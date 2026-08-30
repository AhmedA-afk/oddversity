---
title: "Task framing: intent, constraints, and acceptance criteria"
track: "prompt-engineering"
status: live
summary: "Task framing turns “use AI to help” into a decision the system can perform and a team can test."
duration: "3 min read"
---

## The short answer

Task framing turns “use AI to help” into a decision the system can perform and a team can test. State who the user is, what input is available, what action or answer is wanted, what must never happen, and how a reviewer will decide whether the result is acceptable. If the task cannot be evaluated, the prompt is not ready.

## Frame the boundary

Use this five-part brief:

| Part | Question | Example |
|---|---|---|
| Actor | Who relies on the result? | support agent |
| Input | What is actually available? | ticket + account tier |
| Action | What should happen? | draft a reply or escalate |
| Constraint | What is forbidden? | no refund promises |
| Acceptance | What counts as good? | policy-grounded, complete, editable |

## Worked example

“Write a response” permits invention. “Draft a response using only the policy excerpt and ticket; quote the policy clause; if entitlement is unclear, ask one question and route to a human” creates a bounded workflow.

The important output is not warmth. It is a safe choice among draft, ask, and escalate.

## A small story

A product manager thought an assistant was failing at “prioritization.” When the team listed the decisions, they found three different tasks: sorting by impact, spotting missing information, and deciding what to tell a customer. One prompt had been asked to impersonate a roadmap committee.

## More examples and variations

- **Support:** classify a ticket, define allowed queues, and route uncertainty to a person.
- **Code:** request a patch plus tests, constraints, and the files the model may touch.
- **Research:** ask for claims, sources, uncertainty, and a stop condition—not just “research this.”
- **Counterexample:** a vague request for “the best answer” cannot be evaluated consistently.

## Two ways to see it

### UX view

Good framing reduces the user's cognitive load and makes the next action obvious.

### Reliability view

Good framing reduces the output space and gives evaluation a stable target.

## Hands-on

Rewrite one vague AI feature request as a one-page task contract. Include three in-scope examples, two out-of-scope cases, and an escalation rule.

## Checkpoint

- [ ] The request has one primary decision.
- [ ] The prompt has an explicit uncertainty path.
- [ ] A reviewer can score the result without guessing your intent.

## What this does not solve

Clear requirements do not make an impossible task possible. You may still need retrieval, a tool, a human decision, or a different model.

## Continue, go deeper, apply it

- Continue: Instruction, context, and examples
- Go deeper: Structured output
- Apply it: Responsible risk framing
