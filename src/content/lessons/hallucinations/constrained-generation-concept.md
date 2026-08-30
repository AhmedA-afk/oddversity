---
title: "Constrained Generation: Shrinking the Space to Fabricate In"
track: "hallucinations"
status: live
summary: "If the model can only choose from real options, it can't invent a fake one — constraint as prevention, not detection."
duration: "6 min read"
---

Grounding and citations give the model good evidence and make its claims checkable. Constrained generation takes a different angle entirely: instead of hoping the model uses the evidence correctly, it removes the model's ability to produce anything that isn't already a valid answer.

## What it is

Constrained generation restricts the output space before or during decoding — via a JSON schema, an enum of allowed values, a formal grammar, or a closed list of real, retrieved candidates — so that outputs outside that space are structurally impossible, not just discouraged by a prompt. The model still generates token by token, but the decoder only allows tokens that keep the output on a valid path through the schema or grammar. [Structured output decoding](/learn/hallucinations/structured-output-decoding-impl) covers how that's actually implemented.

This is a different lever from everything else in this module so far. Grounding and citations try to make the model's *content* more likely to be true. Constraining doesn't touch truth at all — it touches *shape*, removing entire categories of output regardless of what the model "wants" to say.

## The mental model

Compare two ways of asking the same question.

**Free-form:** "Which plan applies to this customer?" The model can answer with any string at all — a real plan name, a plan name from a different product line it half-remembers from training, a plausible-sounding name that doesn't exist, or a garbled mix of two real plans.

**Constrained:** "Which plan applies to this customer? Choose exactly one: `starter`, `pro`, `enterprise`." Now the decoder is only allowed to produce one of three token sequences. There is no fourth option to invent, because the space of valid outputs *is* the space of real options. The model can still pick the wrong one of the three — constraint doesn't fix that — but it categorically cannot invent a fourth plan that doesn't exist.

That's the core distinction to hold onto through this lesson and the next: constraint doesn't make an answer *true*, it makes an invalid *shape* of answer impossible.

## Why it works this way

Free-form generation asks the model to solve two problems at once: get the content right, and get the format right. Both are places hallucination can enter — [tool-call hallucination](/learn/hallucinations/tool-call-hallucination) is largely a format problem (an argument name or type that doesn't match the real API), while a wrong plan name is a content problem. Constrained decoding removes the format half of that entirely, because the decoder mechanically rejects any token sequence that would produce an invalid customer_id, an out-of-schema field, or a plan name outside the enum, before it ever reaches output. The model doesn't need to "decide not to hallucinate a field name" — an invalid field name literally isn't a reachable token sequence.

This is why constraint is best understood as *prevention* layered on top of *detection*, rather than a competitor to it. Self-verification and NLI checks from the detection module catch bad content after generation; constrained decoding removes bad structure before generation ever gets the chance to produce it. Neither replaces the other — a schema-valid answer can still hold a factually wrong value, which is exactly why grounding and citation verification remain necessary even in a fully constrained pipeline.

## A concrete example

A billing tool needs the model to choose which plan a refund policy applies to. Free-form:

```text
Prompt: "Which plan does this customer's refund fall under?"
Model output: "This customer is on the Business Pro plan."
```

There is no "Business Pro" plan in this product — the model blended two real plan names ("Pro" and an "Enterprise" tier sometimes marketed as "Business") into a fabricated one, and it reads as completely natural.

Constrained:

```text
Prompt: "Which plan does this customer's refund fall under? Respond
with exactly one of: starter, pro, enterprise."
Model output: "pro"
```

The output space now contains exactly the three real plans. "Business Pro" is not a reachable output regardless of what the model's internal weighting favors — the invention is prevented structurally, not just discouraged verbally.

## Where it shows up

- [Tool-call hallucination](/learn/hallucinations/tool-call-hallucination) and [tool-call argument fabrication](/learn/hallucinations/tool-call-argument-fabrication) are largely fixed by constraining arguments to real enum values or real IDs from a provided list, rather than free strings.
- [Code hallucination and package slop](/learn/hallucinations/code-hallucination-and-package-slop) is partially addressed by constraining import statements or dependency names against a real, known package index.
- [Citation hallucination](/learn/hallucinations/citation-hallucination) is reduced structurally by constraining citation ids to the set of ids actually present in retrieved context, the mechanism behind [enforcing citations](/learn/hallucinations/enforcing-citations-impl).

## Watch out for

- **Constraint doesn't fix value truth.** A schema-valid, enum-valid answer can still be the *wrong* valid option — constraining "which plan" to three real names stops a fabricated fourth plan, not a wrong pick among the three real ones. [Structured output decoding](/learn/hallucinations/structured-output-decoding-impl) covers exactly where this line falls.
- **Over-constraining tasks that need genuine open-endedness kills the thing you wanted the model for.** Forcing a brainstorming or creative-writing task into a rigid schema doesn't reduce hallucination meaningfully there — it just produces stilted, narrower output. This is one of the failure patterns in [mitigation antipatterns](/learn/hallucinations/mitigation-antipatterns).
- **The candidate list itself must be real and current.** Constraining to an enum that's gone stale (a plan that was retired last quarter still listed) just relocates the fabrication risk to whoever maintains the list.

## Where next

[Structured output decoding](/learn/hallucinations/structured-output-decoding-impl) implements this concept end to end — a schema-constrained tool call that can only select a real customer id from a provided list. [Mitigation by task type](/learn/hallucinations/mitigation-by-task-type) covers which tasks benefit most from constraint versus which need it kept light.

**Related:** [Tool-Call Hallucination](/learn/hallucinations/tool-call-hallucination), [Code Hallucination and Package Slop](/learn/hallucinations/code-hallucination-and-package-slop), [Structured Output Decoding](/learn/hallucinations/structured-output-decoding-impl)
