---
title: "Capstone: build a prompt library that can survive a change"
track: "prompt-engineering"
status: live
summary: "Your capstone is a small prompt library for one real workflow, with versions, test cases, a rubric, known failures, and a rollback note."
duration: "3 min read"
---

## The short answer

Your capstone is a small prompt library for one real workflow, with versions, test cases, a rubric, known failures, and a rollback note. The artifact should let another person understand what each prompt does, run it on fixed inputs, see where it fails, and choose whether to use it. The prompt text is only one part of the deliverable.

## Deliverable

Create:

- three prompts for related tasks;
- a shared task contract and output schema;
- 20 test cases with ordinary, ambiguous, and adversarial slices;
- a scorecard with examples, not just percentages;
- a changelog explaining one improvement and one regression;
- a “do not automate” boundary.

## A small story

The best library in a team was not the one with the most elaborate instructions. It was the one with names like `triage_ticket_v2`, a clear owner, a test set, and a note that said “never send without human review.” Good naming made the safe behavior easier to reuse.

## More examples and variations

- **Role library:** one prompt for a marketer, one for a support analyst, and one for a reviewer.
- **Risk library:** separate drafting, recommending, and acting prompts with different approvals.
- **Model variation:** test a smaller and larger model against the same acceptance set.
- **Counterexample:** a library of unowned snippets becomes a museum of accidental behavior.

## Two ways to see it

### Individual craft

The library is a set of reusable moves for your own work.

### Team infrastructure

The library is versioned policy and shared operational knowledge. It needs review, ownership, and retirement.

## Hands-on

Run v1 and v2 against the same dataset. Publish the diff: which cases improved, which regressed, and which new risks appeared. Keep the failing cases in the repository.

## Checkpoint

- [ ] Every prompt has an owner, version, and intended task.
- [ ] The library contains a visible failure and rollback path.
- [ ] A reviewer can identify where human judgment remains required.

## What this does not solve

A prompt library is not a substitute for access control, application validation, monitoring, or a responsible AI review.

## Continue, go deeper, apply it

- Continue: GenAI application engineering
- Go deeper: Adversarial testing lab
- Apply it: fork the library into a real role workflow and measure one week of use.
