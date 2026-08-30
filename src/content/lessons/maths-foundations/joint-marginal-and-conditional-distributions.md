---
title: "Joint, marginal, and conditional distributions"
track: "maths-foundations"
status: live
summary: "A joint distribution describes pairs or tuples together; a marginal distribution sums or integrates out the variables you are not asking."
duration: "4 min read"
---

## The short answer

A joint distribution describes pairs or tuples together; a marginal distribution sums or integrates out the variables you are not asking about; a conditional distribution renormalizes a slice after one variable is known. Move among them with sums, ratios, and checks that total mass is one. AI labels, features, predictions, and missingness all require this distinction.

## Why this matters

The joint table preserves co-occurrence. A marginal can answer “how common is
each label?” but cannot recover which feature values occur with which labels.
Conditionals drive prediction, while marginals describe population mix. Losing
the joint too early makes dependence and impossible combinations invisible.

## How it works

For discrete `X,Y`, a joint PMF is `p(x,y)=P(X=x,Y=y)`. Marginals are

`p_X(x)=Σ_y p(x,y)` and `p_Y(y)=Σ_x p(x,y)`.

If `p_Y(y)>0`, the conditional is
`p_{X|Y}(x|y)=p(x,y)/p_Y(y)`, and the reverse factorisation is
`p(x,y)=p_{X|Y}(x|y)p_Y(y)`. A joint table is valid when all cells are
non-negative and sum to one; every marginal and every conditional row must also
normalise. Independence is the special case `p(x,y)=p_X(x)p_Y(y)`.

### Numerical and visual perspective

Use a heatmap: cell colour is joint mass; row and column sums are marginal bar
charts. To condition on `Y=y`, take that column, then divide by its total so it
becomes a probability vector. A zero-total column has no ordinary conditional.

### An illustrative story

A label dashboard showed a healthy marginal class balance, but a feature slice
contained almost no examples of one class. The marginal hid a joint-distribution
gap. This is an illustrative data-review pattern, not a benchmark result.

## Worked examples and variations

### Example A: a valid binary joint table

**Input:** rows `Y=0,1`, columns `X=0,1`, with cells `0.4,0.1,0.2,0.3`.
**Mechanism:** total is 1; `P(X=1)=0.1+0.3=0.4`, `P(Y=1)=0.2+0.3=0.5`.
**Output:** `P(X=1|Y=1)=0.3/0.5=0.6`. **Inspect:** the conditional uses the
`Y=1` column total. **Decision:** report the slice and its support.

### Example B: labels and predictions

**Input:** a confusion table is a joint distribution of true label `Y` and
prediction `Ŷ` after dividing counts by the evaluation total. **Mechanism:**
row sums give true-label prevalence; column sums give prediction prevalence.
**Output:** diagonal sum is accuracy; a column-normalized slice gives precision.
**Inspect:** changing the marginal class mix can change accuracy. **Decision:**
retain the joint table for metric recomputation.

### Boundary case: impossible combination

**Input:** a joint table assigns positive mass to `age<0` and `account_type=child`
when the domain forbids it. **Mechanism:** arithmetic can still normalise the
table, but semantic support is invalid. **Output:** a mathematically valid but
domain-inconsistent joint model. **Inspect:** apply support constraints to cells.
**Decision:** reject or relabel the fixture rather than smoothing it away.

### Example C: independent factorisation

**Input:** `p_X(1)=0.4`, `p_Y(1)=0.5` and independence is assumed.
**Mechanism:** `p(1,1)=0.4·0.5=0.2`; fill the other cells by products.
**Output:** the table has cells `0.3,0.2,0.3,0.2` in a consistent layout.
**Inspect:** every conditional equals its marginal. **Decision:** use this
shortcut only if its assumption is defensible.

### Counterexample: marginals do not determine the joint

**Input:** two variables are each fair bits. **Mechanism:** they may be equal
always, opposite always, or independent; all three have the same marginals.
**Output:** different joints, same marginal distributions. **Inspect:** the
co-occurrence cells contain the missing information. **Decision:** do not infer
dependence or conditional predictions from marginals alone.

## Two ways to see it

### Builder view

Store the joint count table before deriving metrics. Use row/column sums and
conditional normalisation as executable invariants.

### Systems or reviewer view

Look for support holes, sparse cells, and selection-conditioned tables. A model
can be correct on a marginal while failing on a joint slice that matters to an
action.

## Hands-on

Implement the binary table from Example A. Check total mass, compute both
marginals, normalise each nonzero conditional slice, and render a heatmap or
text grid.

**Deliberate failure:** divide the `Y=1` column by the grand total instead of
the column total. **Test:** the conditional column must sum to 1 and give 0.6
for `P(X=1|Y=1)`. **Reset:** restore slice normalisation and add a zero-column
test that returns “undefined,” not NaN silently. **No-code route:** shade one
column, add it, then rescale its cells.

## Checkpoint

- [ ] Derive marginals from a joint table.
- [ ] Compute a conditional distribution and state its support/denominator.
- [ ] Explain why two equal marginals can have different joints.
- [ ] Identify an impossible joint combination from domain constraints.

## What this does not solve

A valid joint distribution does not prove the data are representative, the
conditional is stable, or an intervention is identified. Sparse cells create
uncertainty that normalisation alone hides. Conditional expectation and variance
summarise these slices while retaining the conditioning variable.

## Continue, go deeper, apply it

- Continue: Conditional expectation and conditional variance
- Go deeper: Probability and statistics for ML
- Apply it: Base rates, Bayes, and simulation
