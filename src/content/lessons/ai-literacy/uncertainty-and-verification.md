---
title: "Handle uncertainty with verification and human judgment"
track: "ai-literacy"
status: live
summary: "Treat model uncertainty as a reason to inspect, not as a number that proves correctness."
duration: "5 min read"
---

## The short answer

Treat model uncertainty as a reason to inspect, not as a number that proves correctness. Verify factual claims against permitted evidence, validate structured outputs with rules, and route ambiguous or high-cost cases to a person. A good AI system has an explicit abstain path; it does not force every input into an answer.

## Why this matters

Fluency hides uncertainty. A response can be grammatically confident while its
source is missing, its interpretation is ambiguous, or its action is outside
policy. Conversely, a short or hesitant response is not automatically wrong.

Verification is a design choice about the claim and its consequences. A low-cost
draft may need a quick human glance. A financial transfer, access decision, or
medical instruction needs stronger evidence, authority checks, and an owner who
can stop the action.

## How it works

Build a verification ladder:

1. **Format:** does the output parse and contain the required fields?
2. **Constraint:** does it obey allowed values, ranges, and policy rules?
3. **Evidence:** can each material claim be traced to a permitted source?
4. **Cross-check:** does a second rule, calculation, or source disagree?
5. **Human judgment:** does an authorized person review cases the system cannot
   resolve, with enough context to disagree?

The system should choose a response state, not just produce text:

```text
supported → proceed within policy
uncertain  → ask, retrieve, or send to review
unsupported → abstain and explain what evidence is missing
unsafe     → block the action and record the reason
```

Do not confuse a model’s token probabilities, a confidence field, or an
LLM-as-judge score with truth. They can be useful signals, but they need to be
calibrated against observed outcomes.

## Worked examples and variations

### Example A: arithmetic claim

The model drafts a total from line items. Recalculate the total with ordinary
code, compare currencies and tax rates, and reject a mismatch. The model can
explain the result; the calculator should determine whether the number is right.

### Example B: grounded policy answer

The assistant answers from a dated policy passage. Check that the citation covers
the claim, the user may access the passage, and no newer policy supersedes it. If
the passages conflict, return the conflict to a reviewer instead of choosing the
more convenient rule.

### Example C: extraction with a missing field

The input contains a customer name but no account ID. A reliable extractor returns
`account_id: null` and a reason, not a guessed identifier. The application can
request the missing field or route the record to a queue.

### Boundary case: plausible but unsupported

An answer names a date and cites a document that only discusses the general
process. The citation exists, but it does not entail the date. Inspect the exact
source span, not merely whether a link appears.

### Counterexample: “ask the model to be certain”

Adding “answer confidently and never say you are unsure” may improve completion
rate while making failures harder to notice. It removes the safety signal without
adding evidence. The correct fix is a source, a test, a rule, or an escalation path.

### Production example: review queues can fail too

Routing every uncertain case to a person does not solve the problem if the queue
has no owner, no service target, or no way to record the decision. Measure queue
volume, review time, disagreement, and what happens when the queue is full.

## An illustrative story

A team celebrated an assistant because reviewers rarely clicked “incorrect.” A
closer look showed that reviewers only corrected answers they had time to inspect;
unsupported answers that looked plausible passed silently. The team changed the
review form to require a source check on a sampled set and tracked abstentions as
a healthy outcome rather than a failure.

This is illustrative. Review data is itself part of the system and can be
incomplete or biased.

## Two ways to see it

### Builder view

Turn each important claim into a check: parse it, constrain it, ground it, compare
it, or assign it to a person. Make the check cheap enough to run and explicit
enough to fail.

### Human and risk view

Human review is not a decorative approval button. The reviewer needs authority,
time, evidence, and a real ability to reject or change the result. Otherwise the
system has shifted responsibility without adding control.

## Hands-on

Create a verification matrix for six outputs from an AI feature:

| Output | Error cost | Evidence available | Automated check | Human review? | Abstain behavior |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Include one harmless draft, one calculation, one missing field, one conflicting
source case, one privacy-sensitive case, and one action with irreversible impact.
For each, decide the minimum verification ladder required. Your failure state is a
matrix that says “human review” without naming the reviewer or the decision they
can make; replace it with an observable review instruction.

## Checkpoint

- [ ] You can distinguish format validity, policy compliance, evidence, and truth.
- [ ] You can design an abstain state for an ambiguous input.
- [ ] You can choose different verification strength for low- and high-cost errors.
- [ ] You can name the reviewer’s authority and the signal that tells you review is failing.

## What this does not solve

Verification can miss unknown failure modes, biased sources, and coordinated abuse.
A citation does not guarantee that the source is correct, and human review does
not guarantee attention. Use evaluation, monitoring, threat modeling, and
governance for systems that matter.

## Continue, go deeper, apply it

- Continue: Data, privacy, provenance, and policy
- Go deeper: Datasets, rubrics, and judges
- Apply it: Grounding, citations, and context budgets
