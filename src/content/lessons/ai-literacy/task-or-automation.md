---
title: "Decide whether a task needs AI"
track: "ai-literacy"
status: live
summary: "Use ordinary software when the rule is stable, visible, and cheap to encode."
duration: "8 min read"
---

## The short answer

Use ordinary software when the rule is stable, visible, and cheap to encode. Use a predictive model when the input varies, examples exist, and the decision can tolerate measured uncertainty. Use a generative model when the output is language, code, audio, or images and a person or test can review it. “AI” is not the first design decision: the task, error cost, data, and fallback are.

## Why this matters

Teams often start with a model because a model is available. That reverses the
engineering order. A model can make an ambiguous task look impressive while
leaving the important questions unanswered: what counts as correct, what happens
when the input is unfamiliar, and who is allowed to act on the result?

The smallest useful system is often a rule, a search box, a better form, or a
human decision supported by evidence. Choosing that baseline first gives you a
comparison point. Without it, “the AI helped” is usually a feeling rather than a
testable result.

## How it works

Describe the task as a contract:

```text
Input       → what arrives, in what shape, from where?
Operation   → rule, prediction, generation, retrieval, or sequence of steps?
Output      → what is returned, including an abstain or error state?
Decision    → what action does the output authorize?
Acceptance  → how will we tell a good result from a plausible bad one?
Owner       → who reviews failures and can stop the system?
```

Then compare the task with the smallest plausible system:

| System | Good fit | Typical failure | Minimum control |
| --- | --- | --- | --- |
| Rule or automation | Stable inputs and explicit logic | The rule misses a new case | validation and an error queue |
| Predictive ML | Repeated decisions with examples or labels | distribution shift or biased labels | held-out evaluation and an abstain band |
| Generative model | Variable language or media transformation | fluent, unsupported, or malformed output | output checks and human review |
| Retrieval/search | The answer should come from known sources | stale, missing, or irrelevant evidence | source permissions, dates, and citations |
| Agent/workflow | Several bounded steps or tools are required | excessive authority or an unrecovered loop | narrow tools, budgets, and stop conditions |

These categories can be combined. A support feature might use retrieval to find
policy text, a model to draft a reply, and a rule that prevents sending without
human approval. Calling the whole thing “the model” hides the controls that make
the feature usable.

## Worked examples and variations

### Example A: invoice totals — ordinary automation

**Input:** line items and a tax rate in a known schema. **Operation:** arithmetic
and validation. **Output:** a total or a clear error. **Inspection:** compare the
result with a hand-calculated fixture and reject a missing tax rate. **Decision:**
use code; a model adds an opaque failure mode without adding useful coverage.

### Example B: support routing — predictive classification

**Input:** free-text request with many phrasings. **Operation:** map the request
to a queue. **Output:** route plus a confidence or review flag. **Inspection:**
measure errors by queue and send unfamiliar or low-confidence cases to triage.
**Decision:** a classifier may be useful, but the queue assignment must not be
treated as certain merely because it has a score.

### Example C: policy answer — retrieval plus generation

**Input:** an employee asks which leave policy applies. **Operation:** retrieve
the current policy passages, then draft an answer from those passages. **Output:**
answer, source spans, and “insufficient evidence” when the sources disagree.
**Inspection:** check that every material claim maps to a permitted, current
source. **Decision:** use a grounded assistant, not an unconstrained chatbot.

### Boundary case: policy interpretation

Two policy documents may both appear relevant, or the question may omit the
employee’s location. A helpful-sounding answer is not a resolution. Return the
candidate sources, ask for the missing fact, or escalate. The system should expose
the ambiguity instead of turning it into an invented rule.

### Counterexample: “add an LLM” to a form

If a form already has a dropdown, validation rules, and a finite set of outcomes,
an LLM may add latency and an opaque failure mode without improving coverage.
The AI version is justified only if it solves a measured problem, such as
supporting messy legacy text that the form cannot capture.

### Production example: the silent failure

A report generator produces a polished weekly summary but silently drops rows
when a source export changes column names. The model is not the first suspect:
the input contract and row-count check failed. A baseline should reject the file,
show the missing fields, and leave the previous report untouched.

## An illustrative story

