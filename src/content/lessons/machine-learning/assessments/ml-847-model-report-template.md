---
title: "Model report template: predictive system review"
track: "machine-learning"
order: 847
status: live
summary: "A fillable evidence template for communicating a predictive model to technical and decision stakeholders."
duration: "45–90 min"
updated: "2026-08-30"
---

## Use this template

Complete every bracketed field with evidence or write **unknown**. A model report is not marketing: it records the boundary between demonstrated performance and speculation.

## 1. Decision and scope

- **Decision owner / action:** [ ]
- **Population, unit, and prediction time:** [ ]
- **Target and label-construction rule:** [ ]
- **Intended use / prohibited use:** [ ]
- **Benefits, error harms, and safe default:** [ ]

## 2. Data and method

- **Data card/version/licence and coverage window:** [ ]
- **Feature availability timeline and exclusions:** [ ]
- **Split strategy and reason:** [ ]
- **Baselines and selected model/configuration:** [ ]
- **Reproduction command, environment digest, run ID:** [ ]

## 3. Evidence

| Question | Result | Uncertainty / caveat |
| --- | --- | --- |
| Primary decision metric | [ ] | [ ] |
| Calibration / threshold / expected cost | [ ] | [ ] |
| Temporal, group, and subgroup performance | [ ] | [ ] |
| Error analysis and counterexamples | [ ] | [ ] |
| Ablation / sensitivity / leakage checks | [ ] | [ ] |

## 4. Release decision

State **launch, shadow, limited launch, or reject**, then name the owner, monitoring signals, alerts, rollback trigger, retraining constraints, privacy/security issues, and unresolved risks. Attach plots and raw results rather than screenshots alone.

## Reviewer rubric (40 points)

Score 0–4 each for decision clarity, data provenance, split correctness, reproducibility, metric appropriateness, uncertainty, slice evidence, error analysis, risk controls, and honest conclusion. A score below 3 in split correctness, reproducibility, or risk controls blocks release regardless of total.

## Self-check and failures

Can a reviewer find each claim’s artefact? Does “improved” name its comparator? Are proxy and missing-data risks explicit? Common failures are unversioned data, test-set tuning, aggregate-only metrics, and recommendations stronger than the evidence.
