---
title: "Four Roads to Structured Output"
track: "structured-outputs"
status: live
summary: "Prompt-only, JSON mode, schema-constrained, and grammar-constrained decoding compared on guarantee, cost, and fit."
duration: "8 min read"
---

Four ways to get a model to produce structured output, each with a genuinely different guarantee — and picking the wrong one is either wasted effort or a reliability gap you won't notice until production traffic finds it.

## Prompt-only formatting

**How it works:** You describe the desired shape in the prompt — "respond only with JSON matching this format" — with nothing at the API level enforcing it. The model is free to add commentary, drop a field, or return valid-looking prose instead.

**When it wins:** Any provider or model, including ones with no structured-output API at all. Zero setup cost, useful for a quick script or a one-off exploration.

**Failure mode:** Leading or trailing prose ("Sure, here's your JSON:"), occasional invalid syntax, field drift session to session. You end up needing full parsing-and-cleanup code regardless, which erodes the setup savings.

**Relative cost:** Cheapest to build, most expensive to run reliably — the cost shows up later, as retries and cleanup code.

## JSON mode

**How it works:** An API flag constrains the decoder so every token it emits keeps the output syntactically valid JSON — balanced braces, correctly quoted strings, no trailing commas. This guarantees syntactic validity only.

**When it wins:** You need output that's definitely parseable without committing to one fixed schema up front, or the shape genuinely varies call to call.

**Failure mode:** Perfectly valid JSON with the wrong shape. `{"result": "4 stars"}` when you wanted `{"rating": 4}` is completely valid JSON-mode output and still useless to a `rating: int` field — JSON mode never saw your field names as anything it had to honor.

**Relative cost:** Minor overhead versus unconstrained decoding; still requires a full schema-conformance validation step afterward. See [JSON Mode Basics](/learn/structured-outputs/json-mode-basics).

## Schema-constrained decoding

**How it works:** You hand the API a JSON Schema — usually generated straight from a Pydantic or Zod model — and the decoder is constrained so every token keeps the output both valid JSON *and* conforming to that schema's keys, types, required fields, and enums.

**When it wins:** Production extraction and tool calling with one well-known shape, where you want a whole category of shape errors eliminated before validation code ever runs.

**Failure mode:** Catches zero semantic errors — a value can be perfectly typed and completely wrong. It can also measurably narrow what the model even considers on unusual inputs. See [Constraints and Model Quality Interaction](/learn/structured-outputs/constraints-and-model-quality-interaction).

**Relative cost:** Some added complexity over JSON mode, generally worth it; setup differs per provider. See [Enabling Structured Modes Across SDKs](/learn/structured-outputs/enabling-structured-modes-across-sdks).

## Grammar-constrained decoding

**How it works:** Generalizes the same idea to any formal grammar, not just "valid JSON matching this schema" — for example a GBNF grammar on a local-inference runtime, letting you constrain output to a custom mini-language, a restricted SQL subset, or a non-JSON tool-call syntax.

**When it wins:** The target format genuinely isn't JSON, or you need tight control over open-weight model inference where the serving stack exposes grammar constraints directly.

**Failure mode:** Harder to author and debug than a schema class — you're writing grammar rules, not a Pydantic model. Portability is the weakest of the four: a grammar written for one runtime doesn't transfer to another provider's API. See [Grammar-Constrained Generation](/learn/structured-outputs/grammar-constrained-generation).

**Relative cost:** Highest setup cost of the four, justified only when you actually need non-JSON structure.

## Decision table

| Mechanism | Guarantee | Portability | Latency cost | Typical use |
|---|---|---|---|---|
| Prompt-only | None (best-effort) | Universal | Lowest | Prototypes, no structured-output API available |
| JSON mode | Syntactic validity | High | Low | Parseable output where shape isn't fixed yet |
| Schema-constrained | Syntax + shape | Medium (per-provider setup) | Low–medium | Production extraction, tool calls |
| Grammar-constrained | Syntax + shape + custom formats | Low | Medium–high | Non-JSON output, local/open-weight inference |

## How to choose

Start here, then measure: default to schema-constrained decoding for anything that feeds code. If your provider only exposes JSON mode, layer your own validation (a Pydantic or Zod model) on top to close the gap up to schema conformance yourself. Reach for grammar-constrained decoding only when the target format genuinely isn't JSON — it buys nothing extra on a flat JSON object that schema-constrained decoding didn't already give you. Never ship prompt-only to production without a validation safety net — and note that none of the four, including the strongest, replaces semantic checking; see [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means) for why validation still runs after every one of them.

**Related:** [JSON Mode Basics](/learn/structured-outputs/json-mode-basics) · [Constrained Decoding Under the Hood](/learn/structured-outputs/constrained-decoding-under-the-hood) · [Grammar-Constrained Generation](/learn/structured-outputs/grammar-constrained-generation) · [One Task, Four Mechanisms](/learn/structured-outputs/same-task-four-ways-mini-tour) · [The Whole Game of Structured Output](/learn/structured-outputs/the-whole-game-of-structured-output)
