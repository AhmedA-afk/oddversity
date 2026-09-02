---
title: "HTTP: requests, responses, and what each status code is telling you"
phase: foundations
module: http-apis-and-auth
kind: lesson
summary: "Almost every integration failure you will debug in a customer's environment shows up first as a status code. Knowing exactly what 401, 403, 404, 429, 500 and 502 mean, and who is responsible for each, turns a two-hour mystery into a two-minute answer."
duration: 15 min
updated: "2026-09-02"
outcomes:
  - Read a raw HTTP request and response and name every part of it.
  - Distinguish 401, 403, 404, 429, 500, 502 and 504 and say which side owns the fix.
  - Use curl to reproduce a failing call and prove where the failure is.
artifact: A one-page status-code triage table in your journal, written in your own words, with the first diagnostic command for each row.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

Vinoo Ganesh's list of things a deployed engineer must know without looking up includes exactly this: HTTP status codes, TLS, OAuth flows, and specifically the ability to tell a 401 from a 403 from a 502. That is not a trivia list. Those three codes point at three different people, in three different rooms, and telling a customer's team the wrong one costs you an afternoon and some credibility.

## The shape of a request

HTTP is text. Here is a complete request:

```text
POST /v1/invoices HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json
Idempotency-Key: 8f14e45f-ea5e-4b2d-9a1c-0f0c9b8e1f22

{"customer_id": "C-4471", "amount_paise": 125000, "currency": "INR"}
```

Four parts, always:

1. **The request line**: method, path, protocol version.
2. **Headers**: metadata as name-value pairs. `Host` says which site on a shared server. `Authorization` carries credentials. `Content-Type` says how to parse the body.
3. **A blank line**.
4. **An optional body**.

The response has the same shape with a status line instead of a request line:

```text
HTTP/1.1 201 Created
Content-Type: application/json
Location: /v1/invoices/INV-9912

{"id": "INV-9912", "status": "open"}
```

Methods you will use: `GET` (read, no side effects, safe to retry), `POST` (create or act, not safe to retry blindly), `PUT` (replace at a known location, idempotent), `PATCH` (partial update), `DELETE` (idempotent in principle). The safety and idempotency properties are not decoration; they determine whether a retry after a timeout is safe, which is the subject of a later lesson.

## The status codes, by who owns them

Codes come in families. `2xx` worked, `3xx` go elsewhere, `4xx` the request was wrong, `5xx` the server was wrong. The family alone tells you which side of the integration to look at first, and that is most of the value.

**401 Unauthorized — you have not proved who you are.**
Wrong name. It means unauthenticated. The credential is missing, malformed, or expired. On a token-based API, the overwhelmingly common cause is an expired access token. Your fix: refresh or reissue the credential. If you are certain the token is fresh, check that you are sending the header at all, because a proxy that strips `Authorization` on redirect produces exactly this. Owned by you, or by whoever issued the token.

**403 Forbidden — we know who you are and you may not do this.**
Authentication succeeded. Authorisation failed. The fix is never in your code; it is a permission, a scope, a role, an IP allowlist, or a policy. In a customer environment this is the code that means "go talk to someone". Owned by the customer's identity or platform team.

The distinction matters because the remediation paths are completely different. "I am getting 401s" is a conversation with your own code. "I am getting 403s" is a ticket with their security team, and that ticket has a lead time, so raise it the hour you see it.

**404 Not Found — the path does not exist, or you may not know that it does.**
Often a wrong base URL, a missing version prefix, a trailing slash, or a resource in a different tenant. Some APIs deliberately return 404 instead of 403 so that an unauthorised caller cannot discover which IDs exist. If a 404 appears on a path you are confident is right, suspect permissions.

**405 Method Not Allowed** — right path, wrong verb. Usually a `POST` where the API wants `PUT`.

**409 Conflict** — state collision. A duplicate creation, or an optimistic-concurrency failure. Not retryable without changing something.

**422 Unprocessable Entity** — the JSON parsed but the values are invalid. Read the body; well-built APIs put the offending field in it.

**429 Too Many Requests — you are being rate-limited.**
Look for `Retry-After` in the response headers, and honour it. This is the code that turns a working script into a failing one the moment you point it at production volumes rather than the twenty test records you developed against. Back off exponentially and add jitter.

**500 Internal Server Error — their application crashed.**
Something threw an exception the server did not handle. Your request may still have caused it, and the interesting question is whether it is deterministic. Send it again once. If it fails identically every time, capture the exact request and hand it over; if it is intermittent, it may be a downstream dependency.

**502 Bad Gateway — a proxy in front of the application could not get a valid response from it.**
This is the one that means "the box behind the load balancer is not answering, or answered with garbage". Common causes inside a customer network: the application container crashed and the load balancer is still routing to it, the health check is passing when it should not, the app is listening on the wrong interface, or an intermediate proxy is in the path that you did not know existed. A 502 is almost never a code fix in your client.

**503 Service Unavailable** — the server is up but refusing work: overloaded, or in maintenance. Retry with backoff.

**504 Gateway Timeout** — a proxy waited for the application and gave up. The application is alive but slow. Compare against the proxy's timeout; a request that takes 65 seconds behind a 60-second gateway timeout will always look like this, and the fix is either to make the work asynchronous or to change the timeout, not to retry.

The 502 and 504 pair is worth committing to memory as "the gateway spoke, the app did not". In a customer environment they very often mean there is a proxy you had not been told about. The networking module returns to this.

## Reproducing a failure with curl

When someone says "the integration is broken", the first move is to reproduce it outside their application, so you can prove which side is failing.

```bash
curl -i -sS -X POST https://api.example.com/v1/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"C-4471","amount_paise":125000,"currency":"INR"}'
```

`-i` includes response headers, `-sS` hides the progress bar but keeps errors. Read the status line and the headers before the body.

Two more that earn their place:

```bash
curl -v https://api.example.com/v1/health        # full handshake, headers both ways
curl -w '\ndns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} total=%{time_total}\n' \
     -o /dev/null -s https://api.example.com/v1/health
```

The second prints a timing breakdown. When a call is slow, this tells you in one line whether the time went to DNS, the TCP connect, the TLS handshake, or the application. That single command has saved more field hours than any dashboard.

## Build the triage table

Write this in your journal, in your own words, one line per code: what it means, who owns the fix, and the first command you would run. Keep it to one page. You are not memorising a specification; you are building the reflex that when a customer's engineer says "we are seeing 403s from your service", you already know that the next sentence out of your mouth is a question about scopes or IP allowlists and not about your code.

That reflex is directly testable in an interview, and it is asked.
