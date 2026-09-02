---
title: "Calling a paginated API with auth, retries and a timeout"
phase: foundations
module: python-for-the-field
kind: lab
summary: "Build the script every Forward Deployed Engineer writes in their first week on a deployment: pull every page of a customer API, authenticate, retry on failure, respect rate limits, and stop cleanly. Roughly three hours."
duration: 3 h
updated: "2026-09-02"
outcomes:
  - Page through an API to exhaustion using both cursor and offset styles, without an infinite loop.
  - Add a timeout, bounded retries with exponential backoff and jitter, and correct handling of 429 and 5xx.
  - Resume an interrupted pull from where it stopped rather than starting again.
artifact: fetch_pages.py, a runnable puller with a checkpoint file, a fixed test server, and a log that shows a retry and a resume actually happening.
sources:
  - "https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/"
---

Paginated API calls appear by name in the practitioner must-know list for this role, alongside CSV processing and database connections. There is a reason it is called out rather than assumed. The naive version of this script is eight lines and works in the demo. The version that survives a customer's network, their rate limiter, and a token that expires at page 340 is about seventy lines, and the difference is entirely in the failure handling.

You are pulling support tickets from a fictional helpdesk vendor for Meridian Textiles, a Tiruppur exporter. There are roughly 40,000 tickets. The API returns 100 per page.

## Before you start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install requests
```

You need something to call. Save this as `fakeapi.py` and run it in a second terminal with `python3 fakeapi.py`. It deliberately misbehaves: it rate-limits, it returns the occasional 503, and it requires a token.

```python
import json, random
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

TOTAL, PAGE = 2500, 100

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        url = urlparse(self.path)
        if self.headers.get("Authorization") != "Bearer test-token":
            return self.send(401, {"error": "unauthorized"})
        if random.random() < 0.15:
            return self.send(503, {"error": "temporarily unavailable"})
        if random.random() < 0.10:
            self.send(429, {"error": "rate limited"}, extra={"Retry-After": "2"})
            return
        cursor = int(parse_qs(url.query).get("cursor", ["0"])[0])
        items = [{"id": i, "subject": f"ticket {i}"}
                 for i in range(cursor, min(cursor + PAGE, TOTAL))]
        nxt = cursor + PAGE if cursor + PAGE < TOTAL else None
        self.send(200, {"items": items, "next_cursor": nxt})

    def send(self, code, body, extra=None):
        payload = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):
        pass

HTTPServer(("127.0.0.1", 8099), Handler).serve_forever()
```

## Step 1: one page, correctly

Start with a single request and get the four non-negotiables in from the beginning.

```python
import os, requests

BASE = "http://127.0.0.1:8099/tickets"

def get_page(session, cursor):
    token = os.environ["HELPDESK_TOKEN"]
    resp = session.get(
        BASE,
        params={"cursor": cursor},
        headers={"Authorization": f"Bearer {token}"},
        timeout=(5, 30),
    )
    resp.raise_for_status()
    return resp.json()
```

Run it with `HELPDESK_TOKEN=test-token python3 fetch_pages.py`.

The `timeout` tuple is connect timeout then read timeout. Omit it and `requests` waits forever, which on a customer network with a silent firewall means your script hangs at 2am and nobody knows why. This is the single most common omission in field scripts and it costs an hour of someone's morning every time.

`raise_for_status` turns a 4xx or 5xx into an exception instead of letting you parse an error page as data. A `Session` reuses the TCP connection across requests, which matters over a slow VPN.

## Step 2: page to exhaustion

Two pagination styles cover almost everything you will meet.

**Cursor or token.** The response carries a pointer to the next page and eventually a null. Follow it.

**Offset and limit.** You increment `offset` by `limit` until you get a short or empty page. This style is unstable when the underlying data is changing: a row inserted at offset 200 while you are at offset 900 shifts everything and you skip a record. If you have the choice, ask for cursor pagination and say why.

```python
def iter_pages(session):
    cursor, seen = 0, set()
    while cursor is not None:
        if cursor in seen:
            raise RuntimeError(f"pagination loop: cursor {cursor} repeated")
        seen.add(cursor)
        page = get_page(session, cursor)
        yield page["items"]
        cursor = page.get("next_cursor")
```

The `seen` set is not paranoia. A misconfigured gateway that returns the same cursor forever will otherwise give you an infinite loop that fills a customer's disk with log lines overnight. Add a hard page cap as well if the total is unknown.

## Step 3: retries that do not make things worse

Distinguish three kinds of failure, because they need three responses.

| Response | Meaning | What to do |
|---|---|---|
| 401, 403 | The token is wrong, expired, or lacks scope | Do not retry. Fail with a message naming the variable |
| 400, 404, 422 | Your request is wrong | Do not retry. Log the URL and body |
| 429 | You are going too fast | Wait, honouring `Retry-After` if present |
| 500, 502, 503, 504 | Their side, probably transient | Retry with exponential backoff |
| Timeout, connection error | Network, probably transient | Retry with exponential backoff |

```python
import random, time
import requests

