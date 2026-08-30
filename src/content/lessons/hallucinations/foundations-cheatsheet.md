---
title: "Cheatsheet: Foundations Vocabulary and Root Causes"
track: "hallucinations"
status: live
summary: "One page of the vocabulary, root causes, annotation labels, and risk rubric this whole module builds - pin it while reading the rest of the track."
duration: "4 min read"
---

Everything below was derived in earlier lessons in this module - this page just collects it into one scannable reference.

## Core vocabulary

| Term | One-line definition | Lesson |
|---|---|---|
| Hallucination | Fluent, confident output not grounded in facts, sources, or supplied context | [what-is-a-hallucination](/learn/hallucinations/what-is-a-hallucination) |
| Parametric knowledge | What's compressed into the model's weights from training - static, can be stale | [parametric-vs-contextual-knowledge](/learn/hallucinations/parametric-vs-contextual-knowledge) |
| Contextual knowledge | What's in the current prompt/conversation - fresh, but can be misread or overridden | [parametric-vs-contextual-knowledge](/learn/hallucinations/parametric-vs-contextual-knowledge) |
| Factuality contract | The implicit agreement, per task, for how much output must correspond to real facts vs. invention | [when-hallucination-is-desirable](/learn/hallucinations/when-hallucination-is-desirable) |
| Factuality vs. faithfulness | Factuality: is it true about the world. Faithfulness: is it true to the *supplied source* - previewed here, defined fully next module | [factual-vs-faithfulness-distinction](/learn/hallucinations/factual-vs-faithfulness-distinction) |
| Risk factors | Task properties that raise fabrication odds: obscurity, recency, specificity, verifiability, pressure to please | [hallucination-risk-factors](/learn/hallucinations/hallucination-risk-factors) |

## The three root causes

1. **Prediction objective, not correspondence to the world.** The model optimizes "what token plausibly comes next," never "is this true" - see [next-token-mechanics-of-fabrication](/learn/hallucinations/next-token-mechanics-of-fabrication).
2. **The guessing incentive.** Standard training and evaluation objectives score a wrong guess and an honest "I don't know" identically (usually zero), so guessing has strictly higher expected value whenever there's any chance of being right - see [training-objective-rewards-guessing](/learn/hallucinations/training-objective-rewards-guessing).
3. **No self-knowledge signal.** There is no internal known/unknown flag the model can consult before generating - fabricated and grounded content are produced by the identical mechanism - see [no-ground-truth-signal](/learn/hallucinations/no-ground-truth-signal).

## The annotation labels

When dissecting any model output, split it into spans and label each one - the method from [anatomy-of-a-hallucination](/learn/hallucinations/anatomy-of-a-hallucination):

- **Supported** - traceable to a real source or to context actually given
- **Unsupported** - a specific, checkable claim with nothing behind it
- **Unverifiable** - plausible and not provably false, but unconfirmable from what's in front of you (treat this as its own risk category, not as "probably fine")

## The risk rubric

Score 0 (low) / 1 (medium) / 2 (high) on each axis - from [risk-factor-walkthrough](/learn/hallucinations/risk-factor-walkthrough):

| Axis | High-risk shape |
|---|---|
| Obscurity | Long-tail entity or fact, thin or no training coverage |
| Recency | Requires post-cutoff or fast-changing information |
| Specificity demanded | Exact number, date, name, or citation - no room for "approximately" |
| Verifiability | Nobody downstream is likely to check the claim |
| Pressure to please | Question presupposes or leads toward a specific answer |

**Start here, then measure:** flag anything scoring high on *both* obscurity and specificity while low on verifiability as an automatic escalation, regardless of total score - that combination is where fabrication is likeliest and least likely to be caught.

## Default starting points

- **Start here, then measure:** for any task demanding exact facts, ground it in supplied sources before trusting parametric memory - don't wait for evidence of a problem first ([grounding-with-source-documents](/learn/hallucinations/grounding-with-source-documents)).
- **Start here, then measure:** don't rely on temperature 0 as a safety measure - it removes sampling variance, not distributional error.
- **Start here, then measure:** classify a wrong answer as hallucination / retrieval bug / reasoning mistake / injection / bias *before* choosing a fix - each needs a different one ([hallucination-vs-error-vs-bug](/learn/hallucinations/hallucination-vs-error-vs-bug)).
- **Start here, then measure:** for creative or brainstorming tasks, don't apply this module's machinery by default - check the task's factuality contract first ([when-hallucination-is-desirable](/learn/hallucinations/when-hallucination-is-desirable)).

## Quick self-check

```text
Given an output span, ask in order:
1. Is this a hallucination at all, or a different failure?
   -> see hallucination-vs-error-vs-bug
2. What's this task's factuality contract?
   -> see when-hallucination-is-desirable
3. If factual accuracy is required, what's the risk score?
   -> see risk-factor-walkthrough
4. Is the claim supported / unsupported / unverifiable?
   -> see anatomy-of-a-hallucination
```

**Related:** [What a Hallucination Actually Is](/learn/hallucinations/what-is-a-hallucination), [Why Models Hallucinate](/learn/hallucinations/why-models-hallucinate), [Hallucination Risk Factors](/learn/hallucinations/hallucination-risk-factors), [Foundations Quiz](/learn/hallucinations/foundations-quiz)
