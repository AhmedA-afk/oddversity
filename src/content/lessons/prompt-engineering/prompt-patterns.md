---
title: "Prompt patterns: zero-shot, few-shot, decomposition, and critique"
track: "prompt-engineering"
status: live
summary: "Prompt patterns are reusable ways to shape a task. Zero-shot asks for a behavior without examples; few-shot demonstrates the behavior; decomposition."
duration: "3 min read"
---

## The short answer

Prompt patterns are reusable ways to shape a task. Zero-shot asks for a behavior without examples; few-shot demonstrates the behavior; decomposition splits a large decision into smaller ones; critique adds a review pass. None is universally best. Choose a pattern based on ambiguity, error cost, context budget, and whether the intermediate work can be checked.

## Compare the patterns

| Pattern | Useful when | Common failure |
|---|---|---|
| Zero-shot | task is simple and conventions are obvious | hidden assumptions |
| Few-shot | format or style matters | examples teach accidental rules |
| Decomposition | task mixes several decisions | errors compound between steps |
| Critique | a second view catches omissions | critic agrees with the first answer |

## Worked example

For invoice extraction, a few-shot prompt can show how to represent missing tax IDs. For a difficult contract review, decomposition can first locate clauses, then classify obligations, then produce a list of questions. If each step emits evidence, a reviewer can find where the chain went wrong.

Do not decompose because a diagram looks impressive. Decompose when the sub-results have distinct acceptance tests.

## A small story

A team added a “critic” prompt after every customer answer. Quality improved in demos, but latency and cost doubled while obvious hallucinations survived. They changed the critic to check three named properties and route uncertain cases to a human. The value came from the rubric, not from the word critic.

## More examples and variations

- **Zero-shot:** useful for a familiar, low-risk transformation with clear instructions.
- **Few-shot:** useful when labels or formatting are easy to demonstrate but hard to describe.
- **Decomposition:** useful when a task has independent subtasks and intermediate checks.
- **Counterexample:** a critique loop can amplify a bad first answer if the critic has no evidence.

## Two ways to see it

### Pattern-library view

Patterns are starting templates that shorten experimentation.

### Systems view

Each extra model call is a new failure boundary, cost center, and place where untrusted text may enter.

## Hands-on

Run the same ten inputs through zero-shot, few-shot, and decomposition. Record accuracy, token use, latency, and the types of errors—not only the average score.

## Checkpoint

- [ ] You can justify the pattern from the task's failure mode.
- [ ] Few-shot examples cover an edge case, not only the happy path.
- [ ] Every extra step has a test or a human owner.

## What this does not solve

Patterns do not replace good data, retrieval, authorization, or evaluation. More steps can make a system less reliable.

## Continue, go deeper, apply it

- Continue: Structured output
- Go deeper: Reasoning and decomposition
- Apply it: Red-team the boundary
