---
title: "REST, JSON, and designing an endpoint someone else will call"
phase: foundations
module: http-apis-and-auth
kind: lesson
summary: "The endpoints you build during an engagement are consumed by the customer's own engineers, often after you have left. Resource naming, pagination, error bodies and versioning are what decide whether that handover works or generates a support thread."
duration: 15 min
updated: "2026-09-02"
outcomes:
  - Design a resource-shaped endpoint with correct methods, status codes and a stable error body.
  - Choose between offset and cursor pagination and explain the failure mode of the one you did not pick.
  - Write a FastAPI endpoint that validates its input and documents itself.
artifact: A small FastAPI service with two endpoints, a typed error body and pagination, committed to your public repo.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

You will consume far more APIs than you build. But the ones you build during a deployment get handed to a customer's team, and they are read as evidence of whether the vendor's engineer knows what they are doing. An endpoint that returns HTTP 200 with the body `{"error": "failed"}` tells a reviewer everything they need to know about the rest of your work.

## Resources, not verbs

REST is a style, not a standard, and arguing about purity is a waste of an engagement. The useful part is small: model your API as **nouns you act on with HTTP methods**, rather than as remote procedure calls with verbs in the path.

```text
GET    /v1/invoices               list
POST   /v1/invoices               create one
GET    /v1/invoices/INV-9912      read one
PATCH  /v1/invoices/INV-9912      partial update
DELETE /v1/invoices/INV-9912      delete
GET    /v1/customers/C-4471/invoices    the invoices of one customer
```

Plural nouns, lowercase, hyphens rather than underscores in paths, identifiers in the path, filters in the query string. Not `/getInvoice?id=9912`, not `/invoice/delete/9912`.

Where an operation is genuinely not a resource change, it is fine to have an action sub-resource: `POST /v1/invoices/INV-9912/send`. Consistency matters more than doctrine. Pick a convention on day one, write it in the README, and do not mix styles inside one service, because the customer's engineers will infer the rule from the first two endpoints they see and be wrong about the third.

## Status codes on the way out

Returning the right code is the cheapest documentation you will ever write.

- `200 OK` for a successful read or update with a body.
- `201 Created` for a successful create, with a `Location` header pointing at the new resource.
- `202 Accepted` when you have queued work that has not finished. Return something the caller can poll.
- `204 No Content` for a successful delete with no body.
- `400` malformed, `401` unauthenticated, `403` not permitted, `404` absent, `409` conflict, `422` valid JSON with invalid values, `429` rate limited.
- `500` only for genuine unhandled failures on your side.

The anti-pattern to avoid absolutely: always returning 200 with a success flag in the body. It defeats every retry policy, every monitor and every load-balancer health check between you and the caller, and it is the reason someone's alerting will fail to notice your service is broken for a day.

## An error body worth reading

Decide the shape once and use it everywhere in the service.

```json
{
  "error": {
    "code": "invoice_amount_invalid",
    "message": "amount_paise must be a positive integer",
    "field": "amount_paise",
    "request_id": "req_01HZY8K3"
  }
}
```

Four properties matter. A **stable machine code** the caller can branch on, which never changes even when you improve the wording. A **human message** that names the actual problem. The **field** where the problem is, when there is one. And a **request identifier** that also appears in your logs, so that when the customer pastes an error into a chat you can find the exact request without asking them for a timestamp and a timezone.

That last one is the difference between "can you tell me roughly when this happened" and "found it, here is what went wrong". On an engagement, that difference is your reputation.

## Pagination, and the bug you will not see in testing

Any list endpoint over data that grows must paginate. There are two options and they fail differently.

**Offset pagination** uses `?limit=100&offset=300`. Simple, allows jumping to page 7, and works with any SQL. Its failure mode: if rows are inserted or deleted while a client is walking pages, records shift between pages, so the client silently skips or duplicates rows. On a static export this never happens. On a live table during a nightly sync it happens constantly, and it produces a data-quality bug that surfaces weeks later as "some invoices are missing".

**Cursor pagination** returns an opaque token pointing at the last row seen, and the next request asks for rows after it. Stable under concurrent writes, and efficient, because the database seeks rather than counts. Its cost: no random access to page 7, and the sort key must be unique and stable, which usually means ordering by a monotonic identifier or by a timestamp plus a tiebreaker.

```json
{
  "data": [ { "id": "INV-9912" } ],
  "next_cursor": "eyJpZCI6IklOVi05OTEyIn0",
  "has_more": true
}
```

Pick cursor pagination for anything a machine will walk. Pick offset only for a human-facing table where the data is stable. Then, critically, **document which one you chose**, because the person writing the client needs to know whether looping until an empty page is safe.

Always enforce a maximum page size on the server. A caller who asks for `limit=1000000` should get 100 rows and a documented cap, not a timeout.

## A version prefix from day one

Put `/v1/` in the path before you have any callers. It costs nothing now and it is the only thing that lets you change a response shape later without breaking the customer's integration, which by then will be embedded in a scheduled job that nobody remembers owning.

The rule that follows: **additive changes are free, removals are not.** Adding a field to a response is safe if clients ignore unknown fields, and you should say in the docs that they must. Removing a field, renaming one, changing a type from string to integer, or narrowing an enum are all breaking, and they need a new version or a long deprecation with the customer's team told directly, not via a changelog they will not read.

## Writing one in FastAPI

FastAPI gives you validation, typed responses and interactive documentation from the same type hints, which means the handover artifact writes itself.

```python
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

app = FastAPI(title="Invoices", version="1.0.0")


class InvoiceIn(BaseModel):
    customer_id: str = Field(min_length=1)
    amount_paise: int = Field(gt=0)
    currency: str = Field(default="INR", pattern="^[A-Z]{3}$")


class Invoice(InvoiceIn):
    id: str
    status: str


DB: dict[str, Invoice] = {}


@app.post("/v1/invoices", response_model=Invoice, status_code=201)
def create_invoice(payload: InvoiceIn) -> Invoice:
    invoice_id = f"INV-{len(DB) + 1:04d}"
    invoice = Invoice(id=invoice_id, status="open", **payload.model_dump())
    DB[invoice_id] = invoice
    return invoice


@app.get("/v1/invoices/{invoice_id}", response_model=Invoice)
def get_invoice(invoice_id: str) -> Invoice:
    invoice = DB.get(invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="invoice not found")
    return invoice


@app.get("/v1/invoices", response_model=list[Invoice])
def list_invoices(limit: int = Query(default=50, le=100), offset: int = 0) -> list[Invoice]:
    return list(DB.values())[offset : offset + limit]
```

Run it with `uvicorn main:app --reload` and open `/docs`. The interactive page is generated from those type hints, and handing a customer's engineer a URL where they can try the endpoint themselves removes an entire round of email.

Notice what the validation buys you. A request with `amount_paise` of zero is rejected with a 422 and a body naming the field, without a single line of validation code. A request with a currency of `rupees` is rejected the same way. Getting this for free is the reason FastAPI is the default for small services in this path.

## The handover test

Before you call an endpoint finished, apply one test: could a competent engineer who has never met you call it correctly using only the generated documentation and the error messages, without asking you a question? If the answer is no, the missing piece is usually the pagination contract, the error codes, or an undocumented required header. Fix that before you fix anything else, because after the engagement ends, the documentation is all that is left of you.
