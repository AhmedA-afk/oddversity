---
title: "Conditional probability"
track: "maths-foundations"
status: live
summary: "Conditional probability restricts attention to cases where B occurred: P(A|B)=P(A∩B)/P(B), when P(B)>0."
duration: "5 min read"
---

## The short answer

Conditional probability restricts attention to cases where `B` occurred: `P(A|B)=P(A∩B)/P(B)`, when `P(B)>0`. It updates a description using information; it does not by itself say that `B` caused `A`. In AI, report the conditioned denominator—“positive among tested cases” differs from “tested among positives.”

## Why this matters

Search filters, diagnostic tests, and model slices all condition on information.
The denominator changes with the question. A retrieval system may ask the
probability that a document is relevant given a hit, while a user asks the
probability of a hit given relevance. Swapping the two produces a plausible but
wrong result.

## How it works

For events `A` and `B`, the intersection is the part where both happen. If we
learn `B`, the new reference space is `B`, so the fraction of that space also in
`A` is `|A∩B|/|B|` for equally likely finite outcomes. Replacing counts by
probability gives

`P(A|B)=P(A∩B)/P(B)`.

The multiplication rule follows by rearranging:

`P(A∩B)=P(A|B)P(B)`.

A probability tree places the first event on branches and the conditional
probabilities on the next branches. The branch products are joint probabilities
and all terminal branches should sum to one. Conditioning is a change in
information, not a causal intervention; causal claims need assumptions or an
experiment.

**Derivation:** start with the joint event `A∩B`, which is the part of the
restricted space `B` that also satisfies `A`. Dividing its mass by `P(B)` makes
the restricted probabilities add to one; rearranging the ratio gives the
multiplication rule used by the tree.

### Numerical and visual perspective

Use a 2×2 table. To read `P(A|B)`, divide the `A,B` cell by the entire `B`
column (or row, depending on layout). A tree is useful for sequential sampling;
a table is safer when you need to see all denominators at once.

### An illustrative story

A search report said “90% of clicked results were relevant,” then a launch memo
called it “90% of relevant results are clicked.” The two conditional directions
were silently swapped. The story is illustrative; keep both denominators in the
report.

## Worked examples and variations

### Example A: a 2×2 classifier table

**Input:** among 100 requests, 20 are truly positive; the model flags 15 of
them and also flags 10 negative requests. **Mechanism:** `P(flagged|positive)`
is `15/20=0.75`, while `P(positive|flagged)` is `15/25=0.60`.
**Output:** sensitivity is 75%; precision is 60%. **Inspect:** one uses the
positive column as denominator, the other the flagged column. **Decision:** name
the metric and denominator rather than saying “the model is 75% accurate.”

### Example B: search conditioning

**Input:** 1,000 retrieved documents contain 120 relevant documents; the
collection has 200 relevant documents in total. **Mechanism:**
`P(relevant|retrieved)=120/1000=0.12` and `P(retrieved|relevant)=120/200=0.60`.
**Output:** precision-like and recall-like quantities differ. **Inspect:** the
same intersection `120` appears in both, but the reference set changes.
**Decision:** choose the conditional that matches the user question.

### Boundary case: conditioning on a zero-probability event

**Input:** `B` is an event with `P(B)=0` in the model. **Mechanism:** the ratio
formula divides by zero. **Output:** ordinary event conditioning is undefined.
**Inspect:** “we observed B” may mean the model omitted an outcome, or that a
continuous variable was conditioned on a point and needs a more careful
conditional-density construction. **Decision:** do not insert an arbitrary zero
denominator; revise the model or use an appropriate limiting definition.

### Counterexample: conditioning is not causation

**Input:** umbrella sales and wet roads are both more common on rainy days.
**Mechanism:** `P(wet roads|umbrella sales)` can be high because rain is a
common cause. **Output:** the conditional association does not imply that buying
an umbrella makes roads wet. **Inspect:** list the intervention `do(umbrella
sales)` separately. **Decision:** use an experiment or causal model for an
intervention claim.

### Production-shaped example: slice metrics

**Input:** a model is evaluated only on cases routed to human review. **Mechanism:**
the reported error is `P(error|reviewed)`, not `P(error|all eligible cases)`.
**Output:** the slice may be useful for reviewer workload but not for overall
quality. **Inspect:** compare the selection rule and denominators. **Decision:**
report selection-conditioned and population-level metrics separately.

## Two ways to see it

### Builder view

Write every metric as `P(numerator event | denominator event)` before coding it.
In a table, label the denominator with a total. In a pipeline, log which filter
created the conditioning set.

### Systems or causal view

Conditioning can remove cases, reveal selection effects, or create dependence.
It is evidence under a revised information state, not a guarantee that changing
the conditioned variable will change the outcome.

## Hands-on

Create the classifier table from Example A and functions that compute
`p(a_given_b)` from named cells. Add a tree representation and verify that each
terminal branch equals the corresponding table cell.

**Deliberate failure:** implement precision as `tp/(tp+fn)` instead of
`tp/(tp+fp)`. **Test:** the fixture must expect precision `0.60` and sensitivity
`0.75`, so the swapped denominator fails. **Reset:** restore the function and add
an assertion that the two metrics need not be equal. **No-code route:** shade
the relevant column and row in the table before calculating.

## Checkpoint

- [ ] Calculate a conditional probability from a 2×2 table and state its denominator.
- [ ] Use the multiplication rule to recover a joint probability.
- [ ] Explain why `P(A|B)` and `P(B|A)` can differ.
- [ ] Give a conditioning example that is not a causal claim.

## What this does not solve

Conditional probability does not select the right population, correct selection
bias, or identify causal effects. A conditional estimate can be precise for the
wrong slice. Independence, total probability, and Bayes’ rule provide the next
ways to compose or reverse these quantities.

## Continue, go deeper, apply it

- Continue: Independence and conditional independence
- Go deeper: Uncertainty and decision
- Apply it: Base rates, Bayes, and simulation
