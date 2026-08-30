---
title: "Confidence and Review Routing"
track: "structured-outputs"
status: live
summary: "How to score an extraction's trustworthiness from validation signals alone, and where to set the threshold that sends it to a human."
duration: "9 min read"
---

*This is the deferred rigor behind a phrase used loosely elsewhere in this module — "route low-confidence extractions to review." Read it when you're actually building that routing layer, not before.*

Most extraction pipelines eventually need a way to say "this one, a human should look at" — and the honest version of that decision requires a confidence signal, a threshold, and an explicit acceptance of the tradeoff the threshold encodes.

## Sources of a confidence signal

Three sources are available, and they're not equally trustworthy:

**Model-reported confidence** — asking the model to self-report a score. This is the weakest source. Models are not well-calibrated at reporting their own uncertainty, and a self-reported "confidence: 0.95" often just reflects how confidently the answer *reads*, not how likely it is to be correct — the same gap discussed in [Extraction Mistakes](/learn/structured-outputs/extraction-mistakes) around over-trusting OCR output on a blurry image. Treat it as a weak, supplementary signal, never the primary one.

**Validation warnings** — how much repair work was needed to make the output schema-valid, and whether any got auto-repaired at all. An extraction that needed [auto-repair](/learn/structured-outputs/validation-and-auto-repair) to fix a malformed field is more likely to have other, silent problems than one that validated cleanly the first time.

**Cross-field checks** — the strongest source, because it's grounded in the document's own internal consistency rather than the model's self-assessment. A receipt where line items sum to the printed subtotal, a statement where the running balance reconciles row to row, a contract where every clause's page number falls within the document's actual page range — each passing check is real evidence, and each failing one is a concrete, explainable reason for suspicion. [A Receipt Image to a Typed Object](/learn/structured-outputs/receipt-image-to-schema-example) and [Transactions from a Bank Statement](/learn/structured-outputs/bank-statement-transactions-example) both build these checks for their respective documents.

## Combining signals into one score

You don't need a trained model to combine these — a rule-based severity scheme covers most pipelines and stays fully explainable, which matters when you're justifying a routing decision to someone:

```python
def confidence_tier(warnings: list[str], had_auto_repair: bool, self_reported: float | None) -> str:
    if warnings:                       # any failed cross-field check
        return "low"
    if had_auto_repair:
        return "medium"
    if self_reported is not None and self_reported < 0.7:
        return "medium"
    return "high"
```

A hard cross-field failure always wins the tier assignment — it's the strongest signal — and the weaker signals only matter when nothing stronger contradicts them.

## Threshold selection and the precision/recall tradeoff

Once you have a numeric confidence score (not just a tier), you pick a threshold: extractions scoring at or above it get accepted automatically; everything below goes to review. Raising the threshold sends more to review — safer, slower. Lowering it accepts more automatically — cheaper, riskier. This is a real precision/recall tradeoff, and it's worth working through the arithmetic once so it stops being an abstraction.

Take a small, fully invented illustrative set — 20 example extractions with a synthetic confidence score and whether each one was actually correct (this is a made-up demonstration set, not data from any real system):

| Threshold | Auto-accepted | Correct among accepted | False accepts | Precision | Recall | Review rate |
|---|---|---|---|---|---|---|
| 0.90 | 7 | 6 | 1 | 6/7 ≈ 85.7% | 6/12 ≈ 50.0% | 13/20 = 65% |
| 0.80 | 12 | 10 | 2 | 10/12 ≈ 83.3% | 10/12 ≈ 83.3% | 8/20 = 40% |
| 0.70 | 15 | 11 | 4 | 11/15 ≈ 73.3% | 11/12 ≈ 91.7% | 5/20 = 25% |

Here `precision` is "of what got accepted automatically, what fraction was actually correct" and `recall` is "of everything that was actually correct, what fraction did automatic acceptance catch" (the 12 in each recall's denominator is the total correct count across all 20 examples in this illustrative set). Reading down the table: pushing the threshold from 0.90 to 0.70 more than doubles how many extractions get auto-accepted (7 → 15) and captures far more of the correct extractions automatically (50% → 91.7% recall) — but it also lets in more of the wrong ones (1 → 4 false accepts), and precision drops accordingly (85.7% → 73.3%).

## Choosing the threshold

There's no universally correct point on that curve — it depends on what a false accept costs versus what a review costs, for your specific pipeline:

- A wrong number that flows silently into an automated payment or a contract obligation is expensive to fix after the fact, sometimes irreversibly. That argues for a high threshold — accept fewer automatically, review more, even at real throughput cost.
- A wrong classification that just routes a support ticket to the wrong queue is cheap to correct downstream. That argues for a lower threshold — the cost of a false accept is small enough that maximizing automatic throughput wins.

Set the threshold by estimating both costs for your actual use case, not by picking a round number like 0.9 because it looks rigorous. And revisit it — as your extraction pipeline improves (better prompts, added cross-field checks), the precision/recall curve itself shifts, and a threshold that was well-calibrated six months ago may now be needlessly conservative or newly too loose.

## Where this fits

This is the layer that sits after validation and grounding, not instead of them — [Grounding Extractions in the Source](/learn/structured-outputs/grounding-and-citations-in-extraction) is what makes a routed-to-review item fast to actually review, and [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair) is what produces the warning signal this layer consumes. If your pipeline is low-stakes enough that a wrong extraction is cheap and easy to catch downstream, you may not need this layer at all — it earns its complexity on pipelines where being wrong silently is the actual risk.

**Related:** [Extraction Mistakes](/learn/structured-outputs/extraction-mistakes), [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair), [Grounding Extractions in the Source](/learn/structured-outputs/grounding-and-citations-in-extraction), [Evaluating Structured Output Quality](/learn/structured-outputs/evaluating-structured-output-quality), [Reliability Budget Thinking](/learn/structured-outputs/reliability-budget-thinking)
