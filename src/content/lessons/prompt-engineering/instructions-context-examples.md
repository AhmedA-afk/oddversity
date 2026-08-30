---
title: "Separate instructions, context, examples, and output contracts"
track: "prompt-engineering"
status: live
summary: "Reliable prompts make four jobs legible: instructions say what to do, context supplies relevant facts, examples show the behavior, and an output."
duration: "3 min read"
---

## The short answer

Reliable prompts make four jobs legible: instructions say what to do, context supplies relevant facts, examples show the behavior, and an output contract makes the result inspectable. Mixing these jobs into one paragraph makes it harder to change one constraint without accidentally changing the others.

## The anatomy

```text
instruction: classify the ticket
context: policy excerpt + ticket text
examples: two labeled tickets
contract: JSON with category, confidence, and reason
```

The model still interprets language probabilistically. Separation does not create
guarantees; it creates handles for testing and revision.

## Four examples

### Example A: extraction

Instruction: extract the invoice ID. Context: a noisy email. Examples: one ID
with punctuation and one missing ID. Contract: `{ "invoice_id": string|null }`.

### Example B: transformation

Instruction: rewrite for a non-technical reader. Context: a release note.
Examples: short and long rewrites. Contract: title, summary, and one caveat.

### Boundary case: conflicting context

Two retrieved documents disagree. Add a rule to identify the conflict and return
both sources for review. A prompt that says “always answer confidently” creates a
bad incentive.

### Counterexample: examples as hidden policy

If every example routes billing complaints to “close,” the model may copy the
pattern even when the written instruction says to escalate refunds. Examples need
labels and review just like training data.

## An illustrative story

A prompt was shortened to save tokens and suddenly started inventing missing
fields. The removed paragraph was not “fluff”; it contained the null behavior and
one example of an incomplete form. The team restored the behavior as a test case,
not as a lucky paragraph.

## Two ways to see it

### Builder view

Use separate blocks so a test can vary context while holding instructions steady.

### Reviewer view

Look for accidental authority: context that contains instructions, examples that
encode an unapproved policy, or a contract that validates syntax but not meaning.

## Hands-on

Take one paragraph prompt and split it into four labeled blocks. Add one ordinary,
one ambiguous, and one missing-data example. Test whether a reader can identify
which block should change when the output format changes.

## Checkpoint

- [ ] Each block has one job.
- [ ] Examples include a boundary case, not only success.
- [ ] The output contract describes missing and invalid values.

## What this does not solve

Clear prompt anatomy does not prevent prompt injection in untrusted context or
semantic errors that satisfy a schema.

## Continue, go deeper, apply it

- Continue: Structured output
- Go deeper: Red-teaming LLM applications
- Apply it: create a reusable prompt skeleton with named blocks and test fixtures.
