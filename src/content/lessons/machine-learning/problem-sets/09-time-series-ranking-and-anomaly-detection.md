---
title: "Problem Set 9: Time Series, Ranking, and Anomaly Detection"
track: "machine-learning"
order: 829
status: live
summary: "Validate temporal models, calculate ranking metrics, and reason about rare-event alarms."
duration: "100–130 min"
updated: "2026-08-30"
---

## Questions

1. Observations are (y_1=10,y_2=12,y_3=11,y_4=15). A naive one-step forecast uses (\hat y_t=y_{t-1}). Compute MAE over forecasts for (t=2,3,4).
2. Explain why randomly shuffling this series before train/test splitting can report an invalid forecast score. Specify a rolling-origin evaluation.
3. A ranking returns relevance labels [1, 0, 1, 1, 0] in positions 1–5. Compute precision@3 and average precision (AP).
4. A fraud detector flags 20 of 10,000 transactions. Twelve flagged transactions are fraud; total fraud count is 30. Compute precision and recall. Which metric matters more if investigators can review only 20 cases, and why?
5. An anomaly score has 99.9th percentile threshold estimated on last month’s data. This month’s whole score distribution shifts upward after a legitimate logging change. What happens to alert volume? Give a safe response sequence.
6. For a Gaussian anomaly detector with mean 0 and standard deviation 2, compute the z-score for 7. Is a z-score alone enough to label the point anomalous?
7. A recommendation model is trained on clicks, but the old ranker determined which items were displayed. Name the bias and one safer offline/online evaluation strategy.
8. Debug a feature created as `next_7_days_spend` for a churn forecast at day (t). Why can it make offline performance spectacular? Write the point-in-time-safe alternative.

---

## Fully worked solutions

1. Forecast errors are |12-10|=2, |11-12|=1, |15-11|=4; MAE (=7/3\approx2.333).
2. Shuffle allows future regimes/outcomes to influence training for earlier predictions. For origins (t_0<t_1<\cdots), train only through each origin, forecast the next fixed horizon, then aggregate errors in chronological order; leave an embargo if labels/features have delayed availability.
3. Precision@3 (=2/3). Relevant ranks are 1,3,4; precisions there are 1, 2/3, 3/4. AP (=(1+2/3+3/4)/3\approx.8056).
4. Precision (=12/20=.6); recall (=12/30=.4). At fixed review capacity, precision directly describes investigator yield, while recall captures missed fraud. Choose with explicit cost/benefit and harm, not a generic rule.
5. More observations exceed the old threshold, so alerts surge even if underlying anomalies did not. Verify the logging/schema change, segment score distributions, pause or rate-limit automated action if safety permits, investigate labels/outcomes, then recalibrate with governance approval rather than silently normalizing away a real incident.
6. (z=(7-0)/2=3.5). No: the relevant distribution may be non-Gaussian, multiple testing changes expected extremes, context can explain a valid value, and the action’s cost determines threshold.
7. Exposure/position bias: clicks are observed only for items shown and higher ranks receive more attention. Use randomized interleaving/exploration for online comparison; offline, use logged propensities and a justified counterfactual estimator, while acknowledging its assumptions.
8. It uses future information unavailable at scoring time, a direct temporal leak. Replace with `spend_in_previous_7_days_as_of_t`, computed from events with timestamps no later than the decision cutoff and tested with backtesting.

## Grading rubric

30 points: forecasting/ranking arithmetic; 25 points: temporal validation and leakage; 25 points: anomaly/rare-event decision reasoning; 20 points: recommendation bias and debugging.

## Common misconceptions

- A lower average forecast error can still be unusable at the decision horizon.
- Precision at a fixed capacity and recall answer different operational questions.
- An anomaly score is evidence, not a verdict.

## Extension problems

Design a backtest for a weekly replenishment forecast with late-arriving labels. Include cutoff timestamps, retraining cadence, baseline, intervals, and a business-cost metric.
