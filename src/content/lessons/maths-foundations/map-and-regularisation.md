---
title: "Maximum a posteriori estimation and regularisation"
track: "maths-foundations"
status: live
summary: "Maximum a posteriori estimation chooses the parameter that maximises likelihood times a prior."
duration: "5 min read"
---

## The short answer

Maximum a posteriori estimation chooses the parameter that maximises likelihood times a prior. Taking negative logs turns the prior into a penalty, so MAP explains why L2 and L1 regularisation can encode beliefs about parameter size or sparsity. Use MAP when that prior is defensible; call the result a regularised estimate, not an objective truth or a full posterior.

## Why this matters

Small datasets make unconstrained estimates extreme: an unseen class gets probability zero, and a regression coefficient can chase one noisy row. A prior supplies a controlled preference before the data arrives. The benefit is reduced variance; the cost is bias if the prior is wrong.

**Small incident (illustrative):** a classifier trained on four examples assigned a never-seen intent probability zero. Adding smoothing did not “fix the labels”; it made the uncertainty implied by sparse evidence explicit.

## How it works

Bayes’ rule gives posterior proportional to likelihood × prior. MAP is the posterior mode:

`θ_MAP = argmaxθ [ p(data | θ) p(θ) ] = argmaxθ [ log p(data | θ) + log p(θ) ]`.

For a Gaussian prior on a weight vector, `p(w) ∝ exp(−λ ||w||² / 2)`. Maximising log likelihood plus log prior is equivalent to minimising negative log likelihood plus `λ ||w||² / 2`, the L2 penalty. A Laplace prior gives an L1 penalty because its negative log density is proportional to `||w||₁`.

### Assumptions and derivation

The equivalence requires the stated prior family, a consistent parameterisation, and a penalty coefficient tied to the amount of data and prior scale. A MAP estimate is one point; it does not contain posterior uncertainty. For a Bernoulli rate with Beta(α, β) prior and s successes in n trials, the posterior is Beta(α+s, β+n−s), and for α+s>1 and β+n−s>1 its mode is `(α+s−1)/(α+β+n−2)`.

## AI use

Use priors and penalties to make sparse data, parameter scale, and model capacity explicit. Tune a regularisation coefficient on validation data, but also ask what prior belief it encodes and whether it is invariant to feature scaling. Regularisation cannot repair a selected sample or an invalid label.

## Worked examples and variations

### Example A — smallest happy path

**Input:** four Bernoulli trials with s=3 and a uniform Beta(1,1) prior. **Mechanism:** the MAP mode equals the MLE, .75, because the uniform prior adds no log penalty in the interior. **Output:** p_MAP=.75. **Inspect:** same data, same estimate, but a full posterior still exists. **Next decision:** distinguish the mode from posterior intervals.

### Example B — meaningful variation

**Input:** the same data with Beta(2,2). **Mechanism:** p_MAP=(3+2−1)/(4+2+2−2)=4/6≈.667. **Output:** the estimate is pulled toward .5. **Inspect:** compare MLE .75, MAP .667, and posterior spread. **Next decision:** use the prior only if the symmetry and concentration are defensible.

### Example C — boundary case

**Input:** ten successes, zero failures, Beta(2,2). **Mechanism:** MAP mode = (10+2−1)/(10+2+2−2)=11/12≈.917 rather than 1. **Output:** an unseen failure retains nonzero probability. **Inspect:** the prior affects the boundary most strongly. **Next decision:** report the prior and sample size; do not hide the shrinkage.

### Example D — tempting counterexample

**Input:** an extremely concentrated prior centred at the wrong rate. **Mechanism:** the prior term dominates the likelihood. **Output:** MAP can remain confidently near the prior even with modest data. **Inspect:** run a prior-sensitivity analysis. **Next decision:** weaken, revise, or explicitly disclose a prior that conflicts with evidence.

### Example E — regularised weights

**Input:** two correlated features in a regression. **Mechanism:** L2 distributes weight across them; L1 tends to prefer sparse solutions but can choose one arbitrarily when features are near duplicates. **Output:** different coefficients with similar predictions. **Inspect:** compare prediction error, coefficient stability, and feature scaling. **Next decision:** choose based on interpretability and stability, not sparsity alone.

## Computation and interpretation

```python
def beta_map(successes, trials, alpha=2, beta=2):
    a = alpha + successes
    b = beta + trials - successes
    if a <= 1 or b <= 1:
        raise ValueError("this simple mode formula needs interior shape")
    return (a - 1) / (a + b - 2)

print(beta_map(3, 4))
```

The number is conditional on the Beta prior and the Bernoulli model. Vary α and β to see sensitivity; a prior is part of the model, not a harmless implementation detail.

## Two ways to see it

### Builder view

MAP is a likelihood score with a regularising term. Keep the data-fit and prior terms separately observable so a training report can explain why a parameter moved.

### Systems view

Regularisation is institutional preference made mathematical: simpler, smaller, or sparser models are preferred because they may be easier to operate or less likely to overreact. That preference can also encode an unfair or stale assumption.

## Hands-on

Create a table comparing Bernoulli MLE and Beta(2,2) MAP for successes `0…n` at n=4, 10, and 100. **Failure fixture:** omit the prior from the all-success row and return probability 1. **Test:** the MAP table must keep the probability strictly between 0 and 1 for the interior Beta prior and must show the gap shrinking as n grows. **Reset:** restore α=2, β=2 and recompute all rows from the count fixture.

## Checkpoint

- [ ] Derive the MAP mode for a Beta–Bernoulli model.
- [ ] Explain why a Gaussian prior yields an L2 penalty.
- [ ] Give one reason MAP can have lower predictive error than MLE.
- [ ] State why a MAP point is not the same as a posterior distribution.

## What this does not solve

MAP does not prove a prior is correct, quantify all posterior uncertainty, or remove sampling bias. Regularisation can underfit, distort calibrated probabilities, and behave differently after feature rescaling. Compare priors and penalties under the deployment decision.

## Continue, go deeper, apply it

- Continue: Confidence intervals and their frequentist meaning
- Go deeper: Latent variables and ELBO intuition
- Apply it: Regularisation and bias–variance
