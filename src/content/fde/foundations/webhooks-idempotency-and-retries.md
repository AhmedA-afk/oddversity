---
title: "Webhooks, idempotency, and retries that do not double-charge"
phase: foundations
module: http-apis-and-auth
kind: lesson
summary: "A webhook can arrive twice, arrive out of order, or arrive with a payload you cannot yet fully trust. This lesson covers how to receive one safely: verify it, deduplicate it, and process it in a way that a duplicate delivery cannot corrupt."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Verify a webhook's authenticity using its signature header, and explain why the payload alone is never enough to trust.
  - Design an idempotent webhook handler that processes the same event twice without double-applying its effect.
  - Explain "at-least-once delivery" and why a webhook handler must assume it, not "exactly-once", as the default.
---

A webhook is a callback: instead of your system polling a vendor's API asking "anything new?", the vendor's system calls your endpoint the moment something happens — a payment succeeded, a document finished processing, a status changed. It is efficient and it is also a genuinely different problem from calling an API yourself, because you no longer control when the request arrives, whether it might arrive twice, or what happens if your endpoint is briefly down when it fires.

## Verifying a webhook is real before trusting it

Anyone who knows or guesses your webhook URL can send a POST request that looks exactly like a real event. Every legitimate webhook provider signs its payloads with a shared secret, and checking that signature — not just parsing the JSON — is the first thing a handler should do:

```python
import hmac
import hashlib
from flask import Flask, request, abort

app = Flask(__name__)
WEBHOOK_SECRET = "whsec_..."  # from environment/secrets manager, never hardcoded

@app.route("/webhooks/payments", methods=["POST"])
def handle_payment_webhook():
    signature = request.headers.get("X-Signature")
    body = request.get_data()  # raw bytes — sign the exact bytes received, not the re-serialised JSON

    expected = hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    if not signature or not hmac.compare_digest(signature, expected):
        abort(401)

    event = request.get_json()
    process_event(event)
    return "", 200
```

Two details matter beyond the obvious. First, sign and compare against the raw request body, not `json.dumps(request.get_json())` — re-serialising can subtly change whitespace or key order and produce a signature mismatch even for a genuine event, which is a confusing false-negative to debug. Second, use `hmac.compare_digest`, not `==`, to compare signatures — a plain string comparison exits as soon as it finds the first differing character, and the tiny timing difference this creates is in principle exploitable to guess a valid signature one byte at a time; `compare_digest` runs in constant time specifically to prevent that.

## At-least-once delivery: the assumption that changes everything

Nearly every webhook provider guarantees **at-least-once** delivery, not exactly-once: if your endpoint does not respond with a success status quickly enough, or responds with an error, the provider will retry — which means the same event can, and eventually will, arrive at your endpoint more than once. This is not a bug in the provider; it is the only sane choice on their end, because the alternative (at-most-once, dropping an event if delivery is uncertain) silently loses data, which is worse.

The consequence: your handler must be safe to run twice on the same event. "Charge the customer $50" run twice is a customer charged $100. "Mark the order as shipped" run twice is usually harmless. Knowing which of your webhook handlers fall into the dangerous category — anything with a side effect that is not naturally idempotent — is the actual design work.

## Making a handler idempotent

The standard pattern: every event carries a unique ID (from the provider, or one you generate), and you record which IDs you have already fully processed before doing anything with side effects:

```python
def process_event(event):
    event_id = event["id"]

    if already_processed(event_id):
        return  # duplicate delivery — safely do nothing

    with db.transaction():
        mark_processed(event_id)   # inside the same transaction as the effect
        apply_effect(event)        # e.g. update order status, credit an account

def already_processed(event_id: str) -> bool:
    return db.execute(
        "SELECT 1 FROM processed_events WHERE event_id = %s", (event_id,)
    ).fetchone() is not None

def mark_processed(event_id: str):
    db.execute(
        "INSERT INTO processed_events (event_id, processed_at) VALUES (%s, now())",
        (event_id,),
    )
```

The critical detail is that `mark_processed` and `apply_effect` happen inside the same database transaction. If they were separate — mark first, apply second, as two independent statements — a crash between the two leaves an event permanently marked "processed" that never actually had its effect applied, which is a silent data loss worse than the duplicate you were trying to prevent. Doing both inside one transaction means either both happen or neither does, and a retry after a crash safely reprocesses the event exactly once.

## Responding fast, processing separately

A webhook provider's retry logic is usually triggered by a slow response as much as by an error response — many providers time out and retry after just a few seconds. If your handler does real work synchronously (calling another API, writing to several systems), you risk the provider retrying while you are still mid-processing the first delivery, compounding the duplicate problem. The standard fix: acknowledge receipt immediately, and do the actual work asynchronously.

```python
@app.route("/webhooks/payments", methods=["POST"])
def handle_payment_webhook():
    # ... verify signature as above ...
    event = request.get_json()
    enqueue_for_processing(event)   # push to a queue, return immediately
    return "", 200                   # ack fast — the provider stops retrying
```

A background worker consumes the queue and runs the same idempotent `process_event` logic, decoupled from the provider's retry timing entirely.

## The FDE version of this lesson

Webhooks show up constantly in integration work — a payments provider notifying on transaction status, a document-processing vendor notifying on completion, a CRM notifying on a record change. The bug this lesson exists to prevent — a customer double-charged, an order marked shipped twice and double-counted in a report — is exactly the kind of incident that ends an engagement's trust in a single afternoon, and it is entirely preventable with the pattern above: verify the signature, deduplicate by event ID inside a transaction, acknowledge fast, process asynchronously. An interviewer asking "how would you handle a webhook that might arrive twice" is checking specifically for the idempotency-key pattern above, by name or in substance — reciting "I'd add a try/catch" is the wrong-altitude answer; naming the dedup table and the transaction boundary is the right one.
