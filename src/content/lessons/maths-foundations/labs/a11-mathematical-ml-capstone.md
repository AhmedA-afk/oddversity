---
title: "A11: Mathematical ML capstone"
track: "maths-foundations"
status: live
summary: "A11 is a bounded decision defense: define a small prediction task, establish a non-AI baseline, implement a probability model from primitives."
duration: "17 min read"
---

## The short answer

A11 is a bounded decision defense: define a small prediction task, establish a non-AI baseline, implement a probability model from primitives, compare optimisers, inspect uncertainty and slices, reproduce a deliberate failure, and decide whether the system should be used. The page supplies a deterministic synthetic fixture and checks, but no model results or ship verdict; those must come from your run.

## Why this matters

Mathematical fluency becomes useful when it changes an engineering decision. A
lower loss is not enough if the split leaks, the probabilities are miscalibrated,
the model fails a subgroup, or the optimiser only works at one scale. This lab
joins the course’s contracts—shapes, likelihoods, gradients, optimisation,
uncertainty, and limitations—inside one reviewable artifact.

The fixture is intentionally synthetic and small. It is a safe place to test the
workflow end to end, not evidence that a real deployment is accurate or fair.
Do not copy a number from this page into the report: every metric, interval, plot,
and ship decision must be produced by your own deterministic run.

## Lab contract

- **Timebox:** 4–6 focused hours, including the failure investigation and memo.
- **Runtime:** Python 3.11+ and NumPy. Matplotlib is optional for plots; do not
  use a library model for the core logistic/tiny-network calculation.
- **Seed:** use `SEED = 20260830` and record Python, NumPy, and OS/runtime versions.
- **Task:** predict a synthetic binary `review_required` label from two numeric
  features. `segment` is retained for evaluation slices and must not be a model
  feature.
- **Model choice:** implement logistic regression as the default. A tiny
  one-hidden-layer network is an allowed alternative only when you state the
  nonlinearity hypothesis, implement its forward/backward equations, and pass a
  gradient check. Do not present both as a leaderboard unless the comparison is
  pre-specified.
- **Evidence:** show assumptions, intermediate calculations, test output, and
  uncertainty. A library solver may verify your result after the core calculation;
  it cannot replace the derivation or failure fixture.

## The bounded question

Use this question, or write a comparably bounded replacement before coding:

> Given two numeric observations available at decision time, should a case be
> routed to manual review? What threshold and evidence would justify a limited
> rollout, and where should the system abstain?

Non-goals are a production service, causal claim, real-world fairness claim,
hyperparameter sweep, deep architecture search, or claim that synthetic data
represents a real population. A valid final decision may be “do not ship.”

## Data contract and split

The fixture generator creates 240 independent rows. The label is generated from
two features plus a hidden segment effect and Bernoulli noise. That hidden effect
is deliberate: it gives you a reason to inspect slices while keeping `segment`
out of the model.

| Field | Type and shape | Meaning | Allowed use |
|---|---|---|---|
| `row_id` | unique integer, `(n,)` | stable row identity | split checks and traceability only |
| `segment` | binary integer, `(n,)` | evaluation-only subgroup | slicing, never a feature |
| `x1`, `x2` | finite float, `(n,)` | observations available at prediction time | model features |
| `y` | binary integer, `(n,)` | `review_required` label | target only |

Create disjoint train/validation/test IDs with a fixed permutation. Fit feature
means and scales on train only, use validation only for choices such as optimiser
or threshold, and touch test labels once for the final report. Keep the split
manifest beside the result.

## How it works

For a feature row `x`, logistic regression models the probability of class one as

```text
z = w₀ + w₁x₁ + w₂x₂
p(y=1|x,w) = σ(z) = 1/(1+exp(−z)).
```

The independent Bernoulli likelihood gives binary cross-entropy:

```text
−log p(y|x,w) = −y log σ(z) − (1−y) log(1−σ(z))
              = log(1+exp(z)) − yz.
```

The second form is numerically stable with `logaddexp`. Over `n` rows,

```text
L(w) = (1/n) Σᵢ [logaddexp(0,zᵢ) − yᵢzᵢ]
∇L(w) = (1/n) X̄ᵀ(σ(X̄w) − y),
```

