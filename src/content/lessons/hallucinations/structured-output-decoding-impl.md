---
title: "Implementation: Schema-Constrained and Grammar-Constrained Output"
track: "hallucinations"
status: live
summary: "Force a tool argument to a real customer id from a provided list instead of a free-text string the model can fabricate."
duration: "8 min read"
---

[Constrained generation](/learn/hallucinations/constrained-generation-concept) explained why shrinking the output space prevents a class of fabrication. This lesson implements it: a schema that rejects a malformed tool call, and an enum constraint that makes a fabricated customer id structurally unreachable rather than just unlikely.

## What we're building

A tool-calling scenario: the model needs to look up a customer's account by id. Free-form, the model can invent a plausible-looking id that isn't real — a classic case of [tool-call argument fabrication](/learn/hallucinations/tool-call-argument-fabrication). We'll build a schema that only accepts ids from the actual list of customers in scope for this conversation, so a fabricated one is rejected before the tool call ever fires — plus a validate-and-retry loop that stands in for real token-level constrained decoding.

## Setup

Pure Python with the standard library. Real production systems get token-level enforcement for free from either their model provider's structured-output mode (JSON-schema-constrained decoding, where invalid tokens are masked out during sampling) or a constrained-decoding library. This lesson builds the validation logic that either approach needs underneath, and calls out explicitly where real token-level constraint would sit.

## Build it

### Step 1: Define the schema as data, not prose

```python
def build_schema(valid_customer_ids):
    return {
        "type": "object",
        "properties": {
            "customer_id": {"type": "string", "enum": valid_customer_ids},
            "reason": {"type": "string"},
        },
        "required": ["customer_id", "reason"],
        "additionalProperties": False,
    }
```

> **Why this step?** The enum isn't a static list baked into the model's training — it's built fresh, per request, from whatever customer ids are actually in scope for this conversation. That's what turns "structurally valid" into "factually possible": the schema itself can't be satisfied by a fabricated id, because a fabricated id was never a member of the enum in the first place.

### Step 2: A validator that mirrors what constrained decoding enforces at the token level

```python
def validate_against_schema(output: dict, schema: dict) -> tuple[bool, str | None]:
    required = schema.get("required", [])
    for field in required:
        if field not in output:
            return False, f"missing required field: {field}"

    if not schema.get("additionalProperties", True):
        extra = set(output) - set(schema["properties"])
        if extra:
            return False, f"unexpected fields: {extra}"

    for field, spec in schema["properties"].items():
        if field not in output:
            continue
        value = output[field]
        if spec["type"] == "string" and not isinstance(value, str):
            return False, f"{field} must be a string"
        if "enum" in spec and value not in spec["enum"]:
            return False, f"{field}={value!r} is not in the allowed set"

    return True, None
```

> **Why this step?** With real constrained decoding (JSON-schema mode from a model provider, or a grammar-constrained decoding library), this check happens *during* generation — the decoder masks out any token that would produce an invalid `customer_id`, so an invalid value is never emitted in the first place. This function is the fallback and the mental model for what that machinery guarantees: nothing that fails this check should ever be reachable output.

### Step 3: Wire it into the tool call, with a bounded retry

```python
def call_llm_for_tool_args(prompt: str) -> dict:
    # Swap point: your provider's structured-output / JSON mode call.
    raise NotImplementedError("wire up your LLM client")

def get_valid_tool_call(query, valid_customer_ids, max_attempts=2):
    schema = build_schema(valid_customer_ids)
    prompt = (
        f"Extract the customer lookup as JSON matching this schema: "
        f"{schema}. Query: {query}"
    )

    for attempt in range(max_attempts):
        output = call_llm_for_tool_args(prompt)
        ok, error = validate_against_schema(output, schema)
        if ok:
            return output
        prompt += f"\n\nYour previous output was invalid: {error}. Try again."

    return None  # exhausted retries — hand off to abstention/escalation
```

> **Why this step?** Even with provider-side schema enforcement, it's worth keeping an explicit retry loop for cases the provider's enforcement doesn't cover (a model that supports JSON-schema types but not full enums, for instance). `max_attempts` is intentionally small and bounded — this is not a place for an unbounded retry loop.

## Run it

Scenario: a conversation is scoped to customers `["cust_8841", "cust_2290"]`. A user asks, "Look up the refund status for customer 8841." Without constraint, the model might reasonably emit `{"customer_id": "cust_08841", ...}` — a plausible but wrong-format id, or worse, hallucinate an entirely different id it associates with "refund status" from unrelated training data.

With the schema built from the actual in-scope list, `"cust_08841"` fails `validate_against_schema` immediately (`not in the allowed set`), and the retry prompt tells the model exactly why. The corrected output, `{"customer_id": "cust_8841", "reason": "refund status lookup"}`, is the only shape that can pass — because it's the only real id in this conversation's scope that plausibly matches "8841."

If `max_attempts` is exhausted — say, the user actually meant a customer not in scope — `get_valid_tool_call` returns `None`, which should route to an abstention or escalation path rather than a best-guess tool call, per [escalation design for uncertain answers](/learn/hallucinations/escalation-design-for-uncertain-answers).

## Harden it

- Log every rejected attempt. A high rejection rate on a specific field is a signal the prompt's instructions or the schema's real-world coverage need work, not just that the model is being careless.
- Keep the enum list as fresh as the data it represents — a stale candidate list (a customer id that's since been merged or deleted) reintroduces exactly the fabrication risk constraint was meant to remove, just at the data layer instead of the model layer.

## Extend it

Constraint fixes the shape of the `customer_id` field — it says nothing about whether `"cust_8841"` is actually the *right* customer for this query rather than a different real customer the model confused it with. That's a value-truth problem, and it needs grounding and verification, not more schema. See [constrained generation](/learn/hallucinations/constrained-generation-concept)'s closing point on this, and pair structural constraint with the same citation-style verification from [the citation verification loop](/learn/hallucinations/citation-verification-loop) wherever a wrong-but-valid selection would be costly.

**Related:** [Constrained Generation](/learn/hallucinations/constrained-generation-concept), [Tool-Call Argument Fabrication](/learn/hallucinations/tool-call-argument-fabrication), [Tool-Call Hallucination](/learn/hallucinations/tool-call-hallucination), [Escalation Design for Uncertain Answers](/learn/hallucinations/escalation-design-for-uncertain-answers)
