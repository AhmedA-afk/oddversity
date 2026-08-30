---
title: "Cheatsheet: Measuring Hallucination"
track: "hallucinations"
status: live
summary: "Metric definitions with denominators, what each benchmark measures, which scorer to reach for, and the golden-set checklist, on one page."
duration: "8 min read"
---

This is the reference card for standing up a hallucination eval pipeline. It assumes you've read the concept and implementation lessons in this module — this page is what you keep open while building or debugging, not where you learn the ideas the first time.

## Metric definitions, with denominators

State the exact numerator and denominator every time you report a rate — see [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) for the full argument.

| Metric | Numerator | Common denominator | What it can't see |
|---|---|---|---|
| Factual accuracy | claims true against the world/reference | all attempted claims or answers | whether the model used its given context faithfully |
| Faithfulness / groundedness | claims entailed by the given context | claims in answers with retrieved context | whether the context itself was correct |
| Hallucination rate | unsupported/false claims or answers | *you must specify:* all questions, answered-only, per-claim, or high-stakes-only | nothing inherently — but a vague denominator hides everything |
| Abstention quality | correct declines vs. wrong declines/answers | all questions where abstention was possible | over-refusal and under-refusal move independently; report both |

## The benchmark landscape

Mechanism-level detail on each of these is in [the full tour](/learn/hallucinations/hallucination-benchmarks-tour); this table is the lookup version.

| Benchmark | Measures | Mechanism | Blind spot |
|---|---|---|---|
| TruthfulQA | resistance to imitative falsehoods | adversarial Qs where the likely continuation is a popular myth; scored on truthfulness + informativeness | fixed set, leak-prone; trivia-style, not your domain |
| HaluEval | discrimination between correct/hallucinated pairs | paired samples, one hallucinated by an LLM | measures recognition, not generation-time rate; tied to one generator's fabrication style |
| FActScore | atomic-fact precision in long-form text | decompose into atomic facts, verify each against a source | precision only — no penalty for incompleteness or vagueness |
| SimpleQA | short factual QA + honest abstention | closed-form Qs graded correct/incorrect/not-attempted | question shape is the opposite of long-form RAG answers |

## Automated scorers — when to use which

| Scorer | Use when | Needs | Gotcha |
|---|---|---|---|
| [FActScore-style](/learn/hallucinations/factscore-eval-impl) | open-ended long-form generation (bios, reports) | a trusted knowledge source to check facts against | precision-only; pair with a raw fact count |
| [LLM-as-judge harness](/learn/hallucinations/llm-judge-eval-harness-impl) | comparing prompt/model variants, general factuality + faithfulness | a `(question, answer, reference)` dataset | pin temperature=0; control position bias; avoid same-family judge |
| [RAGAS-style faithfulness](/learn/hallucinations/ragas-faithfulness-impl) | RAG systems specifically | the exact retrieved chunks per answer | strict "silence = unsupported" rule; validate against human labels |

## Detector evaluation recipe

Full derivation in this module's deep-dive on evaluating detectors as classifiers.

1. Build a confusion matrix against human-labeled ground truth: TP, FP, FN, TN.
2. Compute precision = TP/(TP+FP) and recall = TP/(TP+FN). Don't trust either alone.
3. With a rare positive class (hallucinations usually are), read precision/recall directly — an ROC curve's false-positive-rate denominator can look fine while precision is crushed by class imbalance.
4. Pick your operating threshold by the *cost* of each error for your use case: high-stakes review → bias toward recall; bulk low-stakes content → bias toward precision.
5. Re-run this evaluation periodically — a detector's error rates drift as the generator model or domain shifts.

## Golden-set construction checklist

Full walkthrough in [Building a Golden Hallucination Eval Set](/learn/hallucinations/building-golden-eval-set).

- [ ] Mix of known-with-source, adversarial long-tail, and unanswerable items.
- [ ] A cross-cutting high-stakes tag, not a separate bucket — lets you compute the stratified rate later.
- [ ] Unanswerable items disguised in the same style/plausibility as answerable ones — an obviously silly question tests nothing.
- [ ] Every item labeled with `correct_behavior` (`answer` / `abstain`), not just a gold answer.
- [ ] Frozen and versioned alongside the model/prompt/config it was scored against — never hand-edited to fix an inconvenient result.

**Start here, then measure:**

| Use case | Suggested size |
|---|---|
| CI smoke subset (every PR) | ~20 items |
| CI full-suite gate (nightly/pre-release) | ~100 items |
| Model/prompt comparison needing stable deltas | 300+ items |

## Judge and CI defaults

**Start here, then measure:**

- Judge temperature: **0**. Confirm stability by re-running the same call 2–3× on a handful of items before trusting it.
- Judge model family: **different from the generator's**, to avoid self-preference bias and shared blind spots.
- CI regression threshold: **~3 points absolute** rise in hallucination rate — tune tighter for high-stakes domains, looser for noisy small suites.
- Human spot-check size: **20–30 items**, repeated per judge-model/prompt combination, not once ever.

## Copy-paste: manual faithfulness check

```text
Given CONTEXT and ANSWER below, list every factual claim in ANSWER as
a separate line. For each claim, answer only "supported" or
"unsupported" based strictly on CONTEXT — silence counts as
unsupported, not as a pass.

CONTEXT:
{retrieved_context}

ANSWER:
{model_answer}
```

Score = supported claims ÷ total claims. This is the manual version of what the [RAGAS-style scorer](/learn/hallucinations/ragas-faithfulness-impl) automates.

## Copy-paste: CI gate skeleton

```python
delta = current["hallucination_rate"] - baseline["hallucination_rate"]
if delta > THRESHOLD:
    sys.exit(1)  # fail the build — see Hallucination Regression Testing in CI
```

**Related:** [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) · [Deep Dive: A Tour of Hallucination Benchmarks](/learn/hallucinations/hallucination-benchmarks-tour) · [Implementation: FActScore-Style Atomic-Fact Evaluation](/learn/hallucinations/factscore-eval-impl) · [Implementation: An LLM-as-Judge Evaluation Harness](/learn/hallucinations/llm-judge-eval-harness-impl) · [Implementation: Automated RAG Faithfulness Scoring](/learn/hallucinations/ragas-faithfulness-impl) · [Worked Example: Building a Golden Hallucination Eval Set](/learn/hallucinations/building-golden-eval-set)
