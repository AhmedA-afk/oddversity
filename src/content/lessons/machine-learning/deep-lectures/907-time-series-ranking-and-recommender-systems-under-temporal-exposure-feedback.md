---
title: "Deep lecture: Time series, ranking, and recommender systems under temporal/exposure feedback"
track: "machine-learning"
order: 907
status: live
summary: "Design temporally valid forecasts and ranking systems while accounting for delayed labels, exposure bias, feedback loops, and constrained decisions."
duration: "120 min lecture + 5 hr lab"
updated: "2026-08-30"
---

# Time series, ranking, and recommenders: prediction changes the future data

Forecasting, search ranking, and recommender systems look like different model families. They share a core difficulty: records arrive in time, actions control what is observed next, and an offline score can be disconnected from the actual decision. A demand forecast changes inventory; a ranker decides which items receive impressions; a recommender determines which ratings, clicks, and purchases are visible. Treating these as IID supervised-learning tables creates leakage and feedback bias that a random train/test split cannot reveal.

Begin with a decision contract. For a forecast, state the origin time, horizon, aggregation level, information cutoff, and cost of under/overprediction. For a ranker, define query, candidate set, eligibility rules, position, exposure, relevance signal, and user/task value. For a recommender, define user, item, context, what constitutes an impression, the target event window, and business constraints such as diversity, stock, safety, or creator equity. This is more than documentation: it determines the permissible features and the evaluation unit.

## Temporal validation and information sets

At origin `t`, a forecast for `Y_(t+h)` may use only `F_t`, the information set available by then. A feature like “monthly total sales” is illegal for a day-10 forecast if it includes days 11–30. Randomly splitting rows lets future outcomes leak through rolling averages, target encodings, duplicate entities, and calendar-aligned aggregates. Use rolling-origin evaluation: fit through time `t_1`, validate after `t_1`; move the origin forward and repeat. Use a final future period for the release decision. When many stores or users are present, preserve both time order and entity structure.

Point forecasts optimise a loss. Mean forecasts minimise squared error; medians minimise absolute error; a `q` quantile minimises pinball loss `rho_q(y-yhat)=(q-I[y<yhat])(y-yhat)`. Choose loss from the decision rather than habit. Intermittent demand, count support, hierarchy, holiday effects, promotion endogeneity, and stockouts can each make a naïve regression invalid. Forecast residuals should be checked for autocorrelation, bias by horizon, and degradation across locations—not only averaged RMSE.

### Worked example 1: one-step versus multi-step leakage

On day 7, a retailer predicts day-14 demand. A feature `mean_sales_last_7_days` is valid if it uses days 1–7. A feature generated on day 14 using days 8–14 is not, even if its column name is identical. Suppose day-7 sales are `[10,12,8,11,9,10,10]`; valid mean is `10`. If days 8–14 are `[14,15,13,16,14,17,15]`, the invalid mean is `14.857`, which nearly reveals an upward trend. A model using the latter will appear accurate in offline data and fail when asked on day 7 to see day 14.

### Worked example 2: quantile forecast and inventory cost

A bakery chooses stock `q` for demand `D`. Unsold unit cost is `$1`; a stockout loses `$4` margin. The newsvendor critical fractile is `C_under/(C_under+C_over)=4/(4+1)=.8`, so target the 80th percentile, not the mean. If scenario demand values are 20, 25, 30, 35, 40 with equal probability, the empirical 80th percentile is 35 or 40 depending on convention; choose the documented convention and test realised service/cost. A mean forecast of 30 is not “neutral”: it embeds an asymmetric understock penalty.

### Worked example 3: why offline precision ignores non-exposure

A recommender logs 100 displayed items; 20 were clicked. Model A ranks 10 items with 6 clicks in the log, precision@10 `.6`. It may be missing an unseen item that would have been clicked by every relevant user, because the logging policy never exposed it. Logged non-clicks are not labels for every candidate. Offline ranking metrics estimate quality conditional on historical exposure, not universal relevance. Randomisation, exploration, or valid counterfactual estimators are needed for broader claims.

### Worked example 4: discounted gain calculation

