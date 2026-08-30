---
title: "The Schema as a Contract"
track: "structured-outputs"
status: live
summary: "The schema is an API contract between a nondeterministic producer and a strict consumer — and your code must own it."
duration: "7 min read"
---

Every structured-output pipeline is a contract negotiation between two parties who never meet and can't renegotiate mid-call: the model and the code reading its answer.

## What it is

Treat the model as a third-party service you're integrating with, except this vendor's behavior varies call to call even with identical input. Your code is the consumer of that service's response. The schema is the contract text both sides are supposed to honor — and like any API contract, someone has to own it, both sides get to assume certain things, and one side (the consumer) can never simply trust that the other side followed the happy path.

## The mental model

You wouldn't call a normal third-party API and skip checking the response status code and shape just because the docs promised a certain format. A model is the same kind of dependency, except its "SLA" is probabilistic rather than deterministic: it usually returns what you asked for, and "usually" is not a contract guarantee — it's a description of the common case. Code that treats "usually" as "always" is the same bug whether the unreliable party is a flaky third-party API or a language model.

## Why it works this way

**Who owns the schema:** your code does, not the model. The schema should live where the consumer lives — a Pydantic or Zod model in your codebase, versioned like any other interface (see [Schema Versioning and Migration](/learn/structured-outputs/schema-versioning-and-migration)) — not something you reverse-engineer after looking at whatever the model happened to return once.

**What each side may assume:** the model may assume the schema is fixed for the duration of a call, and that field descriptions genuinely describe what's wanted — descriptions are effectively part of the prompt (see [Field Descriptions as Prompts](/learn/structured-outputs/field-descriptions-as-prompts)). Your code may assume, if you're using schema-constrained decoding, that the response parses and matches the declared shape. Your code may **not** assume that values are truthful, that fields left ambiguous by the schema get filled in sensibly, or that the model reasoned correctly about an edge case the schema never ruled out.

**Why the consumer must never trust the happy path:** the model is nondeterministic and, occasionally, wrong in ways that look exactly like right answers. Validate every response the way you'd validate input from any source outside your process boundary — because that's precisely what it is.

## A concrete example (shown)

Here's a schema that looks fine and isn't:

```python
from pydantic import BaseModel, Field

class TicketTriage(BaseModel):
    priority: str = Field(description="one of: low, medium, high")
    category: str
    needs_human: bool
```

The description says `priority` should be one of three values — but the field is typed as plain `str`. A schema-constrained backend that enforces types (not prose descriptions) will happily accept `"Low"`, `"urgent"`, or `""` as valid strings, because nothing in the *actual contract* — the type — rules them out. This is the contract failing on your side, not the model's: you described a constraint in English instead of encoding it where the enforcement machinery actually looks.

The fix is to put the constraint in the type system, where it's structurally checked instead of politely requested:

```python
from typing import Literal

class TicketTriage(BaseModel):
    priority: Literal["low", "medium", "high"]
    category: str
    needs_human: bool
```

Now `"urgent"` is rejected by construction — caught at validation, not hoped away by a description the model may or may not have weighted heavily.

## Where it shows up

- **Tool and function calling**, where the schema is the contract for an action your code is about to execute — see [Tool and Function Schemas](/learn/structured-outputs/tool-function-schemas).
- **Document extraction**, where the schema is the contract for a row that lands in a database — see [Where Structured Output Shows Up in a System](/learn/structured-outputs/where-structured-output-fits-in-a-system).
- **Cross-provider code**, where the same contract has to survive a change of vendor entirely — see [Cross-Provider Structured Output Differences](/learn/structured-outputs/cross-provider-structured-output-differences).

## Watch out for

- Encoding a constraint in a description string when the type system can express it directly — enums, `Literal`, min/max bounds. See [Enums and Constrained Fields](/learn/structured-outputs/enums-and-constrained-fields).
- Letting the schema drift informally ("the model started returning this field, so we just read it") instead of a deliberate, versioned change.
- Treating a successful validation as proof the contract was honored in spirit, not just in shape — see [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means).

## Where next

See the contract enforced end to end in [The Whole Game of Structured Output](/learn/structured-outputs/the-whole-game-of-structured-output), and the mechanics of writing the schema itself in [JSON Schema for Outputs](/learn/structured-outputs/json-schema-for-outputs) and [Pydantic/Zod Schema Patterns](/learn/structured-outputs/pydantic-zod-schema-patterns).

**Related:** [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means) · [Tool and Function Schemas](/learn/structured-outputs/tool-function-schemas) · [Enums and Constrained Fields](/learn/structured-outputs/enums-and-constrained-fields) · [Schema Versioning and Migration](/learn/structured-outputs/schema-versioning-and-migration)