A team labelled its weekly report “an AI opportunity.” Mapping the work showed
that most of the delay came from a missing database join. Ordinary code removed
that delay. Only the remaining free-text exception notes needed a model, and those
notes received a review queue because their error cost was different from the
arithmetic.

This is illustrative, not a report of a named incident. The lesson is the order
of investigation: measure the task, fix the boundary, then add a model where it
actually changes the result.

## Two ways to see it

### Builder view

Choose the smallest system that meets the acceptance criteria. Make uncertainty
visible, keep model output separate from application policy, and give every
failure a next action.

### Operations view

Every automated decision creates an owner, a failure queue, a review cost, and a
way to stop or roll back the behavior. If those do not exist, the system is not
ready just because the demo works.

## Hands-on

Create a one-page decision brief for three tasks from your own week. Use this
table:

| Field | Your answer |
| --- | --- |
| Task and owner | |
| Input and source | |
| Smallest non-AI baseline | |
| Candidate system | |
| Good output | |
| Known bad output | |
| Error cost | |
| Abstain or escalation rule | |
| Stop/rollback action | |

Use one task that should stay deterministic, one that may need a model, and one
that is ambiguous enough to require human judgment. Deliberately leave one input
incomplete. Your failure state is a decision brief that recommends a system but
cannot say what happens when the input is missing; revise it until the fallback is
explicit.

## Checkpoint

You are ready to continue when you can:

- classify four example tasks as rule, prediction, generation, retrieval, or a
  bounded workflow, and explain why;
- write one observable acceptance test for each task;
- name an abstain or escalation condition, an owner, and a rollback action;
- explain what the non-AI baseline would do better or worse.

## What this does not solve

Choosing the right task does not make the data representative, the policy fair,
or the model truthful. Those are separate questions about data, risk, evaluation,
and human impact. A small model is not automatically a low-risk system if its
output controls a consequential action.

## Continue, go deeper, apply it

- Continue: See AI as a data, model, and output loop
- Go deeper: Problem framing and baselines
- Apply it: Choose the right AI system

## A practical decision tree

Ask four questions:

1. Is the input already structured enough for a deterministic rule?
2. Is there a repeatable judgment that examples could teach?
3. What happens when the system is wrong, silent, slow, or confidently wrong?
4. Can a person or another rule review the uncertain cases?

If the first answer is yes, start with automation. If the second and fourth are
yes, an ML or generative approach may be justified. If the third answer is
“someone could be harmed,” add a risk review before choosing a model.

## Worked examples

### Example A: invoice totals

Input: line items and tax rate in a known schema. Mechanism: arithmetic and
validation. Output: total or a clear error. A calculator plus a schema is easier
to test than a model.

### Example B: support routing

Input: free-text request with many phrasings. Mechanism: a classifier or model
maps text to a queue. Output: route plus confidence. A low-confidence result can
go to triage instead of silently choosing a queue.

### Boundary case: policy interpretation

Two policies may both appear relevant. The system should cite the candidates and
ask for review, not turn ambiguity into an invented rule.

### Counterexample: “add an LLM” to a form

If the form already has a dropdown and validation rules, a model adds latency and
an opaque failure mode without adding useful coverage.

## An illustrative story

A team automated a weekly report because it sounded like an AI opportunity. The
first useful discovery was that 80% of the work was a missing database join. Once
the join was fixed with ordinary code, a small model was considered only for the
remaining free-text exception notes.

## Two ways to see it

### Builder view

Choose the smallest system that meets the acceptance criteria and exposes its
uncertainty.

### Operations view

Every automated decision creates an owner, a failure queue, a review cost, and a
way to stop or roll back the behavior.

## Hands-on

Take three tasks from your own week. For each, write the input, decision, error
cost, fallback, and smallest baseline. Label it rule, ML, generative model, or
human judgment. Add one case where the chosen approach must abstain.

## Checkpoint

- [ ] The task has an observable output and a decision owner.
- [ ] A non-AI baseline was considered.
- [ ] Uncertainty, escalation, and rollback are explicit.

## What this does not solve

Choosing the right task does not make the data representative or the policy
fair. Those become separate design and evaluation questions.

## Continue, go deeper, apply it

- Continue: What prompting is
- Go deeper: Problem framing and baselines
- Apply it: turn one task into a one-page system brief with a human fallback.
