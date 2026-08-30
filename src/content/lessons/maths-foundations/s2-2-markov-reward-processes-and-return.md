---
title: "Markov reward processes and return"
track: "maths-foundations"
status: live
summary: "A Markov reward process (MRP) is a Markov state-transition model with rewards but no choices."
duration: "4 min read"
---

## The short answer

A Markov reward process (MRP) is a Markov state-transition model with rewards but no choices. Its return is the discounted sum `G_t=R_{t+1}+γR_{t+2}+γ²R_{t+3}+…`. Discounting makes far outcomes count less and can make continuing sums finite. Before comparing values, specify reward timing, terminal behavior, horizon, and whether the objective is discounted return or average reward.

## Why this matters

An MRP isolates evaluation from control: what value does a fixed process produce?
That question appears in a policy evaluator, a user journey, and an RL baseline.
Many bugs are not “RL bugs” but inconsistent reward signs, an extra discount, a
terminal reward that is dropped, or an episodic task treated as continuing.

## How it works

For discount `0≤γ<1`,

```text
G_t = Σ_{k=0}∞ γ^k R_{t+k+1},     v(s)=E[G_t | S_t=s].
```

If an episode ends after `T`, terms after `T` are zero under the usual terminal
convention. For an infinite constant reward `c`, `G=c/(1−γ)`; this is a
convergent geometric series. An undiscounted episodic return (`γ=1`) can still be
finite, but an undiscounted continuing positive reward is not.

## Worked examples and variations

### Example A: deterministic episodic return

**Input:** rewards `[2,0,5]`, `γ=0.9`. **Mechanism:**
`G=2+0.9·0+0.9²·5`. **Output:** `6.05`. **Inspect:** reward at step three is
discounted twice. **Decision:** state whether rewards are recorded on entering or
leaving a state.

### Example B: stochastic one-step outcome

**Input:** from `s`, reward is 10 with probability .3 and 0 otherwise, then ends.
**Mechanism:** expectation is `.3·10=3`; discounting does not change a reward at
the first transition. **Output:** `v(s)=3`. **Inspect:** compare sample mean with
the analytic expectation. **Decision:** separate expected value from one rollout.

### Boundary case: `γ=0`

**Input:** any multi-step episode with `γ=0`. **Mechanism:** only `R_{t+1}` counts.
**Output:** myopic value. **Inspect:** changing all later rewards should not
change the value. **Decision:** use only when immediate reward is the intended
objective, not as a numerical shortcut.

### Counterexample: continuing task with `γ=1`

**Input:** reward 1 forever, no terminal state, `γ=1`. **Mechanism:** partial sums
grow without bound. **Output:** no finite discounted return. **Inspect:** plot
partial sums as horizon increases. **Decision:** use discounting, average reward,
or a finite horizon and document the objective.

## An illustrative story

An illustrative support-routing policy receives a small reward for every solved
ticket and a larger reward for preventing future repeats. With `γ` too low, the
evaluator prefers fast shallow fixes; with `γ` too high, noisy distant outcomes
dominate. The discount is a product objective choice, not just a convergence knob.

## Two ways to see it

### Return view

Unroll the reward sequence and mark one factor of `γ` for every step into the
future. This catches off-by-one reward timing.

### State-value view

`v(s)` compresses many possible future sequences into one conditional expectation.
It describes average return, not a guarantee for every rollout or a measure of
risk unless the distribution is inspected too.

## Hands-on

Implement `discounted_return(rewards, gamma, terminal=True)` and a simulator for
a one-state continuing MRP. Compare analytic and Monte Carlo estimates for
deterministic and stochastic rewards; plot partial sums for several `γ` values.

**Failure state:** apply `γ` to the first reward or continue adding rewards after
a terminal marker. **Test:** the `[2,0,5]` fixture must equal `6.05`, and a
terminal reward must not change when padding zeros are appended. **Reset:** fix
the exponent and terminal mask, then rerun finite and continuing cases.

## Checkpoint

- [ ] Compute a three-reward return for a stated discount.
- [ ] Explain why `γ=0` and `γ=1` have different boundary behavior.
- [ ] Distinguish an expected return from one sampled trajectory.
- [ ] Name the metadata needed to reproduce a return calculation.

## What this does not solve

An expected discounted return hides variance, tail risk, and fairness across
trajectories. It also does not choose actions; that requires an MDP and a policy.

## Continue, go deeper, apply it

- Continue: Markov decision processes
- Go deeper: Bellman expectation equations
- Apply it: Policies, exploration, and occupancy
