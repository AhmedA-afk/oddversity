---
title: "Structured errors, and the message the customer will actually read"
phase: craft
module: ship-a-service-end-to-end
kind: lesson
summary: "Your errors have three audiences: the clerk staring at a screen, the customer's engineer reading your JSON, and you at 3 a.m. with a correlation id. One error object can serve all three, and the design of that object decides how much of your next month you spend on support."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Design an error payload with a stable code, a human sentence, a correlation id and a retryable flag.
  - Choose between 400, 401, 403, 422, 429, 502, 503 and 504 correctly and explain the difference to a customer's network team.
  - Write an error catalogue that the customer's support desk can act on without calling you.
artifact: An error catalogue table and a FastAPI exception handler added to your service skeleton, with the catalogue also pasted into the README's "when it breaks" section.
sources:
  - "https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/"
  - "https://www.firstresonance.io/blog/a-day-in-the-life-of-a-forward-deployed-systems-engineer-fdse-c"
---

Somewhere in a shared-services floor in Pune, a claims clerk clicks a button and the screen says "An error occurred. Please try again." She tries again. It says the same thing. She raises a ticket that says "system not working". That ticket reaches an IT manager, who forwards it to the vendor contact, who forwards it to you, eleven days later, with no timestamp and no identifier.

Every hour of that chain was preventable at the moment you wrote the error handler.

## Three audiences, one object

Your error has to work for three different people at once.

1. **The end user.** They need one sentence: what happened in their terms, what they can do, and a reference to quote. They do not need your exception class.
2. **The customer's integrating engineer.** They need a stable machine-readable code they can branch on, and a clear signal of whether retrying is sensible. They will write `if err.code == "UPSTREAM_TIMEOUT": retry()` and that code must never change meaning.
3. **You, later.** You need a correlation id that appears both in the response and in the logs, so a screenshot from a WhatsApp support group becomes a log query.

The trick is that these are layers of one object, not three separate error systems.

## The payload

```json
{
  "error": {
    "code": "UPSTREAM_TIMEOUT",
    "message": "The CRM did not respond in time. Your ticket was not changed. Try again in a few minutes.",
    "retryable": true,
    "correlation_id": "01JB8Q2M4X7ZK9V3P6",
    "details": {"upstream": "crm", "timeout_seconds": 10}
  }
}
```

Five fields, and each one earns its place.

- **`code`** — SCREAMING_SNAKE, stable forever, from a published catalogue. Never reuse a retired code for a new meaning.
- **`message`** — one sentence, present tense, in the user's vocabulary. Rules below.
- **`retryable`** — an explicit boolean, not something the caller has to infer from the status code. A 500 caused by a malformed row in their file is not retryable; a 500 caused by a connection reset is.
- **`correlation_id`** — generated per request, echoed in a response header too, logged on every line for that request.
- **`details`** — a small, safe, machine-readable object. Never free-form prose, never a stack trace.

Notice what is absent: no stack trace, no SQL, no connection string, no upstream hostname beyond a label, no personal data. Error responses cross network boundaries you do not control and end up pasted into email threads and screenshots.

## The message rules

The message field is the one an actual human reads, and it is the field engineers write worst. Four rules.

**Say what happened, not what the code did.** "Could not read the uploaded file" beats "ParseError in row handler".

**Say whether their work survived.** This is the single most valuable sentence and it is almost always missing. "Your ticket was not changed." "The first 340 rows were imported; rows 341 onwards were not." People need to know whether to redo the work.

**Say what to do next.** "Try again in a few minutes." "Check that the file is a .csv exported from SAP, not an Excel file renamed." "Contact your administrator, quoting the reference below."

**Give them the reference.** Show the correlation id in the interface. Every support conversation gets ten times cheaper.

Compare:

> An error occurred. Please try again.

> We could not reach the CRM, so your ticket was not changed. Try again in a few minutes. If it keeps happening, quote reference 01JB8Q2M4X7ZK9V3P6.

The second one costs you thirty seconds to write and removes an entire escalation path.

## Choosing the status code, and why the customer's network team cares

Inside an enterprise your response passes through a load balancer, a reverse proxy, a WAF, and sometimes a data-loss-prevention appliance. Each of those can generate its own errors that look like yours. Getting the codes right is how you win the argument about whose fault it is.

| Code | Means | Who is at fault | Retry? |
|---|---|---|---|
| 400 | The request is malformed | Caller | No |
| 401 | No valid credentials | Caller or their SSO | No, re-authenticate |
| 403 | Authenticated, not permitted | Their permission model | No |
| 404 | The resource does not exist | Caller, usually | No |
| 409 | Conflicts with current state | Caller, retry after refetch | Sometimes |
| 422 | Well-formed but semantically invalid | Caller's data | No |
| 429 | Rate limited | Caller, or your own upstream | Yes, after `Retry-After` |
| 500 | Your bug | You | No |
| 502 | An upstream returned garbage | Upstream | Yes |
| 503 | You are up but not ready | You, temporarily | Yes |
| 504 | An upstream did not answer in time | Upstream or the network | Yes |

