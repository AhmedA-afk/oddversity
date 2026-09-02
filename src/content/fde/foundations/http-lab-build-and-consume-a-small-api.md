---
title: "Lab: build a small API, then consume it from another machine"
phase: foundations
module: http-apis-and-auth
kind: lab
summary: "Build a small REST API with API-key authentication, then write a separate client script that calls it over the real network, handling timeouts, retries, and a rejected key the way you would in a customer's environment."
duration: "2 h"
updated: "2026-09-02"
outcomes:
  - Build a REST endpoint that validates an API key and returns proper status codes for success, missing auth, and bad auth.
  - Write a client that calls it with a timeout, a bounded retry, and error handling that distinguishes a 401 from a 500 from a timeout.
  - Run the server and client on two different machines (or network namespaces) and confirm it end to end.
artifact: A small repo with a server.py, a client.py, and a README explaining how to run both, that you can point to as a first API you shipped end to end.
---

You've covered HTTP status codes, REST design, and API-key auth as lessons. This lab puts all three together the way you'll actually use them: a server that enforces auth correctly, and a client — running somewhere else — that calls it the way production code should, not the way a five-line tutorial script does.

## What you're building

A tiny "customer notes" API: `POST /notes` to create a note, `GET /notes/{id}` to fetch one, both requiring an API key. It's deliberately small — the point of this lab is the auth handling and the client behaviour, not the domain.

## Steps

**1. Build the server.**

```python
# server.py
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
import uvicorn
import uuid

app = FastAPI()
VALID_API_KEY = "sk-field-kit-demo-key"
notes = {}

class NoteIn(BaseModel):
    text: str

def check_auth(x_api_key: str | None):
    if x_api_key is None:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")
    if x_api_key != VALID_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

@app.post("/notes", status_code=201)
def create_note(note: NoteIn, x_api_key: str | None = Header(default=None)):
    check_auth(x_api_key)
    note_id = str(uuid.uuid4())
    notes[note_id] = note.text
    return {"id": note_id, "text": note.text}

@app.get("/notes/{note_id}")
def get_note(note_id: str, x_api_key: str | None = Header(default=None)):
    check_auth(x_api_key)
    if note_id not in notes:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"id": note_id, "text": notes[note_id]}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Note the status codes deliberately: `401` for no key at all (unauthenticated), `403` for a key that's present but wrong (unauthorised), `404` for a valid request that references something that doesn't exist. Getting these three right, distinctly, is exactly what the earlier HTTP status codes lesson was for — a client that treats every non-200 response the same way can't tell "you forgot the header" from "that note was deleted."

**2. Run it, bound to every interface**, so it's reachable from another machine:

```bash
pip install fastapi uvicorn
python server.py
```

**3. Confirm it locally first:**

```bash
curl -X POST http://localhost:8000/notes \
  -H "X-API-Key: sk-field-kit-demo-key" \
  -H "Content-Type: application/json" \
  -d '{"text": "first note"}'
```

**4. Write the client**, on a separate machine (or a separate Docker network namespace, or just a separate terminal if a second machine genuinely isn't available — but do point it at the server's real network IP, not `localhost`, so you're exercising the real path):

```python
# client.py
import requests
import time
import sys

BASE_URL = "http://192.168.1.47:8000"   # replace with the server's real IP
API_KEY = "sk-field-kit-demo-key"
HEADERS = {"X-API-Key": API_KEY}

def create_note(text, max_retries=3, timeout=5):
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.post(
                f"{BASE_URL}/notes",
                json={"text": text},
                headers=HEADERS,
                timeout=timeout,
            )
        except requests.exceptions.Timeout:
            print(f"attempt {attempt}: timed out after {timeout}s", file=sys.stderr)
            time.sleep(2 ** attempt)
            continue
        except requests.exceptions.ConnectionError as exc:
            print(f"attempt {attempt}: connection failed: {exc}", file=sys.stderr)
            time.sleep(2 ** attempt)
            continue

        if response.status_code == 201:
            return response.json()
        if response.status_code in (401, 403):
            raise RuntimeError(f"auth rejected: {response.status_code} {response.json()['detail']}")
        if response.status_code >= 500:
            print(f"attempt {attempt}: server error {response.status_code}, retrying", file=sys.stderr)
            time.sleep(2 ** attempt)
            continue
        response.raise_for_status()

    raise RuntimeError(f"failed to create note after {max_retries} attempts")

if __name__ == "__main__":
    result = create_note("a note from another machine")
    print("created:", result)
```

**5. Run the client from the second machine**, confirm it prints a created note.

**6. Break it on purpose, three ways, and confirm the client behaves correctly for each:**

- Change `API_KEY` in the client to something wrong: confirm the client raises immediately (auth failures should not retry — retrying a wrong key just repeats the same failure and wastes time).
- Stop the server, run the client: confirm it retries with backoff, then fails with a clear message, instead of hanging indefinitely.
- Add `import time; time.sleep(10)` inside `create_note` on the server before returning: confirm the client's timeout fires and it retries rather than waiting forever.

## Definition of done

- Server enforces auth correctly: `401` with no key, `403` with a wrong key, `201` with a valid key and body.
- Client, run from a genuinely different machine or network namespace, successfully creates and reads a note over the real network.
- Client distinguishes auth failure (fails fast, no retry) from timeout or 5xx (retries with backoff, then fails clearly) — confirmed by actually triggering both, not just reading the code.
- A README that tells someone else exactly how to run both halves, including that the server must bind to `0.0.0.0` and the client's `BASE_URL` must be the server's real network IP, not `localhost`.

## How this goes wrong

**Retrying an auth failure.** A client that retries on 401/403 the same way it retries on a timeout will hammer the server three times with the same wrong key, waste the backoff delay, and still fail — worse, against a real API this pattern can trigger rate limiting or a security alert for repeated auth failures from one client. Auth failures are not transient; retrying them is never correct.

**No timeout at all.** `requests.post(...)` with no `timeout` argument will wait indefinitely if the server hangs or the network drops the connection silently — the single most common cause of a script that "just hangs" in production with no error and no log line, because it's still technically running, just waiting forever.

**Testing only against `localhost`.** If you never actually run the client from a separate machine, you can ship code that silently assumes `localhost` and be surprised, later, by a networking bug this lab is designed to force you to hit while it's cheap to fix — this is exactly the failure mode the next lab in this path is built around.
