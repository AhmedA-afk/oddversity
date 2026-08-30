---
title: "Bayes’ rule and base rates"
track: "maths-foundations"
status: live
summary: "Bayes’ rule reverses a conditional using a joint event and a base rate: P(H|E)=P(E|H)P(H)/P(E)."
duration: "5 min read"
---

## The short answer

Bayes’ rule reverses a conditional using a joint event and a base rate: `P(H|E)=P(E|H)P(H)/P(E)`. The evidence rate `P(E)` is a weighted sum over hypotheses. A sensitive test or high retrieval score does not determine the posterior alone; prevalence and false-positive behaviour can dominate the decision.

## Why this matters

People naturally read “how likely is this evidence if the case is positive?” as
“how likely is the case positive given the evidence?” AI systems make the same
mistake when a detector’s true-positive rate is reported without its base rate.
Use a frequency table first: it makes the denominator visible and prevents an
inverse-probability error.

## How it works

Start with the multiplication rule in two directions:

`P(H∩E)=P(E|H)P(H)=P(H|E)P(E)`.

Divide by `P(E)>0` to obtain

`P(H|E)=P(E|H)P(H)/P(E)`.

If hypotheses `Hᵢ` partition the population, the denominator is
`P(E)=ΣᵢP(E|Hᵢ)P(Hᵢ)`. The prior `P(H)` is the base rate before the evidence;
the posterior `P(H|E)` is after it. This is probability updating under a stated
model, not a causal explanation for why the evidence occurred.

### Numerical and visual perspective

Use 10,000 cases rather than decimals. With 1% prevalence, 90% sensitivity,
and 5% false-positive rate: 90 true positives, 495 false positives, and
`90/(90+495)=0.1538` positive predictive value. In a tree, the rare positive
branch is narrow before the test; a modest false-positive branch from the large
negative population can be wider after the test.

### An illustrative story

A team celebrated a detector because it caught nine of ten bad cases, then found
that most alerts were benign when the bad event was rare. The missing calculation
was the base rate. This is an illustrative story, not an empirical performance
claim.

## Worked examples and variations

### Example A: diagnostic update by frequency table

**Input:** prevalence 1%, sensitivity 90%, false-positive rate 5%, 10,000 cases.
**Mechanism:** 100 are positive, giving 90 true positives; 9,900 are negative,
giving 495 false positives. **Output:** `P(positive|flag)=90/585≈15.4%`.
**Inspect:** the denominator is all flagged cases. **Decision:** use the flag
for triage or confirmation, not as a definitive diagnosis.

### Example B: a better false-positive rate

**Input:** keep prevalence and sensitivity, lower false-positive rate to 1%.
**Mechanism:** 90 true positives and 99 false positives. **Output:**
`90/(90+99)≈47.6%`. **Inspect:** a five-fold false-positive improvement has a
large posterior effect because negatives are numerous. **Decision:** measure
false positives in the deployment population, not only on a balanced test set.

### Boundary case: perfect specificity

**Input:** `P(E|not H)=0`, and a positive evidence event `E` occurs. **Mechanism:**
no negative case can produce `E`, so the numerator and denominator contain only
positive cases (assuming the event has nonzero probability). **Output:**
`P(H|E)=1`. **Inspect:** “zero false positives” must be supported over the target
domain and sample size. **Decision:** treat this as a model assumption to test,
not a permanent property of a finite benchmark.

### Counterexample: swapping the condition

**Input:** `P(flag|positive)=0.90` in Example A. **Mechanism:** calling 90% the
probability a flagged case is positive ignores the 495 false positives.
**Output:** the inverse claim is 15.4%, not 90%. **Inspect:** write the vertical
bar after the conditioning symbol. **Decision:** use `P(positive|flag)` for the
alert decision.

### Example C: retrieval evidence

**Input:** a document is relevant with prior probability `0.02`; a query term
appears in 70% of relevant documents and 10% of irrelevant documents.
**Mechanism:** numerator `0.70·0.02=0.014`; denominator
`0.014+0.10·0.98=0.112`; posterior is `0.125`. **Output:** the term raises the
prior from 2% to 12.5%. **Inspect:** relevance is still uncertain. **Decision:**
combine additional evidence or use a calibrated ranking interpretation.

## Two ways to see it

### Builder view

Store the four cells of a confusion table and calculate the posterior from them.
Keep base rates, likelihoods, and decision thresholds as separate fields so a
population shift can be audited.

### Systems or reviewer view

Ask “positive among what?” and “what was the prevalence where this runs?” A
balanced evaluation set is convenient for comparison but does not automatically
represent deployment prevalence.

## Hands-on

Implement a deterministic table simulator for 10,000 cases. Generate labels at
1% prevalence, generate flags from fixed sensitivity and false-positive rates,
and compare the simulated posterior with the frequency-table calculation.

**Deliberate failure:** calculate `tp/(tp+fn)` and label it “probability positive
given flag.” **Test:** the fixture must expect approximately 0.154 for the
posterior and 0.90 for sensitivity; both names and values must differ. **Reset:**
restore the denominator and rerun with false-positive rate 1%. **No-code route:**
draw 100 positive and 9,900 negative tokens, then mark flags in two colours.

## Checkpoint

- [ ] Derive Bayes’ rule from the multiplication rule.
- [ ] Compute a posterior from a frequency table and state its denominator.
- [ ] Explain why changing a base rate changes the posterior even with fixed test rates.
- [ ] Distinguish sensitivity, false-positive rate, and positive predictive value.

## What this does not solve

Bayes’ rule cannot rescue a false likelihood model, biased base rate, label error,
or a decision policy that ignores costs. A posterior is conditional on the
evidence and assumptions supplied; it is not a guarantee or a causal effect.

## Continue, go deeper, apply it

- Continue: Random variables and support
- Go deeper: Classifiers, thresholds, and calibration
- Apply it: Base rates, Bayes, and simulation
