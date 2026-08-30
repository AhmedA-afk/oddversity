---
title: "Policies, exploration, and occupancy"
track: "maths-foundations"
status: live
summary: "A policy maps states to actions, deterministically or as probabilities."
duration: "4 min read"
---

## The short answer

A policy maps states to actions, deterministically or as probabilities. Exploration deliberately visits uncertain actions; occupancy describes which states and actions a policy actually reaches. Greedy choice can miss a delayed-reward route, while unbounded exploration can be unsafe. Choose an exploration schedule and inspect occupancy, not just the final average return.

## Why this matters

An agent learns only from the paths it visits. A policy that looks good on common
states may never test a rare branch, and a policy trained with exploration may
behave differently when exploration is removed. Occupancy also reveals whether
the agent is spending time in loops, unsafe states, or a narrow subset of users.

## How it works

For policy `π`, `π(a|s)≥0` and `Σ_aπ(a|s)=1`. An epsilon-greedy policy chooses a
greedy action with probability `1−ε+ε/|A|` and other actions with `ε/|A|`.
Discounted state occupancy is proportional to

```text
d_π(s) = Σ_{t=0}∞ γ^t P(S_t=s | π),
```

with normalisation depending on convention. It is a distribution over experienced
states, not a guarantee about all states in the environment.

## Worked examples and variations

### Example A: deterministic versus stochastic policy

**Input:** state `s`, actions A and B, `π(A|s)=1` versus `.7/.3`. **Mechanism:**
the stochastic policy samples both actions. **Output:** different transition and
return distributions. **Inspect:** estimate action frequencies. **Decision:** use
stochasticity when uncertainty or mixed behavior is part of the objective.

### Example B: delayed reward and exploration

**Input:** action A gives 1 immediately; action B gives 0 for three steps then 10.
**Mechanism:** a greedy learner initialized with `Q(A)>Q(B)` may never discover B.
**Output:** stable but suboptimal behavior. **Inspect:** count action B visits.
**Decision:** force safe exploration or use prior/model-based planning.

### Boundary case: `ε=0` and `ε=1`

**Input:** two actions. **Mechanism:** `ε=0` is purely greedy; `ε=1` is uniform
under the basic rule. **Output:** no random discovery versus maximal random
choice. **Inspect:** include tie-breaking, which can still introduce determinism.
**Decision:** schedule exploration with a stated floor and safety constraint.

### Counterexample: uniform occupancy means fairness

**Input:** a recommender visits user groups equally but gives one group lower
quality actions. **Mechanism:** state frequency ignores reward and outcome quality.
**Output:** balanced occupancy with unequal harm. **Inspect:** slice outcomes by
group and state. **Decision:** treat occupancy as coverage evidence, not fairness
proof.

## An illustrative story

An illustrative maze agent reaches the goal on training maps but spends most
episodes circling a familiar corridor. Its mean return hides low occupancy of
the corridor containing a shortcut. Counting state-action visits reveals that
“learned” means “repeated the only route it explored.”

## Two ways to see it

### Policy view

`π` is a probability table or function that makes action selection explicit.
Changing `ε` changes the behavior distribution even if value estimates stay fixed.

### Data view

Occupancy is the support of experience. Offline datasets and online logs inherit
that support; unvisited actions are not evidence that they are bad or safe.

## Hands-on

Use a small chain with a safe delayed-reward branch. Run greedy, fixed-epsilon,
and decayed-epsilon policies for 1,000 episodes. Record return distribution,
state-action counts, and unsafe-action count.

**Failure state:** decay epsilon to zero before the delayed branch is visited, or
report only mean return. **Test:** require a minimum visit count for the branch
and report p10/p50/p90 return plus occupancy; the premature schedule must fail.
**Reset:** restore a nonzero floor or a safe exploration budget and rerun.

## Checkpoint

- [ ] Define a deterministic and stochastic policy for one state.
- [ ] Explain why occupancy is about experience, not all possible states.
- [ ] Predict behavior at epsilon 0 and epsilon 1.
- [ ] Name one safety metric to report beside exploration return.

## What this does not solve

Exploration does not guarantee discovery of the best policy, representative data,
or safe behavior. Occupancy can be estimated incorrectly under logging bias,
partial observability, or changing environments.

## Continue, go deeper, apply it

- Continue: Temporal-difference learning
- Go deeper: Bellman optimality and value iteration
- Apply it: RL safety and offline-data warnings
