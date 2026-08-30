---
title: "One Task, Four Mechanisms"
track: "structured-outputs"
status: live
summary: "One address, parsed four ways — showing exactly where each mechanism's guarantee starts and stops."
duration: "8 min read"
---

Same input, same target schema, four mechanisms — and the actual output diffs make the guarantee boundaries from [Four Roads to Structured Output](/learn/structured-outputs/three-ways-to-get-json-overview) concrete instead of theoretical.

## The setup

The input text:

```text
Ship to: Priya Shah, 221B Baker Street, Flat 4, Bengaluru,
Karnataka 560001, India. Please deliver after 6pm.
```

The target schema:

```python
from pydantic import BaseModel

class Address(BaseModel):
    street: str
    city: str
    region: str
    postal_code: str
    country: str
```

## Step by step

**1. Prompt-only.** The prompt asks for "the shipping address as JSON with keys street, city, region, postal_code, country." The reply:

```text
Sure! Here's the address:
{"street": "221B Baker Street, Flat 4", "city": "Bengaluru", "region": "Karnataka", "postal_code": "560001", "country": "India"}
Let me know if you need anything else!
```

> **Why this step?** The JSON itself is actually fine here — the failure is the leading `"Sure! Here's the address:"` and trailing `"Let me know..."` text wrapped around it. `json.loads(reply)` throws immediately; you must locate and strip the JSON substring before parsing at all. That's entirely self-inflicted overhead none of the other three mechanisms carry.

**2. JSON mode.** Same prompt, JSON-mode flag on. The output is guaranteed to *be* valid JSON — but nothing forces it into your five keys. It could just as easily come back as:

```json
{"address": "221B Baker Street, Flat 4, Bengaluru, Karnataka 560001, India"}
```

> **Why this step?** This is JSON mode's exact guarantee boundary made visible: valid syntax, zero shape guarantee. `json.loads()` succeeds; `Address.model_validate()` on that dict fails immediately, because none of your five required keys are present.

**3. Schema-constrained (Pydantic-backed).** The same `Address` model's JSON Schema is passed to a schema-constrained decoding call. The output:

```json
{"street": "221B Baker Street, Flat 4", "city": "Bengaluru", "region": "Karnataka", "postal_code": "560001", "country": "India"}
```

Clean — no leading text, right keys, right types. `Address.model_validate_json(output)` succeeds directly.

> **Why this step?** This is the version that needs zero cleanup code. The constraint eliminated both the prose-leak failure from step 1 and the shape-mismatch failure from step 2 structurally, before generation even finished — not by hoping the model behaved.

**4. Grammar-constrained.** A GBNF-style grammar, on a local-inference runtime, restricts output to exactly this five-field object at the character level. For this input, the output is functionally identical to step 3.

> **Why this step?** This is the honest, useful finding: for a flat JSON object like this, grammar-constrained decoding buys you nothing schema-constrained decoding didn't already deliver. Its value shows up on genuinely non-JSON targets — a custom DSL, a restricted query language — not here. More machinery isn't automatically better; the mechanism should match what the target format actually needs. See [Grammar-Constrained Generation](/learn/structured-outputs/grammar-constrained-generation).

## Where it breaks (+fix)

Even step 3's clean output isn't semantically bulletproof. If the source text had read "Flat 4, 221B Baker Street" (reordered) or omitted the postal code entirely, a schema-constrained model can still merge `region` and `postal_code` into one field, or invent a plausible-looking postal code for a Bengaluru address instead of leaving it blank — a shape-valid, semantically wrong output that no amount of decoding constraint prevents. The fix is twofold: add a validator that checks `postal_code` against a country-specific format, and prefer a nullable field over an invented value, so "not found" is representable and distinguishable from "found and correct" — see [Optional, Nullable, and Defaults](/learn/structured-outputs/optional-nullable-and-defaults).

## Takeaways

- Prompt-only carries a self-inflicted parsing cost that has nothing to do with the model's actual competence at the task.
- JSON mode's guarantee stops at "this parses" — not "this has the fields you asked for."
- Schema-constrained decoding is usually the right default for a flat, well-known shape like an address.
- Grammar-constrained decoding's advantage is invisible on simple JSON and only shows up once your target format isn't JSON at all.
- None of the four mechanisms catches a semantically wrong-but-valid field — that's still validation's job, every time.

**Related:** [Four Roads to Structured Output](/learn/structured-outputs/three-ways-to-get-json-overview) · [JSON Mode Basics](/learn/structured-outputs/json-mode-basics) · [Pydantic/Zod Schema Patterns](/learn/structured-outputs/pydantic-zod-schema-patterns) · [Optional, Nullable, and Defaults](/learn/structured-outputs/optional-nullable-and-defaults) · [Grammar-Constrained Generation](/learn/structured-outputs/grammar-constrained-generation)
