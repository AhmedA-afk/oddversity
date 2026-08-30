---
title: "A10 · Optimiser and stability clinic"
track: "maths-foundations"
status: live
summary: "This lab compares batch gradient descent, deterministic SGD, momentum, Adam, and a curvature-aware Newton update on the same tiny least-squares."
duration: "11 min read"
---

## The short answer

This lab compares batch gradient descent, deterministic SGD, momentum, Adam, and a curvature-aware Newton update on the same tiny least-squares model. You will make the raw feature scale fail, show an unstable learning rate, repair the conditioning with unit-RMS scaling, and test log-sum-exp as a separate stable numerical identity. Every run starts from the same parameters, seed, data exposure, and declared state reset.

## Why this matters

An optimiser can be blamed for a failure caused by feature units, curvature, overflow, stale state, or an overly large step. A controlled clinic separates those causes. In AI training, the useful output is not “Adam won”; it is a trace showing which method, scale, step size, and numerical contract produced which behaviour.

## Lab contract

Submit one reproducible notebook or Python script containing:

1. the problem statement in your own words;
2. assumptions, shapes, objective, optimiser recurrences, seed, and NumPy version;
3. loss, gradient, Hessian/conditioning derivations and annotated code;
4. a labelled comparison of batch GD, SGD, momentum, Adam, and Newton;
5. at least four scenarios, including bad scale, unstable learning rate, and a stable repair;
6. raw loss/gradient/parameter diagnostics, deliberate failure output, and reset evidence; and
7. a 150–300 word decision memo explaining the method/repair you would use and its limitation.

Use the same objective and initial parameter vector for every optimiser. Compare full-data methods and SGD by **data exposure**: one outer step is one epoch, and SGD visits every example once in a fixed seeded permutation. Do not carry optimiser state from one comparison into another.

## How it works

The model is a two-parameter linear predictor `ŷ=Xw` with mean squared objective

```text
J(w) = 1/(2N) ||Xw−y||²
g(w) = ∇J(w) = Xᵀ(Xw−y)/N
H    = ∇²J(w) = XᵀX/N.
```

Use this zero-centred tiny fixture, which makes scale the intentional issue rather than an intercept omission:

```python
import numpy as np

X_raw = np.array([
    [-1.,     0.],
    [ 1.,     0.],
    [ 0., -1000.],
    [ 0.,  1000.],
], dtype=np.float64)                         # (N=4, D=2)
y = np.array([-1., 1., -1., 1.], dtype=np.float64)  # (4,)
w0 = np.zeros(2, dtype=np.float64)

scale = X_raw.std(axis=0)                    # [1/sqrt(2), 1000/sqrt(2)]
X_scaled = X_raw / scale                     # unit-RMS / unit-SD here
```

The raw Hessian is `diag(0.5, 500000)`, with condition number `10⁶`. The scaled Hessian is the identity. The raw optimum is `w=[1,0.001]`; the scaled-coordinate optimum is `[1/√2,1/√2]`. Convert with `w_raw=w_scaled/scale` when comparing parameters across the two coordinate systems; predictions are the comparable object.

## Optimiser rules

Implement these independently, with zeroed state at the start of each run:

```text
batch GD:       w ← w − η g(w)
SGD:            w ← w − η xᵢ(xᵢᵀw−yᵢ), once per example in a seeded order
momentum:       v ← βv + g(w);       w ← w − ηv
Adam:           m ← β₁m+(1−β₁)g; q ← β₂q+(1−β₂)g²
                m̂=m/(1−β₁ᵗ); q̂=q/(1−β₂ᵗ); w ← w−ηm̂/(√q̂+ε)
Newton:         solve Hδ=−g;       w ← w+ηδ
```

For Newton, use `np.linalg.solve`, not an explicit inverse. It is the curvature-aware reference required by the A10 practice ladder. For the main comparison use `β=.9`, Adam `β₁=.9`, `β₂=.999`, `ε=1e−8`, and the per-scenario learning rates below.

## Worked examples and variations

### Scenario A: raw feature scale and conditioning

**Input:** `X_raw`, `w0`, and `J`. **Mechanism:** inspect `H`, its eigenvalues, and condition number before selecting a step. **Output:** curvature differs by a factor of one million. **Inspect:** the high-scale feature produces a large gradient component and controls a fixed-step stability limit. **Decision:** treat scale/conditioning as a data and parameterisation issue before swapping optimisers.

### Scenario B: controlled optimiser comparison after repair

**Input:** `X_scaled`, `w0`, 100 epochs, and the same data exposure. **Mechanism:** run batch GD with `η=.8`, SGD with `η=.8`, momentum with `η=.4`, Adam with `η=.1`, and Newton with `η=1`. **Output:** all methods remain finite and reach loss below `1e−3`; Newton reaches the exact quadratic solution in one full-data step. **Inspect:** compare loss, gradient norm, update norm, and final predictions, not only wall-clock-free epoch count. **Decision:** choose a method from the trace and operational constraints.

