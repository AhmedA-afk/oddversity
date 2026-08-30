---
title: "Causal inference foundations: confounding, counterfactuals, interventions, and experiments"
track: "maths-foundations"
status: live
summary: "Causal inference asks how an outcome would change under an intervention, not merely how variables co-vary."
duration: "5 min read"
---

## The short answer

Causal inference asks how an outcome would change under an intervention, not merely how variables co-vary. A counterfactual compares the same unit under treatment and control, though only one outcome is observed. Confounding occurs when a common cause affects treatment and outcome. Randomised experiments identify an average treatment effect under their design; observational adjustment requires explicit, defensible assumptions.

## Why this matters

Prediction answers “what outcome is likely for this case?” A product or policy decision asks “what happens if we change this input?” A feature can be highly predictive because it records a consequence or a common cause, while changing it has no useful causal effect.

**Small incident (illustrative):** umbrella sales predicted wet roads, but stocking more umbrellas did not cause rain. The predictor was informative; the intervention question was different.

## How it works

Let Y(1) be the outcome for a unit if treated and Y(0) if controlled. The average treatment effect is `ATE = E[Y(1)−Y(0)]`. For each unit, only one potential outcome is observed. If treatment A is randomised, assignment is independent of potential outcomes in expectation, so the difference in group means estimates ATE under consistency, no problematic interference, and adequate measurement.

### Assumptions and derivation

In an observational study, adjustment for covariates X is defensible when X blocks all relevant backdoor paths, treatment and control overlap across X, treatment is well-defined, and outcomes are measured consistently. Then a g-formula-style standardisation averages conditional outcome estimates over a target X distribution. A variable caused by treatment is generally not a safe pre-treatment confounder adjustment.

## AI use

Separate predictive features from intervention levers in ML product work. For uplift, policy, recommendation, or triage changes, define the intervention, unit, outcome, time horizon, and estimand. Use randomisation when feasible; otherwise document the causal graph and sensitivity to unmeasured confounding.

## Worked examples and variations

### Example A — smallest happy path

**Input:** randomly assign 100 users to reminder and 100 to no reminder; conversion is 20% versus 15%. **Mechanism:** assignment breaks pre-treatment confounding in expectation. **Output:** estimated ATE = 5 percentage points. **Inspect:** check exposure, attrition, interference, and interval. **Next decision:** compare the effect with cost and a predeclared practical threshold.

### Example B — meaningful variation

**Input:** training completion is higher for people who choose coaching. **Mechanism:** motivation affects both coaching choice and completion. **Output:** the observational difference mixes coaching effect with motivation. **Inspect:** draw `motivation → choice` and `motivation → completion`. **Next decision:** randomise offers or measure and adjust for credible pre-treatment confounders.

### Example C — boundary case

**Input:** no treated units exist for a subgroup X=rare. **Mechanism:** positivity fails; there is no observed contrast to estimate the subgroup effect. **Output:** any model-based extrapolation is assumption-driven. **Inspect:** treatment counts by subgroup. **Next decision:** collect overlap or narrow the estimand.

### Example D — tempting counterexample

**Input:** a fraud score predicts chargebacks, so the team blocks every high-score transaction and observes fewer chargebacks. **Mechanism:** blocking changes which transactions can become observed chargebacks and may alter attacker behaviour. **Output:** post-intervention outcome is not a simple estimate of “what if we had not blocked.” **Inspect:** retain randomised holdouts or use a defined policy evaluation design. **Next decision:** measure the intervention effect, not only post-policy correlation.

## Computation and interpretation

```python
import numpy as np

rng = np.random.default_rng(8)
n = 20_000
z = rng.binomial(1, .5, n)                 # a confounder
treatment = (rng.random(n) < (0.15 + .65 * z)).astype(int)
y = 0.20 * treatment + 0.50 * z + rng.normal(0, .2, n)
print(y[treatment == 1].mean() - y[treatment == 0].mean())
```

The crude difference mixes the treatment effect with different Z distributions. Stratify by Z and standardise the two conditional means to a common Z distribution; the exercise demonstrates adjustment under a known confounder, not proof that every real confounder was measured.

## Two ways to see it

### Builder view

Write an estimand before writing a model: unit, treatment, outcome, time, and contrast. Then list the assumptions that make the proposed estimate identify it.

### Systems view

Interventions create feedback. A model changes user behaviour, selection, labels, and future training data. Monitoring must compare the actual policy with the counterfactual it was meant to improve.

## Hands-on

Draw a DAG for the coaching example and simulate the fixture above. Estimate the crude difference, the within-Z differences, and a standardised difference. **Failure fixture:** adjust for a post-treatment variable affected by coaching. **Test:** the lab must flag any adjustment variable whose timestamp is after treatment assignment. **Reset:** restore the pre-treatment confounder Z and recompute the standardised estimate.

## Checkpoint

- [ ] Define ATE with potential outcomes.
- [ ] Explain why prediction does not identify an intervention effect.
- [ ] Name consistency, overlap/positivity, and no-unmeasured-confounding assumptions.
- [ ] Identify one post-treatment variable that should not be adjusted for in a simple total-effect analysis.

## What this does not solve

Randomisation does not solve interference, noncompliance, missing outcomes, or a badly defined treatment. Observational adjustment cannot prove an unmeasured-confounding assumption. Causal estimates remain conditional on population, intervention, measurement, and time horizon.

## Continue, go deeper, apply it

- Continue: Self-information and coding intuition
- Go deeper: Data-generating processes, sampling, and selection bias
- Apply it: Causal questions versus predictive models
