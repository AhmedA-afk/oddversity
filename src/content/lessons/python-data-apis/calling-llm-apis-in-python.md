---
title: "Calling an LLM Chat API"
track: "python-data-apis"
status: live
summary: "Deep implementation walkthrough for Oddversity's Python & Data track: builds a runnable ticket-triage script against the Anthropic Messages API, covering system/user messages, read"
duration: "3 min read"
---

A chat-completion call looks like a normal REST request right up until it fails in ways a normal REST client never does — the server can return HTTP 200 with an answer it cut off mid-sentence, or with a polite refusal instead of your data. You'll build a small, real script that sends a support ticket to Claude and gets back a structured record, and you'll handle those failure modes on purpose instead of discovering them in production.

## What we're building

`triage_ticket.py`: a function that takes one raw customer-support ticket (free text, the messy kind that shows up in a real inbox) and returns a clean dict — `category`, `sentiment`, `urgency`, `summary` — that you could drop straight into a dataframe or a CSV row. Along the way it reads token usage off every response and handles the three failure modes that are specific to LLM APIs: truncated output, refused output, and rate limits.

This is the single-call tier — one request, one response, no agent loop, no tools. If you haven't made a plain REST call in Python yet, do that first: [Calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) covers the request/response basics this lesson builds on.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install anthropic python-dotenv
```

Get an API key from the Anthropic Console and keep it out of your source code:

```
# .env
ANTHROPIC_API_KEY=sk-ant-...
```

```python
from dotenv import load_dotenv
load_dotenv()  # now ANTHROPIC_API_KEY is in os.environ
```

If you haven't set up a project like this before, [Python environments and venv](/learn/python-data-apis/python-environments-and-venv) and [Secrets and config management](/learn/python-data-apis/secrets-and-config-management) cover the why, not just the how. Never hardcode the key, and never put it in anything you'd commit or send to a service.

### Build it

#### 1. Install and initialize the client

```python
import anthropic

client = anthropic.Anthropic()
# Reads ANTHROPIC_API_KEY from the environment automatically.
# Never pass api_key="sk-ant-..." as a literal - see the secrets lesson above.
```

One client per process is enough — it's not tied to a single conversation or request, so create it once and reuse it.

#### 2. Write the system message: a contract, not a personality

The `system` message is where a chat API diverges from a normal REST call. You're not setting a query parameter; you're writing instructions in prose, and the model's compliance with them is probabilistic, not guaranteed by a schema. Treat it as the contract for the whole call: what role Claude is playing, and — critically — exactly what fields you expect back and what values are valid for each one.

```python
SYSTEM_PROMPT = """You triage incoming customer support tickets for a small SaaS company.
Read the ticket and extract exactly these fields, based only on what the ticket says:

- category: one of "billing", "bug", "feature_request", "account", "other"
- sentiment: one of "frustrated", "neutral", "positive"
- urgency: an integer from 1 (can wait) to 5 (drop everything)
- summary: one sentence describing what the customer wants

If the ticket doesn't give you enough information to judge urgency, default to 3."""
```

Notice this says nothing about the ticket itself. That's deliberate — the system message holds what's true across every ticket you'll ever send; the ticket text goes in the user message, next.

#### 3. Write the user message and send the request

The user message is the payload that changes per call — the equivalent of the body you'd send to a REST endpoint. Keep it as close to the raw data as you can; resist the urge to re-explain the task here, that's what the system message is for.

```python
ticket_text = """
Hi, I've been charged twice for my Pro subscription this month ($49 x2) and
support hasn't responded in 3 days. This is the second time this has happened.
I need this fixed today or I'm cancelling.
"""

response = client.messages.create(
    model="claude-opus-5",
    max_tokens=1024,
    system=SYSTEM_PROMPT,
    messages=[{"role": "user", "content": ticket_text}],
)
```

`max_tokens` is a cap on generation, not a request for a response of that size — the model stops as soon as it's done, or when it hits the cap, whichever comes first. That distinction matters in the next step.

#### 4. Read the response: content blocks, stop reason, and usage

`response.content` is a *list* of typed blocks, not a string — a plain-text answer arrives as a `text` block, but the same response shape can carry `thinking` or `tool_use` blocks depending on what you asked for, so always check `.type` before reading `.text`:

```python
for block in response.content:
    if block.type == "text":
        print(block.text)

