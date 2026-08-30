---
title: "Pagination: Collecting Every Page"
track: "python-data-apis"
status: live
summary: "Deep implementation walkthrough: build a local mock API serving offset/limit, cursor-token, and Link-header pagination, then write one Python client that fully drains each style in"
duration: "6 min read"
---

Most list endpoints lie a little: `GET /customers` never actually returns *all* your customers, just the first slice of them plus a hint about how to get the next one. Miss that hint and you silently ship a pipeline that only ever sees page one.

## What we're building

You'll build a tiny local API that serves the same 130-record dataset three different ways — offset/limit, cursor tokens, and Link-header URLs — because in the wild you'll meet all three and the fix for "I only got 25 rows" looks different each time. Then you'll write one Python client that fully drains each style into a single list, and finish by collapsing all three into one generic pager, because the loop shape underneath them is always the same: **keep asking until the API tells you to stop.**

Everything here runs on `127.0.0.1` with no API key, no rate limit, and no network flakiness, so you can focus entirely on the pagination logic. If you haven't made a `requests` call before this, skim [calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) first — this lesson assumes you're comfortable with `requests.get` and reading a JSON response.

## Setup

You need one third-party package. Everything else — the mock server — is standard library, so there's no API key to manage and nothing to put in a `.env` file this time.

```bash
python -m venv .venv
source .venv/bin/activate   # .venv\Scripts\activate on Windows
pip install requests
```

