---
title: "Field Names and Order Change Behavior"
track: "structured-outputs"
status: live
summary: "Field names function as prompts, and field order matters because each field conditions on every field emitted before it."
duration: "6 min read"
---

Two schemas can describe the exact same data, differ only in field names and field order, and produce measurably different accuracy on the same inputs. Neither difference shows up in a JSON Schema validator, which only checks shape — this is a behavior lever validators can't see.

## What it is

Field names aren't just labels for your consumer code — the model reads them as instructions, the same way it reads a description. And field order isn't cosmetic — because generation is autoregressive, each field's value is conditioned on every token written before it, including every field that came earlier in the object.

## The mental model

Picture the schema as a short, forced conversation the model has with itself, one field at a time, in the order you wrote them. A field name is the question being asked; a field's position is *what the model already knows* when it answers that question. Rename `flag` to `is_refunded` and you've asked a clearer question. Move a `justification` field before the `label` it justifies, and you've let the model answer the easy question first and use its own answer to inform the harder one.

## Why it works this way

Naming: the model has never seen your internal variable-naming conventions. `amt`, `val_2`, a boolean literally named `status` — these carry no signal about what value belongs there, so the model has to infer intent from context alone, and inference is where errors creep in. `total_amount_usd` and `is_refunded` remove the guessing entirely. [Schema Design Choices That Reduce Model Errors](/learn/structured-outputs/schema-design-for-reliability) covers this angle directly; [Field Descriptions as Prompts](/learn/structured-outputs/field-descriptions-as-prompts) goes further into what a good description adds beyond a good name.

Ordering: once the model emits a token, it's part of the context for every token after it — that's just what autoregressive generation is, as [next-token prediction](/learn/llm-foundations/next-token-prediction) lays out. Applied to a schema with fields A then B, the model generating B's value can see A's already-committed value; the reverse isn't true. So the ordering rule falls straight out of the mechanism: **put evidence and reasoning fields before the fields that depend on them.** Ask for the facts extracted, the category derived from those facts, the confidence in that category — in that order — and each field gets to condition on real, already-written support. Reverse it, and the label is the first thing generated with nothing to lean on, then the "evidence" that follows is written to justify a decision already locked in, which is closer to a rationalization than a reason.

## A concrete example

A sentiment-labeling schema with the risky order:

```json
{
  "properties": {
    "sentiment": { "type": "string", "enum": ["positive", "negative", "neutral"] },
    "reasoning": { "type": "string" }
  }
}
```

`sentiment` gets committed with nothing behind it but the raw input; `reasoning` is generated after, and has every incentive to support whatever `sentiment` already said rather than to have actually driven it. Swap the order:

```json
{
  "properties": {
    "reasoning": { "type": "string", "description": "Note specific words or phrases that indicate tone before classifying." },
    "sentiment": { "type": "string", "enum": ["positive", "negative", "neutral"] }
  }
}
```

Now `sentiment` is generated with `reasoning`'s actual content sitting in context to condition on. [Evidence Before Label](/learn/structured-outputs/reasoning-field-ordering-example) runs both orderings on the same inputs and reports the gap directly.

## Where it shows up

Any classification-with-justification schema, any extraction task where a derived field (a total, a category, a risk score) depends on raw fields (line items, keywords, dates) — put the raw fields first. It also matters for tool-call arguments: a tool schema that asks for a `confirm: true` flag before the arguments it's confirming asks the model to commit before it's reasoned through what it's confirming.

## Watch out for

- **Providers differ in how strictly they honor field order** under full schema-constrained decoding versus looser JSON modes — see [Why "JSON Mode" Isn't One Thing](/learn/structured-outputs/cross-provider-structured-output-differences) before assuming ordering behaves identically everywhere you deploy.
- **Ordering isn't a substitute for [thinking before structuring](/learn/structured-outputs/thinking-then-structuring)** — a `reasoning` field inside the final schema is a lighter version of the same idea, useful when you want the reasoning captured in the record itself, but a separate unstructured reasoning pass beforehand can go further when the task is genuinely hard.
- **Renaming a shipped field is a breaking change**, not just a readability improvement — see [Versioning a Schema Without Breaking Consumers](/learn/structured-outputs/schema-versioning-basics) before renaming anything already in production.

## Where next

[Evidence Before Label](/learn/structured-outputs/reasoning-field-ordering-example) is the worked measurement of the ordering rule in this lesson — read it next if "conditions on" still feels abstract.

**Related:** [Evidence Before Label](/learn/structured-outputs/reasoning-field-ordering-example), [Field Descriptions as Prompts](/learn/structured-outputs/field-descriptions-as-prompts), [Make the Right Answer the Easy Path](/learn/structured-outputs/shape-the-easy-path-intuition), [Thinking Before Structuring](/learn/structured-outputs/thinking-then-structuring)
