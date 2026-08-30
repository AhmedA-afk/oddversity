---
title: "Reasoning and decomposition without cargo culting"
track: "prompt-engineering"
status: live
summary: "Decomposition helps when a task contains separable decisions with different evidence or tests."
duration: "3 min read"
---

## The short answer

Decomposition helps when a task contains separable decisions with different evidence or tests. Ask for useful intermediate artifacts—an extracted table, a plan, a calculation, or a list of uncertainties—rather than treating hidden reasoning text as proof. A longer chain can improve inspectability while also multiplying latency, cost, and opportunities for error.

## Choose the intermediate artifact

For a research answer, useful artifacts might be:

1. claims to verify;
2. sources or retrieved passages;
3. a conflict list;
4. a final answer with confidence and limitations.

That is more operational than requesting an unreviewed stream of private reasoning.

## Worked example

Task: decide whether a bug is caused by a token expiry.

- Step 1 extracts timestamps and error codes.
- Step 2 compares them with the token lifetime.
- Step 3 proposes two hypotheses.
- Step 4 chooses the next diagnostic action.

If step 1 omits the error code, later steps should stop or mark uncertainty. A chain that continues confidently is a failure, not intelligence.

## A small story

A debugging assistant produced a beautiful explanation for a failure that never occurred in the logs. The team changed the prompt to require “evidence found” and “evidence missing” fields. The output became less eloquent and far more useful.

## More examples and variations

- **Arithmetic:** split parsing, calculation, and checking; use a calculator for the arithmetic.
- **Comparison:** define criteria first, score candidates second, and inspect tradeoffs third.
- **Long task:** checkpoint after retrieval before asking for synthesis.
- **Counterexample:** asking for longer hidden reasoning does not fix missing data or a wrong premise.

## Two ways to see it

### Reasoning view

Smaller subproblems can reduce ambiguity and make verification local.

### Reliability view

Every intermediate artifact is an API boundary that needs validation and an error path.

## Hands-on

Take one complex support or coding task. Compare one-shot output with a three-step pipeline where each step emits structured evidence. Measure where the pipeline fails.

## Checkpoint

- [ ] Each subtask has a distinct acceptance criterion.
- [ ] Missing evidence stops or routes the task to review.
- [ ] You can explain whether the extra calls improved correctness enough to justify their cost.

## What this does not solve

Decomposition does not turn an unsupported premise into a fact and does not remove the need for end-to-end tests.

## Continue, go deeper, apply it

- Continue: Prompt evaluation
- Go deeper: Search and planning
- Apply it: Agent planning branch
