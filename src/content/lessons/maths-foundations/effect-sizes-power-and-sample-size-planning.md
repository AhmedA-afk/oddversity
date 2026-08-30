---
title: "Effect sizes, statistical power, and sample-size planning"
track: "maths-foundations"
status: live
summary: "An effect size describes how much a quantity changes in meaningful units; power is the probability a planned test rejects a false null."
duration: "4 min read"
---

## The short answer

An effect size describes how much a quantity changes in meaningful units; power is the probability a planned test rejects a false null under a specified alternative. Sample-size planning starts with a smallest practically important effect, variability, error rate, and design—not a desired p-value after the fact. Report magnitude and interval first; statistical significance alone confuses detectability with value.

## Why this matters

With enough rows, a tiny change can be statistically detectable; with too few, a useful change can be missed. Product decisions need the size, cost, uncertainty, and likely consequences of the change, not only a binary label.

**Small incident (illustrative):** a checkout change improved conversion by 0.02 percentage points in a very large sample and was declared a win. The result was precise, but the engineering and operational costs exceeded the expected value.

## How it works

For a difference in means, a raw effect is `δ = μ₁−μ₀`; a standardised effect is `d = δ/σ` when a common scale is appropriate. A confidence interval expresses uncertainty around δ. Power depends on effect size, sample size, noise, allocation, the test threshold α, and the alternative used for planning.

### Assumptions and derivation

For a rough two-arm normal design with equal group sizes and known common σ, the required observations per group satisfy `n ≈ 2 (zα/2 + zβ)² σ² / δ²`, where 1−β is target power. This is an approximation: binary outcomes, unequal allocation, clustering, repeated looks, and multiple arms require a design-specific calculation.

## AI use

Use effect-size planning for model improvements, annotation studies, retraining decisions, and online experiments. Define the smallest lift that changes the decision, then plan for it. For imbalanced metrics, choose a unit and a denominator that reflect harm; a one-point macro-F1 change and one-point accuracy change are not interchangeable.

## Worked examples and variations

### Example A — smallest happy path

**Input:** baseline mean 50, new mean 55, common σ=10. **Mechanism:** raw effect δ=5 and standardised effect d=.5. **Output:** a medium-scale change under this convention. **Inspect:** retain the original unit because d hides business meaning. **Next decision:** ask whether five units exceeds the practical threshold before planning power.

### Example B — meaningful variation

**Input:** 1,000,000 requests show a conversion lift of .0002, with a narrow interval around it. **Mechanism:** large n shrinks standard error. **Output:** a potentially significant but operationally negligible improvement. **Inspect:** calculate absolute incremental conversions, revenue, latency, and rollout cost. **Next decision:** use a practical-value gate in addition to a statistical gate.

### Example C — boundary case

**Input:** a rare safety event with expected rate .001 and only 100 trials. **Mechanism:** the expected count is .1, so observing zero is common even if risk exists. **Output:** low observed count and low power to detect modest changes. **Inspect:** report the interval and minimum detectable effect. **Next decision:** increase exposure, use a richer metric, or avoid claiming equivalence.

### Example D — tempting counterexample

**Input:** choose sample size after seeing a noisy pilot effect of 20 units. **Mechanism:** planning on an inflated estimate underpowers the real, smaller effect. **Output:** an apparently surprising non-result. **Inspect:** use a conservative effect or pilot-informed variance, not a post-hoc target. **Next decision:** predeclare the planning assumptions and sensitivity range.

## Computation and interpretation

```python
from math import ceil

z_alpha, z_beta = 1.96, 0.84       # two-sided 5%, 80% power
sigma, practical_delta = 10.0, 5.0
n_per_group = ceil(2 * (z_alpha + z_beta)**2 * sigma**2 / practical_delta**2)
print(n_per_group)
```

The output is a planning approximation, not a guarantee. Recompute when the outcome, allocation, dependence, or stopping rule changes. Show the result as “planned to detect δ under assumptions,” not as proof that δ will occur.

## Two ways to see it

### Builder view

Power is a sensitivity test for an experiment design: if the true change were this size, would the design usually distinguish it from noise?

### Systems view

A statistically powered experiment can still be ethically or economically wrong. The practical threshold, rollback rule, and harm budget belong in the design before traffic is assigned.

## Hands-on

Make a planning sheet with baseline mean 50, σ=10, α=.05, power=.80, and practical effect 5. Add a sensitivity table for effects 2, 5, and 10. **Failure fixture:** plan for effect 20, then evaluate simulated data with true effect 2. **Test:** the sheet must show lower power for the smaller effect at the same n. **Reset:** restore the predeclared practical effect and recompute without looking at simulated outcomes.

## Checkpoint

- [ ] Report one raw and one standardised effect size with units.
- [ ] Explain why large samples can detect negligible effects.
- [ ] Name the inputs to a power calculation.
- [ ] State why planning on a post-hoc observed effect is risky.

## What this does not solve

Power is conditional on a design and alternative; it does not measure truth, practical value, or generalisation. It cannot fix biased sampling, invalid metrics, or an outcome that was changed after seeing data.

## Continue, go deeper, apply it

- Continue: A/B experiments, sequential testing, and multiple comparisons
- Go deeper: Calibration, scoring rules, and distribution shift
- Apply it: Imbalanced data and metrics
