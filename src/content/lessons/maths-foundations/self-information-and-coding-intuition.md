---
title: "Self-information and coding intuition"
track: "maths-foundations"
status: live
summary: "Self-information measures how surprising one observed event is under a stated probability model: I(x) = −log₂ p(x) bits, or −ln p(x) nats."
duration: "4 min read"
---

## The short answer

Self-information measures how surprising one observed event is under a stated probability model: `I(x) = −log₂ p(x)` bits, or `−ln p(x)` nats. Rare events carry more information because a code needs more distinctions to identify them. Use the probability model explicitly; surprise is not importance, truth, or data quality.

## Why this matters

Negative log probabilities appear in language-model loss, anomaly scoring, and coding arguments. The same event can be unsurprising under one model and surprising under another, so an AI system must not present “high information” as an objective property of the input.

**Small incident (illustrative):** a rare but benign support phrase triggered an anomaly alert because the detector had learned common phrasing, not because the phrase was harmful. Surprise was a useful signal for review, not a final decision.

## How it works

For an event with probability p, define self-information as `−log_b p`; base 2 gives bits and base e gives nats. A certain event has zero information. Independent events add information because `−log(p₁p₂)=−log p₁−log p₂`.

### Assumptions and derivation

The coding intuition comes from assigning shorter codewords to probable events and longer codewords to rare events. Ideal code length is proportional to negative log probability; integer and prefix-code constraints add rounding and coding overhead. The probability must be positive for an observed event; assigning p=0 gives infinite surprise and signals a support or smoothing failure.

## AI use

Use token negative log probability for language-model evaluation, per-record surprise for anomaly triage, and information gain as a feature-selection intuition. Compare like with like: same tokenisation, event definition, base, context, and denominator. A rare event can be valuable, harmless, or noisy.

## Worked examples and variations

### Example A — smallest happy path

**Input:** fair coin outcome with p=.5. **Mechanism:** `−log₂(.5)=1`. **Output:** one bit of self-information. **Inspect:** either head or tail needs one binary distinction. **Next decision:** use bits when comparing binary coding costs.

### Example B — meaningful variation

**Input:** an event with p=.125=1/8. **Mechanism:** `−log₂(1/8)=3` bits and `−ln(1/8)≈2.079` nats. **Output:** three binary distinctions in the ideal code intuition. **Inspect:** do not compare a bit number directly with a nat number without converting bases. **Next decision:** label the logarithm base in every report.

### Example C — boundary case

**Input:** p=1 for the only allowed outcome. **Mechanism:** `−log(1)=0`. **Output:** no surprise under the model. **Inspect:** certainty is model-relative; if another outcome occurs, its p=0 gives infinite loss. **Next decision:** test support and smoothing before shipping a probability model.

### Example D — tempting counterexample

**Input:** a rare typo with p=.0001. **Mechanism:** the event has about 13.3 bits of surprise. **Output:** high information according to the model. **Inspect:** ask whether the event changes a decision or only violates a language pattern. **Next decision:** route high surprise to inspection, not automatic rejection.

## Computation and interpretation

```python
import math

for p in [0.5, 0.125, 0.01]:
    print(p, -math.log2(p), -math.log(p))
```

The first value is bits; the second is nats. A sequence’s total surprise is the sum of token surprises only when the sequence probability is decomposed into the conditional factors actually used by the model.

## Two ways to see it

### Builder view

Self-information is a local diagnostic: given a probability, inspect the negative log and find which event or token made the score large.

### Systems view

Coding length is a resource analogy, not a safety score. A model that assigns low probability because its vocabulary or context is wrong will call ordinary inputs surprising.

## Hands-on

Create a table for probabilities `[1, .5, .25, .125, .01]` with bits and nats. **Failure fixture:** include p=0 and let the computation return a silent sentinel such as `0`. **Test:** the fixture must reject p≤0 or report positive infinity explicitly, and every row must label its logarithm base. **Reset:** remove p=0 and recompute from the valid probability list.

## Checkpoint

- [ ] Calculate self-information in bits for p=.25 and p=.01.
- [ ] Explain why independent surprises add.
- [ ] Convert a result between bits and nats using the log-base factor.
- [ ] Give one reason high surprise is not proof of harmfulness.

## What this does not solve

Self-information depends on the model, context, tokenisation, and event support. It does not establish causality, semantic importance, or anomaly severity. Infinite surprise is a model failure signal, not a conclusion about the world.

## Continue, go deeper, apply it

- Continue: Entropy and uncertainty
- Go deeper: Cross-entropy and negative log-likelihood
- Apply it: Attention and transformers
