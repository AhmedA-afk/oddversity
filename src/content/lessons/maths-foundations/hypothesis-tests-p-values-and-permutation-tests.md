---
title: "Hypothesis tests, p-values, and permutation tests"
track: "maths-foundations"
status: live
summary: "A hypothesis test compares observed data with what a null model would generate."
duration: "5 min read"
---

## The short answer

A hypothesis test compares observed data with what a null model would generate. A p-value is the probability, under that null and the planned test statistic, of observing a result at least as extreme as the one seen. It is not the probability that the null is true. Use permutation tests when exchangeability under the null is credible, and pair every p-value with effect size and uncertainty.

## Why this matters

Teams often turn a threshold into a truth machine: p<.05 becomes “the feature works.” That discards magnitude, design, multiplicity, and the possibility that the null model was a poor representation of the comparison.

**Small incident (illustrative):** an analyst tried five metrics and reported the one with the smallest p-value. The calculation for that metric was ordinary; the selection process made the reported evidence more surprising than it really was.

## How it works

State a null H₀, an alternative H₁, a statistic T, and a rejection rule before inspecting results. A permutation test pools observed outcomes, randomly reassigns treatment labels in a way allowed by H₀, recomputes T, and estimates the tail fraction at least as extreme as the observed T. This tests a sharp exchangeability claim, not every possible “no effect” story.

### Assumptions and derivation

If labels are exchangeable under H₀, each permitted reassignment is equally plausible under the null. The permutation distribution therefore approximates the sampling distribution of T under H₀ without choosing a normal approximation. Pairing, clusters, time order, and stratification must be preserved when they are part of the design.

## AI use

Use tests for predeclared model comparisons, feature ablations, and experiment effects—not as a replacement for evaluation design. Report the test statistic, null, alternative, denominator, number of comparisons, stopping rule, and practical effect. For model metrics, resample at the user or task unit and preserve pairing when comparing systems on the same cases.

## Worked examples and variations

### Example A — smallest happy path

**Input:** treatment scores `[8, 9, 10]`, control scores `[5, 6, 7]`; statistic = mean difference. **Mechanism:** observed difference is 3; permute the six labels and recompute differences. **Output:** a right-tail permutation p-value. **Inspect:** the exact distribution has only 20 unique three-versus-three assignments. **Next decision:** state whether the observed difference is unusual under exchangeability.

### Example B — meaningful variation

**Input:** paired model errors for the same 10 cases. **Mechanism:** randomly flip the sign of each within-case difference under a symmetric null, rather than shuffling independent labels. **Output:** a paired permutation distribution. **Inspect:** pairing reduces irrelevant case difficulty noise. **Next decision:** preserve the comparison structure in the test.

### Example C — boundary case

**Input:** an exact permutation test with all allowed statistics at least as extreme as observed. **Mechanism:** tail count equals the number of permutations. **Output:** p=1, not “no information.” **Inspect:** the design may have little contrast or the statistic may be insensitive. **Next decision:** examine effect size and data collection, not just a threshold.

### Example D — tempting counterexample

**Input:** p=.03 after trying 20 unplanned metrics. **Mechanism:** the analysis searched until a small tail probability appeared. **Output:** the nominal p-value ignores search multiplicity. **Inspect:** list every metric and stopping decision. **Next decision:** predeclare one primary outcome or adjust and disclose the family of tests.

## Computation and interpretation

```python
import itertools
import numpy as np

a = np.array([8., 9., 10.])
b = np.array([5., 6., 7.])
pooled = np.r_[a, b]
observed = a.mean() - b.mean()
null = []
for treated_indices in itertools.combinations(range(6), 3):
    mask = np.zeros(6, dtype=bool)
    mask[list(treated_indices)] = True
    null.append(pooled[mask].mean() - pooled[~mask].mean())
p_value = np.mean(np.abs(null) >= abs(observed))
print(observed, p_value)
```

The exact result is conditional on the exchangeability null and the chosen two-sided statistic. A small p-value says the result is unusual under that null; it does not quantify importance or prove a causal story.

## Two ways to see it

### Builder view

A test is a comparison contract: define the randomisation or resampling rule, statistic, tail, and decision threshold before looking at the answer.

### Systems view

The p-value is downstream of human choices about metrics, slices, stopping, and logging. Multiple looks and multiple outcomes are part of the experiment, not invisible implementation details.

## Hands-on

Implement the exact permutation test for the six scores above and write a one-paragraph interpretation. **Failure fixture:** shuffle treatment labels after removing the paired identity from a paired dataset. **Test:** the paired fixture must preserve one treated and one control value per case; the test should fail when case IDs are mismatched. **Reset:** restore the original IDs and use sign flips within pairs.

## Checkpoint

- [ ] State H₀, H₁, statistic, and tail for one analysis.
- [ ] Define a p-value without saying “probability the null is true.”
- [ ] Choose shuffle, sign-flip, or blocked permutation for three designs.
- [ ] Explain why trying many metrics changes the evidence calculation.

## What this does not solve

Tests do not establish practical value, causality without design assumptions, or truth after arbitrary metric shopping. A valid p-value can accompany a trivial effect. Dependence, selection, optional stopping, and multiplicity require explicit handling.

## Continue, go deeper, apply it

- Continue: Effect sizes, power, and sample-size planning
- Go deeper: A/B experiments, sequential testing, and multiple comparisons
- Apply it: Cross-validation and experimental design
