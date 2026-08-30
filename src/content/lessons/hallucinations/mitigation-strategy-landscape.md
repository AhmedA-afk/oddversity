---
title: "The Mitigation Landscape: Ground, Constrain, Prompt, Abstain"
track: "hallucinations"
status: live
summary: "Four levers cut hallucination at generation time, and they compound — no single one is enough on its own."
duration: "7 min read"
---

Ask five engineers how to stop a model from making things up and you'll get five different answers — "just add RAG," "force citations," "prompt it better," "let it say it doesn't know." Every one of those is a real technique. None of them is the whole fix, and this module exists because you need all four working together.

## What it is

Every technique that acts at generation time — as opposed to training-time fixes like the calibration work covered in [calibration versus prompting](/learn/hallucinations/calibration-training-vs-prompting) — falls into one of four levers:

- **Ground** — give the model real evidence to answer from, so it's reading instead of recalling. Retrieval, pasted documents, tool results.
- **Constrain** — shrink the space of possible outputs so there's less room to invent. Schemas, enums, grammars, closed candidate lists.
- **Prompt** — change the instructions and decision policy the model applies, especially around uncertainty and premises.
- **Abstain** — refuse or hedge instead of answering when the first three levers still leave the model without solid ground.

Each lever gets its own cluster of lessons in this module. This one is the map.

## The mental model

Think defense-in-depth, the same principle behind layered security controls: no single layer stops every attack, but an attack that gets past layer one still has to get past layers two, three, and four. Hallucination mitigation works the same way.

A query enters the pipeline. Grounding tries to hand the model the actual answer before it has to guess. Constraining limits what shape the eventual output can take, closing off entire classes of fabrication regardless of what the model "believes." Prompting shapes behavior in the ambiguous cases grounding and constraints don't resolve — what to do when evidence is thin, when a question rests on a false premise, when it's tempting to just agree with the user. Abstention is the backstop: if everything upstream still leaves real uncertainty, the system says so instead of guessing.

These levers intercept the failure at different points, which is why they compound instead of substituting for each other. Grounding failing — retrieval missed the right passage — doesn't disable constraining, which still keeps the output schema-valid. A schema-valid-but-wrong value doesn't disable abstention, which can still trigger on low confidence. A hallucination has to get past all four layers to reach a user, which is a much lower bar to clear than getting past any one alone.

## Why it works this way

Hallucination isn't one mechanism with one fix — it's what happens when next-token generation has to produce *something* and the true answer isn't reliably available in what the model has to work with (see [why models hallucinate](/learn/hallucinations/why-models-hallucinate)). "Not reliably available" fails in different ways, and each lever targets a different one:

- Grounding fixes **missing information** — the model doesn't have the fact, so give it the fact.
- Constraining fixes **unbounded output space** — the model has too much freedom to invent a plausible-looking wrong answer, so remove the freedom.
- Prompting fixes **bad decision policy** — the model has usable information but is inclined to guess, agree, or overreach anyway, so change the instructions governing that choice.
- Abstention fixes **residual uncertainty** — some fraction of queries are genuinely unanswerable with confidence even after the first three, and the honest output is "I don't know," decided using the signals from [confidence and uncertainty](/learn/hallucinations/confidence-and-uncertainty-signals) and [semantic entropy](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification).

None of these is complete alone, which is why this module has seventeen lessons instead of one. Grounding is necessary but not sufficient — [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates) is an entire lesson on the ways grounded answers still go wrong. Constraining fixes structure, not truth — a schema-valid answer can still hold a false value, covered in [structured output decoding](/learn/hallucinations/structured-output-decoding-impl). Prompting is cheap to apply and just as cheap to defeat with the next leading question, per [calibration versus prompting](/learn/hallucinations/calibration-training-vs-prompting). Abstention only helps if the system can tell *when* to invoke it, which depends entirely on the uncertainty work from the previous module.

## A concrete example

Take one query against a support knowledge base: "What's the early-cancellation fee after the trial period?"

**No mitigation.** The model answers from parametric memory and produces a specific, plausible-sounding dollar figure. It's wrong — there's no way the model could know your actual pricing, so it pattern-matches to what cancellation fees typically look like.

**Add grounding.** Retrieve the pricing page, put it in context, instruct the model to answer only from it. Now the figure comes from a real passage instead of a guess — the mechanism in [grounding fundamentals](/learn/hallucinations/grounding-fundamentals).

**Add constraining.** If the answer feeds a downstream system, don't let the model emit free text — force a structured `{fee_cents: int, currency: str}` output validated against a schema, so a malformed or wrong-currency response is impossible even before you check whether the number itself is right.

**Add prompting.** Instruct the model to quote the exact sentence it's basing the fee on before stating the number, and to flag it explicitly if the retrieved page doesn't mention a trial-period carve-out at all — catching the case where the document covers cancellation fees in general but not this specific scenario.

**Add abstention.** If retrieval comes back empty, or the model's own quoted evidence doesn't actually mention a number, the system answers "I don't have that on file — let me check with billing" instead of forcing one out.

Every layer catches something the previous one missed.

## Where it shows up

Each lever maps onto hallucination types you should already recognize:

| Lever | Hallucination types it targets |
|---|---|
| Ground | Factual fabrication from missing knowledge, [temporal hallucination](/learn/hallucinations/knowledge-cutoff-and-temporal-hallucination), extrinsic additions in [summarization](/learn/hallucinations/summarization-hallucination) |
| Constrain | Structural [tool-call fabrication](/learn/hallucinations/tool-call-hallucination), invented [package names](/learn/hallucinations/code-hallucination-and-package-slop), malformed [citations](/learn/hallucinations/citation-hallucination) |
| Prompt | [Sycophancy](/learn/hallucinations/sycophancy-vs-hallucination), [leading-prompt fabrication](/learn/hallucinations/adversarial-and-leading-prompts) |
| Abstain | Any type, when upstream confidence is genuinely low — the general case in [hallucination risk factors](/learn/hallucinations/hallucination-risk-factors) |

## Watch out for

- **Treating one lever as the whole fix.** RAG is the most common victim — teams add retrieval, watch the obvious fabrications disappear, and stop there. [Why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates) exists because this is the single most common mitigation mistake in production systems.
- **Stacking levers in the wrong order.** An abstention prompt bolted onto a system with no grounding just makes the model refuse more often without becoming more accurate — you've traded fabrication for unhelpfulness without touching the actual information gap.
- **Shipping a stack without measuring it.** Every lever in this module has failure modes of its own. The only way to know your stack reduced hallucination rate — rather than just changed its shape — is the measurement discipline the next module covers.

## Where next

Start with the strongest single lever, grounding, in [Grounding: Anchoring Answers to Evidence](/learn/hallucinations/grounding-fundamentals). For the assembled reference, the [mitigation cheatsheet](/learn/hallucinations/mitigation-cheatsheet) lays out the full stack on one page, and [choosing mitigations by task type](/learn/hallucinations/mitigation-by-task-type) tells you where to start for your specific system.

**Related:** [Why Models Hallucinate](/learn/hallucinations/why-models-hallucinate), [Hallucination Risk Factors](/learn/hallucinations/hallucination-risk-factors), [Confidence and Uncertainty Signals](/learn/hallucinations/confidence-and-uncertainty-signals), [Mitigation Cheatsheet](/learn/hallucinations/mitigation-cheatsheet)
