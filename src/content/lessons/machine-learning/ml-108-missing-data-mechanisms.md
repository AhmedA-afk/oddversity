---
title: "Missing-data mechanisms"
track: "machine-learning"
order: 108
status: live
summary: "Reason about why values are absent before imputing, dropping rows, or interpreting a missingness indicator."
duration: "26 min read"
updated: "2026-08-30"
---

## The short answer

Missingness is a process. Distinguish missing completely at random (MCAR), missing at random conditional on observed data (MAR), and missing not at random (MNAR). No imputation method can infer the unobserved mechanism from a column alone, so document assumptions and test sensitivity.

## Why this matters

When a test is ordered only for high-risk patients, missingness is informative. Filling it with the average can erase the ordering decision; using a missingness flag can learn policy rather than underlying condition. Both may be useful prediction signals, but neither should be mistaken for truth.

## How it works

Let `R=1` mean a value is observed. MCAR means `R` is unrelated to data; MAR permits dependence on observed variables; MNAR permits dependence on the missing value itself. Compare missingness rates across time, groups, and outcomes. Fit imputation parameters on training rows only, and include missingness indicators when their operational meaning is stable and allowed.

```text
MCAR: device randomly loses packets
MAR: income missing more often for age bands observed in the table
MNAR: income missing more often when income itself is very high
```

## Worked examples and variations

1. A broken random sensor is plausibly MCAR after checking failures are unrelated to operating conditions.
2. A form field skipped more often on mobile is MAR if device type is observed.
3. Self-reported debt omitted by people with high debt is plausibly MNAR.
4. Boundary case: a structurally inapplicable value, such as spouse income for an unpartnered applicant, is not ordinary missingness; encode applicability.
5. Counterexample: dropping every row with a missing lab result can select only patients clinicians chose to test.

## Two ways to see it

Statistically, missingness modifies the likelihood and identifiability. Operationally, it is telemetry about forms, workflows, access, and devices. The operational cause often tells you which statistical assumption is plausible.

## Hands-on

Create missingness indicators and plot their rate by month and outcome. Intentionally impute before splitting. Reset by learning imputation on train only; compare the score and the rate of missing values in each split. Write one MNAR sensitivity scenario even if you cannot resolve it.

## Checkpoint

- What event makes this value absent?
- Is “not applicable” distinct from unknown?
- Would a missingness feature remain available and meaningful after rollout?

## What this does not solve

Mechanism labels are assumptions, not conclusions from a null-rate table. For high-stakes inference, consult domain experts and run explicit sensitivity analyses.

## Continue, go deeper, apply it

After choosing a treatment, perform a feature-availability and leakage audit for every derived feature and imputation signal.
