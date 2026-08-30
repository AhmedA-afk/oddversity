---
title: "Public-data project: Bike-sharing demand forecast under temporal leakage"
track: machine-learning
order: 893
status: live
summary: "Forecast rental demand from past-available information while proving that the split and features respect time."
duration: "8–12 hours"
updated: "2026-08-30"
---

## Project brief

**Executable project package:** [student starter, deterministic fixture, and public checks](/classical-ml-projects/public-data/bike-sharing/).

Build a one-step-ahead demand forecasting study with the [UCI Bike Sharing dataset](https://archive.ics.uci.edu/dataset/275/bike%2Bsharing%2Bdataset). UCI provides hourly and daily rental counts for 2011–2012 with weather and seasonal information from Capital Bikeshare. Choose one granularity and one operational question, for example: “How many rentals should be expected next hour given information available before that hour?”

Your goal is forecast quality and honest operational interpretation—not a claim about traffic, environment, health, or user behaviour.

## Authoritative source, licence, and provenance

Download from UCI, cite its DOI and the dataset’s original description, and retain the listed **CC BY 4.0** attribution. Record whether you use `hour.csv` or `day.csv`, source download date, file hash if practical, row counts, timezone assumptions, and parsing decisions. UCI’s data describe one system in a bounded period; do not generalise it to every city or current bike-share operation.

## Data card

| Field | Required statement |
| --- | --- |
| Unit | Hour or day in one historical bike-sharing system. |
| Outcome | Total rentals `cnt`; optionally registered/casual counts for analysis only. |
| Time coverage | 2011–2012 as documented by UCI. |
| Inputs | Calendar, season/holiday/workday, weather and climate-related variables supplied by UCI. |
| Intended use | Time-aware regression, forecast diagnostics, and capacity-planning thought experiments. |
| Not supported | Individual mobility prediction, enforcement, pricing, staffing, or claims of causal weather effects. |

## Leakage and data-quality hazards

The target `cnt` is the sum of `casual` and `registered`; never use either as a feature for the same forecasting target. Do not randomise rows: that leaks future seasonal regimes into training. Clarify whether apparent weather fields are observations available before the prediction time or retrospectively measured summaries; if their availability is unclear, treat them as a hindsight upper bound and run a calendar-only forecast as the deployable baseline.

Check duplicate timestamps, missing time intervals, unit scaling, daylight-saving ambiguity, and lag construction. Every lag, rolling mean, target encoding, or seasonal statistic must use only earlier training history. Fit scaling and imputation on each training window.

## Split and evaluation design

Use rolling-origin evaluation: train through time `t`, validate on a following block, advance the origin, and reserve the final chronological block for one locked test. Report MAE, RMSE, MAPE or sMAPE only with its zero/low-count caveat, and a naive seasonal baseline such as “same hour last week” where prior history permits. Plot residuals over time, by hour, season, holiday/workday, and low/high-demand regimes.

## Required model comparisons

1. Mean and seasonal-naive baselines.
2. Regularised linear regression with calendar and lag features.
3. A tree ensemble with the identical information set.
4. A count-aware alternative or transformed-target model, with an explanation of its assumptions.

Include a deliberately invalid random cross-validation experiment and quantify why it is not the number to use. Compare point forecasts and uncertainty proxies or prediction intervals; state what decisions could still fail when an interval is wide.

## Deliverables

- A forecast specification with horizon and feature-availability timeline.
- Data card, provenance note, and temporal data-quality report.
- Rolling-origin split implementation and all baselines/models.
- Forecast report with plots, aggregate and slice metrics, failures, and operational caveats.
- Leakage appendix and reproduction instructions.

## Rubric (100 points)

| Criterion | Points |
| --- | ---: |
| Source, data card, and availability contract | 15 |
| Chronological splits and leakage-safe feature generation | 25 |
| Baselines and model comparison | 20 |
| Diagnostics, uncertainty, and failure analysis | 20 |
| Clear operational limits | 10 |
| Reproducibility | 10 |

## Responsible-use constraints

Do not use the project to make claims about particular riders or neighbourhoods. Describe forecasts as uncertain planning inputs that require capacity, equity, safety, and local-domain review—not automated allocation decisions.