### Scenario C: unstable learning rate

**Input:** `X_scaled`, batch GD, `η=2.1`. **Mechanism:** the scaled Hessian's largest eigenvalue is 1, while the quadratic stability boundary is `η=2`. **Output:** loss grows from `0.5` to about `22.63` after 20 steps and alternates in sign. **Inspect:** raw loss and parameter norm, without smoothing away the oscillation. **Decision:** lower the step or add a predeclared line-search/schedule; do not call the run “random noise.”

### Scenario D: raw objective with a superficially helpful optimiser

**Input:** `X_raw`, `η=.1`, and each first-order method. **Mechanism:** GD, SGD, and momentum are dominated by the `500000` curvature; Adam rescales recent gradients but is still solving the unscaled parameterisation. **Output:** GD/SGD/momentum diverge or overflow; Adam may remain finite but is not a scale-validation pass. **Inspect:** raw gradient, parameter, and update norms alongside loss. **Decision:** repair representation first, then compare optimisers on the repaired objective.

### Scenario E: stable log-sum-exp repair

**Input:** logits `[1000,999,998]`. **Mechanism:** naive `log(sum(exp(z)))` overflows; subtracting `max(z)` preserves the value while keeping exponentials bounded. **Output:** stable result is finite and shift-invariant. **Inspect:** dtype, finite flags, and logits—not just clipped probabilities. **Decision:** use stable algebra or a fused logits-based loss wherever exponentials and logs meet.

## Runnable fixed-seed harness

The following is the minimum executable core. Add plots or tables, but keep these assertions visible:

```python
SEED = 20260830

def objective(w, X):
    residual = X @ w - y
    return 0.5 * np.mean(residual * residual)

def gradient(w, X):
    return X.T @ (X @ w - y) / X.shape[0]

def run(kind, X, eta, steps=100, seed=SEED, beta=.9):
    rng = np.random.default_rng(seed)
    w = w0.copy()
    v = np.zeros_like(w)
    m = np.zeros_like(w)
    q = np.zeros_like(w)
    t = 0
    H = X.T @ X / X.shape[0]
    history = []

    for _ in range(steps):
        if kind == "sgd":
            for i in rng.permutation(X.shape[0]):
                gi = X[i] * (X[i] @ w - y[i])
                w -= eta * gi
        elif kind == "gd":
            w -= eta * gradient(w, X)
        elif kind == "momentum":
            v = beta * v + gradient(w, X)
            w -= eta * v
        elif kind == "adam":
            t += 1
            g = gradient(w, X)
            m = .9 * m + .1 * g
            q = .999 * q + .001 * (g * g)
            m_hat = m / (1.0 - .9 ** t)
            q_hat = q / (1.0 - .999 ** t)
            w -= eta * m_hat / (np.sqrt(q_hat) + 1e-8)
        elif kind == "newton":
            w -= eta * np.linalg.solve(H, gradient(w, X))
        else:
            raise ValueError(f"unknown optimiser: {kind}")
        history.append(objective(w, X))
    return np.asarray(history), w

H_raw = X_raw.T @ X_raw / X_raw.shape[0]
H_scaled = X_scaled.T @ X_scaled / X_scaled.shape[0]
assert np.linalg.cond(H_raw) > 1e5
assert np.linalg.cond(H_scaled) < 1.1

settings = {
    "batch-gd": ("gd", .8),
    "sgd": ("sgd", .8),
    "momentum": ("momentum", .4),
    "adam": ("adam", .1),
    "newton": ("newton", 1.0),
}
scaled_runs = {}
for name, (kind, eta) in settings.items():
    history, w = run(kind, X_scaled, eta)
    scaled_runs[name] = (history, w)
    assert np.isfinite(history).all(), name
    assert history[-1] < 1e-3, (name, history[-1])

with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
    raw_runs = {}
    for name, kind in (("batch-gd", "gd"), ("sgd", "sgd"),
                       ("momentum", "momentum"), ("adam", "adam")):
        raw_runs[name] = run(kind, X_raw, .1, steps=20)
assert raw_runs["batch-gd"][0][-1] > 1e6
assert (not np.isfinite(raw_runs["sgd"][0]).all()
        or raw_runs["sgd"][0][-1] > 1e6)
assert raw_runs["momentum"][0][-1] > 1e6
assert raw_runs["adam"][0][-1] > 1.0

bad_lr, _ = run("gd", X_scaled, 2.1, steps=20)
assert bad_lr[-1] > 10.0 * bad_lr[0]

with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
    naive_lse = np.log(np.exp(np.array([1000., 999., 998.])).sum())
stable_logits = np.array([1000., 999., 998.])
shift = stable_logits.max()
stable_lse = shift + np.log(np.exp(stable_logits - shift).sum())
assert not np.isfinite(naive_lse)
assert np.isfinite(stable_lse)

# State reset/reproducibility check.
h1, w1 = run("sgd", X_scaled, .8)
h2, w2 = run("sgd", X_scaled, .8)
assert np.array_equal(h1, h2) and np.array_equal(w1, w2)
```

