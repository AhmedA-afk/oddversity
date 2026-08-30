---
title: "Temporal-difference learning and the bias–variance trade-off"
track: "maths-foundations"
status: live
summary: "Monte Carlo learning waits for a complete return; temporal-difference (TD) learning updates from a one-step bootstrap target R{t+1}+γV(S{t+1})."
duration: "3 min read"
---

## The short answer

Monte Carlo learning waits for a complete return; temporal-difference (TD) learning updates from a one-step bootstrap target `R_{t+1}+γV(S_{t+1})`. MC targets are often unbiased for the sampled return but noisy; TD targets have bootstrap bias while reducing variance and working before episode end. Compare them under the same environment and report both estimate error and update stability.

## Why this matters

TD learning is the bridge from Bellman equations to practical RL. It explains why
an agent can learn from continuing streams and why a wrong value estimate can
propagate. The bias–variance choice is not abstract: short horizons, noisy
rewards, terminal handling, and function approximation change the comparison.

## How it works

For a transition `(S_t,A_t,R_{t+1},S_{t+1})`, TD(0) uses

```text
δ_t = R_{t+1} + γV(S_{t+1}) − V(S_t)
V(S_t) ← V(S_t) + αδ_t.
```

MC uses the sampled `G_t` and update `V←V+α(G_t−V)`. If `V` were already the
true value, the expected TD target equals `V(S_t)` by Bellman consistency. Early
in training, the bootstrap estimate is wrong; that is the source of bias.

## Worked examples and variations

### Example A: one TD update

**Input:** `V(s)=2`, `V(s')=5`, reward 1, `γ=.9`, `α=.1`. **Mechanism:** target
is `5.5`, error `δ=3.5`. **Output:** new `V(s)=2.35`. **Inspect:** update moves
toward the one-step target. **Decision:** preserve reward and discount timing.

### Example B: terminal transition

**Input:** `V(s)=2`, reward 10, next state terminal, `γ=.9`. **Mechanism:**
terminal value is zero, target is 10. **Output:** error 8. **Inspect:** do not
bootstrap from a stale terminal table entry. **Decision:** mask terminal targets.

### Boundary case: `α=0` or `α=1`

**Input:** any transition. **Mechanism:** alpha zero never learns; alpha one
replaces the old estimate with the current target. **Output:** no adaptation or
high target noise. **Inspect:** track step-to-step variance. **Decision:** choose
alpha with environment noise and nonstationarity in mind.

### Counterexample: bootstrapping from a bad state value

**Input:** downstream `V(s')=100` though true future return is 0. **Mechanism:**
TD propagates the error backward through `r+γV(s')`. **Output:** inflated values
before experience corrects them. **Inspect:** compare against MC returns on a fixed
episode set. **Decision:** add diagnostics or use multi-step targets carefully.

## An illustrative story

An illustrative streaming monitor cannot wait until a never-ending episode ends.
TD gives it feedback after each event, but a stale downstream value can make early
alerts too aggressive. Periodic held-out rollouts and target residuals make the
bootstrap risk visible.

## Two ways to see it

### Estimator view

MC averages realised futures; TD solves local consistency equations by passing
information one transition at a time.

### Engineering view

TD is a low-latency update with an internal dependency. When the dependency is
wrong, errors can spread faster than fresh evidence arrives.

## Hands-on

Create a fixed three-step environment with known values. Run MC and TD(0) with
the same learning rate across many seeds. Plot estimate error over updates and
the variance of targets; include a terminal transition.

**Failure state:** use `R+γV(S_t)` instead of `R+γV(S_{t+1})`, or bootstrap after
termination. **Test:** the hand-computable update must equal `2.35`, and terminal
targets must equal their immediate reward. **Reset:** restore successor indexing
and terminal masking, then rerun the seed comparison.

## Checkpoint

- [ ] Compute one TD error and updated value by hand.
- [ ] Contrast a complete MC target with a one-step TD target.
- [ ] Explain where TD bias comes from and what variance it can reduce.
- [ ] State why terminal transitions must be masked.

## What this does not solve

TD does not remove reward misspecification, partial observability, off-policy
instability, or function-approximation error. Better-looking learning curves do
not prove the policy is safe or aligned.

## Continue, go deeper, apply it

- Continue: RL safety and offline-data warnings
- Go deeper: Bellman expectation equations
- Apply it: Optimisation, loss, and gradient descent