where `X̄` includes a leading intercept column. The gradient follows from
`dL/dz=σ(z)−y` and the chain rule. Use the loss for probability quality; choose
the action threshold separately from the model’s default `0.5` cutoff.

If you choose the tiny-network option, use `h=tanh(X̄_no_bias W₁+b₁)` and a
sigmoid output with the same Bernoulli loss. Explain why the extra hidden layer
is warranted, derive the local derivatives, and compare its added variance and
failure surface with logistic regression. The default route is complete without
that extension.

## Worked examples and variations

### Example A: the clean logistic route

**Input:** train-only-standardised `x1,x2`, binary `y`, and an intercept.
**Mechanism:** compute stable logits, sigmoid probabilities, BCE, and the
analytic gradient; update the same initial weights under two optimisers.
**Output:** a reproducible history of loss and weights, plus validation/test
  metrics produced by your run. **Inspect:** finite values, gradient check, and
  split provenance. **Decision:** compare models only under the predeclared metric
  bundle and threshold policy.

### Example B: the tiny-network option

**Input:** the same fixture and split, with a one-hidden-layer `tanh` model.
**Mechanism:** backpropagate BCE through output sigmoid, matrix multiplication,
  `tanh`, and hidden weights. **Output:** a second probability model, not an
  automatic improvement. **Inspect:** parameter count, gradient check, seed
  sensitivity, and calibration. **Decision:** keep it only if its evidence changes
  the bounded decision enough to justify complexity.

### Boundary case: a case near the action threshold

**Input:** `p` close to the selected review threshold. **Mechanism:** a tiny input
  or weight change flips the action even though the probability barely moves.
**Output:** high decision sensitivity near the boundary. **Inspect:** report a
  threshold-neighbourhood slice and review capacity. **Decision:** abstain,
  widen manual review, or require a margin rather than hiding the instability.

### Counterexample: full-data standardisation or leaked `segment`

**Input:** compute mean/scale using train+validation+test, or add `segment` to
  `X` because it improves the score. **Mechanism:** future information or a
  subgroup proxy crosses the intended boundary. **Output:** an optimistic or
  policy-incompatible result that still runs. **Inspect:** compare the feature
  manifest and train-only statistics. **Decision:** reject the run and recover
  the clean contract before comparing metrics.

### Operational case: a review budget

**Input:** the organisation can manually review only a fixed fraction of cases.
**Mechanism:** a threshold turns probabilities into a queue; false negatives,
  false positives, calibration, and slice coverage have different costs.
**Output:** a capacity-aware action policy, not merely an accuracy number.
**Inspect:** validation-only threshold selection, confusion matrix, queue rate,
  and slice metrics. **Decision:** propose limited use, abstention, or no ship.

## An illustrative story

Imagine a triage prototype whose validation log-loss improves after a feature
change. A review later finds that the feature was a post-decision status field.
The numerical optimisation succeeded, but the data contract was impossible at
prediction time. This is an illustrative teaching frame, not a report of a real
incident; reproduce the pattern locally with the leaked `segment` or a copied
label column, then show the guard that rejects it.

## Two ways to see it

### Mathematical view

The capstone is a chain of claims: the data split defines the sample, the model
defines a conditional probability, the loss defines the objective, the optimiser
defines the path, and the metrics define the decision evidence. A result is only
as meaningful as the weakest unstated assumption in that chain.

### Systems and review view

The artifact is a small release review. Someone else should be able to rebuild
the fixture, find where data enters, see why the threshold was chosen, reproduce
the deliberate failure, and understand why the final boundary is limited.

## Hands-on

Create `a11_capstone.py` or a notebook outside this content directory. Work in
this order:

1. Copy the starter fixture and acceptance checks below without changing the
   seed or column meanings.
2. Write the problem brief, non-goals, data contract, and split manifest before
   fitting a model.
3. Implement the majority baseline, then logistic regression from primitives.
   Add the tiny network only if the nonlinearity hypothesis is worth the scope.
4. Derive the loss and gradient in the report, then run a central-difference
   gradient check at a nonzero parameter vector.
5. Compare at least two optimisers—plain batch GD and momentum or Adam—using the
   same initial weights, data, epochs, and stopping rule. Record choices before
   looking at the test set.
6. Choose a threshold on validation data using an explicit cost or review
   capacity. Freeze it before final test evaluation.
