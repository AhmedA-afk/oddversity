---
title: "Parsing and Validating API Responses"
track: "python-data-apis"
status: live
summary: "A worked example that takes a real LLM classification call through json.loads and a pydantic model, then deliberately breaks it three ways — a missing field, a stringified number, "
duration: "16 min read"
---

An LLM API call doesn't hand you a Python object. It hands you text that happens to look like one — and the gap between those two things is exactly where classification pipelines quietly rot in production.

## The setup (specific)

You're building a triage step for a support inbox: every incoming ticket gets sent to an LLM, which is supposed to return a small JSON object your code then uses to route the ticket. Here's one ticket:

```python
ticket_text = (
    "My invoice for August shows a charge of $340 but I'm on the $49/month "
    "plan. Can someone check this? This is urgent, I need it fixed before "
    "my finance team reviews expenses tomorrow."
)
```

And here's the shape you need back — the data contract for this pipeline, same idea covered in [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation), just applied to model output instead of a dataframe:

```python
from typing import Literal
from pydantic import BaseModel, Field

class TicketClassification(BaseModel):
    category: Literal["billing", "bug", "feature_request", "other"]
    priority: int = Field(ge=1, le=5)      # 5 = drop everything
    confidence: float = Field(ge=0.0, le=1.0)
    summary: str
```

Nothing downstream of this point — the router, the dashboard, the on-call alert — should ever touch the raw text the model produced. It should only ever touch a `TicketClassification` instance. Getting from one to the other reliably is the whole lesson.

## Step by step

### 1. Make the call and get text back

This part is the mechanics covered in [calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) — a client (reading its key from the environment, per [secrets and config management](/learn/python-data-apis/secrets-and-config-management)), a system prompt describing the shape you want, and the ticket as the user message:

```python
import anthropic

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from the environment

SYSTEM_PROMPT = """You classify support tickets. Respond with ONLY a JSON \
object, no other text, matching this shape:
{"category": "billing" | "bug" | "feature_request" | "other",
 "priority": <integer 1-5, 5 is most urgent>,
 "confidence": <float 0.0-1.0>,
 "summary": "<one sentence>"}"""

response = client.messages.create(
    model="claude-opus-5",
    max_tokens=256,
    system=SYSTEM_PROMPT,
    messages=[{"role": "user", "content": ticket_text}],
)

raw_text = next(b.text for b in response.content if b.type == "text")
print(raw_text)
# {"category": "billing", "priority": 5, "confidence": 0.93, "summary":
#  "Customer was charged $340 instead of the $49 plan price and needs it
#  corrected before a finance review tomorrow."}
```

> **Why this step?** `response.content` is a list of typed blocks (text, tool calls, thinking) — you have to pull the actual string out before you can do anything with it. At this point `raw_text` is just a string. It looks like JSON. It is not JSON, not to Python — it's still just a sequence of characters that happens to be shaped like some.

### 2. Parse it — does it even have the right syntax?

```python
import json

data = json.loads(raw_text)
# {'category': 'billing', 'priority': 5, 'confidence': 0.93,
#  'summary': 'Customer was charged $340 instead of the $49 plan price...'}
```

> **Why this step?** `json.loads` answers exactly one question: is this valid JSON syntax? It does not know anything about your schema. It will happily parse `{"category": "purple", "oops": true}` — a completely useless object for your purposes — with zero complaint. Treat a successful `json.loads` as "this is a dict now," not "this is the data I asked for."

### 3. Validate it — does it match the contract?

```python
classification = TicketClassification.model_validate(data)
print(classification)
# category='billing' priority=5 confidence=0.93 summary='Customer was
# charged $340 instead of the $49 plan price and needs it corrected...'
print(type(classification.priority))   # <class 'int'>
```

> **Why this step?** This is the step `json.loads` can't do for you. `model_validate` checks every field exists, every type matches (or can be honestly converted — more on that below), and every constraint holds (`priority` between 1 and 5, `category` one of exactly four strings). Only after this line do you have something you can pass to `route_ticket()` and trust without a second thought.

