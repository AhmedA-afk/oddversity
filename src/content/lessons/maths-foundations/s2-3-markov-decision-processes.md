---
title: "Markov decision processes"
track: "maths-foundations"
status: live
summary: "An MDP formalises sequential choice as states S, actions A, transition probabilities P(s'|s,a), rewards R, a discount γ, and terminal rules."
duration: "4 min read"
---

## The short answer

An MDP formalises sequential choice as states `S`, actions `A`, transition probabilities `P(s'|s,a)`, rewards `R`, a discount `γ`, and terminal rules. A policy `π(a|s)` turns it into an MRP. Define the state, legal actions, reward timing, and termination before choosing an algorithm; an underspecified MDP can optimise the wrong problem very efficiently.

## Why this matters

The MDP is the contract between environment and agent. It makes clear what the
agent can know, do, and optimise. In a product workflow, “send a reminder” may
change a user state and have delayed costs; omitting those transitions turns a
short-term click maximiser into a policy that violates the actual objective.

## How it works

For finite spaces, an MDP can be written `(S,A,P,R,γ)`, with

```text
P(s'|s,a) ≥ 0,       Σ_s' P(s'|s,a)=1,
R(s,a,s') = expected immediate reward.
```

Under a policy, the next action is drawn from `π(a|s)`. A terminal state needs an
explicit convention: either no outgoing action and value zero, or an absorbing
state whose future reward is zero. The two are equivalent only if the code treats
them consistently.

## Worked examples and variations

### Example A: two-cell delivery

**Input:** states `{home, office}`, actions `{walk, wait}`, walking reaches the
office with reward 5 and waiting stays with reward −1. **Mechanism:** list each
legal transition and reward. **Output:** a complete two-state MDP. **Inspect:**
every state-action row sums to one. **Decision:** policy can now be evaluated or
optimised.

### Example B: inventory control

**Input:** state `(stock, demand forecast)`, action `order quantity`, reward is
margin minus holding and stockout cost. **Mechanism:** demand transitions stock
to the next state. **Output:** a finite-horizon control problem. **Inspect:**
whether forecast is known at decision time. **Decision:** include lead time and
backorders if they change future outcomes.

### Boundary case: illegal action

**Input:** “withdraw 10” when balance is 4. **Mechanism:** either action is not
in `A(s)`, or it is legal with a defined rejection transition and cost. **Output:**
different MDPs. **Inspect:** test both semantics explicitly. **Decision:** never
let an environment silently invent a transition for an invalid action.

### Counterexample: reward only for clicks

**Input:** recommender gets reward for immediate click but no penalty for harmful
repetition or later unsubscribe. **Mechanism:** the specified reward makes click
maximisation optimal. **Output:** a policy that may degrade long-term utility.
**Inspect:** add delayed outcomes and user constraints to the model. **Decision:**
review the reward as a proxy, not as the user’s full value.

## An illustrative story

An illustrative warehouse robot is rewarded for reaching a shelf and not for
near-misses. It learns a fast route through a narrow human walkway. Nothing is
wrong with the Bellman update; safety was absent from the MDP. Add constraints,
penalties, or a safety layer before deploying a learned policy.

## Two ways to see it

### Mathematical view

The MDP is a stochastic state-transition graph with labelled actions and rewards.
Policies induce distributions over paths.

### Product view

It is a decision contract: observation, authority, feedback, and stop conditions.
Ambiguous or unlogged transitions are specification gaps, not mere data noise.

## Hands-on

Specify a five-state toy environment in a table or JSON: legal actions, next
state probabilities, reward, and terminal flag. Write validators for probability
sums, legal actions, reachable terminal behavior, and reward timing.

**Failure state:** add an action with probabilities summing to 1.2 and a terminal
state that still emits a positive reward. **Test:** the environment validator must
name both violations. **Reset:** correct the row and terminal convention, then
simulate at least three trajectories and inspect them by hand.

## Checkpoint

- [ ] Write an MDP tuple and define each component in the toy environment.
- [ ] Verify that every transition distribution sums to one.
- [ ] Explain two legitimate ways to represent a terminal state.
- [ ] Identify one proxy-reward failure and the missing downstream signal.

## What this does not solve

An MDP does not guarantee the state is observable, the reward is aligned, or the
transition model is known. Real systems may be nonstationary, multi-agent, or
constrained in ways a simple MDP does not capture.

## Continue, go deeper, apply it

- Continue: Bellman expectation equations
- Go deeper: RL safety and offline-data warnings
- Apply it: Agents versus workflows