7. Report test metrics, bootstrap intervals, calibration, and at least two error
   slices: `segment` and feature-defined near-boundary/distance slices.
8. Run one intentional failure, capture symptom → cause → test → recovery, reset
   from a fresh process, and write the decision memo.

### Starter fixture and contract checks

This block generates data; it does not claim what the model will achieve. Keep
the generated arrays and split indices as part of your reproducibility manifest.

```python
import numpy as np

SEED = 20260830
rng = np.random.default_rng(SEED)
n = 240

row_id = np.arange(n, dtype=int)
segment = (row_id % 2).astype(int)             # evaluation-only slice
x1 = rng.normal(0.0, 1.0, size=n)
x2 = rng.normal(0.0, 1.0, size=n)
latent = 1.1 * x1 - 0.8 * x2 + 0.5 * segment + rng.normal(0.0, 0.6, size=n)
probability = 1.0 / (1.0 + np.exp(-latent))
y = rng.binomial(1, probability).astype(int)

permutation = rng.permutation(n)
train_idx = permutation[:144]
valid_idx = permutation[144:192]
test_idx = permutation[192:]

X_raw = np.column_stack([x1, x2])
X_train_raw = X_raw[train_idx]
train_mean = X_train_raw.mean(axis=0)
train_scale = X_train_raw.std(axis=0)
if np.any(train_scale == 0):
    raise ValueError("a zero-variance training feature needs an explicit policy")
X = (X_raw - train_mean) / train_scale

def require(condition, message):
    if not condition:
        raise AssertionError(message)

require(np.array_equal(np.sort(np.concatenate([train_idx, valid_idx, test_idx])), row_id),
        "split does not cover every row exactly once")
require(len(set(train_idx) & set(valid_idx)) == 0, "train/validation overlap")
require(len(set(train_idx) & set(test_idx)) == 0, "train/test overlap")
require(len(set(valid_idx) & set(test_idx)) == 0, "validation/test overlap")
require(np.unique(row_id).size == n, "row IDs are not unique")
require(np.isin(y, [0, 1]).all(), "labels are not binary")
require(np.isfinite(X).all(), "standardised features are not finite")
require(np.allclose(X[train_idx].mean(axis=0), 0.0, atol=1e-12),
        "scaler was not fit on the training rows")
require(np.allclose(X[train_idx].std(axis=0), 1.0, atol=1e-12),
        "training scale is not reproducible")
print("A11 fixture checks: PASS")
```

If a check fails because a deliberate failure was introduced, keep that output in
the failure report. Do not weaken the assertion to make the run green.

### Stable logistic primitives

Use this as the baseline implementation. Add assertions for dimensions and
finite values; do not silently clip a probability without recording the policy.

```python
def sigmoid(z):
    z = np.asarray(z, dtype=float)
    out = np.empty_like(z)
    positive = z >= 0
    out[positive] = 1.0 / (1.0 + np.exp(-z[positive]))
    exp_z = np.exp(z[~positive])
    out[~positive] = exp_z / (1.0 + exp_z)
    return out


def loss_and_grad(weights, features, labels):
    features = np.asarray(features, dtype=float)
    labels = np.asarray(labels, dtype=float)
    if features.ndim != 2 or labels.ndim != 1:
        raise ValueError("expected a feature matrix and one label per row")
    if features.shape[0] != labels.shape[0]:
        raise ValueError("feature rows and labels must align")
    design = np.column_stack([np.ones(features.shape[0]), features])
    logits = design @ weights
    loss = np.mean(np.logaddexp(0.0, logits) - labels * logits)
    probabilities = sigmoid(logits)
    gradient = design.T @ (probabilities - labels) / labels.size
    if not np.isfinite(loss) or not np.isfinite(gradient).all():
        raise FloatingPointError("non-finite loss or gradient")
    return loss, gradient, probabilities


def finite_difference_gradient(weights, features, labels, epsilon=1e-5):
    estimate = np.zeros_like(weights, dtype=float)
    for index in range(weights.size):
        plus = weights.copy()
        minus = weights.copy()
        plus[index] += epsilon
        minus[index] -= epsilon
        loss_plus = loss_and_grad(plus, features, labels)[0]
        loss_minus = loss_and_grad(minus, features, labels)[0]
        estimate[index] = (loss_plus - loss_minus) / (2.0 * epsilon)
    return estimate


X_train = X[train_idx]
y_train = y[train_idx]
weights = np.array([0.07, -0.11, 0.13], dtype=float)
analytic = loss_and_grad(weights, X_train, y_train)[1]
numeric = finite_difference_gradient(weights, X_train, y_train)
require(np.allclose(analytic, numeric, rtol=1e-4, atol=1e-6),
        "analytic and finite-difference gradients disagree")
print("A11 gradient check: PASS")
```

