---
title: "Public-data project: Bank marketing campaign under time and contact constraints"
track: machine-learning
order: 892
status: live
summary: "Design a leakage-safe term-deposit campaign model and defend which information could exist at each decision point."
duration: "8–12 hours"
updated: "2026-08-30"
---

## Project brief

**Executable project package:** [student starter, deterministic fixture, and public checks](/classical-ml-projects/public-data/bank-marketing/).

Use the [UCI Bank Marketing dataset](https://archive.ics.uci.edu/dataset/222/bank%2Bmarketing) to build a decision-support prototype for whether to contact a customer about a term deposit. Your report must make a precise prediction-time contract: **before a campaign call is placed**. That contract is the heart of this project. A high-scoring model that uses facts produced during or after a call is a leakage demonstration, not a valid campaign model.

This is an educational marketing benchmark, not permission to automate financial-product targeting. Do not use it for credit, suitability, vulnerability, or exclusion decisions.

## Authoritative source, licence, and provenance

Use UCI’s dataset page and cite the linked DOI and the dataset creators. UCI declares **CC BY 4.0**; preserve attribution and the source description. The records concern Portuguese bank telephone marketing campaigns, with repeated contacts possible, and the source presents variants with different feature sets and temporal ordering. State exactly which file/version you used and why.

## Data card

| Field | Required statement |
| --- | --- |
| Unit | A campaign contact record, not necessarily an independent customer. |
| Target | Recorded subscription outcome `y`. |
| Context | Portuguese direct-marketing phone campaigns; source-era behaviour and policies may not transfer. |
| Temporal fields | Month/day-of-week and campaign-order context where supplied. |
| Sensitive/proxy risk | Age, job, marital status, education, default/housing/loan indicators and contact history can encode vulnerability or unequal access. |
| Intended use | Study temporal validation, leakage, decision thresholds, and contact-cost trade-offs. |

## Leakage and missingness hazards

Create a feature-availability table with columns: feature, when known, retain? and rationale. `duration` is the canonical trap: it is known after a call and must be excluded from the pre-call model. Treat “unknown” categories deliberately. Repeated contacts and client records can cross a random split, causing overly optimistic evaluation; use group-aware safeguards when an identity/near-identity is available, and clearly state the limitation when it is not.

Do not use `pdays`, `previous`, or campaign variables casually. Their meaning is tied to prior campaign process and may be unavailable, stale, or altered by intervention. Produce one invalid all-features model only as a labelled leakage audit, then exclude it from conclusions.

## Split and decision design

Prefer the ordered, richer UCI file and perform chronological train/validation/test blocks where its ordering supports that claim; otherwise explain why a temporal claim cannot be made and use a stratified split with a weaker deployment inference. Never shuffle future records into training if you claim a campaign forecast.

Evaluate PR-AUC, ROC-AUC, log loss, Brier score, calibration, lift/precision at a fixed contact budget, and expected utility under explicitly declared hypothetical contact/benefit costs. Do not invent business values: supply a sensitivity table over several stated cost ratios instead.

## Required model comparisons

1. Contact nobody / contact everyone / prevalence baselines.
2. Regularised logistic regression using pre-call features only.
3. A tuned tree ensemble using the same availability contract.
4. A calibrated selected model and a budgeted ranking policy.

Compare discrimination, calibration, stability by time block, and who enters the top contact bucket. Audit age bands and other context groups as diagnostic slices; do not claim that an observed gap establishes discrimination or causality.

## Deliverables

- Dataset provenance file, licence note, and feature-availability table.
- Reproducible temporal or explicitly non-temporal split code.
- Baseline, linear, and non-linear models with a fixed evaluation script.
- A campaign policy memo: threshold/budget, uncertainty, non-actionable findings, and a human-review/opt-out requirement.
- Leakage appendix contrasting `duration`-included and pre-call models.

## Rubric (100 points)

| Criterion | Points |
| --- | ---: |
| Provenance and prediction-time contract | 20 |
| Split validity and leakage analysis | 25 |
| Model/ranking comparison and calibration | 20 |
| Cost-sensitive decision analysis | 15 |
| Slice analysis and responsible-use limits | 10 |
| Reproducibility | 10 |

## Responsible-use constraints

No automated outreach, eligibility, credit, or “propensity” decision is permitted by this project. Do not equate a historical subscription label with customer benefit. State how consent, contact frequency limits, opt-outs, and human oversight would be required before any real campaign use.