Two functions, two different questions: `json.loads` asks "is this text well-formed?" and `model_validate` asks "is this the thing I actually asked for?" Conflating them is how a well-formed-but-wrong object slips through and corrupts a report three steps downstream. This is also why [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) and the retries you're about to write here are different mechanisms: the SDK retries *network* failures (429s, timeouts) automatically; nothing retries a *content* failure like a missing field unless you write it.

## Where it breaks

Same ticket, same prompt — but LLM output isn't deterministic, and three things happen across enough calls that you need to handle all of them on purpose rather than discover them in production.

### Break 1: a missing field

```python
raw_missing = (
    '{"category": "billing", "priority": 5, '
    '"summary": "Customer was charged $340 instead of the $49 plan price."}'
)
data = json.loads(raw_missing)          # succeeds — this is valid JSON
TicketClassification.model_validate(data)
```

```
1 validation error for TicketClassification
confidence
  Field required [type=missing, input_value={'category': 'billing', ...}, input_type=dict]
```

The model dropped `confidence` entirely. `json.loads` had nothing to complain about — this is perfectly good JSON, it's just missing a field your contract requires.

### Break 2 (mostly not a break): a stringified number

```python
raw_stringified = (
    '{"category": "billing", "priority": "5", "confidence": "0.93", '
    '"summary": "Customer was charged $340 instead of the $49 plan price."}'
)
data = json.loads(raw_stringified)
result = TicketClassification.model_validate(data)
print(result.priority, type(result.priority))     # 5 <class 'int'>
print(result.confidence, type(result.confidence)) # 0.93 <class 'float'>
```

This one *validates fine*, and that's worth pausing on. Pydantic's default mode is lax, not strict: for an `int` or `float` field, a string that unambiguously parses as a number gets coerced, not rejected. `"5"` becomes `5`. That's often exactly what you want, because plenty of models emit numbers as strings depending on how the prompt is phrased, and you don't want every one of those to page someone.

But leniency has a cost: if your prompt clearly asks for a number and you keep getting a string back, that's a signal your prompt isn't landing — and next time, instead of `"5"`, you might get `"high"`, which does *not* coerce:

```python
data = json.loads('{"category": "billing", "priority": "high", "confidence": 0.93, "summary": "..."}')
TicketClassification.model_validate(data)
```

```
1 validation error for TicketClassification
priority
  Input should be a valid integer, unable to parse string as an integer [type=int_parsing, input_value='high', input_type=str]
```

If you'd rather catch the type drift itself — even the harmless-looking `"5"` — turn coercion off:

```python
from pydantic import ConfigDict

class StrictTicketClassification(TicketClassification):
    model_config = ConfigDict(strict=True)

StrictTicketClassification.model_validate(data)  # data has priority="5", confidence="0.93"
```

```
2 validation errors for StrictTicketClassification
priority
  Input should be a valid integer [type=int_type, input_value='5', input_type=str]
confidence
  Input should be a valid number [type=float_type, input_value='0.93', input_type=str]
```

Which mode you want is a judgment call, not a default to accept blindly: lax if occasional stringified numbers are noise you don't want to page on, strict if type drift is itself the signal you're trying to catch.

### Break 3: output that isn't JSON at all

```python
raw_prose = (
    'Sure! Here is the classification:\n\n'
    '```json\n'
    '{"category": "billing", "priority": 5, "confidence": 0.93, "summary": "..."}\n'
    '```\n\n'
    'Let me know if you need anything else.'
)
json.loads(raw_prose)
```

```
json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)
```

There's a perfectly good JSON object buried in there, wrapped in a friendly sentence and a markdown fence — but `json.loads` looks at character zero, sees `S`, and gives up immediately. This is the most common real-world failure, and tightening your prompt's formatting instructions (see [delimiters and formatting](/learn/prompt-engineering/delimiters-and-formatting)) cuts it more than any parsing cleverness will. It won't get you to zero, though, so your code still needs a plan for it.

### The retry-or-reject decision

You now have two kinds of failure with two different fixes. A missing field or a prose-wrapped response is often the model having an off moment on a task it understands — a sharper reminder usually fixes it. A hallucinated category, or the same failure twice, means the model doesn't understand the contract on this input at all — retrying with the same prompt just spends another API call to fail the same way. That distinction, not "did validation fail," is what should decide whether you retry or give up.

```python
class ClassificationRejected(Exception):
    """Raised when a response can't be salvaged after retrying."""
    def __init__(self, reason, raw_text):
        self.reason = reason
        self.raw_text = raw_text
        super().__init__(reason)

