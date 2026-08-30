---
title: "Choose an agent only when a workflow is not enough"
track: "agentic-ai"
status: live
summary: "Use a workflow when steps, transitions, and approvals are known."
duration: "3 min read"
---

## The short answer

Use a workflow when steps, transitions, and approvals are known. Use an agent when the system must choose among bounded tools or steps based on changing information. The more freedom an agent has, the more you need limits on tools, time, state, cost, and escalation.

## Compare the shapes

| Shape | Best fit | Main control |
|---|---|---|
| fixed workflow | known sequence | explicit code paths |
| router | choose one known branch | classifier or rules |
| bounded agent | select among safe tools | policy, budget, stop conditions |
| open-ended loop | poorly bounded exploration | high risk; justify carefully |

## Four examples

### Example A: onboarding checklist

Use a workflow: collect fields, validate, create account, notify. Deterministic
steps make retries and audit easy.

### Example B: research assistant

A bounded agent may choose search, compare, and summarize tools, with a fixed
source policy and a human review before publication.

### Boundary case: unknown next step

If a tool fails or evidence conflicts, the agent should pause, explain the state,
and ask for direction—not invent a new authority.

### Counterexample: agent for a three-step form

An agent adds nondeterminism and cost where ordinary code can express the process.

## An illustrative story

A team replaced a clear approval workflow with a “helpful” agent. It handled easy
cases well but became difficult to audit when a field was missing. They retained a
model for classification and restored explicit code for authorization and writes.

## Two ways to see it

### Capability view

An agent is useful when deciding the next bounded action is the hard part.

### Reliability view

Every choice point is a new failure surface, so autonomy must earn its place with
tests and recovery.

## Hands-on

Model one task as a fixed workflow and as a bounded agent. Give both the same
mock tools and fixtures. Compare trace length, failure explanations, cost proxy,
and ease of rollback.

## Checkpoint

- [ ] The reason for autonomy is explicit.
- [ ] Tools, budget, and stopping conditions are bounded.
- [ ] The system has a human or deterministic recovery path.

## What this does not solve

Choosing a workflow does not make the underlying model correct; choosing an agent
does not make an ambiguous goal precise.

## Continue, go deeper, apply it

- Continue: State, memory, and recovery
- Go deeper: Tool calling and authority
- Apply it: write a one-page autonomy decision record.
