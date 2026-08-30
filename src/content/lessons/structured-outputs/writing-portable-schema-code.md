---
title: "Keeping Schema Code Provider-Agnostic"
track: "structured-outputs"
status: live
summary: "Define the schema once, let an adapter speak each provider's dialect, and know exactly what still leaks through."
duration: "7 min read"
---

[One Schema, Three Providers](/learn/structured-outputs/same-schema-three-providers-example) showed three different response shapes come back from one schema. The fix isn't to write three copies of your extraction code — it's to draw one line in your architecture where "provider" stops being a concept your business logic knows about.

## What it is

A provider-agnostic schema layer has exactly three pieces, in this order:

1. **One schema definition**, in [Pydantic or Zod](/learn/structured-outputs/pydantic-zod-schema-patterns), that your team reviews, versions, and tests like any other type in the codebase.
2. **One adapter per provider**, whose entire job is translating that single definition into the provider's specific request shape and translating its specific response shape back into a plain dict or JSON string.
3. **One validation step**, downstream of every adapter, that only ever sees the adapter's normalized output — never a provider's raw response.

Everything above the adapter layer — your extraction function, your eval harness, your retry logic — imports the schema and calls a provider-neutral function. It never imports `anthropic` or `openai` directly.

## The mental model

Think of the adapter as a translator standing between two people who don't speak each other's language, not as a wrapper that adds features. A translator's job is narrow: take the sentence, restate it faithfully in the other language, and hand back the reply restated in the first language. It doesn't get to improve the sentence, and it doesn't get to hide the fact that the second language has no word for something the first one does.

```python
class ProviderAdapter(Protocol):
    def request(self, schema: type[BaseModel], document: str) -> Any: ...
    def normalize(self, raw_response: Any) -> dict: ...

def extract(adapter: ProviderAdapter, schema: type[BaseModel], document: str) -> BaseModel:
    raw = adapter.request(schema, document)
    normalized = adapter.normalize(raw)
    return schema.model_validate(normalized)  # same validation call, every provider
```

Swap `adapter` and nothing else in `extract` changes — that one-line swap is built out fully in [A Provider Adapter](/learn/structured-outputs/provider-adapter-implementation).

## Why it works this way

This shape works because it puts the seam exactly where the actual disagreement lives. Providers disagree about *how a schema gets sent and how a response gets shaped* — that's a translation problem, and `request`/`normalize` are where translation belongs. They don't (usually) disagree about *what a valid `TicketExtraction` looks like* — that's a business-logic problem, and it belongs in the schema and the validator, run once, after translation is done. Collapsing these two concerns into one function is exactly how you end up with three parallel copies of extraction logic that quietly drift out of sync the first time someone fixes a bug in only one of them.

## A concrete example (shown)

The two adapter methods for OpenAI, matching the response shape from [One Schema, Three Providers](/learn/structured-outputs/same-schema-three-providers-example):

```python
class OpenAIAdapter:
    def request(self, schema: type[BaseModel], document: str):
        s = schema.model_json_schema()
        s["additionalProperties"] = False
        s["required"] = list(s["properties"].keys())
        return client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": document}],
            response_format={"type": "json_schema",
                              "json_schema": {"name": schema.__name__, "strict": True, "schema": s}},
        )

    def normalize(self, raw_response) -> dict:
        return json.loads(raw_response.choices[0].message.content)
```

Everything strict-mode-specific — the `additionalProperties` flag, the forced `required` list, pulling `.choices[0].message.content` — lives inside this one class. The Anthropic adapter has none of that code and instead knows about `tool_choice` and `.content` blocks. Neither leaks into `extract`.

## Where it shows up

This pattern earns its cost the first time you need to run the same extraction against two providers for a genuine reason, not a hypothetical one: an eval that compares accuracy across models, a cost-based routing decision that falls back to a cheaper provider under load, or a regulatory requirement to avoid a single vendor for a given workload. Without the adapter boundary, each of these becomes a multi-file refactor; with it, it's a config value.

## Watch out for (what leaks through anyway)

- **Effective constraint strength.** The abstraction can normalize *shapes*, but it can't normalize how tightly a `pattern` or `maxLength` is actually enforced — one provider's sampler may honor it, another's may treat it as a hint. Test this per provider; don't assume the adapter absorbed it.
- **Union and discriminated-union support.** [Discriminated unions](/learn/structured-outputs/discriminated-unions-in-schemas) are the schema feature most likely to hit a wall on a provider whose dialect doesn't cleanly support `anyOf` or `oneOf` — the adapter can flatten a union into a workaround shape, but that's a visible compromise in the adapter code, not something the abstraction hides for free.
- **Cost and latency.** Two providers returning the identical validated object can differ by a meaningful margin in price and response time. An adapter that only normalizes correctness will quietly let a cost regression through — log both, not just pass/fail.

## Where next

[A Provider Adapter](/learn/structured-outputs/provider-adapter-implementation) builds this pattern out as a runnable two-provider implementation, including the one-line swap.

**Related:** [The Cross-Provider Landscape](/learn/structured-outputs/cross-provider-landscape), [Pydantic and Zod: Deriving Schemas from Code](/learn/structured-outputs/pydantic-zod-schema-patterns), [Discriminated Unions in Schemas](/learn/structured-outputs/discriminated-unions-in-schemas), [Schema Versioning and Migration](/learn/structured-outputs/schema-versioning-and-migration)
