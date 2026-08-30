---
title: "Numerical stability: softmax, log-sum-exp, and safe probabilities"
track: "maths-foundations"
status: live
summary: "Numerically stable computation preserves the intended mathematical quantity despite finite precision."
duration: "4 min read"
---

## The short answer

Numerically stable computation preserves the intended mathematical quantity despite finite precision. For softmax and log probabilities, subtract the largest logit before exponentiating; for log-sum-exp use `m + log(sum(exp(z−m)))`. This leaves ratios unchanged while preventing overflow. Validate finite inputs, support, normalisation, and gradients. Clipping probabilities after the fact can hide a broken computation rather than repair it.

## Why this matters

Exponentials overflow quickly and tiny probabilities underflow to zero. A model can then emit NaNs or infinite loss even when the mathematical logits are valid. Stability is part of the algorithm, not an optional formatting step.

**Small incident (illustrative):** a classifier returned NaN only for a long input. The logits were large but finite; the naive exponential overflowed. Rewriting the calculation with log-sum-exp fixed arithmetic, while separate tests still had to check the model’s scale.

## How it works

Softmax is invariant to adding a constant c: `exp(zᵢ+c)/sum exp(zⱼ+c)` equals the original ratio. Choose c=−max(z), so the largest exponent is 1 and all others are at most 1. Log-sum-exp applies the same identity. For a two-class sigmoid, use a stable branch or a library loss that consumes logits.

### Assumptions and derivation

The shift is valid because the common factor `exp(c)` cancels in numerator and denominator. It does not make a non-finite input finite; check inputs first. In a loss, prefer a fused logits-based implementation when its contract is known, because separately materialising probabilities can lose tiny values.

## AI use

Use stable softmax/log loss in classifiers, token scoring, beam search, energy models, and calibration code. Preserve logits for diagnostics, record dtype and reduction, and assert finite outputs. A probability floor is a documented approximation for support, not evidence that the underlying model was stable.

## Worked examples and variations

### Example A — smallest happy path

**Input:** logits `[2,1,0]`. **Mechanism:** subtract max 2, exponentiate `[1,e⁻¹,e⁻²]`, then normalise. **Output:** same probabilities as naive softmax, approximately `[.665,.245,.090]`. **Inspect:** sum is one and all values are finite. **Next decision:** use the stable form.

### Example B — meaningful variation

**Input:** logits `[1000,999,998]`. **Mechanism:** naive exp overflows, shifted exp uses `[1,e⁻¹,e⁻²]`. **Output:** stable finite probabilities. **Inspect:** compare logit differences; adding 998 to all logits should not change the result. **Next decision:** keep logits in a safe representation.

### Example C — boundary case

**Input:** logits `[−infinity, −infinity]`. **Mechanism:** no finite maximum or total mass exists. **Output:** undefined softmax, often NaN. **Inspect:** distinguish all-masked input from a valid extremely negative vector. **Next decision:** define an empty-support policy before calling softmax.

### Example D — tempting counterexample

**Input:** compute probabilities, clip each to 1e−7, then renormalise after a wrong class mapping. **Mechanism:** clipping makes the numbers finite but does not fix labels or logits. **Output:** plausible-looking distribution and wrong loss. **Inspect:** class order, raw logits, and per-example loss. **Next decision:** repair the contract before numerical patching.

### Example E — underflow

**Input:** probability p=1e−300 in float32. **Mechanism:** it may underflow to zero before `log`. **Output:** infinite loss despite a positive mathematical p. **Inspect:** dtype and compute in log space. **Next decision:** use stable logits/log-probabilities and a documented precision budget.

## Computation and interpretation

```python
import numpy as np

def stable_logsumexp(z):
    z = np.asarray(z, dtype=float)
    if not np.isfinite(z).all():
        raise ValueError("logits must be finite for this fixture")
    m = z.max()
    return m + np.log(np.exp(z - m).sum())

def stable_softmax(z):
    lse = stable_logsumexp(z)
    return np.exp(np.asarray(z, float) - lse)

print(stable_softmax([1000., 999., 998.]))
```

Check invariance by adding a constant to every finite logit. If results differ beyond tolerance, inspect dtype or implementation.

## Two ways to see it

### Builder view

Stable algebra preserves identities before the floating-point operations become dangerous. Test extreme, ordinary, and invalid inputs explicitly.

### Systems view

Numerical failures propagate: one NaN can poison optimiser state, monitoring, retries, and user-visible output. Stable code needs an operational response as well as a formula.

## Hands-on

Implement stable log-sum-exp and softmax for `[2,1,0]`, `[1000,999,998]`, and a shifted copy. **Failure fixture:** pass `[−inf,−inf]` and allow NaNs to continue downstream. **Test:** reject non-finite logits, assert probabilities sum to one for valid inputs, and assert shift invariance. **Reset:** restore finite fixtures and clear any cached output produced by the failed case.

## Checkpoint

- [ ] Derive why subtracting max preserves softmax.
- [ ] Explain overflow and underflow in one concrete example.
- [ ] State the policy for all-masked or non-finite logits.
- [ ] Distinguish numerical clipping from modelling support/smoothing.

## What this does not solve

Stable arithmetic does not fix a wrong class order, exploding model scale, poor calibration, or invalid data. A finite result can still be semantically wrong. Precision, dtype, and fused implementation details remain part of the numerical contract.

## Continue, go deeper, apply it

- Continue: Optimisation diagnostics and second-order perspective
- Go deeper: Cross-entropy and negative log-likelihood
- Apply it: API lifecycle and structured output
