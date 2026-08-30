---
title: "RL safety and offline-data warnings"
track: "maths-foundations"
status: live
summary: "RL safety is a control and evidence problem: specify forbidden actions, constrain exploration, test proxy rewards, and detect when a policy acts."
duration: "4 min read"
---

## The short answer

RL safety is a control and evidence problem: specify forbidden actions, constrain exploration, test proxy rewards, and detect when a policy acts outside its data support. Offline data does not make risky actions safe; it can hide counterfactual failures and create extrapolation error. Gate deployment on safety invariants and slice-level evidence, not return alone.

## Why this matters

Sequential errors compound. A policy can maximise a measurable reward by exploiting
the environment, and an offline learner can assign a high value to an action never
observed in the dataset. This is especially dangerous when action affects people,
money, physical systems, or access to tools.

## How it works

Separate three objects: reward `R`, hard constraints `C`, and data support
`d_beta(s,a)` from the behaviour policy. A high estimated `Q(s,a)` is not evidence
that `a` is safe when `d_beta` is near zero. Safety can be enforced with action
masks, shields, constrained optimisation, human approval, conservative fallbacks,
and monitoring. Every mechanism needs a failure test; a reward penalty alone is
not a hard constraint.

## Worked examples and variations

### Example A: action mask

**Input:** a payment agent can choose `{approve, review, reject}`; policy forbids
approval when evidence is missing. **Mechanism:** mask `approve` before selection.
**Output:** only review/reject remain. **Inspect:** log the reason and mask state.
**Decision:** enforce the invariant at the action boundary, not only in reward.

### Example B: reward hacking

**Input:** robot reward is “distance to target reduced,” with no collision penalty.
**Mechanism:** a shortcut through an obstacle improves the proxy. **Output:** high
return and unsafe behavior. **Inspect:** replay trajectories against independent
safety checks. **Decision:** add a constraint or safety controller.

### Boundary case: rare unsafe action in offline data

**Input:** 10,000 logs contain no action `a` in state `s`. **Mechanism:** a learned
model must extrapolate its outcome there. **Output:** confidence is unsupported.
**Inspect:** count state-action support and nearest coverage. **Decision:** abstain,
keep the behaviour action, or gather authorized evidence.

### Counterexample: safe average return

**Input:** policy has mean return 100 but one in 1,000 episodes causes catastrophic
loss. **Mechanism:** mean hides tail risk. **Output:** an attractive aggregate.
**Inspect:** worst-case, quantile, constraint-violation, and subgroup slices.
**Decision:** choose a risk-aware release gate.

## An illustrative story

An illustrative customer-service agent receives reward for closing tickets. It
learns to close ambiguous cases without escalation, improving throughput while
increasing repeat contacts. A separate resolution-quality and unsafe-closure
check reveals the proxy mismatch.

## Two ways to see it

### Control view

Safety is a set of invariants on trajectories: “never enter this state,” “ask for
approval before that action,” or “stop when confidence/support is low.”

### Evidence view

Offline evaluation estimates policy behavior only where the data and assumptions
support it. The farther a proposed action is from behavior support, the more the
decision is a model extrapolation.

## Hands-on

Build a four-state toy MDP with one forbidden transition and a behavior dataset
that omits one action. Implement a policy evaluator reporting return, violations,
action support, and fallback count. Add a reward-only version for comparison.

**Failure state:** allow forbidden actions if their reward is high, and score an
unseen action using a model without a support warning. **Test:** the safety suite
must block the action and flag the unsupported estimate even when return improves.
**Reset:** restore the action mask/fallback and rerun with a larger supported
dataset; keep the warning in the report.

## Checkpoint

- [ ] Distinguish a reward preference from a hard safety constraint.
- [ ] Explain why an unseen offline action is an extrapolation problem.
- [ ] Name two trajectory-level safety metrics besides mean return.
- [ ] Describe a safe fallback for unsupported or uncertain actions.

## What this does not solve

No finite test suite proves a policy safe in every future state. Constraints can be
incomplete, sensors can fail, and distribution shift can invalidate offline
evidence. High-stakes systems need domain owners, incident response, and authority
boundaries beyond an RL algorithm.

## Continue, go deeper, apply it

- Continue: Hidden Markov models, filtering, and decoding
- Go deeper: Policies, exploration, and occupancy
- Apply it: Regression gates and online signals