For a query, ranked relevance grades are `[3,2,0,1]`. With `DCG@4=sum (2^rel_i-1)/log2(i+1)`, values are `7/1 + 3/1.585 + 0/2 + 1/2.322 = 9.323`. If the ideal order is `[3,2,1,0]`, it has the same value here, so `NDCG=1`. A ranker with all relevant items but poor order can have high recall and low NDCG. Whether that matters depends on user scanning behaviour and accessibility; no ranking metric automatically captures both.

### Worked example 5: inverse propensity score for an exposed click

An item shown at position 1 has estimated examination propensity `.8`; position 8 has `.1`. A click at position 8 carries inverse-propensity weight `1/.1=10`, while a click at position 1 gets `1.25`. The weighting corrects a known exposure tendency only if propensities are measured or randomised and positivity holds. An item never exposed has propensity zero and cannot be evaluated off-policy. Clip weights only with an explicit bias-variance trade-off and report the coverage lost.

## Forecast models must respect the system

Simple seasonal-naïve baselines—predict this Monday from last Monday—are hard to beat and reveal whether a complex model adds value. Exponential smoothing separates level, trend, and seasonality; autoregression uses lagged values; state-space models represent evolving latent states; gradient boosting can combine lags with static covariates; hierarchical reconciliation makes store and national forecasts coherent. A powerful model cannot recover sales lost because inventory was zero unless stockouts are modelled as censored demand. Promotions are interventions, not naturally occurring features; forecasts used to choose promotions must account for this circularity.

Prediction intervals should widen with horizon and with sparse series. A 90% interval that covers 90% over all stores but only 60% for remote stores is operationally misleading. Refit frequency and feature availability must mirror deployment. Backtests need versioned calendars, data revisions, and a simulation of the actual cutoff time; “historical data as downloaded today” often includes corrections that were unavailable in the past.

```text
rolling_origin_backtest(table, origins, horizon):
    results <- []
    for origin in origins:
        train <- rows with event_time <= origin
        future <- rows where origin < event_time <= origin + horizon
        features <- build_features_as_of(train, origin)
        model <- fit(train.features, train.target)
        prediction <- model.predict(features_for(future, known_at=origin))
        results.append(score_by_horizon_and_entity(prediction, future.target))
    return aggregate_with_intervals(results)
```

The function `build_features_as_of` is a critical production component, not notebook glue. Test it by masking every record after origin and verifying that output features are unchanged.

## Ranking objectives, candidates, and constraints

Learning-to-rank typically learns either pointwise relevance scores, pairwise preferences, or listwise objectives. Pointwise losses can ignore ordering; pairwise losses compare clicked versus unclicked candidates; listwise objectives approximate ranking metrics. Candidate generation and ranking must be evaluated together: a perfect ranker cannot retrieve an item absent from its candidate set. Report recall of candidate generation, ranking NDCG/recall at business-relevant cutoffs, latency, and constraint satisfaction.

Clicks are imperfect relevance labels. Position, thumbnail, price, trust, fatigue, and prior recommendations influence them. Use presentation logs containing displayed set, positions, model version, context, and outcome window. Exploration policies—small random swaps, contextual bandits with guardrails, or interleaving—create data to distinguish item quality from placement. They also impose user cost, so scope exploration and monitor harm.

For recommenders, collaborative filtering estimates user-item preferences from a sparse interaction matrix. Matrix factorisation writes score `rhat_ui=mu+b_u+b_i+p_u^Tq_i`, with user/item biases and latent vectors. It handles repeated preferences but struggles with cold start, feedback loops, and objectives not represented in clicks. Content features, session context, and business rules help, but every feature creates availability and privacy obligations.

### Worked example 6: matrix-factorisation prediction

Let global mean `mu=3.5`, user bias `.2`, item bias `-.1`, user vector `[.4,.1]`, item vector `[.5,.3]`. Dot product is `.4*.5+.1*.3=.23`. Predicted rating is `3.5+.2-.1+.23=3.83`. A regularised objective penalises large biases and vectors. A predicted 3.83 is not necessarily a calibrated probability of engagement; if used for ranking, validate ranking and downstream outcomes separately.

## Exposure feedback and counterfactual evaluation

When a recommender shows an item, it increases the chance that item receives feedback; popular items receive more data and remain popular. This rich-get-richer loop can reduce catalog discovery and make offline accuracy look excellent. Counterfactual estimators use logged propensity `pi(a|x)` to estimate a new policy’s value from data generated by an old policy. Inverse propensity scoring weights outcomes by target-policy probability divided by logging-policy probability; doubly robust estimators add an outcome model. The same warnings as causal inference apply: accurate propensities, overlap, stable contexts, and careful variance control are essential.

