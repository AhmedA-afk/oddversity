---
title: "Use linear regression as a transparent baseline"
track: "machine-learning"
status: live
summary: "Linear regression predicts a numeric target as a weighted combination of features. It is fast, inspectable, and often a strong baseline."
duration: "3 min read"
---

## The short answer

Linear regression predicts a numeric target as a weighted combination of features. It is fast, inspectable, and often a strong baseline. Its assumptions—linearity, error structure, feature availability, and stable relationships—are hypotheses to test, not facts granted by the algorithm.

## The mechanism

Predict `ŷ = w · x + b` and choose parameters that minimize a loss such as mean
squared error. Coefficients describe the fitted association under the feature
scales and correlations in the data; they are not automatically causal effects.

## Four examples

### Example A: delivery time

Use distance, traffic proxy, and order size to estimate minutes. Compare against
the historical mean and inspect large underestimates separately.

### Example B: log target

A skewed price target may be modeled on a log scale, then transformed back with
care. The error interpretation changes after transformation.

### Boundary case: extrapolation

A line fit inside the observed range can behave wildly outside it. Add range
checks or an abstention path for unfamiliar inputs.

### Counterexample: coefficient storytelling

A large coefficient may reflect a unit choice or correlated proxy. Standardize,
inspect intervals, and avoid calling it “importance” without qualification.

## An illustrative story

A sales forecast looked excellent until a new product category arrived. The model
had learned interpolation, while the business needed a policy for extrapolation.

## Two ways to see it

### Statistical view

Fit a conditional mean and inspect residuals, leverage, and variance.

### Decision view

Ask whether an estimate changes staffing, pricing, or review—and how costly a
large miss is.

## Hands-on

Implement closed-form or gradient-descent regression on a small dataset. Compare
the mean baseline, raw features, standardized features, and a log-target variant.
Plot residuals and write one deployment guardrail.

## Checkpoint

- [ ] The baseline and linear model are compared on the same split.
- [ ] Residuals and extrapolation limits are inspected.
- [ ] Coefficients are not presented as causal proof.

## What this does not solve

Linearity does not guarantee fairness, causal validity, stable drift behavior, or
good performance on a new population.

## Continue, go deeper, apply it

- Continue: Logistic regression
- Go deeper: Causal questions versus predictive models
- Apply it: publish a transparent baseline report with residual plots.

## From residuals to the fitted line

For observations collected in matrix X and targets y, ordinary least squares minimizes the residual sum of squares:

~~~text
RSS(w) = Σᵢ (yᵢ - xᵢ·w)²
~~~

When X has full column rank, setting the gradient to zero yields the normal equation XᵀXw = Xᵀy. The symbolic solution is w = (XᵀX)⁻¹Xᵀy, but robust software usually uses QR or SVD rather than explicitly inverting XᵀX. Inversion can amplify numerical error, especially when columns are nearly duplicates.

With one feature x = [1, 2, 3] and y = [2, 4, 5], the mean x is 2 and mean y is 11/3. The fitted slope is covariance(x,y)/variance(x) = 3/2 = 1.5; intercept is 11/3 - 1.5×2 = 2/3. The predicted value at x=4 is 6⅔. Calculate a residual for every observed point; a fitted line is valuable precisely because its errors can be inspected.

## Assumptions and diagnostics

The model does not require each feature to “cause” the target, but different conclusions require different assumptions. For prediction, stable conditional relationships and representative data matter most. For conventional coefficient intervals, linearity in the chosen features, independent errors, adequate sample size, and a suitable error model matter. Heteroscedasticity—residual spread that grows with prediction—does not automatically ruin point prediction, but it changes uncertainty and can signal a missing transformation.

Plot residuals against fitted values, time, major features, and important groups. A curved residual pattern suggests nonlinear structure; a fan shape suggests changing variance; long runs above zero suggest temporal dependence; isolated massive residuals invite row-level investigation. Do not delete a point simply because it is inconvenient: it may reveal a new operating regime.

## Prediction interval versus confidence interval

A confidence interval around the mean response says where the average target may lie for inputs like x. A prediction interval for one future case is wider because it includes irreducible individual variation. If a delivery model estimates average travel time to be 30 ± 2 minutes, it does not follow that every delivery is within two minutes. Operations often need a quantile or prediction interval, not merely a mean estimate.

## Debugging clinic: suspicious coefficients

Fit a price model with square footage and square meters accidentally both included. The two features are perfectly collinear, so coefficients can become enormous or undefined while predictions remain reasonable. Remove one, inspect correlations and variance inflation, then compare cross-validated error. Next fit with and without a log transformation of a highly skewed target and examine residuals on both scales. Record which business error is being measured after transformation.

## Assessment: model report

Fit or hand-calculate a one-feature regression for a small supplied dataset. Report the line, three residuals, MAE and RMSE, and an extrapolation rule. Explain why RMSE changes more after a single 20-unit mistake than MAE. Finally, give one example in which a coefficient is predictive but should not be described as causal.

Include a short residual plot interpretation: name one pattern that would justify adding a feature or transformation and one that warrants an operational range check instead of more fitting.
