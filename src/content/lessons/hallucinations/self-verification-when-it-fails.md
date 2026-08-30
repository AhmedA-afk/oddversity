---
title: "Worked Example: When Self-Verification Rubber-Stamps a Lie"
track: "hallucinations"
status: live
summary: "One case where a shared myth survives its own verification pass, and one where an arithmetic slip gets caught — same method, opposite outcome."
duration: "7 min read"
---

Chain-of-verification worked cleanly in the [previous lesson](/learn/hallucinations/self-verification-chain-impl) — a fabricated number got caught because the independent verification pass landed somewhere different. This lesson shows the case where that same method fails, and works through exactly why the failure isn't a bug in the technique.

## The setup

Two questions, run through the identical chain-of-verification pipeline: draft, generate verification questions, answer them fresh, revise.

**Case A (a widely repeated myth):** "Can you see the Great Wall of China from space with the naked eye?" This is a well-documented popular misconception — astronauts and space agencies have repeatedly stated it is not visible to the naked eye from low Earth orbit, but the claim that it *is* visible is one of the most widely repeated pieces of trivia on the internet, meaning it shows up constantly, confidently, across huge amounts of the text any model trains on.

**Case B (a reasoning slip):** "What is 17 × 24?" A one-step arithmetic question with a single correct answer (408) and no ambiguity about how to check it.

## Step by step

**Case A, draft:**

```text
Yes, the Great Wall of China is visible from space with the naked eye,
and it's one of the few man-made structures that can be seen this way.
```

> **Why this step?** This is the myth, stated with total confidence — exactly the kind of fluent, unhedged claim [why fluent text feels confident](/learn/hallucinations/why-fluent-text-feels-confident) warns reads as more trustworthy than it is.

**Case A, verification question generated from the draft:**

```text
Is the Great Wall of China visible from low Earth orbit with the naked eye?
```

**Case A, independent verification answer (fresh context, no draft visible):**

```text
Yes, astronaut accounts and photographs have confirmed the Great Wall
is one of the few human-made structures visible from space.
```

> **Why this step?** This is the failure, and it's worth sitting with why it happens. The verification call is genuinely independent in the sense that it never saw the draft — but it draws on the exact same training distribution, where this specific myth is repeated so often and so confidently that it's the dominant pattern regardless of which prompt triggers it. Isolation prevents the model from literally re-reading its own draft. It does nothing to prevent the model from holding the same belief twice.

**Case A, revision step:** sees two answers that agree, finds no mismatch, and ships the original claim unchanged. The check passed. The claim is still wrong.

**Case B, draft:**

```text
17 × 24 = 402.
```

> **Why this step?** A quiet arithmetic slip — the actual answer is 408. Not implausible-looking, which is exactly what makes this class of error dangerous unchecked.

**Case B, verification question:** "Recompute 17 × 24 and state the result."

**Case B, independent verification answer:**

```text
17 × 24 = 408. (17 × 20 = 340, 17 × 4 = 68, 340 + 68 = 408.)
```

> **Why this step?** This succeeds for a structural reason the myth case doesn't share: arithmetic isn't a matter of which fact got memorized most often in training, it's a computation that produces the same correct result every time it's actually carried out correctly. A fresh attempt at the same computation is a real second data point, not a second draw from the same stored belief.

**Case B, revision step:** sees 402 and 408 disagree, flags the mismatch, and corrects the draft to 408.

## Where it breaks (and the fix)

The break is specific: self-verification catches *inconsistency* between a draft and a fresh attempt. It cannot catch a case where the draft and the fresh attempt are both wrong for the same reason, because they're drawing on the same underlying source — the model's parametric memory of the training distribution. A widely-repeated misconception isn't a slip the model can notice by re-deriving it; it's the model's actual best answer, generated twice.

The fix isn't a better verification prompt. It's checking against something that isn't the model at all. Run the claim through [Implementation: NLI Entailment as a Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl) against an authoritative source, or through [Retrieval-Based Fact Checking as Detection](/learn/hallucinations/retrieval-based-factuality-check), which queries a search index instead of the model's own memory. Either one introduces a piece of evidence that never came from inside the model, which is the only thing that can break a belief the model holds twice in a row.

## Takeaways

- Self-verification is strong against reasoning errors, careless leaps, and slips the model can catch by genuinely redoing the work a different way.
- It is weak against shared, systematic error — a belief so common in training data that both the draft and the "independent" check reproduce it.
- Isolating the verification pass from the draft is necessary but not sufficient. It rules out the model literally re-reading its own text; it does not rule out the model holding the same wrong belief twice.
- Even an ensemble of models can share this blind spot if the models were trained on overlapping web-scale data — see the correlated-errors discussion in [Implementation: Cross-Checking Across Multiple Models](/learn/hallucinations/ensemble-cross-check-impl). The only real fix is external grounding.

**Related:** [Implementation: Self-Verification and Chain-of-Verification](/learn/hallucinations/self-verification-chain-impl), [Self-Verification: Having the Model Check Its Own Work](/learn/hallucinations/self-verification-techniques), [Retrieval-Based Fact Checking as Detection](/learn/hallucinations/retrieval-based-factuality-check), [Implementation: NLI Entailment as a Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl), [Common Mistakes: When Detectors Give False Comfort](/learn/hallucinations/detection-false-comfort)
