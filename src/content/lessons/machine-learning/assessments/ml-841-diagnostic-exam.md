---
title: "Diagnostic exam: the ML readiness audit"
track: "machine-learning"
order: 841
status: live
summary: "A scored diagnostic that identifies whether to begin with modelling, evaluation, or mathematical repair."
duration: "90–120 min"
updated: "2026-08-30"
---

## Purpose

Use this before Assignment 1. It diagnoses reasoning, not library recall. Work without an LLM or notebook for Part A; use a calculator only where stated. Keep your written reasoning: it becomes the first item in your learning portfolio.

## Exam blueprint

| Part | Task | Points |
| --- | --- | ---: |
| A | Interpret a binary-risk table; calculate prevalence, precision, recall, specificity, and expected decision cost at two thresholds | 20 |
| B | Derive the mean-squared-error gradient for one linear-regression coefficient and complete two gradient steps | 15 |
| C | Diagnose a deliberately leaky customer-churn split and propose a time-safe replacement | 15 |
| D | Compare regularised linear regression, a tree ensemble, and kNN for three data conditions | 15 |
| E | Explain why a high AUC can still be unsafe; propose calibration and slice checks | 10 |
| F | Compute one PCA projection from a centred two-dimensional dataset and state what information is lost | 10 |
| G | Read an experiment log and identify the one unsupported conclusion, one missing control, and one reproducibility defect | 15 |

## Submission artefacts

Submit `diagnostic.pdf` with every calculation, units, and assumptions; `diagnostic-data.csv` if you used a spreadsheet; and a one-page reflection answering: *What evidence would change my answer?* Name every source, tool, and collaborator. Do not submit only final numbers.

## Scoring rubric and placement guide

Award full credit for correct reasoning, even with minor arithmetic error. Award half credit when the method is right but assumptions are unstated. Award no credit for a correct number produced without a traceable calculation. For C, a random split is a failing answer when the label is observed after the feature window. For E, “use accuracy” without a decision threshold earns no credit.

| Score | Placement | Required next move |
| ---: | --- | --- |
| 85–100 | Ready | Start Assignment 1; revisit only missed topics. |
| 70–84 | Ready with repair | Complete two worked problems per missed domain before Assignment 1. |
| 50–69 | Foundations repair | Rework probability, linear algebra, optimisation, and validation lessons first. |
| Below 50 | Rebuild | Use the Maths Foundations route and retake within two weeks. |

## Self-check before submitting

- Did every metric identify its positive class and denominator?
- Did every split respect when information becomes available?
- Did you distinguish prediction quality from decision quality?
- Could another learner reproduce each number from your working?

## Common failure modes

Do not infer causality from an observational association. Do not standardise using the full dataset before splitting. Do not call an explanation “fairness evidence.” A polished answer with missing assumptions is weaker than a transparent, incomplete answer.

## Instructor notes

Keep this diagnostic ungraded or low stakes. Use the rubric to form repair groups, not to rank learners. Ask learners to correct one answer after feedback; the correction quality is useful evidence of readiness.