The 401 versus 403 distinction is the one that consumes weeks in the field. A customer's SSO integration going wrong produces 401s; a role mapping going wrong produces 403s. If you return the same code for both, you will spend an afternoon in a call with their identity team looking at the wrong system.

The 502 versus 504 distinction matters when a corporate proxy sits between you and an upstream: a 504 says the network or the far end is slow, a 502 says something answered but with nonsense. That is often literally an HTML proxy error page returned with the wrong content type, and if you classify it as your own 500 you will hunt your own code for a day.

## The catalogue

Keep one table, in the README and in the code, and treat it as an interface.

| Code | HTTP | Retryable | User-facing message | First check |
|---|---|---|---|---|
| `INVALID_TICKET_PAYLOAD` | 422 | no | The ticket is missing a subject. | Look at the request body in the log line for this correlation id |
| `UNKNOWN_QUEUE` | 422 | no | The queue name is not one we route to. | Compare against the queue list in `config/queues.yaml` |
| `UPSTREAM_TIMEOUT` | 504 | yes | The CRM did not respond in time. Your ticket was not changed. | Check the CRM status page and the `/readyz` endpoint |
| `UPSTREAM_BAD_RESPONSE` | 502 | yes | The CRM returned something we could not read. | Almost always a proxy or an expired certificate |
| `RATE_LIMITED` | 429 | yes | Too many requests right now. | Check the batch job is not running at the same time |
| `NOT_READY` | 503 | yes | The service is starting up. | Wait 60 seconds, then check `/readyz` for the failing dependency |

The right-hand column is what turns this from documentation into a support tool. Vinoo Ganesh's guide places debugging and data-quality handling at the centre of the forward deployed skill set, and this table is where that judgement gets written down for people who are not you.

## Implementation

```python
import uuid
from dataclasses import dataclass, field

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


@dataclass
class AppError(Exception):
    code: str
    http_status: int
    message: str
    retryable: bool = False
    details: dict = field(default_factory=dict)


app = FastAPI()


@app.middleware("http")
async def add_correlation_id(request: Request, call_next):
    cid = request.headers.get("x-correlation-id") or uuid.uuid4().hex
    request.state.correlation_id = cid
    response = await call_next(request)
    response.headers["x-correlation-id"] = cid
    return response


@app.exception_handler(AppError)
async def handle_app_error(request: Request, exc: AppError):
    cid = getattr(request.state, "correlation_id", "unknown")
    logger.warning(
        "app_error",
        extra={"code": exc.code, "correlation_id": cid, "details": exc.details},
    )
    return JSONResponse(
        status_code=exc.http_status,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "retryable": exc.retryable,
                "correlation_id": cid,
                "details": exc.details,
            }
        },
    )


@app.exception_handler(Exception)
async def handle_unexpected(request: Request, exc: Exception):
    cid = getattr(request.state, "correlation_id", "unknown")
    logger.exception("unhandled", extra={"correlation_id": cid})
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong on our side. Quote the reference below.",
                "retryable": False,
                "correlation_id": cid,
                "details": {},
            }
        },
    )
```

Accepting an incoming `x-correlation-id` matters more than generating one. If the customer's API gateway already stamps a request id, adopting it means their tracing and yours line up for free, and their platform team will notice that you did it.

## Two field notes

**Volume defeats good errors.** The First Resonance account of a forward deployed systems engineer describes chunking logs to fix a user-interface "adoption cliff": people stopped using a screen because it drowned them. The same applies to errors. Ten thousand identical `UPSTREAM_TIMEOUT` responses during a five-minute outage need to collapse into one alert and one status banner, not ten thousand tickets.

**Localise the sentence, never the code.** If the interface is a WhatsApp bot used by field agents who type in Hinglish, the message string may need to be Hindi or a mixed register. Keep `code` in English and stable, keep `message` as a lookup by code and locale. The moment somebody translates the code, every integration breaks.

## Common failure patterns

- **Leaking the exception.** `str(exc)` in the message field ships your internal file paths to a customer's screen and, eventually, into a security finding.
- **One code for everything.** `VALIDATION_ERROR` for eighteen different problems means the support desk cannot triage any of them.
- **Retryable inferred, not stated.** Callers will guess, and they will guess by status code, and they will hammer a broken upstream during an incident.
- **Correlation id logged but not returned.** You have the data and no way to find the row.
- **Errors that blame the user for your assumption.** "Invalid date format" when their ERP exports `14-08-2026` and you assumed ISO is your bug wearing their name.

## Do this now

Add the error catalogue table and the handler to your service skeleton. Then take three errors your code can currently raise, and rewrite each message to satisfy all four message rules. Read them out loud as if you were the clerk. If any sentence would not help her, it is not finished.
