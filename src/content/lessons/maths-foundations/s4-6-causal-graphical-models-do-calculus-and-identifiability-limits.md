---
title: "Causal graphical models, do-calculus, and identifiability limits"
track: "maths-foundations"
status: live
summary: "Causal graphical models represent variables and assumed data-generating directions in a graph."
duration: "4 min read"
---

## The short answer

Causal graphical models represent variables and assumed data-generating directions in a graph. Conditioning on `X` observes `X`; intervening `do(X=x)` sets it and cuts incoming causes. Backdoor adjustment can identify an effect when measured covariates block noncausal paths. Some effects remain unidentifiable without stronger assumptions or experiments—no regression trick can manufacture the missing counterfactual.

## Why this matters

Prediction and intervention answer different questions. A feature can predict an
outcome because of a common cause while changing it has no effect. Graphs expose
confounders, mediators, and colliders, and identifiability analysis tells you
whether the requested causal quantity is recoverable from the available data.

## How it works

In a DAG, a directed edge encodes an assumed structural relationship. For an
exposure `X` and outcome `Y`, the causal effect is a distribution such as
`P(Y|do(X=x))`. If `Z` blocks every backdoor path from `X` to `Y` and does not
include a descendant of `X`, then

```text
P(Y|do(X=x)) = Σ_z P(Y|X=x,Z=z)P(Z=z).
```

Do-calculus gives graph transformation rules for more complex cases. A collider
on `X→C←Y` is not a confounder to adjust for; conditioning on it can create a
spurious association. Identifiability is a property of the graph plus observed
data, not of the sample size alone.

## Worked examples and variations

### Example A: measured confounding

**Input:** treatment `X`, outcome `Y`, age `Z` causes both. **Mechanism:** age is
a backdoor variable; adjust using the backdoor formula. **Output:** an identified
causal effect under consistency, positivity, and no unmeasured confounding.
**Inspect:** draw `Z→X`, `Z→Y`, `X→Y`. **Decision:** state the assumptions beside
the estimate.

### Example B: mediation

**Input:** `X→M→Y`, with a direct `X→Y` path. **Mechanism:** conditioning on M
changes the estimand and can block part of the effect. **Output:** total and
direct/indirect effects are different questions. **Inspect:** label the target
before adjustment. **Decision:** do not call mediator adjustment “controlling for
everything.”

### Boundary case: collider adjustment

**Input:** `X→C←Y`, no causal X–Y edge. **Mechanism:** marginally, paths are
blocked; conditioning on C opens a noncausal path. **Output:** an apparent
association. **Inspect:** compare estimates with and without collider adjustment.
**Decision:** avoid conditioning on post-treatment selection variables without a
causal justification.

### Counterexample: unmeasured confounder

**Input:** `U→X`, `U→Y`, with U unobserved and no valid instrument/front-door path.
**Mechanism:** the backdoor path cannot be blocked by observed covariates.
**Output:** the causal effect is not identified from the stated observational data.
**Inspect:** draw the missing path and run sensitivity analysis if possible.
**Decision:** collect a confounder, design an experiment, find a valid alternative,
or report non-identifiability.

## An illustrative story

An illustrative product analysis finds that users who enable a feature retain
better. High engagement causes both adoption and retention, so simply targeting
all users based on the association may waste effort. A randomized offer or a
credible causal design is needed for the intervention question.

## Two ways to see it

### Graph view

Arrows encode assumptions about how variables are generated; paths show where
association can flow. Blocking and opening paths are graph operations with causal
consequences.

### Decision view

Ask “what would happen if we set X?” rather than “who has X?” Then check whether
the data and assumptions identify that counterfactual distribution.

## Hands-on

Simulate four DAG fixtures: measured confounding, mediation, collider bias, and an
unmeasured confounder. Estimate the naive association, a proposed adjustment,
and (where identifiable) the known simulated intervention effect. Draw each graph
and list assumptions.

**Failure state:** adjust for the collider or report an observational association
as the effect under `do(X)`. **Test:** collider adjustment must show induced bias;
the unmeasured-confounder fixture must be labelled non-identifiable rather than
awarded a causal estimate. **Reset:** use the valid backdoor set or simulated
randomization, and preserve the non-identifiability warning.

## Checkpoint

- [ ] Contrast conditioning `P(Y|X=x)` with intervention `P(Y|do(X=x))`.
- [ ] Draw a backdoor path and name a valid adjustment variable.
- [ ] Explain why collider adjustment can create bias.
- [ ] State what “not identifiable” means for a causal request.

## What this does not solve

Do-calculus cannot validate a wrong graph or supply unmeasured causes. Identified
effects still need positivity, consistency, measurement quality, and transport
assumptions; a graph is a transparent assumption set, not an oracle.

## Continue, go deeper, apply it

- Continue: Problem framing and baselines
- Go deeper: Causal questions versus predictive models
- Apply it: Risk before model
