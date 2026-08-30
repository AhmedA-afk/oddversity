---
title: "Multiclass and multilabel classification"
track: "machine-learning"
order: 207
status: live
summary: "Design targets, probabilities, metrics, and decisions for one-of-many and many-at-once prediction tasks."
duration: "23 min read"
updated: "2026-08-30"
---

## The short answer

Multiclass means exactly one class is true; multilabel means several may be true. They require different output constraints, losses, and evaluation. Treating them as interchangeable creates invalid probabilities and poor threshold choices.

## Why this matters

Ticket routing, diagnosis codes, content tags, and product categories can look similar in a table but imply different business actions. The target definition is part of the model design.

## How it works

Softmax multiclass models produce class probabilities summing to one. One-vs-rest trains separate binary classifiers and can be practical, but its scores may not sum to one. Multilabel systems usually use one sigmoid probability per label, then choose label-specific thresholds or constrained decoding. Report micro metrics for label-instance volume and macro metrics for per-label parity; neither alone is enough under severe imbalance.

## Worked examples and variations

1. An image classified as one of ten digits is multiclass.
2. A support email tagged billing, urgent, and account-access is multilabel.
3. “No applicable label” must be explicit; otherwise every example is forced into a wrong class.
4. A rare safety label can have high micro-F1 while its recall is effectively zero.
5. Mutually exclusive labels encoded as independent sigmoids can predict incompatible categories together.

## Two ways to see it

Multiclass allocates one probability budget among alternatives. Multilabel estimates a set of conditional events; correlations between labels may need a later structured or rule-based layer.

## Hands-on

Write target contracts for one multiclass and one multilabel dataset, including allowed states and action for “none.” Intentionally apply softmax to independent tags and locate the forced trade-off. Reset with independent sigmoids, label-specific validation thresholds, and a per-label error table.

## Checkpoint

When must probabilities sum to one? Why can macro and micro F1 disagree sharply?

## What this does not solve

Independent label models do not automatically respect taxonomy constraints, missing labels, or changing class definitions.

## Continue, go deeper, apply it

Follow with thresholding and human review. Apply this target-design exercise before collecting labels or selecting a model.
