---
title: "RAG, fine-tuning, or a longer prompt?"
description: "A decision procedure for the most common architecture question in AI engineering — which of the three fixes your problem, which just costs money, and how to tell them apart in an afternoon."
question: "Should I use RAG or fine-tune the model?"
level: "beginner"
duration: "15 min"
published: "2026-08-30"
tags: ["RAG", "Fine-tuning", "Architecture"]
featured: false
steps:
  - "Name the gap: knowledge, behaviour, or format"
  - "Try the prompt first, because it is free to undo"
  - "Reach for retrieval when the gap is knowledge the model cannot have"
  - "Reach for fine-tuning when the gap is consistent behaviour at volume"
  - "Check the four questions that decide it in practice"
related:
  - "/learn/rag/what-is-rag-and-when-to-use-it"
  - "/learn/rag/when-rag-is-the-wrong-tool"
  - "/learn/fine-tuning/fine-tune-vs-prompt-vs-rag"
  - "/learn/context-engineering/retrieval-vs-context-stuffing"
---

This is the most common architecture question in AI engineering and it is usually asked
backwards. "Should I fine-tune?" is a question about a solution. The useful question is
what kind of gap you are looking at, because the three techniques fix three different
things and none of them fixes the other two.

## The one distinction that decides it

**Knowledge gaps** — the model does not know a fact. Your internal policies, this quarter's
pricing, what a specific customer ordered. Fine-tuning is a poor fix for this: it is slow,
it is expensive to redo when the fact changes, and it produces a model that states the fact
without being able to cite it. **Retrieval** fixes knowledge gaps.

**Behaviour gaps** — the model knows the material but does not respond the way you need,
consistently, across thousands of calls. A house style, a rigid output shape, a
domain-specific classification rubric. **Prompting** fixes this first; **fine-tuning** fixes
it when the prompt needed to get there has become long, expensive and still only works
eight times in ten.

**Format gaps** — you need a specific structure every time. Neither of the above.
**Constrained decoding** fixes it, and it is nearly free.

Most real problems are a knowledge gap that someone is planning to fine-tune away.

## Start with the prompt, always

Not because prompting is best, but because it is the only one you can undo in thirty
seconds. Before anything else, try:

- Putting the actual reference material in the prompt, if it fits.
- Three or four examples of a correct response — few-shot examples do a large fraction of
  what people expect fine-tuning to do.
- An explicit statement of the failure you keep seeing: "If the documents do not answer the
  question, say so rather than guessing."

If the material fits in the context window, is small, and changes rarely, you may be done.
A 30-page policy document pasted into a system prompt with caching enabled is a completely
legitimate architecture, and it is dramatically simpler than a retrieval pipeline. Do not
build the pipeline out of embarrassment.

## Choose retrieval when

- The corpus is bigger than the context window, or big enough that sending it every time is
  wasteful.
- The content changes, and re-training on every change would be absurd.
- You need citations. This is the underrated one — retrieval gives you a passage to point
  at, and in support, legal, medical or compliance settings that is the requirement, not a
  nicety.
- Different users may see different subsets. Permissions live naturally in a retrieval
  filter and cannot be expressed in a set of weights at all.

That last point is worth stating sharply: **a fine-tuned model cannot enforce per-user
access control.** If some of your data is confidential to some of your users, retrieval is
not a preference, it is the only one of the three that can work.

## Choose fine-tuning when

- The behaviour is stable and you have measured that prompting plateaus below your bar.
- You have hundreds to thousands of good examples of the behaviour, already.
- Volume makes the prompt overhead expensive — a fine-tuned model can do the same job with a
  much shorter prompt, and at scale that is a real saving.
- You need lower latency and a smaller model would do the job if it behaved correctly.
- The task is narrow and well-defined: a classifier, an extractor, a specific transformation.

Fine-tuning teaches form far more reliably than it teaches facts. A model fine-tuned on
your documents will learn to *sound* like your documents, and will still invent details
with total confidence. If your goal was accuracy about the content, you built the wrong
thing.

## The four questions that settle it

**Does the answer change when the underlying data changes?** Yes → retrieval.

**Would you need to cite a source?** Yes → retrieval.

**Do different users get different answers for permission reasons?** Yes → retrieval.

**Is the gap "it does not follow my format or style consistently"?** Yes → prompt first,
then constrained decoding, then fine-tune if it still plateaus.

They combine, and the strongest systems usually do: retrieval for the facts, a small
fine-tune for the response style, and constrained decoding for the shape. But build them in
that order, and measure between each one.

## Run this experiment before you commit

Take twenty real inputs with their correct outputs. Then, in one afternoon:

1. Score the base model with your current prompt. That is your baseline.
2. Score it with the reference material pasted into the prompt.
3. Score it with a crude retrieval step — even keyword search over the same corpus.

If step 2 fixes it, your problem was context, not capability. If step 3 gets close to step
2, retrieval is your architecture and the rest is tuning. If neither moves the number, the
gap is behavioural, and you have now earned the right to consider fine-tuning — with a
baseline to prove it was worth it.

That afternoon routinely saves a fine-tuning project. The eval set you build for it is the
same one you will need afterwards regardless of which path you take.
