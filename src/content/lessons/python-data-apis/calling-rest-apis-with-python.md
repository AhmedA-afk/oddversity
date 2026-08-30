---
title: "Calling REST APIs with requests"
track: "python-data-apis"
status: live
summary: "Teaches the anatomy of an HTTP request/response — verbs, status codes, headers, JSON bodies — through live GET and POST calls with `requests`, anchoring the `response.status_code` "
duration: "14 min read"
---

Every weather app, every chatbot, every dashboard that shows "live" data is doing the same thing under the hood: sending a small text message to a server and parsing a small text message back. Once you can read that exchange — not just call a function that hides it — you can debug *any* API, not just the ones with friendly Python wrappers.

## What it is

An HTTP request has four parts, and that's the whole vocabulary:

- **A verb** — what you want to do (`GET` to read, `POST` to send/create, plus `PUT`, `PATCH`, `DELETE` for the rest).
- **A URL** — which resource you're talking to.
- **Headers** — metadata about the request, sent separately from the content (what format you're sending, what format you want back, who you are).
- **A body** — the actual payload, usually present on `POST`/`PUT`/`PATCH`, usually absent on `GET`.

The response mirrors that shape:

- **A status code** — a three-digit number that tells you what happened, before you look at anything else.
- **Headers** — metadata about the response.
- **A body** — the data you asked for, or an error description.

In Python, the `requests` library is the standard way to construct one side of this exchange and parse the other:

```python
import requests

response = requests.get("https://api.open-meteo.com/v1/forecast")
print(type(response))          # <class 'requests.models.Response'>
print(response.status_code)    # 400 — we haven't given it a location yet
```

That `Response` object is the entire lesson in one variable: it holds the status code, the headers, and the body, and gives you `.json()` as a one-line way to turn a JSON body into a Python dict.

## The mental model

Picture the call like this: you dial a number (the URL) and open with one specific word that states your intent — "get" or "post," never a sentence. Anything the other side needs for context but that isn't part of the actual ask — your credentials, what format you'd like the reply in — goes on an index card you hand over silently (the headers), not spoken aloud as part of your request. If you're handing something over — a new order, a sensor reading, an event — you write it out on a form in a language both sides agreed on in advance (JSON), and attach that.

The other side *always* answers with the three-digit code first, before anything else, no matter what you asked or what went wrong. Then, only after that, they hand back their own paperwork — a body, in the same shared language.

That ordering is the important part to internalize: **check the code before you trust the body**. A 500 error page is still "a response" — it has headers and often a body — but the body might be HTML, not JSON, and calling `.json()` on it will blow up. The status code is what tells you whether the body is worth parsing at all.

## Why it works this way

HTTP is deliberately boring and language-agnostic. It has to work the same whether the client is Python, JavaScript, curl, or a toaster — so the "did it work" signal can't be an English sentence you'd have to parse ("Sorry, something went wrong!"). It has to be a number, drawn from a small fixed set of ranges every HTTP client on earth already understands:

| Range | Means | Examples |
|---|---|---|
| 2xx | Success | `200` OK, `201` Created |
| 3xx | Redirect | `301` Moved Permanently |
| 4xx | You (the client) made a bad request | `400` Bad Request, `401` Unauthorized, `404` Not Found, `429` Too Many Requests |
| 5xx | The server failed | `500` Internal Server Error, `503` Service Unavailable |

That's why every serious pipeline branches on `response.status_code` instead of trying to string-match error text — the code is a stable contract, the wording of an error message is not.

JSON won for bodies for a similar reason: it's plain text, so it survives being copied through any transport, and it maps directly onto the nested dicts and lists you already work with in Python — see [nested JSON in memory](/learn/python-data-apis/nested-json-in-memory) for exactly how that mapping works. A server written in Go and a client written in Python don't need to share a runtime; they just need to agree on JSON's handful of types.

And the verb/URL split exists so the same address can mean different things depending on intent: `GET /orders/42` reads order 42, `DELETE /orders/42` removes it. The noun lives in the URL; the intent lives in the verb. That's also why `GET` requests conventionally carry no body — anything they need to specify (filters, coordinates, pagination) goes in the URL as query parameters instead, which is what `params=` does below.

## A concrete example

**GET**, against a real, keyless weather API ([Open-Meteo](https://open-meteo.com)):

```python
import requests

url = "https://api.open-meteo.com/v1/forecast"
params = {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "current": "temperature_2m,wind_speed_10m",
}

response = requests.get(url, params=params, timeout=10)

print(response.status_code)          # 200
print(response.url)                  # see the query string requests built for you
print(response.headers["Content-Type"])  # application/json; charset=utf-8
```

Always look at the raw shape before you assume field names — API responses evolve, and this is the one habit that saves you from guessing:

```python
data = response.json()
print(data)
# {'latitude': 40.71, 'longitude': -73.99, ...,
#  'current': {'time': '2026-08-29T14:00', 'temperature_2m': 24.3, 'wind_speed_10m': 11.7}, ...}

temp = data["current"]["temperature_2m"]
print(f"It's {temp}°C right now.")
```

`response.json()` is just `json.loads(response.text)` with better error messages — it's a convenience method, not magic.

Now **POST**, sending a JSON body to a webhook. [httpbin.org](https://httpbin.org) is a public testing service built for exactly this — it echoes back whatever you send it, so you can see the full round trip:

```python
import requests

payload = {
    "event": "order.created",
    "order_id": "A1029",
    "amount": 42.50,
}

response = requests.post(
    "https://httpbin.org/post",
    json=payload,      # requests serializes this to JSON *and* sets Content-Type for you
    timeout=10,
)

print(response.status_code)   # 201 would be typical for "created"; httpbin returns 200
body = response.json()
print(body["json"])                        # your payload, echoed back
print(body["headers"]["Content-Type"])     # 'application/json'
```

The `json=` argument is doing two things you'd otherwise do by hand: calling `json.dumps()` on your dict, and setting the `Content-Type: application/json` request header so the server knows how to parse what you sent. That header is the request-side mirror of the one you just read on the response.

A production version wraps the status check explicitly rather than assuming success:

```python
response = requests.post(url, json=payload, timeout=10)

if response.status_code == 200:
    result = response.json()
else:
    print(f"Webhook failed: {response.status_code} — {response.text}")
```

Or let `requests` raise for you on any 4xx/5xx:

```python
response.raise_for_status()   # raises requests.HTTPError if status is 4xx/5xx
result = response.json()
```

Get comfortable with both patterns — `status_code` checks and `raise_for_status()` — because [parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) builds directly on top of them.

## Where it shows up

This exact pattern — verb, URL, headers, JSON body, status code, `.json()` — is the substrate under almost everything else in this track:

- **Calling an LLM** is a `POST` with a JSON body containing your prompt, and a JSON body coming back containing the model's output — see [calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python).
- **Authenticated APIs** attach credentials as a header rather than a URL parameter — [authentication and API keys](/learn/python-data-apis/authentication-and-api-keys) picks up exactly where the headers here leave off.
- **Rate limits** show up as a `429` status code, which your code branches on the same way it branches on `200` — see [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries).
- **Paginated results** are just repeated `GET` calls where each JSON body tells you the URL or token for the next page — [pagination patterns](/learn/python-data-apis/pagination-patterns).
- **Webhooks in reverse** — a service `POST`ing JSON *to* your server — use the identical body/header shape you just sent to httpbin, just with the roles flipped.

## Watch out for

**Calling `.json()` before checking `.status_code`.** A `404` or `500` response often comes back as an HTML error page, not JSON — `.json()` will throw a decode error, and the traceback won't obviously point back to "the status was wrong." Check the code, or call `raise_for_status()`, first.

**`data=` versus `json=`.** `requests.post(url, data=payload)` on a dict sends form-encoded data (`application/x-www-form-urlencoded`) — which most JSON APIs will silently reject or misparse. `requests.post(url, json=payload)` serializes to JSON and sets the right content type. If a POST that "should work" is failing with a 400, this is the first thing to check.

**No default timeout.** `requests.get(url)` with no `timeout=` will wait forever if the server hangs — there's no built-in ceiling. Always pass `timeout=` (seconds), even a generous one, so a flaky endpoint fails loudly instead of freezing your script silently.

One more thing worth internalizing early: never hardcode a webhook URL or API key directly in a script you'll share or commit — treat it the way you'd treat any credential. [Secrets and config management](/learn/python-data-apis/secrets-and-config-management) covers the pattern for keeping it out of your source.

## Where next

From here, the natural path is [authentication and API keys](/learn/python-data-apis/authentication-and-api-keys) to add credentials to these same requests, then [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) and [pagination patterns](/learn/python-data-apis/pagination-patterns) to handle the ways real APIs push back or split up large results. Once those habits are solid, [calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) applies this exact same verb/status/JSON shape to a chat completion endpoint.

**Related:** [nested JSON in memory](/learn/python-data-apis/nested-json-in-memory) · [parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) · [common API-calling mistakes](/learn/python-data-apis/api-calling-common-mistakes) · [API calling quiz](/learn/python-data-apis/api-calling-quiz)
