---
title: "Use probability to describe uncertainty and data variation"
track: "machine-learning"
status: live
summary: "Probability gives ML a language for uncertain outcomes, noisy observations, and assumptions about how data was generated."
duration: "3 min read"
---

## The short answer

Probability gives ML a language for uncertain outcomes, noisy observations, and assumptions about how data was generated. Statistics helps estimate those quantities from samples and quantify variation. A model’s confidence is meaningful only relative to its data, calibration, and decision context; it is not a guarantee.

## The mechanism

Separate `P(data | model)` from `P(model | data)`. A likelihood says how well a
model explains observations; a posterior combines evidence with prior beliefs.
Sampling distributions explain why two train/test scores can differ even when the
pipeline is unchanged.

## Four examples

### Example A: base rates

If a rare event has a low prior probability, a positive test can still have many
false positives. Always inspect the base rate before celebrating a score.

### Example B: confidence interval

A validation metric from a small sample is an estimate with uncertainty. Report
the sample size and variation instead of treating the decimal as exact.

### Boundary case: selective labels

You may observe outcomes only for cases humans chose to review. The missing labels
are not random, so a sample average can be misleading.

### Counterexample: probability equals truth

`0.9` can mean a calibrated frequency, a ranking score, or an untested neural
output. Ask what experiment gives the number meaning.

## An illustrative story

A model was “90% confident” on a new region where its training data had almost no
examples. The number reflected an output scale, not evidence that the local case
was safe.

## Two ways to see it

### Statistical view

Ask what population, sample, estimator, and uncertainty the result represents.

### Product view

Ask which action changes when the probability changes and who pays for error.

## Hands-on

Simulate a rare event with a known base rate. Compute precision for three test
qualities, then bootstrap a validation metric. Write which statements are facts,
estimates, or assumptions.

## Checkpoint

- [ ] Base rate and conditional probability are not confused.
- [ ] A metric includes sample size or uncertainty context.
- [ ] You can name the population your estimate describes.

## What this does not solve

Probability does not choose a prior, define a fair cost, or correct biased
sampling. Those are modeling and governance choices.

## Continue, go deeper, apply it

- Continue: Optimization, loss, and gradient descent
- Go deeper: Bayesian and generative learning
- Apply it: add uncertainty language to a model evaluation report.

## Conditional probability is the source of many ML mistakes

For events A and B, P(A | B) = P(A and B) / P(B). Bayes' rule reverses a condition:

~~~text
P(disease | positive) = P(positive | disease) × P(disease) / P(positive)
~~~

Suppose 1% of a population has a disease. A test catches 90% of disease cases and has a 5% false-positive rate. Out of 10,000 people, 100 have disease: 90 test positive. Of 9,900 without disease, 495 test positive. The posterior probability after a positive is 90/(90+495) ≈ 15%, not 90%. The base rate did not disappear because the classifier produced a positive score.

## Likelihood, estimation, and a concrete calculation

A Bernoulli model says y is 1 with probability p. For ten independent observations with seven positives, the likelihood is p⁷(1-p)³. Maximizing it gives p-hat = 7/10 = 0.7. The log likelihood is easier to optimize:

~~~text
log L(p) = 7 log(p) + 3 log(1-p)
~~~

Taking its derivative and setting it to zero yields 7/p - 3/(1-p) = 0, hence p = 0.7. Logistic regression generalizes this estimation idea by making p vary with features through a sigmoid. Maximum likelihood chooses the parameters whose implied probabilities make observed labels least surprising.

## Sampling variation and intervals

A mean or metric computed from samples changes if the sample changes. If an estimated rate is p-hat from n independent observations, an approximate standard error is sqrt(p-hat(1-p-hat)/n). For p-hat = 0.70 and n = 100, this is about 0.046. A rough 95% interval is 0.70 ± 2×0.046, or approximately [0.61, 0.79]. This approximation weakens for very small samples, extreme probabilities, and clustered observations; bootstrap or better binomial intervals are safer in those settings.

Statistical significance is not practical significance. With millions of examples, a tiny metric improvement can be statistically detectable while too small to justify latency, complexity, or policy risk.

## Debugging clinic: a confidence score with no calibration

Partition predictions into bins 0.0–0.1, 0.1–0.2, and so on. Within each bin, calculate average predicted probability and observed positive rate. If the 0.8–0.9 bin has mean score 0.85 but only 0.55 positives, the model is overconfident in that range. Repeat by region and time. A globally calibrated model can be poorly calibrated for the cases that matter most.

Do not use calibration data to also report final performance without documenting the reuse. Hold out a calibration set or use cross-validated calibration.

## Assessment: probability audit

Answer each step for a fraud alert with 0.5% prevalence, 80% sensitivity, and 2% false-positive rate: out of 100,000 transactions, how many true and false alerts occur; what is precision; and why might the system still be valuable or unusable? Then derive the maximum-likelihood estimate of a Bernoulli probability after observing 12 successes in 20 trials. State two assumptions behind your uncertainty calculation.
