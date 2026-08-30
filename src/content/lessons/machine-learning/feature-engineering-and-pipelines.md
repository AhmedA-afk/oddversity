---
title: "Make feature engineering reproducible"
track: "machine-learning"
status: live
summary: "Feature engineering turns raw observations into representations a model can use."
duration: "3 min read"
---

## The short answer

Feature engineering turns raw observations into representations a model can use. A pipeline makes transformations repeatable across training and serving, keeps fitting inside the training boundary, and records the meaning and availability of every feature. The best feature is not useful if it cannot be computed consistently at decision time.

## The pipeline contract

```text
raw input -> validate -> fit transforms on train -> transform -> model -> decision
```

Persist preprocessing parameters, schema versions, and missing-value behavior.
Avoid a notebook-only transformation that the serving path cannot reproduce.

## Four examples

### Example A: text counts

Fit a vocabulary on training data, then transform validation and production with
that vocabulary. Unknown words need a defined bucket.

### Example B: date features

Extract day-of-week and age from a timestamp available at prediction time. Do not
derive “days until resolution” from a future event.

### Boundary case: category explosion

A new category can create an unseen feature at serving time. Use an unknown bucket,
hashing, or a controlled update process.

### Counterexample: fit preprocessing globally

Normalizing or selecting features using the full dataset leaks information across
the split. Put transforms inside the evaluation pipeline.

## An illustrative story

A model performed well in a notebook and failed in the service because the
training code silently filled missing values with a global median while serving
used zero. The model was unchanged; the feature contract was not.

## Two ways to see it

### Modeling view

Representation changes the hypothesis space and what patterns are learnable.

### Systems view

Feature computation is a dependency with schema, latency, freshness, ownership,
and rollback concerns.

## Hands-on

Build a pipeline for a timestamped tabular dataset. Add numeric scaling,
categorical unknown handling, and a time-safe feature. Test train/serve parity with
fixtures for missing, unseen, and future-valued fields.

## Checkpoint

- [ ] Transform fitting is isolated to training data.
- [ ] Serving behavior for missing and unseen values is tested.
- [ ] Features have source, timestamp, and owner metadata.

## What this does not solve

A reproducible pipeline can reproducibly encode a bad policy or a biased source.
Domain review and impact evaluation remain necessary.

## Continue, go deeper, apply it

- Continue: Clustering and k-means
- Go deeper: ML systems and reproducibility
- Apply it: publish a feature dictionary and train/serve parity tests.

## Treat transformations as part of the model

The learned estimator is only one stage of a prediction system. A categorical encoder, a date parser, an outlier rule, and an imputer each decide what the model can see. If they differ between training and serving, the same raw customer can receive a different prediction for reasons no coefficient inspection will reveal.

Write every transformation as a function with two phases:

~~~text
fit(train raw data) -> parameters and schema
transform(raw data, saved parameters) -> model-ready matrix
~~~

For standardization, fitting produces the training mean and standard deviation. Transforming turns a raw value x into (x - mean)/standard deviation. Production must use the saved values, not the mean of today's request batch. For one-hot encoding, fitting produces the allowed category list and an explicit unknown-category rule.

## Worked example: a category that arrives after launch

Training orders contain shipping methods Standard and Express. The encoder learns columns [is_standard, is_express]. A production order with Same-day appears. If the service drops the row, maps Same-day to all zeroes without recording it, or dynamically creates a third column, predictions become inconsistent. A safe contract might say:

1. map any unseen method to an unknown bucket;
2. increment an unknown-rate metric;
3. reject a request if the schema version is incompatible;
4. retrain only after the new category is understood and approved.

Unknowns are not merely an engineering exception. A rising unknown rate is evidence of distribution shift.

## Feature engineering calculations

Suppose raw delivery distance has training mean 12 km and standard deviation 4 km. A 20 km job transforms to (20 - 12)/4 = 2. A 4 km job transforms to -2. That scaling lets a regularized linear model compare distance with another feature measured in thousands of currency units. It does not make the variables equally meaningful, and it must never be fit using validation or future rows.

For a cyclic feature such as hour of day, 23:00 and 00:00 should be close. Encode hour h as:

~~~text
sin(2πh / 24), cos(2πh / 24)
~~~

At h = 23 and h = 0 the two vectors are close; a raw numeric hour makes them look far apart. This is an example where representation expresses known geometry before a model is chosen.

## Debugging clinic: train/serve parity

Take 20 fixed raw records—ordinary, missing, unseen category, extreme value, malformed date—and store the expected transformed values. Run the training pipeline and serving pipeline against exactly those records. Compare column names, ordering, dtypes, and values with a strict tolerance. Then deliberately change a category spelling or date timezone and ensure the test fails loudly rather than silently producing a prediction.

~~~python
assert list(train_features.columns) == list(serve_features.columns)
assert_allclose(train_features.values, serve_features.values, atol=1e-8)
assert serving.transform({"method": "same_day"}).unknown_method == 1
~~~

## Assessment: design a feature contract

For a food-delivery ETA model, specify transformations for restaurant ID, order timestamp, distance, missing traffic signal, and a newly introduced vehicle type. For each, name the fit-time artifact, inference behavior, failure behavior, and monitoring metric. Explain why an apparently harmless global normalization introduces evaluation leakage.