Record `np.__version__`, the condition numbers, each history's first/last loss and maximum gradient/update norm, the final prediction residual, and the exact seed. With the fixture and settings above, the scaled final losses are approximately: GD `0`, SGD `0`, momentum `1.37e−5`, Adam `5.62e−6`, and Newton `0`.

## Failure modes, tests, and reset

**Failure state:** raw high-scale features, an unstable step, naive log-sum-exp, or reused optimiser state must produce a labelled diagnostic before any repair is applied.

**Bad conditioning / feature scale:** run the raw fixture at `η=.1`. The raw GD and momentum traces grow to about `2.27e187` after 20 steps; SGD can become `inf`. **Test:** assert the raw condition number is large and classify non-finite or explosive loss as `scale-dominated`, not as an optimiser-quality ranking. **Repair:** use `X_scaled` and convert parameters back only when interpreting the original units.

**Unstable learning rate:** run scaled GD at `η=2.1`. **Test:** require a finite-value and loss-growth diagnostic; do not hide it with a smoothed plot. **Repair:** use `η=.8` or a tested schedule/line search.

**Bad numerical algebra:** evaluate naive log-sum-exp at large logits. **Test:** naive output must be non-finite while the max-shifted output is finite and invariant to adding a constant. **Repair:** retain logits and use the stable form or fused logits loss.

**State contamination:** start a second Adam or momentum run without clearing `m`, `q`, or `v`. **Test:** two identical seeded runs must be byte-for-byte equal; a deliberately carried state should fail the reset comparison. **Reset:** recreate `w`, all optimiser state, the RNG, objective, and history from the saved initial fixture before every comparison.

## Two ways to see it

### Builder view

An optimiser is a stateful numerical program. The experiment record must identify objective, coordinate scale, seed, data exposure, hyperparameters, state initialisation, finite-value policy, and rollback point.

### Systems or numerical view

An adaptive method can make a poorly scaled model look less broken without removing the underlying unit and conditioning problem. A finite loss can still be wrong if the objective, data mapping, or stable algebra is wrong.

## Hands-on

1. Reproduce the raw and scaled Hessians, eigenvalues, and condition numbers by hand and in NumPy.
2. Implement all five optimisers with one common objective and clean state.
3. Run the scaled comparison for 100 epochs and save labelled loss/gradient/update traces.
4. Run the raw high-step failure and the scaled unstable-step failure.
5. Implement and test stable log-sum-exp on ordinary, extreme, shifted, and non-finite logits.
6. Restore the known-good configuration and rerun from a clean process.
7. Write the 150–300 word decision memo, including what evidence would be needed before production use.

## Checkpoint

- [ ] Derive `J`, `g`, and `H` for the least-squares objective.
- [ ] Explain why the raw Hessian is ill-conditioned and why scaling changes the coordinate representation.
- [ ] Compare batch GD, SGD, momentum, Adam, and Newton under the same data-exposure budget.
- [ ] Diagnose an unstable step from raw loss and norms.
- [ ] Explain max-shifted log-sum-exp and its invariance.
- [ ] Demonstrate a clean state reset and attach the decision memo.

## Acceptance tests

- [ ] Fixed seed, NumPy version, fixture, shapes, and optimiser state rules are recorded.
- [ ] Raw condition number exceeds `1e5`; scaled condition number is below `1.1`.
- [ ] All five optimisers are implemented and compared on the same scaled objective.
- [ ] Scaled runs remain finite and finish below `1e−3` loss.
- [ ] Raw high-step and scaled unstable-step failures are caught with labelled diagnostics.
- [ ] Stable log-sum-exp is finite for extreme logits and passes shift invariance.
- [ ] A repeated seeded run is exactly reproducible after reset.
- [ ] The memo distinguishes optimisation, conditioning, numerical, and modelling limitations.

## Rubric

| Criterion | Weight | Full-credit evidence |
|---|---:|---|
| Mathematical model | 25% | correct objective, gradient, Hessian, optimiser recurrences, and scale interpretation |
| Computation | 20% | runnable fixed-seed NumPy implementations with clean state and assertions |
| Interpretation | 20% | optimiser and stability results connected to an AI training decision |
| Diagnostics | 20% | conditioning, learning-rate, overflow, and state-contamination failures diagnosed and repaired |
| Communication | 15% | labelled traces/tables, readable code, and 150–300 word decision memo |

## What this does not solve

This clinic does not establish that a lower training objective generalises, that a feature scaling choice is semantically appropriate, or that Adam is best for a real model. The quadratic fixture has no stochastic data drift, non-convex representation learning, calibration problem, or deployment constraint. Those require held-out evaluation, data/version monitoring, and a broader model-risk review.

## Continue, go deeper, apply it

- Continue: Learning-rate schedules, warm-up, and gradient clipping
- Go deeper: Optimisation diagnostics and second-order perspective
- Apply it: Regularisation geometry
