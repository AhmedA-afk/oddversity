---
title: "Diagnosing Five Real Broken Outputs"
track: "structured-outputs"
status: live
summary: "Five concrete broken extraction outputs, each diagnosed from its validation error back to its cause and its fix."
duration: "8 min read"
---

Reading a validation error and knowing instantly what to do about it is a learned skill, not an innate one. Here are five real shapes of broken output from the same pipeline, worked one at a time.

## The setup

A support-ticket extractor pulls this schema out of raw ticket text:

```python
from pydantic import BaseModel
from typing import Literal

class TicketExtract(BaseModel):
    name: str
    age: int
    status: Literal["open", "pending", "resolved"]
    email: str
    tags: list[str]

    class Config:
        extra = "forbid"
```

Five real captured responses broke it five different ways. Each one below is diagnosed the same way: read the raw output, read the validator's complaint, name the [failure category](/learn/structured-outputs/failure-modes-taxonomy) it belongs to, then fix it.

## Step by step

### 1. A length-truncated object

```json
{"name": "Dana Osei", "age": 34, "status": "open", "email": "dana@example.com", "tags": ["billing", "urg
```

`json.loads` raises `Expecting ',' delimiter: line 1 column 103 (char 102)` — and that column number sits at the very last character of the string, not somewhere in the middle. That's the tell for truncation specifically: a parse error pointing at the tail means the model simply ran out of room, not that it wrote something wrong partway through.

**Fix:** this is a syntactic failure. Run it through a tolerant repair pass that closes the open string and array (see [Repairing Partial and Streamed JSON](/learn/structured-outputs/incremental-json-repair-explained)), or better, raise `max_tokens` so it doesn't happen again. A repair pass here recovers `tags: ["billing", "urg"]` — note the last tag is likely incomplete too, so treat it as provisional and consider dropping it rather than trusting `"urg"` as a real value.

### 2. A wrong enum value

```json
{"name": "Marcus Lin", "age": 41, "status": "resolved-ish", "email": "marcus@example.com", "tags": []}
```

This parses fine. Pydantic raises:

```text
status: Input should be 'open', 'pending' or 'resolved' [type=literal_error, input_value='resolved-ish', input_type=str]
```

**Fix:** structural failure — the model paraphrased instead of picking from the literal set. If `"resolved-ish"` maps unambiguously to one allowed value, a deterministic remap table is the cheapest fix (rung one of [the repair ladder](/learn/structured-outputs/auto-repair-strategies)). Otherwise, re-ask with the error and the allowed set restated verbatim — the model rarely repeats this exact mistake once the literal options are back in front of it.

### 3. A response wrapped in apologetic prose

```text
I don't have access to the customer database, but based on the ticket
text provided, here is the extracted information:

{"name": "Priya Patel", "age": 29, "status": "open", "email": "priya@example.com", "tags": ["refund"]}

Let me know if you need anything else!
```

`json.loads` on the whole string fails immediately with `Expecting value: line 1 column 1` — it doesn't even get past the first character, because the first character is `I`, not `{`.

**Fix:** this is prose-leakage, not a syntax error in the JSON itself — treat it differently from case 1. Extract the substring between the first `{` and the matching last `}` (or the contents of a fenced ```json block if one is present) before attempting to parse anything. Once extracted, this object is actually valid — the fix is purely subtraction, no repair of the JSON needed at all.

### 4. A string where an int belonged

```json
{"name": "Jonas Weber", "age": "twenty-nine", "status": "pending", "email": "jonas@example.com", "tags": ["access"]}
```

```text
age: Input should be a valid integer, unable to parse string as an integer [type=int_parsing, input_value='twenty-nine', input_type=str]
```

**Fix:** structural failure, and specifically one where you should *not* auto-coerce. A digit-string like `"29"` is safe to coerce automatically — no ambiguity, no invented information. A word-form like `"twenty-nine"` is a different, riskier case: reaching for automatic word-to-number parsing invites edge cases (`"a dozen"`, `"mid-thirties"`) that don't have one clean answer. Re-ask with the error attached; let the model redo the conversion itself rather than hand-rolling a number-word parser for a case that shouldn't come up often.

### 5. A hallucinated extra field

```json
{"name": "Yuki Tanaka", "age": 52, "status": "open", "email": "yuki@example.com", "tags": ["billing"], "sentiment_score": 0.87}
```

With `extra = "forbid"` set on the model, Pydantic raises:

```text
sentiment_score: Extra inputs are not permitted [type=extra_forbidden]
```

**Fix:** structural — but only because the schema was written to forbid extras. Without that setting, this response would validate cleanly and the fabricated `sentiment_score` would flow straight downstream as if it were a real field, silently. That's the actual lesson here: set `additionalProperties: false` (Pydantic's `extra = "forbid"`, Zod's `.strict()`) by default, specifically so that a model's habit of adding "helpful" fields becomes a structural failure you can see and strip, instead of an invisible one.

## Where it breaks (and the fix)

Real production responses don't queue up neatly one failure at a time — they stack. A response can be prose-wrapped *and* truncated in the same breath:

```text
Here's what I found:
{"name": "Dana Osei", "age": 34, "status": "open", "tags": ["bill
```

Run this through the repair order from [A Taxonomy of Structured-Output Failures](/learn/structured-outputs/failure-modes-taxonomy): strip the prose first (find the `{`, discard everything before it), *then* check whether what's left parses. Here it still won't — you'll hit the same truncation as case 1, now on a clean substring. Fix that with the same bracket-closing repair. Trying to run a bracket-closer over the *un*-stripped text first would either fail outright or, worse, "successfully" close brackets around commentary that was never meant to be part of the object.

## Takeaways

- The column number in a `JSONDecodeError` and the `type` field in a Pydantic error are diagnostic information, not noise — read them before reaching for a fix.
- Truncation, wrong enums, prose wrapping, wrong types, and hallucinated fields are five different failures with five different fixes; treating them all as "malformed JSON, try again" wastes retries on failures a one-line deterministic fix would have solved instantly.
- A schema that forbids extra fields turns an invisible semantic-adjacent problem (case 5) into a visible, catchable structural one — that's a design choice worth making before you ever see a hallucinated field in production, covered further in [Schema Design for Reliability](/learn/structured-outputs/schema-design-for-reliability).
- Real failures compound. Diagnose in the fixed order — prose, syntax, structure, semantics — rather than assuming the first thing you spot is the only thing wrong.

**Related:** [A Taxonomy of Structured-Output Failures](/learn/structured-outputs/failure-modes-taxonomy), [Always Validate at the Boundary](/learn/structured-outputs/the-validation-layer), [Repairing Partial and Streamed JSON](/learn/structured-outputs/incremental-json-repair-explained), [The Repair Ladder](/learn/structured-outputs/auto-repair-strategies), [Enums: Locking a Field to a Fixed Set of Values](/learn/structured-outputs/enums-and-constrained-fields)