Implement `fit_logistic` around `loss_and_grad` for `gd` and one of `momentum`
or `adam`. Keep the initial `weights`, learning rate, epoch count, and data order
identical for the comparison. Save a history table with optimiser name, epoch,
training loss, validation loss, gradient norm, and whether every value is finite.
Do not claim which optimiser wins until your run and decision rule say so.

## Evaluation, uncertainty, and slices

Report a baseline and every chosen model on the frozen test split. At minimum,
include:

| Quantity | Question it answers |
|---|---|
| accuracy and balanced accuracy | how often and how symmetrically do actions match labels? |
| confusion matrix at the frozen threshold | what kinds of decisions occur? |
| mean BCE/log-loss | how good are the probability claims? |
| Brier score | how close are probabilities to binary outcomes? |
| calibration table/ECE | does confidence track observed correctness under this binning? |
| positive/action rate | does the threshold fit the review capacity? |

Use a fixed, documented calibration-bin rule. For uncertainty, bootstrap test rows
with replacement using a new documented seed, recomputing the metric per resample;
report percentile intervals and the number of resamples. Do not bootstrap training
and test together or treat row-wise bootstrap as a guarantee under dependence.

Compute the same report for at least these slices:

1. `segment == 0` versus `segment == 1`; and
2. `near_boundary = abs(x1) + abs(x2) < 1.0` versus its complement, defined from
   features only and before inspecting errors.

For each slice, include sample size, positive rate, action rate, log-loss,
balanced accuracy, and a note when the slice is too small for a stable interval.
The slice table is evidence about this fixture, not a fairness certification.

## Failure states, tests, and recovery

Run one failure at a time from a clean process. Keep the wrong output in the
report before applying the repair.

| Failure | Symptom | Test | Recovery |
|---|---|---|---|
| Leaked `segment` or `y` column | implausibly improved test evidence; model input manifest changes | assert feature names are exactly `x1,x2`; compare train/test availability | remove the column, regenerate the manifest, and rerun from the frozen split |
| Full-data scaling | validation/test statistics influence preprocessing | recompute scaler from train rows and compare saved means/scales | fit preprocessing on train only; freeze it before validation/test |
| Split overlap | repeated row IDs or optimistic estimates | assert pairwise ID intersections are empty and coverage is exactly `n` | regenerate one fixed permutation and preserve its manifest |
| Unstable sigmoid/loss | overflow, NaN, or infinite history at large logits | test logits such as `[-1000,0,1000]` and require finite stable loss | use stable sigmoid/logaddexp, then investigate scale and learning rate |
| Optimiser divergence | loss or gradient norm becomes non-finite or grows without bound | assert finiteness each epoch and compare a smaller learning rate on validation only | recover from clean weights, document the failed setting, and retune within the predeclared budget |
| Test-set threshold tuning | threshold chosen after seeing final test errors | keep threshold-selection rows and timestamps in the manifest | choose once on validation, freeze, and rerun test evaluation |
| Hidden slice failure | aggregate metric passes while one segment or boundary slice fails | require minimum slice rows and emit a row for every declared slice | report the limitation, abstain, collect data, or narrow the rollout |
| Incorrect bootstrap unit | intervals look precise despite grouped/dependent rows | inspect whether rows are independent; compare row and group resampling when needed | use a sampling unit justified by data collection, or mark uncertainty unresolved |

### Combined reset path

Save the clean fixture and split manifest. Restart the Python process, regenerate
the arrays, reproduce exactly one named failure, capture its symptom and test,
restore the clean code, rerun fixture and gradient checks, then rerun the full
training/evaluation workflow. A reset is complete only when the clean checks pass
and the failure remains represented in the report rather than deleted.