Create two files in the same directory: `mock_api.py` (the server you're about to build) and `pagination_client.py` (the code that consumes it). You'll run the second one; it starts the first one for you in a background thread.

## Build it

### 1. Stand up an API with all three pagination styles

You could point this lesson at a public API, but real ones bundle pagination together with auth, rate limits, and data that changes between requests — three separate problems fighting for your attention when you're trying to learn one. Instead, build a small `http.server` app that serves a fixed, 130-item list three ways, so the only variable left is the pagination mechanic itself.

```python
# mock_api.py
import json
import base64
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

# Deterministic dataset: pretend this is a "customers" table.
TOTAL_ITEMS = 130
ITEMS = [
    {"id": i, "name": f"customer-{i}", "plan": "paid" if i % 3 == 0 else "free"}
    for i in range(1, TOTAL_ITEMS + 1)
]


class PaginatedAPI(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # keep the console quiet

    def _send_json(self, payload, status=200, extra_headers=None):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        for key, value in (extra_headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        if parsed.path == "/items":
            self._offset_limit(params)
        elif parsed.path == "/items/cursor":
            self._cursor(params)
        elif parsed.path == "/items/linked":
            self._link_header(params)
        else:
            self._send_json({"error": "not found"}, status=404)

    def _offset_limit(self, params):
        offset = int(params.get("offset", ["0"])[0])
        limit = int(params.get("limit", ["25"])[0])
        page = ITEMS[offset: offset + limit]
        self._send_json(
            {"results": page, "count": TOTAL_ITEMS, "offset": offset, "limit": limit}
        )

    def _cursor(self, params):
        limit = int(params.get("limit", ["25"])[0])
        raw_cursor = params.get("cursor", [None])[0]
        offset = 0
        if raw_cursor:
            offset = int(base64.urlsafe_b64decode(raw_cursor.encode()).decode())
        page = ITEMS[offset: offset + limit]
        next_offset = offset + limit
        next_cursor = None
        if next_offset < TOTAL_ITEMS:
            next_cursor = base64.urlsafe_b64encode(str(next_offset).encode()).decode()
        self._send_json({"results": page, "next_cursor": next_cursor})

    def _link_header(self, params):
        page_num = int(params.get("page", ["1"])[0])
        limit = int(params.get("limit", ["25"])[0])
        offset = (page_num - 1) * limit
        page = ITEMS[offset: offset + limit]
        headers = {}
        if offset + limit < TOTAL_ITEMS:
            next_url = (
                f"http://127.0.0.1:8000/items/linked?page={page_num + 1}&limit={limit}"
            )
            headers["Link"] = f'<{next_url}>; rel="next"'
        self._send_json({"results": page}, extra_headers=headers)


def run(port=8000):
    server = ThreadingHTTPServer(("127.0.0.1", port), PaginatedAPI)
    print(f"Mock API running on http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
```

Three routes, three contracts:

- `/items` hands back a raw `offset`/`limit` and tells you the grand `count` up front.
- `/items/cursor` hands back a `next_cursor` string that's deliberately base64-encoded — treat it as opaque, because real APIs will punish you for assuming it's a plain integer.
- `/items/linked` puts the next page's *entire URL* in a `Link` response header, exactly the way GitHub's REST API does, and simply omits that header on the last page.

### 2. Drain an offset/limit endpoint

This is the style you'll meet most often: the server tells you how many rows exist in total, and you keep sliding a window forward until you've covered them all.

```python
# pagination_client.py
import requests

BASE_URL = "http://127.0.0.1:8000"


def fetch_all_offset_limit(page_size=25):
    all_items = []
    offset = 0
    while True:
        resp = requests.get(
            f"{BASE_URL}/items", params={"offset": offset, "limit": page_size}
        )
        resp.raise_for_status()
        data = resp.json()
        all_items.extend(data["results"])
        offset += page_size
        if offset >= data["count"]:
            break
    return all_items
```

The stopping condition matters more than it looks: it checks `offset >= data["count"]`, not "did the last page come back shorter than `page_size`." That second check is a common trap — if your total happens to be an exact multiple of your page size (say 125 rows at 25 per page), the last real page is *still full*, so a length-based check thinks there might be more and burns an extra request on an empty page. Reading the server's own count avoids the guesswork entirely.

### 3. Drain a cursor-token endpoint

Cursor pagination trades "you compute the offset" for "the server hands you a token that means whatever it wants it to mean." Your job is just to keep passing it back until you get `None`.

```python
def fetch_all_cursor(page_size=25):
    all_items = []
    cursor = None
    while True:
        params = {"limit": page_size}
        if cursor:
            params["cursor"] = cursor
        resp = requests.get(f"{BASE_URL}/items/cursor", params=params)
        resp.raise_for_status()
        data = resp.json()
        all_items.extend(data["results"])
        cursor = data["next_cursor"]
        if cursor is None:
            break
    return all_items
```

Notice what the client *doesn't* do: it never decodes, inspects, or reconstructs the cursor. That's the whole point of cursor pagination — the token is a black box that only the server needs to understand, so it stays stable even if the server changes its internal encoding later, and it stays correct even if rows are inserted or deleted between your requests (an offset-based page, by contrast, can silently skip or repeat rows when the underlying data shifts mid-pagination — more on that in Harden it).

### 4. Follow Link headers to the end

The third style doesn't put pagination info in the JSON body at all — it puts a fully-formed next URL in a `Link` HTTP header, `rel="next"`. `requests` parses that header for you into `response.links`.

```python
def fetch_all_link_header(page_size=25):
    all_items = []
    url = f"{BASE_URL}/items/linked"
    params = {"page": 1, "limit": page_size}
    while url:
        resp = requests.get(url, params=params)
        resp.raise_for_status()
        all_items.extend(resp.json()["results"])
        next_link = resp.links.get("next")
        url = next_link["url"] if next_link else None
        params = None  # the next URL already carries its own query string
    return all_items
```

That `params = None` line is doing real work. On the first request you supply `page` and `limit` yourself, but every request after that hits a URL the server already built — complete with its own query string. If you kept passing the same `params` dict, `requests` wouldn't overwrite the existing `page` value, it would *append* a second one:

```python
>>> import requests
>>> requests.Request(
...     "GET", "http://example.com/items?page=2&limit=25", params={"page": 1, "limit": 25}
... ).prepare().url
'http://example.com/items?page=2&limit=25&page=1&limit=25'
```

Most servers take the last value and you'd never notice — until you hit one that doesn't. Once you're following a server-supplied URL, stop supplying your own query params for that request.

### 5. Collect once, not twice: a single generic pager

All three loops above have the identical shape: fetch a page, extend a list, compute the next state, stop when the state is `None`. Once you see that, you can write it once and plug in a small "step" function per style — and get memory efficiency for free by making it a generator instead of a function that returns a list.

```python
def paginate(step, max_pages=1000):
    state = None
    for _ in range(max_pages):
        items, next_state = step(state)
        yield from items
        if next_state is None:
            return
        if next_state == state:
            raise RuntimeError("pagination state did not advance - refusing to loop forever")
        state = next_state
    raise RuntimeError(f"stopped after {max_pages} pages - check the API's pagination contract")


def offset_limit_step(state, page_size=25):
    offset = state or 0
    resp = requests.get(f"{BASE_URL}/items", params={"offset": offset, "limit": page_size})
    resp.raise_for_status()
    data = resp.json()
    next_offset = offset + page_size
    next_state = next_offset if next_offset < data["count"] else None
    return data["results"], next_state
```

`state` is just "whatever the next call needs" — an offset for one style, a cursor for another, a URL for the third — so `paginate()` itself never needs to know which pagination style it's driving.

This is also where the brief's warning about loading data twice actually bites. It's tempting to write:

```python
# Don't do this — two full copies live in memory at once.
raw_pages = [requests.get(f"{BASE_URL}/items", params={"offset": o, "limit": 25}).json()
             for o in range(0, 130, 25)]
all_items = [item for page in raw_pages for item in page["results"]]
```

`raw_pages` holds every raw response body, and then `all_items` holds every extracted item — for a moment, both the wrapped and unwrapped versions of your entire dataset exist in memory simultaneously, for no reason. Because `paginate()` is a generator, `list(paginate(...))` builds the final list exactly once: each page's raw response is used, unpacked, and discarded before the next request even goes out.

```python
from functools import partial

all_items = list(paginate(partial(offset_limit_step, page_size=25)))
```

## Run it

Put `mock_api.py` and `pagination_client.py` in the same directory, then add a runner block to the bottom of `pagination_client.py` that starts the server in a background thread and exercises all three explicit fetchers plus the generic pager:

```python
import threading
import time

if __name__ == "__main__":
    import mock_api
    from functools import partial

    threading.Thread(target=mock_api.run, daemon=True).start()
    time.sleep(0.3)  # give the server a moment to bind

    offset_items = fetch_all_offset_limit()
    cursor_items = fetch_all_cursor()
    link_items = fetch_all_link_header()
    generic_items = list(paginate(partial(offset_limit_step, page_size=25)))

    print(len(offset_items), len(cursor_items), len(link_items), len(generic_items))
    print(offset_items == cursor_items == link_items == generic_items)
```

Run it with `python pagination_client.py`. With 130 items at 25 per page, expect six requests per strategy — five full pages of 25 and one partial page of 5 (`130 = 5 × 25 + 5`) — and every strategy should land on the same 130 records in the same order, so the final line prints `130 130 130 130` followed by `True`. That last check is the real payoff of this lesson: three completely different wire formats, one identical result, because you handled each one's "is there more?" signal correctly.

## Harden it

A pagination loop is exactly the kind of code that works perfectly in a demo and then hangs your job at 2am against a real API. Guard against the ways it actually fails:

- **A response that never terminates.** The `paginate()` generator above already caps itself at `max_pages` and raises if `next_state` repeats — so a server bug (always returning the same cursor) or a bad `if` condition in your own code fails loudly on page 1000 instead of running forever. Pick a `max_pages` that's comfortably above what you expect, not exactly at it.
- **Transient failures mid-pagination.** A `requests.get` can time out or 500 on page 40 of 60. Don't restart from page 1 — retry just that one request with backoff, and keep your existing `all_items` intact. See [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) for a retry decorator you can drop straight into any of the `step` functions above.
- **An empty result set.** If `TOTAL_ITEMS` were `0`, the offset/limit loop should still terminate after its first request (`offset=0 >= count=0`), and the cursor/Link-header styles should return `next_cursor: null` / no `Link` header on that same first response. Test this explicitly rather than assuming it — it's the edge case that "works for the demo dataset" tutorials never check.
- **Page drift on offset/limit.** If rows are inserted or deleted while you're mid-pagination, an offset-based loop can skip a row (something got deleted ahead of your current offset) or return one twice (something got inserted). Cursor and keyset-style pagination are usually immune to this because the token encodes "everything after row X," not a raw position — if you're pulling a live, changing table, that's a real reason to prefer a cursor API over an offset one when you have the choice.
- **Trusting the page shape blindly.** Every function above does `data["results"]` with no check that `"results"` exists. One malformed response and you get a `KeyError` three functions deep in a stack trace that doesn't mention pagination at all. Validate each page's shape as you go — see [parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses).
- **Datasets too large to hold in memory.** `list(paginate(...))` is fine for 130 rows or 130,000. Past that, stream straight to disk instead of accumulating a giant Python list:

  ```python
  import json

  def paginate_to_jsonl(step, path, max_pages=1000):
      count = 0
      with open(path, "w") as f:
          for item in paginate(step, max_pages=max_pages):
              f.write(json.dumps(item) + "\n")
              count += 1
      return count
  ```

  This never holds more than one item at a time beyond what the generator is already buffering — worth doing before you feed the result into anything downstream. See [JSON and JSONL files](/learn/python-data-apis/json-and-jsonl-files) for why JSONL specifically suits this append-as-you-go pattern.

## Extend it

- **Checkpoint your progress.** For a long-running pull, persist the current `state` (offset, cursor, or URL) to disk after each page. If the process dies on page 400, you resume from `state`, not from zero.
- **Parallelize the one style that allows it.** Offset/limit pagination is the only one of the three where you know the total up front, which means you know every offset before you've fetched a single page — you can fire those requests concurrently instead of one-at-a-time. Cursor and Link-header pagination can't do this: each next token only exists once you've seen the previous response. See [concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio) for the pattern.
- **Adapt the `step` shape to real APIs.** Stripe uses a cursor style but signals "more" with a `has_more` boolean instead of a null token; GitHub's Link-header pagination arrives alongside rate-limit headers you're expected to respect between pages. Both fit the same `(items, next_state)` contract you already built — you're just changing how `next_state` gets computed.
- **Validate before you use it.** Once every page is flattened into one list, run it through a schema check before it reaches a DataFrame, a Parquet file, or an LLM prompt — see [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) for enforcing that every record actually has the fields your downstream code assumes.

**Related:** [Calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) · [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) · [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) · [JSON and JSONL files](/learn/python-data-apis/json-and-jsonl-files) · [Concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio) · [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation)
