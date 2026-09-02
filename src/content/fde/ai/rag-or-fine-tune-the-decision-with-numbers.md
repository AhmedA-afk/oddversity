---
title: "RAG or fine-tune: the decision, with numbers"
phase: ai
module: guardrails-cost-and-choice
kind: lesson
summary: "Fine-tuning and RAG solve different problems and the question is not which is better. It is whether your eval score is limited by missing knowledge, in which case retrieval fixes it, or by a stable behaviour the model gets wrong every time, in which case fine-tuning might."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Diagnose, from an eval's failure pattern, whether the problem is missing knowledge or a stable behavioural gap.
  - Explain why RAG is almost always the correct default, and what specifically would change that answer.
  - Use your own eval set as the numbers in this decision, rather than a general opinion about which technique is "better".
artifact: A one-page decision memo applying this framework to a real failure pattern from an eval you have already run in this path.
sources:
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
  - https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde
---

This question comes up in interviews specifically because it exposes whether a candidate has a real decision framework or a preference. The honest framework does not start with "which technique is better" — it starts with your eval set from earlier in this phase, and what it tells you about why the current system is wrong.

## The diagnosis comes before the decision

Run your eval and look at the failures, not the aggregate score. Two failure patterns point in opposite directions.

**The model doesn't have the fact.** It answers confidently and wrong, or declines to answer, on questions whose correct answer exists in a specific document, record, or data source the model was never shown. This is a missing-knowledge problem, and it is what retrieval exists to solve. Adding the right document to the model's context window fixes this category of failure directly, and the fix is testable the same day — retrieve the relevant chunk, put it in context, rerun the eval case, see if it now passes.

**The model has the information but gets the reasoning, format, or tone stably wrong.** Given the right context, it still misapplies a customer-specific classification scheme every time, or it answers in a register that does not match the customer's brand voice no matter how the system prompt is worded, or it consistently fails a structured-output format the schema and retries from earlier lessons have not resolved. This is a behavioural gap, not a knowledge gap, and it is the category where fine-tuning becomes worth considering — teaching the model, through many labelled examples, to reliably produce the pattern you need, rather than hoping a longer and longer system prompt eventually gets there.

Most failures diagnosed honestly turn out to be the first kind. This is why RAG is the correct default: most of what an enterprise customer needs the model to know is not a stable behaviour to learn, it is a specific fact to look up, and fine-tuning cannot teach a model facts that change weekly the way a policy document does. A fine-tuned model with last month's pricing baked into its weights is wrong in a way no amount of retraining schedule discipline fully solves, while a RAG system with an updated document is correct the moment the document changes.

## What actually moves the needle for each

For a knowledge gap, the intervention is retrieval quality: better chunking, hybrid search, reranking, permission-aware filtering, all covered earlier in this module. None of these require touching the model's weights, all of them are testable against your existing eval set without a training run, and all of them can be iterated on in the time it takes to redeploy a retriever, not the time it takes to fine-tune and re-evaluate a model.

For a genuine behavioural gap, the intervention is a labelled training set built the same way your eval set was built — with a domain expert, from real examples, at a scale sufficient to teach the pattern reliably rather than a handful of examples that overfit to their own quirks. This is a materially larger undertaking than adjusting a retriever: it requires enough labelled examples to actually shift model behaviour, an evaluation of the fine-tuned model against the same eval set to prove it improved rather than regressed elsewhere, and a plan for what happens when the underlying base model is updated or deprecated, since a fine-tune is tied to a specific base model in a way a prompt and a retriever are not.

## Try prompting and few-shot examples before either

Before reaching for retrieval infrastructure or a fine-tuning pipeline, check whether the failure is actually solved by putting a small number of well-chosen examples directly in the prompt — the parameterised-instructions lesson's template mechanism makes this cheap to test. A behavioural gap that a handful of in-context examples fixes reliably does not need fine-tuning; a knowledge gap that a single relevant document in context fixes does not need a full retrieval pipeline if the corpus is small and stable enough to include directly. Reach for the heavier tool only once the lighter one has been tried against the eval set and shown not to close the gap.

## The order to actually work in

1. Diagnose the failure pattern from your eval set: knowledge gap or behavioural gap.
2. If knowledge gap, try adding the missing document directly to context first, to confirm the diagnosis, then build or improve retrieval.
3. If behavioural gap, try a handful of in-context examples in the prompt template first, to confirm the diagnosis, then consider fine-tuning only if the gap persists at a scale a prompt cannot reasonably cover.
4. Re-run the full eval set, not just the case you were fixing, after any change — a fix for one failure category can regress another, which is exactly what the eval set exists to catch.

Interviewers specifically probe fine-tune-versus-RAG decisions because this ordering — diagnose from evidence, try the cheap fix first, escalate only when the cheap fix demonstrably fails — is the actual signal, more than knowing the textbook definitions of either technique.

## The FDE angle

When a customer's engineering lead asks "should we just fine-tune it on our data", the answer is rarely a flat yes or no — it is "what does the eval say is actually wrong, and let's look at three or four specific failing cases together." That conversation, run with real failure examples on the screen, usually resolves itself: a knowledge gap is visibly a knowledge gap once you show someone the document that was missing from context, and a genuine behavioural gap is visibly that too. The framework earns its keep by turning a preference-driven debate into a five-minute diagnostic exercise anyone in the room can follow.

## What you should be able to do now

Given a specific eval failure, you should be able to say within a couple of minutes whether it is a knowledge gap or a behavioural gap, and name the cheap fix you would try first to confirm the diagnosis before recommending anything heavier.

Write the memo now: take a real failure pattern from an eval you have already run in this path, diagnose it using this framework, and state which intervention you would try first and why.
