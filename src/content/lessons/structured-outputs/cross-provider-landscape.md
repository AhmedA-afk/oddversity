---
title: "The Cross-Provider Landscape"
track: "structured-outputs"
status: live
summary: "A map of how Anthropic, OpenAI, Google, and OSS engines get to structured JSON, and what actually survives a provider swap."
duration: "7 min read"
---

[Cross-Provider Structured Output](/learn/structured-outputs/cross-provider-structured-output-differences) already showed you three roads to the same JSON and where field requiredness and refusal shapes diverge. This lesson zooms out further: it adds the fourth road most teams forget about, gives you a framework for sorting "portable" from "provider-specific" before you write a line of adapter code, and names the escaping quirks that break things even when every provider claims success.

## What it is

Every major structured-output surface is one of four mechanisms wearing different API names:

- **Tool-schema mediated** (Anthropic): your JSON Schema is attached to a tool definition, the model "calls" it, and the arguments *are* your structured data. Covered in [Tool Schemas as a Structured-Extraction Mechanism](/learn/structured-outputs/tool-function-schemas).
- **Strict schema-constrained response** (OpenAI): the schema goes on `response_format`, `strict: true` restricts the sampler token-by-token, and the dialect is narrower than full JSON Schema — every property must be `required`, `additionalProperties: false` is mandatory.
- **Restricted-OpenAPI schema** (Google): `response_schema` accepts a cut-down OpenAPI subset, not JSON Schema proper, with narrower keyword support and historically weaker union handling.
- **Grammar-constrained decoding** (OSS engines — llama.cpp, vLLM, Outlines, and similar): you hand the runtime a formal grammar (often GBNF) or a schema it compiles into one, and it constrains the raw token stream directly, with no API-level "structured output" concept sitting in between. See [Grammar-Constrained Generation](/learn/structured-outputs/grammar-constrained-generation) and [a GBNF grammar worked example](/learn/structured-outputs/gbnf-grammar-worked-example).

The first three are hosted-API features you configure; the fourth is a decoding mechanism you own end to end, which is why its guarantees look different — a well-built grammar can be *airtight* on syntax in a way no hosted API commits to in its docs.

## The mental model

Sort every provider quirk into one of two buckets before you touch code:

**Portable** — survives unchanged across providers, because it lives in your code, not theirs: the schema definition itself (if you keep it in [Pydantic or Zod](/learn/structured-outputs/pydantic-zod-schema-patterns)), your field semantics and descriptions, and your validation layer downstream of whatever comes back.

**Provider-specific** — has to be translated or re-verified per provider: the request shape, how strictly constraints are actually enforced versus merely accepted, what a refusal looks like, the schema-complexity ceiling before nesting or enum size gets silently flattened, and — the one this lesson adds — how each provider formats and terminates the JSON it emits.

Everything downstream of this module assumes that split. [Writing Portable Schema Code](/learn/structured-outputs/writing-portable-schema-code) is built directly on top of it.

## Why it works this way

The split exists because "structured output" bolts a constraint onto a next-token predictor, and each provider chose a different point in the stack to apply it: OpenAI and Google constrain inside their own closed serving stack, tuned against internal benchmarks you can't inspect. Anthropic reuses tool-calling infrastructure that was built for a different purpose (invoking real functions) and inherits that infrastructure's guarantees and gaps. OSS grammar engines constrain at the token-sampling layer you control directly, which is more predictable precisely because you can read the grammar that produced the constraint. None of these implementations agree on what "done" looks like at the level of raw bytes, so anything below the schema's own type system is provider-specific until proven otherwise.

## A concrete example (shown)

Ask three engines to close out a two-field object, `{"vendor": "Acme Corp", "note": null}`, at the very end of generation. What you actually get back on the wire differs more than the parsed result suggests:

```text
Provider A: {"vendor":"Acme Corp","note":null}
Provider B: {"vendor": "Acme Corp", "note": null}\n
Provider C: {"vendor": "Acme Corp", "note": null}

Note: no discount code was found on this invoice.
```

All three parse as valid JSON if you slice out the object — but Provider C's grammar (or its non-strict configuration) didn't stop the model from emitting prose after the closing brace, which breaks a naive `json.loads(response_text)` call even though the JSON itself is fine. [One Schema, Three Providers](/learn/structured-outputs/same-schema-three-providers-example) walks this exact failure with real side-by-side output and a fix.

## Where it shows up

Every extraction pipeline that supports more than one model hits this the first time someone benchmarks a second provider against the same eval set: the schema "works" on both, the valid-rate looks similar, and then a null-handling or trailing-text difference fails a downstream parser that was only ever tested against one provider's output shape. It's also the reason [multi-provider fallback](/learn/structured-outputs/structured-output-failure-modes) — retrying a failed extraction on a second model — needs its own normalization step, not just a retry.

## Watch out for

- **Assuming "valid JSON" means "same JSON."** Two schema-valid responses can differ in key ordering, null representation, and whitespace in ways that break a byte-level diff or a naive string check even though both parse correctly.
- **Trusting a constraint you haven't tested.** A `pattern` or `maxItems` in your schema might be a hard rail on one provider and a decoration the sampler ignores on another. Verify with your own eval, not the provider's marketing copy.
- **Treating the OSS row as "harder, so skip it."** Grammar-constrained decoding is more work to set up but gives you the strongest guarantees in this list, because you own the constraint instead of trusting a black box to have applied it correctly.

## Where next

[One Schema, Three Providers](/learn/structured-outputs/same-schema-three-providers-example) makes this concrete with real request/response pairs, then [Writing Portable Schema Code](/learn/structured-outputs/writing-portable-schema-code) turns the portable/provider-specific split into an actual code boundary.

**Related:** [Cross-Provider Structured Output](/learn/structured-outputs/cross-provider-structured-output-differences), [Tool Schemas as a Structured-Extraction Mechanism](/learn/structured-outputs/tool-function-schemas), [Grammar-Constrained Generation](/learn/structured-outputs/grammar-constrained-generation), [Constrained Decoding Under the Hood](/learn/structured-outputs/constrained-decoding-under-the-hood)
