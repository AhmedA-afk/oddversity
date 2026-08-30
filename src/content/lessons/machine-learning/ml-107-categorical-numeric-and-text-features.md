---
title: "Categorical, numeric, and text features"
track: "machine-learning"
order: 107
status: live
summary: "Choose feature representations that respect measurement meaning, model assumptions, sparsity, and future unknown values."
duration: "27 min read"
updated: "2026-08-30"
---

## The short answer

Represent a field according to what it measures, not its storage type. Preserve numeric scale and units; encode nominal categories without invented order; encode ordinal categories with justified order; and turn text into a representation appropriate to the task and vocabulary available at prediction time.

## Why this matters

An integer code for a city is not a number with geometric distance. A category that appears only after the train period will occur in production. Text can contain an answer key, identifiers, sensitive details, or a useful explanation—often all at once.

## How it works

For numeric features, inspect units, transformations, and meaningful zeroes. For categories, choose one-hot encoding, frequency/target encoding with strict fold isolation, hashing, or a model with native categorical treatment. For text, start with a transparent bag-of-words or TF–IDF baseline, then consider richer representations only when the task and validation justify them.

```text
nominal: city = {Delhi, Pune, ...}  -> separate indicators
ordinal: service_tier = {basic < standard < premium} -> ordered code only if order is real
```

## Worked examples and variations

1. Income is positive and skewed: compare raw value and `log(1 + income)` while retaining units in documentation.
2. Product SKU is high-cardinality: a one-hot encoding may overfit; use grouped hierarchy or carefully cross-fitted encoding.
3. Satisfaction levels are ordinal: encoding 1–5 may be suitable, but equal distances are still an assumption.
4. Boundary case: a binary yes/no variable can be a single indicator with an explicit missing state.
5. Counterexample: label-encoding unordered colors as 0, 1, 2 makes a linear model infer that blue is between red and green.
6. Text notes recorded after an outcome may contain post-decision language and must fail the availability audit.

## Two ways to see it

Feature engineering is basis construction: it chooses functions of raw observations. It is also interface design between the world and the model: the representation determines what distinctions the model can make.

## Hands-on

Build two pipelines for a mixed table: one-hot plus linear model, and a tree baseline with documented category handling. Intentionally let the test vocabulary build the encoder. Reset by fitting vocabulary on training rows only and route unseen values to a known bucket.

## Checkpoint

- Does the representation invent an order or distance?
- What happens to an unseen category at serving time?
- Does text contain information unavailable at `t0`?

## What this does not solve

A good representation does not establish relevance, fairness, or causal validity. More features can intensify leakage and operational fragility.

## Continue, go deeper, apply it

Audit missingness separately: absence is often a signal about collection, not a value to casually fill in.