MAX_ATTEMPTS = 2

def get_classification(ticket_text: str, client: anthropic.Anthropic,
                        attempt: int = 1) -> TicketClassification:
    response = client.messages.create(
        model="claude-opus-5",
        max_tokens=256,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": ticket_text}],
    )
    raw_text = next(b.text for b in response.content if b.type == "text")

    # Layer 1: is it JSON at all?
    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError:
        if attempt < MAX_ATTEMPTS:
            nudge = ticket_text + (
                "\n\n(Your last reply wasn't valid JSON. Respond with ONLY "
                "the JSON object - no prose, no markdown fences.)"
            )
            return get_classification(nudge, client, attempt + 1)
        raise ClassificationRejected("never produced parseable JSON", raw_text)

    # Layer 2: does it match the contract?
    try:
        return TicketClassification.model_validate(data)
    except ValidationError as e:
        errors = e.errors()
        only_missing_fields = all(err["type"] == "missing" for err in errors)
        if only_missing_fields and attempt < MAX_ATTEMPTS:
            missing = [err["loc"][0] for err in errors]
            nudge = ticket_text + (
                f"\n\n(Your last reply was missing: {missing}. "
                "Include every field.)"
            )
            return get_classification(nudge, client, attempt + 1)
        raise ClassificationRejected(f"validation failed: {errors}", raw_text)
```

Note what earns a retry and what doesn't: a purely missing-field error retries once, with a nudge naming exactly what was missing. A bad `category` value, a non-numeric `priority`, or a second failure after that one retry all raise `ClassificationRejected` immediately — no third attempt, because nothing about the prompt changed enough to expect a different answer. Calling code then makes the actual business decision:

```python
try:
    result = get_classification(ticket_text, client)
    route_ticket(result)
except ClassificationRejected as e:
    # Log the raw text for prompt debugging - appending to a JSONL file
    # (see /learn/python-data-apis/json-and-jsonl-files) is a natural fit -
    # then hand the ticket to a person. Never guess a category to keep
    # the pipeline moving; a fabricated label is worse than a delayed one.
    send_to_human_queue(ticket_text, reason=e.reason, raw=e.raw_text)
```

That last comment is the part worth taking seriously: rejection is a routing decision, not a data-cleaning problem. Don't default `priority` to 3 or `category` to `"other"` just to keep records flowing — that's inventing data the model never actually gave you, and it'll look identical to a real classification to everything downstream. See [common API-calling mistakes](/learn/python-data-apis/api-calling-common-mistakes) for more of this shape of bug.

## Takeaways

- `json.loads` and `model_validate` check two different things — syntax and shape. A response can pass one and fail the other; you need both, in that order.
- Pydantic's default (lax) mode coerces numeric strings like `"5"` into `5` for you. That's usually a feature — switch a model to `ConfigDict(strict=True)` only when type drift itself is the thing you want to catch.
- Sort validation failures by cause before deciding what to do: a missing field or prose wrapper is often a one-off you can fix with a sharper retry prompt; a hallucinated enum value or a repeat failure means the model doesn't understand the contract on this input, and retrying just burns another call.
- Cap retries at a small fixed number and always log the raw failing text somewhere — it's the best signal you'll get for fixing the prompt itself.
- Rejection should route to a human or a dead-letter queue, never to a guessed default. A fabricated classification is indistinguishable from a real one to every system reading it afterward.

**Related:** [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) · [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) · [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) · [Delimiters and formatting](/learn/prompt-engineering/delimiters-and-formatting) · [Common API-calling mistakes](/learn/python-data-apis/api-calling-common-mistakes) · [JSON and JSONL files](/learn/python-data-apis/json-and-jsonl-files)
