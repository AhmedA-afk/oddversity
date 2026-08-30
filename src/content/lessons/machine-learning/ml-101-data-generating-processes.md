---
title: "Data-generating processes: model the world before the model"
track: "machine-learning"
order: 101
status: live
summary: "Turn a vague prediction task into an explicit story about how observations, labels, decisions, and feedback are produced."
duration: "24 min read"
updated: "2026-08-30"
---

## The short answer

A data-generating process (DGP) is the causal and operational story that turns a real-world process into rows, features, and labels. State the population, sampling mechanism, measurement process, prediction time, intervention, and feedback loop before choosing an algorithm. A model can only learn regularities in the observed DGP; it cannot repair a dataset that represents the wrong process.

## Why this matters

The same column can mean radically different things depending on how it was produced. “Number of support tickets” may measure customer need, product failure, or simply access to support. If the observation mechanism changes after launch, an accurate offline model can fail despite flawless code.

## How it works

Write a compact generative sketch:

```text
population -> eligibility -> sampling -> measurement -> label creation
          -> train dataset -> model decision -> intervention -> future population
```

For a unit `i`, distinguish an unobserved state `Z_i`, measurements `X_i`, outcome `Y_i`, and inclusion indicator `S_i`. Training learns `P(Y | X, S=1)`, not automatically `P(Y | X)` for everyone. Ask what makes `S=1`, whether `X` is available at decision time, and whether the decision changes future `X` or `Y`.

## Worked examples and variations

1. A churn dataset contains only customers who answered a survey. Survey response is part of `S`; its patterns may not transfer to silent customers.
2. Fraud labels come from transactions investigators reviewed. “Not fraud” often means “not investigated,” not a verified negative.
3. A factory model predicts defects from sensor readings. A new sensor calibration changes measurement, even when the physical process stays fixed.
4. Boundary case: a complete census of a fixed historical population has no sampling uncertainty, but it can still have measurement error and deployment shift.
5. Counterexample: treating an observed correlation as the DGP—“late payments cause cancellations”—does not establish a mechanism; financial stress may cause both.

## Two ways to see it

Statistically, the DGP defines the distribution your estimator assumes. Operationally, it is a process map with owners, timestamps, and failure points. The first asks “what distribution changes?”; the second asks “which team or system changed it?”

## Hands-on

Choose a prediction idea. Draw the flow above and annotate every arrow with a database, actor, or instrument. Intentionally delete the sampling arrow; then try to answer who is absent from the data. Reset by restoring it and writing one test: compare a known population attribute for included versus excluded cases.

## Checkpoint

- Can you name the population, unit, inclusion rule, and label creator?
- Which variables are measurements rather than underlying causes?
- What decision could alter the next training dataset?

## What this does not solve

A DGP map does not identify causal effects by itself, guarantee representative data, or replace privacy and fairness review. It makes those assumptions visible enough to test.

## Continue, go deeper, apply it

Apply the map before data extraction, then revisit it after the first error analysis and after launch. Next, specify the unit of analysis and the exact instant at which a prediction is allowed.
