---
title: "Deep Dive: Evaluating the Detector Itself"
track: "hallucinations"
status: live
summary: "A detector with 70% recall silently misses three in ten real hallucinations — and a precision-only view of it looks fine."
duration: "8 min read"
---

[Detection: False Comfort](/learn/hallucinations/detection-false-comfort) warns that a detector can make things worse by changing what humans do — once something is "checked," people stop checking it themselves. This lesson is the rigor behind that warning: how to actually measure a detector's own error rates, precisely, before anyone trusts it. Treat it as optional depth once you've internalized the general warning; this is where you learn to compute the number that proves it.

## What it is

Any hallucination detector — a self-consistency check, an NLI entailment check, an LLM-as-judge, an [ensemble cross-check](/learn/hallucinations/ensemble-cross-checking) — is, functionally, a binary classifier: given a claim or answer, it predicts hallucinated or not. Once you frame it that way, standard classifier evaluation applies directly, scored against human-labeled ground truth (see [Human Evaluation and Annotation Protocols](/learn/hallucinations/human-annotation-protocols)): precision, recall, and the full curve you get by sweeping its decision threshold.

## Deriving the mechanism: the confusion matrix

Four outcomes, and each has a different real-world cost:

- **True positive** — detector flags it, it really is a hallucination. The system works.
- **False positive** — detector flags it, it's actually fine. Cost: wasted review time, and enough of these erodes trust in the detector until people start ignoring its flags.
- **False negative** — detector says clean, it's actually a hallucination. Cost: **false comfort** — exactly the failure [Detection: False Comfort](/learn/hallucinations/detection-false-comfort) names. A human sees "not flagged" and stops checking, and the fabrication ships with zero further scrutiny.
- **True negative** — detector says clean, it's actually fine.

**Precision** = TP / (TP + FP): of what the detector flags, how much is real. **Recall** = TP / (TP + FN): of everything that's actually a hallucination, how much did the detector catch.

## Worked example: the 70%-recall detector

Score a detector against 200 human-labeled claims, 40 of which are real hallucinations (a 20% base rate). The detector flags 31 claims total: 28 of them are real hallucinations, 3 are false alarms.

- TP = 28, FP = 3, FN = 40 − 28 = 12, TN = 200 − 40 − 3 = 157
- **Precision** = 28 / 31 ≈ **90%**
- **Recall** = 28 / 40 = **70%**

Read the precision number alone and this detector looks excellent — when it flags something, it's right nine times out of ten, which is exactly the kind of number that makes a team trust its flags and stop double-checking. But recall tells a different story: **12 of the 40 real hallucinations — 30% of them — pass through with the detector saying "clean."** If the workflow is "only human-review what's flagged," those 12 fabrications ship completely unreviewed, and a dashboard that only tracks outcomes for *flagged* items never sees them at all. That's false comfort with a number attached to it: a detector that looks trustworthy by one metric while quietly missing three in ten of the failures it exists to catch.

## The tradeoff curve, precisely

Sweeping the detector's decision threshold trades recall against precision. Illustrative thresholds on the same underlying detector:

| Threshold | Recall | Precision |
|---|---|---|
| Loose (flag more) | ~95% | ~40% |
| Medium | ~70% | ~90% |
| Strict (flag less) | ~40% | ~98% |

There is no threshold that maximizes both at once — this is a real tradeoff, not a tuning bug. One precise note worth stating plainly: with a rare positive class (hallucinations are usually a minority of claims, as in the 20% base rate above), a **precision/recall curve is more informative than a standard ROC curve**. ROC's false-positive-rate denominator is the full pool of negatives, which is large when the positive class is rare — so a detector can look strong on ROC (a low false-positive *rate*) while its precision is being crushed by the sheer volume of negatives it's compared against. When you're choosing or reporting a detector for a rare-event problem like hallucination detection, read precision and recall directly rather than trusting an ROC summary alone.

## Stating the tradeoff as a decision, not a default

Where to sit on that curve is a product decision, not a modeling one, and it needs to be justified against the actual cost of each error type for your use case:

- A **legal or medical review pipeline** should bias toward high recall even at the cost of more false positives — a human reviewing a few extra flagged-but-fine claims is cheap compared to a missed fabrication in that context.
- A **bulk, low-stakes content pipeline** can accept lower recall to avoid drowning a small review team in false alarms, since the cost of an occasional missed hallucination is lower and review capacity is the scarcer resource.

Neither choice is "more correct" in the abstract. State which one you made, and why, the same discipline [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) insists on for the metric itself.

## Where next

Re-run this evaluation periodically, not once at launch — a detector's true error rates drift as the generator model or the domain shifts underneath it, the same recalibration point [Human Evaluation and Annotation Protocols](/learn/hallucinations/human-annotation-protocols) makes about IAA. This also feeds directly into [Evaluation Pitfalls](/learn/hallucinations/evaluation-pitfalls): a detector built from the same model family as the generator it's checking can systematically miss the exact hallucination style that model produces, deflating recall precisely where it matters most.

**Related:** [Detection: False Comfort](/learn/hallucinations/detection-false-comfort) · [Human Evaluation and Annotation Protocols](/learn/hallucinations/human-annotation-protocols) · [Detection Methods Compared](/learn/hallucinations/detection-methods-compared) · [Ensemble Cross-Checking](/learn/hallucinations/ensemble-cross-checking) · [Evaluation Pitfalls](/learn/hallucinations/evaluation-pitfalls) · [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators)