**Failure state:** the deliberately broken run must preserve the wrong output or
diagnostic—for example, a leaked feature manifest, a non-finite loss, an overlap
assertion, or a threshold chosen after test inspection.

**Test:** the named guard must fail for that reason, and the report must include
the command/output or a compact reproducible excerpt. A red test with no diagnosis
is not acceptance evidence.

**Reset:** restart from the clean fixture and frozen split, restore one repair,
rerun all checks, and confirm that the valid path passes without deleting the
failure evidence.

## Deliverables

Submit one notebook or folder containing:

1. **Problem brief:** the decision, users/owner, prediction time, non-goals,
   action threshold, review capacity, and harm of false positives/negatives.
2. **Data contract and manifest:** field meanings, availability assumptions,
   seed, split IDs, train-only preprocessing, versions, and label balance by split.
3. **Baseline and model:** majority or explicit rule baseline; logistic or the
   justified tiny network; parameter shapes; probability/loss derivation; and
   analytic-versus-finite-difference gradient evidence.
4. **Optimisation comparison:** at least two optimisers under the same protocol,
   loss/gradient histories, selected configuration, and a reason for the choice.
5. **Evaluation report:** frozen-threshold metrics, calibration, Brier/log-loss,
   bootstrap intervals, two declared slices, plots/tables with labelled axes,
   and a note on small-slice uncertainty.
6. **Failure dossier:** one or more broken fixtures with symptom → mechanism →
   test → repair, plus the clean reset output.
7. **Decision memo:** 150–300 words stating ship, limited ship, abstain, or do
   not ship; the evidence for that boundary; and the next measurement required.
8. **Reproducibility manifest:** command, seed, environment versions, file hash
   or commit identifier, and the exact acceptance-test output from a fresh run.

## Checkpoint

- [ ] The problem, prediction-time information, action, non-goals, and threshold are explicit.
- [ ] The data contract names every field, shape, unit/meaning, allowed use, and split rule.
- [ ] The baseline is computed from training data and the chosen model is implemented from primitives.
- [ ] The probability model and loss are justified; the analytic gradient passes a finite-difference check.
- [ ] At least two optimisers use the same initial conditions and their comparison is reproducible.
- [ ] The test split is frozen before final evaluation; metrics include probability quality and action quality.
- [ ] Bootstrap intervals, calibration, `segment` slices, and near-boundary slices are reported with sample sizes.
- [ ] At least one failure is reproduced, tested, repaired, and reset from a clean process.
- [ ] The decision memo names a limitation and a concrete next measurement; it does not overclaim from synthetic data.

The capstone is incomplete if the final metric improves but the split, objective,
threshold, uncertainty, or failure boundary cannot be explained.

## Scoring rubric

Score out of 100 using the A11 course weights:

| Criterion | Weight | Full-credit evidence |
|---|---:|---|
| Mathematical model | 25 | Correct data notation, probability/loss derivation, dimensions, gradient, assumptions, and threshold objective. |
| Computation | 20 | Reproducible fixture, baseline, primitive model, stable numerics, two optimiser runs, and passing checks. |
| Interpretation | 20 | Metrics are connected to the stated decision, review capacity, probability meaning, and slice outcomes. |
| Diagnostics | 20 | Deliberate failure, finite-difference or equivalent check, split/scaling guards, bootstrap caveat, and clean recovery. |
| Communication | 15 | Readable manifest, labelled tables/plots, decision memo, explicit limitations, and enough detail for reruns. |

Passing also requires nonzero evidence in Mathematical model, Computation, and
Diagnostics. A higher score without a defensible data boundary is not a passing
capstone.

## What this does not solve

This capstone cannot establish real-world accuracy, causal effects, fairness,
safety, privacy, or long-term calibration from a synthetic fixture. Bootstrap
intervals describe the chosen sampling procedure, not every deployment source of
uncertainty. A clean gradient check does not validate labels; a stable optimiser
does not fix a proxy objective; and good slices on two variables do not cover
unmeasured subgroups or future distribution shift. Treat the result as a bounded
engineering decision and name the evidence needed before any real authority is
granted.

## Continue, go deeper, apply it

- Continue: Optimisation diagnostics and second-order perspective
- Go deeper: Gradient checking and debugging
- Apply it: ML foundations capstone
