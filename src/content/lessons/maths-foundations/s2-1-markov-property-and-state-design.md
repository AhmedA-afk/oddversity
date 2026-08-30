---
title: "The Markov property and state design"
track: "maths-foundations"
status: live
summary: "A state is Markov when it contains enough information that the next state and reward do not depend on the earlier history once the current state."
duration: "4 min read"
---

## The short answer

A state is Markov when it contains enough information that the next state and reward do not depend on the earlier history once the current state and action are known. State design is therefore an information decision, not merely a variable-name decision. Test the proposed state against hidden history; if history still changes outcomes, augment the state or model partial observability.

## Why this matters

Value functions and Bellman updates assume a compact summary of the past. If a
robot sees only position but not velocity, or a service agent sees queue length
but not a hidden cooldown, the same apparent state can require different actions.
Learning then averages incompatible futures and can look unstable even when the
algorithm is implemented correctly.

## How it works

Let history be `H_t=(S_0,A_0,R_1,…,S_t)`. A Markov decision process requires

```text
P(S_{t+1}, R_{t+1} | H_t, A_t) = P(S_{t+1}, R_{t+1} | S_t, A_t).
```

The equality need not hold for the smallest raw observation `O_t`; it must hold
for the state supplied to the dynamics. One can always make history itself the
state, but that is expensive. A useful engineered state is a sufficient statistic
that preserves decision-relevant information while discarding irrelevant past.

## Worked examples and variations

### Example A: grid position with static walls

**Input:** a gridworld state contains the agent cell; walls never move. **Mechanism:**
given cell and action, the transition distribution and reward are fixed regardless
of the route used to arrive. **Output:** position is Markov. **Inspect:** compare
two histories reaching the same cell. **Decision:** use the cell as state.

### Example B: position without velocity

**Input:** a moving cart is represented only by position. **Mechanism:** two carts
at the same position but with different velocities have different next positions.
**Output:** position is not Markov. **Inspect:** condition on position and action,
then compare next-state frequencies by velocity history. **Decision:** include
velocity or a belief over velocity.

### Boundary case: a deterministic process

**Input:** `S_{t+1}=f(S_t,A_t)` with no randomness. **Mechanism:** the conditional
distribution is a point mass; history adds no transition information if state is
complete. **Output:** deterministic dynamics are still Markov. **Inspect:** do not
confuse randomness with the Markov requirement. **Decision:** test sufficiency,
not whether the world is stochastic.

### Counterexample: hidden cooldown

**Input:** an API action “send” succeeds only if a hidden rate-limit timer is zero;
the visible state is account ID alone. **Mechanism:** identical visible states
have different success probabilities depending on recent sends. **Output:** the
visible process is history-dependent. **Inspect:** add last-send time and compare.
**Decision:** augment the state or treat it as a partially observable problem.

## An illustrative story

An illustrative game bot may repeatedly choose “move left” from the same screen
because the screen omits whether an animation is still in progress. The policy
is not necessarily foolish; it received a state that conflated two futures. A
one-step history or an explicit animation flag can remove the ambiguity.

## Two ways to see it

### Builder view

Write a state schema and a transition table. For each pair of histories that maps
to the same state, ask whether the distribution of next outcomes is the same.
That is a testable data contract.

### Learning view

If state is insufficient, a value function `V(s)` is forced to represent multiple
conditional returns with one number. More samples reduce estimation noise but do
not remove this representation bias.

## Hands-on

Create two toy fixtures: a cart with `(position, velocity)` and a rate-limited
sender with `(last_send_age)`. Log histories, compress them to candidate states,
and estimate next-outcome frequencies conditioned on each candidate.

**Failure state:** drop velocity and cooldown age from the state. **Test:** for
one visible state, assert that two history groups have equal transition/reward
distributions within a chosen tolerance; the incomplete state must fail. **Reset:**
restore the omitted variable, rerun the conditional comparison, and record the
remaining sampling uncertainty.

## Checkpoint

- [ ] State the Markov equality using history, state, action, next state, and reward.
- [ ] Give one observation that is not a sufficient state and name the missing information.
- [ ] Explain why “deterministic” and “Markov” are different properties.
- [ ] Describe the trade-off between full history and a compact sufficient statistic.

## What this does not solve

A Markov state does not make a problem easy, observable to a learner, or safe to
control. Approximate states can be useful, and belief states can restore a Markov
description under assumptions, but both add estimation and model risk.

## Continue, go deeper, apply it

- Continue: Markov reward processes and return
- Go deeper: Hidden Markov models
- Apply it: Agents: state, memory, and recovery