RETRYABLE = {429, 500, 502, 503, 504}

def get_page(session, cursor, attempts=5):
    token = os.environ["HELPDESK_TOKEN"]
    for attempt in range(attempts):
        try:
            resp = session.get(
                BASE,
                params={"cursor": cursor},
                headers={"Authorization": f"Bearer {token}"},
                timeout=(5, 30),
            )
        except (requests.Timeout, requests.ConnectionError) as exc:
            wait = backoff(attempt)
            print(f"cursor={cursor} {type(exc).__name__}, retrying in {wait:.1f}s")
            time.sleep(wait)
            continue

        if resp.status_code in RETRYABLE:
            wait = float(resp.headers.get("Retry-After", 0)) or backoff(attempt)
            print(f"cursor={cursor} http {resp.status_code}, retrying in {wait:.1f}s")
            time.sleep(wait)
            continue

        resp.raise_for_status()
        return resp.json()

    raise RuntimeError(f"gave up on cursor {cursor} after {attempts} attempts")

def backoff(attempt, base=1.0, cap=30.0):
    return min(cap, base * (2 ** attempt)) * (0.5 + random.random() / 2)
```

The jitter, that random multiplier between 0.5 and 1.0, exists so that when a customer's API recovers from an outage, ten of your scheduled jobs do not all hit it at the same instant and knock it over again. Attempts are bounded. An unbounded retry loop is not resilience, it is a script that never finishes and never tells anyone.

## Step 4: checkpoint and resume

40,000 tickets at 100 a page with rate limiting is long enough that something will interrupt it. Write each page as you get it and record where you are.

```python
import json, pathlib

STATE = pathlib.Path("state.json")
OUT = pathlib.Path("tickets.ndjson")

def load_cursor():
    if STATE.exists():
        return json.loads(STATE.read_text())["cursor"]
    return 0

def main():
    session = requests.Session()
    cursor = load_cursor()
    total = 0
    with OUT.open("a", encoding="utf-8") as out:
        while cursor is not None:
            page = get_page(session, cursor)
            for item in page["items"]:
                out.write(json.dumps(item, ensure_ascii=False) + "\n")
            out.flush()
            total += len(page["items"])
            cursor = page.get("next_cursor")
            STATE.write_text(json.dumps({"cursor": cursor}))
            print(f"wrote {total} records, next cursor {cursor}")
    print(f"done, {total} records")

if __name__ == "__main__":
    main()
```

Newline-delimited JSON, appended and flushed per page, means a kill at page 340 costs you nothing. The state file is written after the data, never before, so a crash between the two re-fetches one page rather than skipping one. Re-fetching a page is cheap; skipping one is a silent data loss you find out about in a reconciliation three weeks later.

## Definition of done

- Full run completes and the record count matches the API's stated total.
- Kill the process mid-run with Ctrl-C, restart it, and the final count is still correct with no duplicated ids.
- Run with a wrong token. It exits immediately with a message naming `HELPDESK_TOKEN`, and does not retry five times first.
- Stop the fake API mid-run. The script retries with visibly growing waits, then gives up with a clear error rather than hanging.
- Every log line identifies which cursor it is talking about.
- No secret appears in the code, the command line, or the log output.

## How this could go wrong

**The token expires halfway.** Long pulls outlive short-lived tokens. If a 401 appears after pages have succeeded, that is an expiry, not a configuration error, and the correct response is to refresh once and retry. Handling it needs the OAuth material later in this phase; for now, log it distinctly so you can tell the two cases apart.

**You get rate-limited into a much longer run than you promised.** Measure the actual throughput on page 20 and extrapolate before you tell a stakeholder it will be done by Friday. If the honest answer is eleven hours, say eleven hours on Monday rather than at the demo.

**The data changes while you page.** With offset pagination against a live table you will miss and duplicate records. Deduplicate on the identifier at load time, and prefer a filter on an immutable created-at field over a raw offset.

**Someone runs it twice.** Your output file is opened in append mode, so a second run doubles it. Either key the output on the run date or make the loader idempotent on the identifier. The webhooks lesson later in this phase covers idempotency properly; this is your first encounter with the idea.

**It works on your laptop and not in their environment.** Corporate proxies, TLS interception and DNS split-horizon all break outbound HTTP in ways that look like your bug. The networking module covers the diagnosis; the habit to build now is to print the full effective URL and the response headers on the first request, so the evidence exists.

## Where this shows up

Palantir's screen includes an API exercise alongside coding and SQL, and take-homes at several companies in this space hand you an API and a data shape and ask for a working pull. What separates submissions is not whether the pages were fetched. It is whether the reviewer can see a timeout, a bounded retry, a clean failure on 401, and a resume that works. Keep the log from your Ctrl-C-and-restart run in the repository. It is evidence.
