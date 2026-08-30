---
title: "Bellman optimality and value iteration"
track: "maths-foundations"
status: live
summary: "Bellman optimality replaces a fixed policy average with the best available action: V(s)=maxa Σ{s',r}p(s',r|s,a)r+γV(s')."
duration: "4 min read"
---

## The short answer

Bellman optimality replaces a fixed policy average with the best available action: `V*(s)=max_a Σ_{s',r}p(s',r|s,a)[r+γV*(s')]`. Value iteration repeatedly applies this operator, then extracts a greedy policy. Track residuals and terminal handling. Convergence of the table does not certify the reward design, state representation, or behavior outside the modeled environment.

## Why this matters

Value iteration is the smallest complete example of planning under delayed
reward. It shows how local one-step lookahead can discover a long route and why
discounting and termination change the chosen route. It is also a strong fixture
for later RL code: if a toy tabular solver is wrong, a neural agent will not make
the specification clearer.

## How it works

Starting from any bounded `V_0`, apply

```text
V_{k+1}(s)=max_a E[r+γV_k(S') | s,a].
```

The Bellman optimality operator is a `γ`-contraction when `0≤γ<1`, so values
converge to the unique fixed point in a finite discounted MDP. Once values are
stable, choose an action attaining the maximum. Ties are real policy choices;
make the tie-break deterministic if reproducibility matters.

## Worked examples and variations

### Example A: a delayed reward chain

**Input:** `A→B→goal`, each move costs 0, entering goal gives 10, `γ=.9`.
**Mechanism:** backups propagate the 10 backward one edge per iteration.
**Output:** `V*(B)=9`, `V*(A)=8.1`. **Inspect:** residual decreases as the wave
travels. **Decision:** delayed rewards require enough horizon/iterations.

### Example B: shortcut versus safe route

**Input:** risky action gives 8 now with .5 chance of −20; safe route gives 4
with certainty, `γ=.9`. **Mechanism:** compare expected discounted returns.
**Output:** the preferred action depends on the exact transition model and
objective. **Inspect:** vary risk and report expected value, not one rollout.
**Decision:** add a risk criterion if expectation alone is unacceptable.

### Boundary case: `γ=0`

**Input:** two actions with immediate rewards 1 and 2 but different future paths.
**Mechanism:** only immediate reward remains in the backup. **Output:** action 2
is selected. **Inspect:** future transition edits do nothing. **Decision:** verify
the myopic objective is intentional.

### Counterexample: terminal treated as ordinary self-loop

**Input:** goal reward 10, then code self-loops with reward 10. **Mechanism:**
the planner can collect 10 forever instead of ending. **Output:** inflated or
infinite values. **Inspect:** compare terminal mask and absorbing-zero state.
**Decision:** encode termination in both environment and backup.

## An illustrative story

An illustrative navigation benchmark reports a policy that “converged” after a
fixed number of iterations. A one-cell reward was eight steps away, but the
iteration budget was four, so the start state still looked worthless. Convergence
should be based on residual tolerance or a justified horizon, not a decorative
loop count.

## Two ways to see it

### Planning view

Each iteration spreads the value of future outcomes backward through the graph.
The max chooses a branch at each state.

### Audit view

The value table is an executable claim about rewards, transitions, discount, and
termination. Residuals, reachable-state coverage, and extracted trajectories are
the evidence.

## Hands-on

Implement tabular value iteration for a five-state environment. Store `V_k`, max
residual, greedy action, and one rollout after each run. Compare `γ=.5,.9,.99`
and two termination encodings.

**Failure state:** bootstrap from the terminal value as if it can earn future
reward, or stop after a fixed four iterations. **Test:** terminal value must stay
zero, residual must be below tolerance, and the chain start must select the path
to goal. **Reset:** restore the terminal mask and convergence criterion, then
rerun the discount comparison.

## Checkpoint

- [ ] Write the Bellman optimality backup and contrast `max` with a policy average.
- [ ] Explain why a delayed reward propagates backward over iterations.
- [ ] State why `γ<1` supports a contraction argument in a finite bounded setting.
- [ ] Diagnose a value-iteration result with a Bellman residual and rollout.

## What this does not solve

Value iteration assumes a known, manageable transition model and correct reward.
Function approximation, partial observability, nonstationarity, and safety
constraints require additional methods and evidence.

## Continue, go deeper, apply it

- Continue: Policies, exploration, and occupancy
- Go deeper: Temporal-difference learning
- Apply it: RL safety and offline-data warnings