An online experiment remains the strongest evidence for a meaningful policy shift. Predefine primary outcome, guardrails (complaints, session abandonment, creator concentration, stockouts), duration, randomisation unit, and stopping rule. Network interference—one user’s recommendations affecting another user’s inventory or community—can violate simple A/B assumptions. In high-stakes rankings, human review and policy constraints may be non-negotiable even when they reduce a short-term metric.

## Real-world decision context: marketplace search and supply fairness

A marketplace wants to improve conversion with a personalised ranker. Optimising click-through alone might promote sensational listings, overexpose already dominant sellers, or repeatedly show out-of-stock inventory. The product decision needs a constrained objective: relevance and conversion subject to availability, policy safety, seller exposure limits, diversity, and latency. The experiment should report effects for new versus established sellers, buyer cohorts, and rare inventory—not just overall gross merchandise value. A high NDCG score does not grant permission to make an opaque economic allocation policy.

## Debugging workshop: failures in time and feedback systems

1. **Future joins.** A weekly aggregation joins all events sharing a calendar week, leaking late-week outcomes into early-week predictions. Test every join against the scoring timestamp.
2. **Stockout-as-zero demand.** Zero sales during an empty shelf are censored demand, not evidence of zero interest. Track availability and separate observation from latent demand.
3. **Random split in recommendations.** The same user appears in both sets with later interactions training the model. Split by time and consider cold-start users/items explicitly.
4. **Position bias disguised as relevance.** Top-ranked items get clicks because they are top-ranked. Log and model exposures; use controlled exploration or counterfactual methods.
5. **Metric-only deployment.** A ranking gain can increase concentration or reduce satisfaction. Monitor guardrails and long-horizon return behaviour.

## Code exercise: cutoff-safe forecast plus logged-ranker evaluator

Implement an `as_of_features(events, cutoff)` function and unit-test that adding future events cannot change its output. Use it in a rolling-origin demand backtest with seasonal-naïve and one learned baseline; report pinball loss at `.5` and `.8` plus coverage of an interval. Separately, implement `dcg_at_k`, `ndcg_at_k`, and an inverse-propensity-weighted click estimate from a log containing query, shown item, position, propensity, and click. Write tests for zero/negative propensities, unseen candidates, duplicate impressions, and a ranking with known DCG. Explain why your IPS estimate is not valid for never-exposed items.

## Assignment: a temporally valid allocation system

**Part A — decision contract (15 points).** Choose forecasting, ranking, or recommendation. Define cutoff, horizon, unit, candidate/eligibility set, label delay, action, capacity, and at least three product constraints.

**Part B — calculations and derivations (20 points).** Derive the quantile-loss interpretation of the newsvendor fractile, calculate DCG/NDCG for a supplied list, calculate an IPS weight, and compute a matrix-factorisation score or a forecast interval quantity.

**Part C — offline evaluation (20 points).** Build a rolling-origin or temporal exposure-respecting split. Compare an appropriate naïve baseline to a learned system, break results down by horizon/cohort/position, and quantify uncertainty with block/group resampling.

**Part D — implementation and robustness (20 points).** Submit cutoff-safe feature code, tests for future leakage, metric implementations, reproducible configuration, and a failure analysis for stockouts, cold start, or position bias.

**Part E — controlled release plan (25 points).** Specify logging schema, exploration policy, primary outcome, guardrails, randomisation/interference risks, monitoring, rollback, and a policy constraint that overrides model rank when needed.

| Rubric criterion | Full-credit evidence |
| --- | --- |
| Temporal integrity | Cutoffs, horizons, labels, and every feature respect information available at decision time. |
| Mathematical correctness | Loss, ranking, propensity, and latent-factor calculations are correct and interpreted carefully. |
| Evaluation quality | Baselines, temporal splits, uncertainty, and exposure limitations are explicit. |
| Engineering quality | Feature generation and metrics are tested against leakage and invalid log data. |
| Product judgement | Release plan addresses feedback, constraints, human impact, and long-term guardrails. |

The mature question is not whether a model predicts the past. It is whether its predictions and the policy they induce remain useful when time passes, users react, and the system starts writing the data it will later learn from.
