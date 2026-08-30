---
title: "Parametric vs. Contextual Knowledge"
track: "hallucinations"
status: live
summary: "Two different sources feed every answer, and hallucination can come from either one being wrong - not just from stale memory."
duration: "6 min read"
---

Hand a model a document that clearly states "Q3 2024 ends September 30," then ask it when Q3 ends, and it can still answer "June 30." The right fact was sitting right there in the prompt. The model overrode it with something it "remembered" instead. Understanding why requires separating two things people usually lump together as "what the model knows."

## What it is

**Parametric knowledge** is whatever got compressed into the model's weights during training - a vast, static, sometimes-stale summary of patterns across its training corpus, with no way to update it except retraining. **Contextual knowledge** is whatever is sitting in the prompt or conversation right now - narrow, current, and exactly what you gave it. Every answer the model produces is some blend of these two sources, and hallucination can originate from either one: stale or thin parametric knowledge producing an outdated or invented fact, or contextual knowledge being present but misread, ignored, or overridden.

## The mental model

Think of parametric knowledge as long-term memory and contextual knowledge as a note held in your hand right now. A person with strong, confident long-term memory of "fiscal quarters usually end in June, September, December, March" can glance at a note that says "this company's Q3 ends September 30" and still blurt out the memorized pattern instead of the note in front of them - especially if they're moving fast and the note isn't the first thing that comes to mind. That's not the note being wrong. It's the stronger, more automatic signal winning a race it shouldn't have won.

## Why it works this way

Nothing architecturally guarantees that context wins when it conflicts with a strong prior baked into the weights. Attention lets the model incorporate context tokens into its representation, but the same forward pass is also shaped by everything training taught it about what "typically" follows a phrase like this. When the parametric prior is very strong - a common convention, a frequently-repeated fact, a pattern the model has seen thousands of times - it can dominate a comparatively weak or oddly-placed contextual signal, particularly in long contexts where the relevant sentence is buried far from the question (a well-documented weakness sometimes called "lost in the middle"). Giving the model correct context raises the odds of a correct answer; it does not force one.

## A concrete example

```text
[context provided to the model]
"Fiscal calendar: Q3 2024 runs July 1 - September 30, 2024."

[user question]
"When does Q3 end this year?"

[model output]
"Q3 typically ends June 30."
```

The correct date was one sentence away from the question, verbatim. The model's answer instead reflects a common - but here wrong - convention it picked up from training data about how fiscal quarters are usually laid out elsewhere. This is a hallucination sourced from parametric knowledge overriding available contextual knowledge, not from the context being missing or wrong.

## Where it shows up

This exact pattern is a known failure mode in RAG systems: the retriever does its job and hands the model the right passage, and the model still answers from memory instead of from the retrieved text - which is one reason [why-rag-still-hallucinates](/learn/hallucinations/why-rag-still-hallucinates) even when retrieval worked perfectly. It also shows up whenever instructions conflict with a model's trained defaults, and in long conversations where an early, correct fact gets contradicted by a later, memorized assumption. [Knowledge-cutoff-driven hallucination](/learn/hallucinations/knowledge-cutoff-and-temporal-hallucination) is the mirror case: no context is provided at all, so the model has nothing but a stale parametric prior to work from.

## Watch out for

- **Don't assume "we gave it the right context" is the same as "it used the right context."** Verifying the fix requires checking the model's actual output against the source, not just checking that the source was retrieved - that's the whole point of a faithfulness check ([nli-entailment-grounding-check-impl](/learn/hallucinations/nli-entailment-grounding-check-impl)).
- **Don't treat all context as equally trustworthy just because it's "contextual" rather than "parametric."** Untrusted content placed in context (a pasted email, a scraped web page) is still contextual knowledge, and blindly following it is a different problem - prompt injection, not this lesson's subject (see [hallucination-vs-error-vs-bug](/learn/hallucinations/hallucination-vs-error-vs-bug)).
- **Don't bury the load-bearing fact in the middle of a long context and assume it'll be found.** Position and salience affect whether context actually wins the race against a parametric prior.

## Where next

This is exactly why grounding and retrieval exist as mitigation strategies: they don't erase parametric knowledge, but they shift what the model relies on toward the contextual side, where you actually control what's true.

**Related:** [Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents), [RAG as Hallucination Mitigation](/learn/hallucinations/retrieval-augmented-mitigation), [Why RAG Still Hallucinates](/learn/hallucinations/why-rag-still-hallucinates), [Knowledge Cutoff and Temporal Hallucination](/learn/hallucinations/knowledge-cutoff-and-temporal-hallucination), [Context Engineering for Grounding](/learn/hallucinations/context-engineering-for-grounding)
