---
title: "Sets, logic, and proof habits"
track: "maths-foundations"
status: live
summary: "Sets describe collections; logic states conditions; a proof or counterexample."
duration: "4 min read"
---

## The short answer

Sets describe collections; logic states conditions; a proof or counterexample
checks whether a claim follows from its assumptions. These are practical AI
skills. They let you define an allowed input set, distinguish “all users” from
“some test cases,” formulate an evaluation criterion, and reject a model claim
whose impressive average hides a single harmful or impossible case.

## Why this matters

Many system requirements contain quiet quantifiers: “the model works for every
language,” “no private value reaches the tool,” or “at least 95% of inputs meet
the latency target.” Those are very different claims. A model passing ten
examples proves only that it passed ten examples. It does not prove a universal
statement about an open input space.

## How it works

A set can be listed, such as `C={cat,dog,bird}`, or described by a condition,
such as `P={x∈R : x>0}`. Common operations are union `A∪B`, intersection
`A∩B`, difference `A\B`, and complement `Aᶜ` relative to a stated universe.

Logic combines propositions:

| Symbol | Read it as | Example |
|---|---|---|
| `∀` | for every | every input has the expected feature count |
| `∃` | there exists | at least one evaluation case fails |
| `⇒` | implies | valid schema implies safe parser input |
| `⇔` | if and only if | score is calibrated iff stated condition holds |
| `¬` | not | the output is not within the allowed set |

To disprove a universal statement, one valid counterexample is enough. To prove
one, you need an argument covering every member of its stated domain.

## Worked examples and variations

### Example A: allowed labels

**Input:** `C={refund, delivery, account}` and model label `delivery`.
**Mechanism:** test membership: `delivery∈C`. **Output:** valid label.
**Inspect:** membership is a deterministic output validation rule. **Decision:**
reject or route unknown labels rather than guessing where `billing` belongs.

### Example B: a data split is a set relation

Let `T`, `V`, and `E` be train, validation, and test row identifiers. The desired
condition is `T∩V=T∩E=V∩E=∅`. **Output:** no row belongs to two splits.
**Inspect:** a nonempty intersection is leakage, even when aggregate metrics
look good. **Decision:** test identifiers, not only row counts.

### Example C: negating a latency requirement

Claim: “For every request `r` in the supported set, latency is under 500 ms.”
Its negation is “There exists a supported request `r` with latency at least
500 ms.” **Inspect:** one trace can disprove the universal claim. **Decision:**
state whether the actual requirement is universal, a percentile, or an average.

### Boundary case: an empty set

The claim “every element of the empty set has property P” is technically true,
but it proves no real system handled an input. **Inspect:** an evaluation suite
with zero cases can satisfy a careless “all tests pass” check. **Decision:** add
a minimum-coverage assertion alongside universal checks.

### Counterexample: correlation implies cause

The statement “if two variables are correlated, changing one changes the other”
is false. A common cause can move both. **Inspect:** write the observed claim as
association, then list the untested intervention. **Decision:** use experiments
or explicit causal assumptions before making an action recommendation.

## Two ways to see it

### Builder view

Turn sets into allowlists, schemas, split IDs, and test fixtures. Turn logic into
assertions: `assert feature_count == 20`, `assert test_ids ∩ train_ids == ∅`.
The implementation is only as strong as the universe and assumptions you state.

### Reviewer view

Ask “for which inputs?” and “compared with what?” whenever a result uses words
like *all*, *never*, *safe*, *fair*, or *works*. A counterexample can reveal a
missing boundary much faster than another average metric.

## Hands-on

Build a tiny validation suite for a hypothetical classifier with allowed labels
`{0,1,2}` and three dataset splits. Write checks for label membership, pairwise
disjoint split IDs, and a latency statement.

**Failure state:** place one ID in both train and test, add label `3`, and include
one 700 ms supported request. **Tests:** report each violated condition by name;
do not collapse them into “validation failed.” **Reset:** fix the ID, label, and
trace, then rerun the assertions.

## Checkpoint

- [ ] Compute `A∩B`, `A∪B`, and `A\B` for two small label sets.
- [ ] Negate: “Every production input has a citation.”
- [ ] Give one counterexample to “high accuracy means every group is served
  equally well.”
- [ ] Explain why an empty evaluation set is not evidence of success.

## What this does not solve

Logic cannot supply missing data, define an ethical policy, or make a claim true.
It forces the scope and evidence burden into the open. Statistical uncertainty,
causal inference, and responsible-AI review add the next layers.

## Continue, go deeper, apply it

- Continue: Mathematics Foundations checklist
- Go deeper: Responsible AI risk framing
- Apply it: build the validation suite described above before starting M0.5.
