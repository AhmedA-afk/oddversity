---
title: "Naive Bayes and generative versus discriminative modelling"
track: "maths-foundations"
status: live
summary: "Naive Bayes models how features are generated within each class and applies Bayes’ rule to classify."
duration: "4 min read"
---

## The short answer

Naive Bayes models how features are generated within each class and applies Bayes’ rule to classify. Its “naive” assumption is conditional independence of features given the class. This can be badly false while predictions remain useful, especially with small data. Compare it with discriminative logistic regression: generative models learn `p(x|y)p(y)`, while discriminative models learn `p(y|x)` directly.

## Why this matters

Naive Bayes is a transparent probabilistic baseline and a compact lesson in model assumptions. It can perform well with sparse text and small datasets, but correlated features can be double-counted and zero counts can make a class impossible.

**Small incident (illustrative):** two duplicate keywords were both present in a message. Naive Bayes counted each as independent evidence, inflating the posterior for a class. The classifier’s decision was useful on average until the feature vocabulary changed.

## How it works

Bayes’ rule gives `p(y|x) ∝ p(y) p(x|y)`. Naive Bayes factorises `p(x|y)=product_j p(xⱼ|y)`, so log scores are `log p(y)+sum_j log p(xⱼ|y)`. A Bernoulli text model uses feature presence; a multinomial model uses token counts; a Gaussian model uses continuous-feature densities.

### Assumptions and derivation

Conditional independence is the key approximation. Laplace/additive smoothing replaces zero counts with positive pseudo-counts. The model is generative because it defines a joint distribution over features and labels; logistic regression is discriminative because it models the conditional label probability, usually with a linear log-odds relationship.

## AI use

Use Naive Bayes as a fast baseline, interpretable error probe, and model for sparse feature counts. Inspect conditional likelihoods, priors, smoothing, and correlated features. Compare decision quality and calibration with a discriminative baseline on the same split rather than choosing by folklore.

## Worked examples and variations

### Example A — smallest happy path

**Input:** classes spam/ham with priors .5/.5; a token appears with probability .8 in spam and .1 in ham. **Mechanism:** posterior odds multiply by .8/.1=8 when the token appears. **Output:** spam is favoured 8:1 before other tokens. **Inspect:** keep scores in log space. **Next decision:** inspect other tokens and the prior before thresholding.

### Example B — meaningful variation

**Input:** two binary features that are conditionally independent given class. **Mechanism:** their likelihood ratios multiply, or add in log space. **Output:** evidence combines transparently. **Inspect:** estimate conditional tables with counts and smoothing. **Next decision:** use the model as a baseline when the independence approximation is plausible enough.

### Example C — boundary case

**Input:** a token never appears in ham training examples but appears in a ham test message. **Mechanism:** unsmoothed `p(token|ham)=0`. **Output:** ham gets zero posterior probability. **Inspect:** count unseen feature/class combinations. **Next decision:** apply documented smoothing or use a different representation.

### Example D — tempting counterexample

**Input:** two duplicate features both strongly associated with spam. **Mechanism:** naive factorisation counts the same evidence twice. **Output:** overconfident posterior. **Inspect:** compare with a deduplicated feature and a calibration curve. **Next decision:** remove redundancy, change the model, or calibrate with held-out data.

### Example E — generative versus discriminative

**Input:** class-conditional feature distributions are misspecified but the decision boundary is simple. **Mechanism:** logistic regression can fit the conditional boundary without modelling all of p(x|y). **Output:** it may classify better despite less generative structure. **Inspect:** compare held-out log loss, calibration, and data efficiency. **Next decision:** choose the model for the available data and required outputs.

## Computation and interpretation

```python
import math

prior = {"spam": .5, "ham": .5}
token_prob = {"spam": .8, "ham": .1}
log_score = {c: math.log(prior[c]) + math.log(token_prob[c]) for c in prior}
print(log_score)
```

Normalise log scores with log-sum-exp if posterior probabilities are needed. The scores are only as meaningful as the class priors, feature likelihoods, smoothing, and conditional-independence approximation.

## Two ways to see it

### Builder view

Naive Bayes is a count ledger: prior count plus class-conditional feature counts, then log-add and normalise. Every prediction can be inspected feature by feature.

### Systems view

The independence assumption is a compression choice. It makes training and reasoning cheap but can create overconfidence when the same source, user, or policy generates several features.

## Hands-on

Train a two-class Bernoulli Naive Bayes classifier on a six-message local fixture. **Failure fixture:** remove additive smoothing and include a test message with an unseen token/class pair. **Test:** the baseline must reject or expose zero posterior rather than silently returning a confident class; the smoothed version must retain finite log scores. **Reset:** restore the original count table and smoothing constant.

## Checkpoint

- [ ] Write the Naive Bayes decision rule in log form.
- [ ] Explain conditional independence versus marginal independence.
- [ ] Show how additive smoothing prevents a zero likelihood.
- [ ] Contrast one generative and one discriminative modelling choice.

## What this does not solve

Naive Bayes does not make correlated features independent, guarantee calibrated posteriors, or capture causal structure. A good classification baseline can still be a poor generator. Smoothing changes the model and must be validated.

## Continue, go deeper, apply it

- Continue: Latent variables and ELBO intuition
- Go deeper: Exponential families, sufficient statistics, and GLM intuition
- Apply it: Problem framing and baselines
