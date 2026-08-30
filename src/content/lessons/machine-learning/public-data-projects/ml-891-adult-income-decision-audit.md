---
title: "Public-data project: Adult income decision audit"
track: machine-learning
order: 891
status: live
summary: "Build, audit, and communicate a census-income classifier without treating a historical label as a decision rule."
duration: "8–12 hours"
updated: "2026-08-30"
---

## Project brief

**Executable project package:** [student starter, deterministic fixture, and public checks](/classical-ml-projects/public-data/adult-income/).

Develop a reproducible classification study using the [UCI Adult dataset](https://archive.ics.uci.edu/dataset/2/adult). The narrow technical task is to estimate the recorded label `>50K` versus `<=50K` from the supplied census attributes. The educational task is more important: distinguish predictive performance from a claim that income, opportunity, creditworthiness, hiring merit, or entitlement should be predicted or decided from these attributes.

Do not deploy this model, present it as an income estimator, or frame it as a policy recommendation. This is a historical benchmark with sensitive demographic fields and an old thresholded label.

## Authoritative source, licence, and provenance

Download only from UCI or through its documented `ucimlrepo` interface. Cite Becker and Kohavi and UCI’s DOI listed on the dataset page. UCI lists the dataset under **CC BY 4.0**; retain attribution in your repository and report. CC BY permits reuse with attribution, but it does not make a sensitive or historically contingent prediction appropriate for real decisions.

UCI describes 48,842 records extracted from the 1994 Census database, using stated inclusion filters. That selection process, the age of the source, the binary threshold, and the dataset’s construction mean this is neither a representative population sample nor a ground-truth measure of individual potential.

## Data card

| Field | Required statement |
| --- | --- |
| Unit of analysis | A retained census record; do not infer that it represents a unique contemporary person. |
| Outcome | Historical income category above/below a fixed $50K annual threshold. |
| Inputs | Demographic, education, work, capital, and country-related fields supplied by UCI. |
| Sensitive/contextual attributes | `sex`, `race`, age, nationality-related field, and proxies such as relationship, occupation, and education. |
| Intended use | Learning classification, evaluation, calibration, and subgroup-audit methods. |
| Prohibited use | Employment, lending, insurance, immigration, benefit, policing, or any person-level decision. |

Record the exact download date, filename/checksum if available, row count after parsing, parser settings, and every exclusion. Do not silently delete rows with unknown values.

## Leakage, missingness, and preprocessing hazards

Treat `?` as a data value requiring an explicit missingness strategy, not as a category to overlook. Compare an explicit “unknown” category with a train-fitted imputation/indicator approach where appropriate. `education` and `education-num` encode overlapping information; document whether both are retained and why. Do not fit encoders, imputers, scalers, feature selection, or threshold choice on validation/test data.

The supplied train/test division may be used as a final historical holdout, but do not tune on it. If reconstructing a split, stratify by the label and keep every transformation inside a pipeline. Never call sensitive attributes “causes”; they and their proxies may create impressive metrics while encoding social structure.

## Split and evaluation design

Use three partitions: development train, validation, and locked test. Create the development split with a documented random seed and stratification. Select models and operating thresholds only on validation data; open the locked test once. Report class prevalence, ROC-AUC, PR-AUC, log loss, Brier score, calibration curve, and a threshold-specific confusion matrix. Explain why accuracy alone is inadequate.

Run subgroup *evaluation* for at least `sex` and `race` where sample sizes allow, including intervals or uncertainty caveats. Do not optimise a fairness metric on the test set. Discuss base-rate differences, small cells, proxy features, and the fact that parity metrics can conflict.

## Required baselines and comparisons

1. Majority-class and prevalence baselines.
2. Regularised logistic regression with a column-transformer pipeline.
3. A non-linear model such as a depth-controlled tree ensemble.
4. A calibrated version of the selected model, using a validation-only calibration procedure.

Compare models with the same split and a table of discrimination, calibration, threshold performance, fit time, and a short error analysis. Include one deliberately bad experiment: fit preprocessing before the split or tune the threshold on test data, then explain exactly why the resulting estimate is invalid. Do not include that invalid result in model selection.

## Deliverables

- `README` with source URL, licence/attribution, environment, and reproduction command.
- A data card and a feature/target decision log.
- One executable training-and-evaluation pipeline with fixed seeds.
- A model report containing all metrics, calibration and subgroup analyses, an error table, and a no-deployment statement.
- A short appendix showing the deliberate leakage failure and its repair.

## Rubric (100 points)

| Criterion | Points |
| --- | ---: |
| Provenance, licence, and data card | 15 |
| Leakage-safe pipeline and split discipline | 20 |
| Baselines and technically sound comparisons | 20 |
| Calibration, threshold, and subgroup evaluation | 20 |
| Error analysis and responsible-use judgement | 15 |
| Reproducibility and clear communication | 10 |

## Responsible-use constraints

Do not publish row-level data, infer protected traits not supplied, rank individuals, or claim the model is fair because one metric is similar across groups. Your conclusion must name at least two reasons this benchmark should not become a real-world decision system.
