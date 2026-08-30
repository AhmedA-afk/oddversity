---
title: "Public-data project: Online Retail cohort, demand, and anomaly study"
track: machine-learning
order: 894
status: live
summary: "Build time-respecting retail analyses while handling cancellations, missing customer identifiers, and unstable transaction semantics."
duration: "10–14 hours"
updated: "2026-08-30"
---

## Project brief

**Executable project package:** [student starter, deterministic fixture, and public checks](/classical-ml-projects/public-data/online-retail/).

Use [UCI Online Retail II](https://archive.ics.uci.edu/dataset/502/online%2Bretail) to investigate one scoped problem: next-period customer activity, product-level demand forecasting, or transaction-anomaly triage. It is not acceptable to mix all three tasks without a clear target and prediction time. This two-year transactional dataset contains purchases from a UK-based non-store retailer and includes missing values and cancellations.

The project teaches data semantics as much as modelling. A negative quantity or an invoice beginning with `C` is not “bad data” by default; it may encode a cancellation and must be modelled or excluded according to a declared task definition.

## Authoritative source, licence, and provenance

Use UCI’s source page, cite Chen and the DOI listed there, and preserve **CC BY 4.0** attribution. Record the supplied workbook/sheet names, parsing engine, currency interpretation, source date, and all normalisation steps. The data are historical and context-limited; do not claim they represent all ecommerce, customers, or current UK retail.

## Data card

| Field | Required statement |
| --- | --- |
| Unit | Transaction line, with invoices potentially spanning multiple lines. |
| Time span | Two years as documented by UCI. |
| Identifiers | Invoice, product/stock code, and partly missing customer identifier. |
| Outcome | Your declared future activity, demand, or anomaly label—not a retrofitted outcome. |
| Known anomalies/semantics | Cancellations, returns, negative quantities, missing customer IDs, free/zero-priced items, descriptions and codes that may change. |
| Prohibited use | Individual profiling, credit/marketing targeting, or fraud accusation. |

## Leakage, missingness, and split hazards

For a next-30-day activity task, aggregate features only up to an explicit cutoff, label the following 30 days, then advance time. Do not let a customer's future invoices enter recency/frequency/monetary features. For demand, do not use same-period quantity aggregates. For anomaly triage, do not pretend that cancellations are ground-truth fraud labels.

CustomerID missingness is informative and may be operational, not random. Report the missingness rate by time/country/invoice type; never impute a person identity. Reconcile invoice-level cancellations before computing spend. Use chronological train/validation/test windows and group by customer where a customer-level task requires it.

## Required model comparisons

Select exactly one primary task and one secondary exploratory analysis.

1. A rule/naive baseline, such as last-period activity or seasonal naive demand.
2. A regularised linear/logistic model using a cutoff-safe feature table.
3. A non-linear tree ensemble with the same features.
4. For anomaly work, an unsupervised baseline plus a transparent ruleset; do not report supervised fraud metrics without labels.

Evaluate the primary task with time-held-out metrics. Show performance by country, customer-ID availability, product-frequency bucket, and time. Explain where sample sizes are too small to interpret.

## Deliverables

- A target/prediction-time memo and a transaction-semantics decision table.
- Data card, provenance/attribution note, and missingness/cancellation audit.
- A leakage-safe feature-building script with cutoff tests.
- Comparative model report, error slices, and an appendix for one invalid future-leaking feature.
- A concise stakeholder memo explaining why anomaly scores are review queues, not accusations.

## Rubric (100 points)

| Criterion | Points |
| --- | ---: |
| Task definition and transaction semantics | 20 |
| Provenance, data card, and missingness/cancellation handling | 20 |
| Time-safe feature construction and split design | 25 |
| Baselines, comparisons, and diagnostics | 20 |
| Responsible interpretation and reproducibility | 15 |

## Responsible-use constraints

Never expose CustomerID-level outputs or infer a customer's value, trustworthiness, or fraud propensity. Anomaly scores must be presented as a limited, human-reviewed operations signal with documented false-positive harm.