print(response.stop_reason)         # why generation stopped
print(response.usage.input_tokens)  # tokens you sent
print(response.usage.output_tokens) # tokens you were billed for generating
```

`stop_reason` is the field a REST API doesn't have an equivalent for, and it's the one you'll check constantly:

| Value | Meaning |
|---|---|
| `end_turn` | finished normally |
| `max_tokens` | cut off by the cap you set — the output is truncated, not wrong |
| `refusal` | declined for safety reasons — check `response.stop_details` |
| `tool_use` | wants to call a tool (not used in this lesson) |

A REST endpoint that can't fulfill your request gives you a 4xx and stops. This API can give you a 200 with a `stop_reason` that means "this isn't what you asked for" — which is why reading it isn't optional.

#### 5. Constrain the output so parsing isn't a guess

Asking nicely for JSON in the system prompt works most of the time, which is exactly the problem — "most of the time" breaks a pipeline the first time a ticket has a stray comment before the `{`. Use `output_config` to make the schema part of the request instead of a hope:

```python
import json

TICKET_SCHEMA = {
    "type": "object",
    "properties": {
        "category": {
            "type": "string",
            "enum": ["billing", "bug", "feature_request", "account", "other"],
        },
        "sentiment": {"type": "string", "enum": ["frustrated", "neutral", "positive"]},
        "urgency": {"type": "integer", "minimum": 1, "maximum": 5},
        "summary": {"type": "string"},
    },
    "required": ["category", "sentiment", "urgency", "summary"],
    "additionalProperties": False,
}


def triage_ticket(ticket_text: str) -> dict:
    if not ticket_text.strip():
        raise ValueError("ticket_text is empty - nothing to send")

    response = client.messages.create(
        model="claude-opus-5",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": ticket_text}],
        output_config={"format": {"type": "json_schema", "schema": TICKET_SCHEMA}},
    )

    if response.stop_reason == "max_tokens":
        raise RuntimeError("Response was truncated before it finished - raise max_tokens")
    if response.stop_reason == "refusal":
        category = response.stop_details.category if response.stop_details else None
        raise RuntimeError(f"Model declined to answer (category: {category})")

    text = next(block.text for block in response.content if block.type == "text")
    ticket = json.loads(text)  # guaranteed valid JSON when stop_reason == "end_turn"

    print(f"tokens: {response.usage.input_tokens} in / {response.usage.output_tokens} out")
    return ticket
```

`output_config.format` guarantees the text block parses as JSON matching your schema — but only when the model actually finished (`stop_reason == "end_turn"`). That's why the truncation check comes first: a `max_tokens` cutoff can still hand you a half-written JSON object that looks like a `json.loads` bug when it's really a token-budget bug. [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) goes deeper on validating what you get back once it's a dict.

## Run it

Call it and print the result:

```python
if __name__ == "__main__":
    result = triage_ticket(ticket_text)
    print(json.dumps(result, indent=2))
```

You should see the token count line, then something shaped like this (the model's exact wording will vary between runs — treat the values below as illustrative, not a spec):

```
tokens: 165 in / 34 out
{
  "category": "billing",
  "sentiment": "frustrated",
  "urgency": 5,
  "summary": "Customer was double-charged for their Pro subscription and wants it fixed today or will cancel."
}
```

`urgency` and `sentiment` are judgment calls the model is making from tone and content, not facts it's looking up — expect them to be reasonable, not deterministic. If you need the same input to always produce the same category, that's a signal to narrow the categories or add few-shot examples to the system prompt, not to expect determinism you haven't asked for.

## Harden it

The three failure modes from the brief, handled explicitly instead of assumed away:

**Truncated output.** Already caught above via `stop_reason == "max_tokens"`. The fix is almost always to raise `max_tokens` — 1024 is generous for a four-field ticket record, but if you extend the schema with a longer `summary` or add a `suggested_reply` field, budget accordingly. Don't set `max_tokens` low to save money; a truncated response that gets discarded and retried costs more than a response with headroom.

**Refusal (this API's version of content filtering).** Unlike a keyword-based content filter that either passes or blocks before generation, `stop_reason == "refusal"` is decided by the model itself and comes with structured detail:

```python
if response.stop_reason == "refusal" and response.stop_details:
    print(response.stop_details.category)     # e.g. "cyber", "bio", or None
    print(response.stop_details.explanation)
```

For a ticket-triage pipeline, a refusal on ordinary customer complaints should be rare — if you see one, log the ticket text and the category for review rather than silently dropping it. Don't retry a refusal with the identical request; it'll refuse again.

**Rate limits.** The SDK already retries `429` and `5xx` responses with exponential backoff (`max_retries=2` by default), so you don't need to hand-roll basic backoff. Wrap the call anyway when you want visibility into what's happening in a batch job, or want to keep going past the default retry count:

```python
import time

def safe_triage(ticket_text: str, retries: int = 3) -> dict | None:
    for attempt in range(retries):
        try:
            return triage_ticket(ticket_text)
        except anthropic.RateLimitError as e:
            wait = int(e.response.headers.get("retry-after", "20"))
            print(f"rate limited, waiting {wait}s (attempt {attempt + 1}/{retries})")
            time.sleep(wait)
        except anthropic.APIStatusError as e:
            print(f"API error {e.status_code}: {e.message}")
            return None
        except anthropic.APIConnectionError:
            print("network error reaching the API")
            return None
    print("gave up after repeated rate limits")
    return None
```

Order matters here: `RateLimitError` and `APIStatusError` both descend from the same base, so the more specific exception has to come first or it never gets caught. This is the general shape for any error handling against this API — see [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) for the pattern applied beyond this one endpoint.

A few more edges worth guarding before this touches real traffic:

- **Empty or near-empty tickets** — the `ticket_text.strip()` check above stops you from paying for a call that has nothing to extract.
- **`json.loads` failing anyway** — the schema guarantee only holds for a completed response; wrap the `json.loads` call in a `try/except json.JSONDecodeError` if you're calling this from a loop you can't afford to crash, and log the raw text for debugging rather than swallowing it.
- **Unicode and odd escaping in extracted text** — always parse the model's JSON string output with `json.loads`, never with string matching or regex, even for fields that look simple.

## Extend it

- **Stronger typing.** Swap the raw schema for a Pydantic model and `client.messages.parse(...)`, which validates the response into a typed object for you instead of a bare dict. Pairs with [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) if you're feeding this into a larger pipeline with its own schema.
- **Throughput.** Triaging one ticket at a time is fine for a demo and slow for a real inbox. Fan out concurrent calls with `asyncio` (see [Concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio)), or move non-urgent, non-latency-sensitive batches to the Batches API for a meaningful cost cut (see [Batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput)).
- **Persist the output.** Once you're getting back clean dicts, write them to JSONL as you go (one ticket per line, crash-safe) or accumulate into a dataframe for aggregation — see [JSON and JSONL files](/learn/python-data-apis/json-and-jsonl-files) and [GroupBy and aggregation](/learn/python-data-apis/groupby-and-aggregation) if the next step is "how many urgent billing tickets did we get this week."
- **Common mistakes.** Before you wire this into anything larger, skim [API calling common mistakes](/learn/python-data-apis/api-calling-common-mistakes) — several of them are exactly the traps this lesson built the function to avoid.

**Related:** [Calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) · [Authentication and API keys](/learn/python-data-apis/authentication-and-api-keys) · [Secrets and config management](/learn/python-data-apis/secrets-and-config-management) · [Parsing and validating API responses](/learn/python-data-apis/parsing-and-validating-api-responses) · [Turning messy data into model inputs](/learn/python-data-apis/turning-messy-data-into-model-inputs)
