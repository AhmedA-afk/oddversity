---
title: "A Taxonomy of Guardrails"
track: "hallucinations"
status: live
summary: "Guardrails split into input, output, and behavioral layers, each stopping a different family of hallucination."
duration: "6 min read"
---

"Add a guardrail" isn't one action — it's a choice between three different layers, each catching a different failure, at a different point in the request. Confuse the layers and you end up with a system that's thick with checks and still misses the obvious case.

## What it is

[Guardrails for high-stakes output](/learn/hallucinations/guardrails-for-high-stakes-output) established the core idea: a check that runs outside the model and assumes it can still be wrong. This lesson splits that single idea into three layers that do genuinely different jobs:

- **Input guardrails** — run before generation, on the request itself. They catch false-premise questions ("what year did the Treaty of Versailles fail in 1920?" — it wasn't signed then and didn't "fail"), out-of-scope requests the system has no business answering, and prompt injection attempts riding in on user text.
- **Output guardrails** — run after generation, on the draft answer. They catch claims that don't match a source, numbers that don't parse, citations that point nowhere, and structurally invalid output.
- **Behavioral guardrails** — shape what the model is allowed to do at all: enforced abstention when confidence is low, refusal templates for out-of-scope requests, and hard caps on what categories of claim the system will ever assert without a human sign-off.

## The mental model

Input guardrails ask "should we even try to answer this?" Output guardrails ask "is what we produced actually true?" Behavioral guardrails ask "is answering at all the right move, regardless of whether we could?" They stack in that order on the request path, and each one is watching for something the others structurally can't see.

| Layer | Runs on | Catches | Misses |
|---|---|---|---|
| Input | The question, pre-generation | False premises, out-of-scope asks, injection | Anything wrong in an answer to a valid question |
| Output | The draft answer, post-generation | Unsupported claims, bad citations, malformed structure | A well-formed answer to a question that should never have been asked |
| Behavioral | The decision to answer at all | Overconfident answering under low certainty | A confidently wrong claim that passes a shallow check |

## Why it works this way

A false-premise question is a distinct failure mode from a fabricated claim, and it needs a distinct fix. If a user asks "why did GPT-3 fail to ship in 2019?" (it didn't fail, and it shipped in 2020), an output guardrail checking claims against sources won't help — there's no source to check against, because the question's premise is the problem, not any claim in an answer. Only an input check that evaluates the question itself, independent of any answer, catches this. This is the same failure covered from the prompting side in [adversarial and leading prompts](/learn/hallucinations/adversarial-and-leading-prompts) — the taxonomy here is about where you build the defense, not just recognizing the attack.

Output guardrails exist because generation and verification want different things from a model — a generator optimizes for a fluent, complete answer, and nothing in that process cross-checks the claims it makes. A separate, suspicious pass is required, which is exactly the discipline behind [fact-checking pipelines](/learn/hallucinations/fact-checking-pipelines).

Behavioral guardrails exist because even a perfectly grounded, perfectly verified answer can be the wrong thing to produce — the honest move for a low-confidence medical question is not "answer very carefully," it's "don't answer, escalate." That's [teaching a model to say "I don't know"](/learn/hallucinations/teaching-models-to-say-i-dont-know) enforced as policy rather than left to prompting alone.

## A concrete example

```
Q: "What's the standard dosage escalation for a drug that was pulled
    from the market in 2021?" (premise check: was it actually pulled?)

Input guardrail:  checks the premise against a maintained list of
                   market status changes -> flags "premise unverified,
                   drug X was not withdrawn" -> reroutes to clarification
                   instead of generating an answer to a false premise

  [if the premise had been true, generation proceeds]

Output guardrail:  draft answer cites a dosage number -> claim-level
                    check confirms the number against the retrieved
                    label text -> passes, or strips the claim if unsupported

Behavioral guardrail: this is a dosage question in a high-risk domain ->
                       policy requires citation display + escalation
                       threshold lowered regardless of how confident
                       the detector is
```

Three layers, three independent reasons the same request could get blocked or held.

## Where it shows up

Input guardrails matter most in open-ended assistants where users ask about assumed facts (support bots, research assistants). Output guardrails matter most anywhere claims are checkable against a source — RAG systems, summarizers, financial and legal generation. Behavioral guardrails matter most in regulated or safety-critical domains where the cost of a wrong-but-plausible answer outweighs the cost of an unnecessary refusal — see the [worked case study](/learn/hallucinations/high-stakes-case-study) for a domain where all three are mandatory together.

## Watch out for

- **Building only output guardrails.** They're the most intuitive to build (there's a concrete answer to check) but they can't catch a false-premise question, because there's no false claim in the answer to point at — the flaw is in what was asked.
- **Treating behavioral guardrails as a fallback instead of a first-class layer.** A system that only decides to abstain after generation has already run has paid the generation cost and still risks a partial leak of the ungrounded answer.
- **No layer talking to the others.** An input guardrail that flags a borderline premise but doesn't pass that flag downstream forces the output guardrail to re-derive suspicion from scratch — carry the risk signal through the pipeline, per the [architecture overview](/learn/hallucinations/reliability-architecture-overview).

## Where next

[Implementation: Input and Output Guardrails](/learn/hallucinations/input-output-guardrail-impl) builds the first two layers as running code. The behavioral layer becomes concrete in [Escalation and Human-in-the-Loop Design](/learn/hallucinations/escalation-human-in-the-loop) and its [confidence-gated router](/learn/hallucinations/confidence-gated-escalation-impl).

**Related:** [Guardrails for High-Stakes Output](/learn/hallucinations/guardrails-for-high-stakes-output), [Adversarial and Leading Prompts](/learn/hallucinations/adversarial-and-leading-prompts), [Fact-Checking Pipelines Before Output Ships](/learn/hallucinations/fact-checking-pipelines), [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know), [Implementation: Input and Output Guardrails](/learn/hallucinations/input-output-guardrail-impl)
