---
title: "Connect loss functions to optimization decisions"
track: "machine-learning"
status: live
summary: "Optimization searches for parameters that reduce a chosen loss."
duration: "3 min read"
---

## The short answer

Optimization searches for parameters that reduce a chosen loss. Gradient descent uses the slope of the loss to choose an update, but the result depends on scaling, learning rate, initialization, and the loss itself. A lower loss means “better according to this objective,” not automatically “better for the user.”

## The mechanism

For parameter `w`, update `w := w - η ∂L/∂w`. The learning rate `η` controls the
step. Batch, stochastic, and mini-batch updates trade compute, noise, and
stability. Regularization adds a preference for simpler parameters.

## Four examples

### Example A: squared loss

A large regression error receives disproportionate penalty. Useful when large
mistakes are costly; sensitive to outliers when they are not.

### Example B: log loss

A confidently wrong classifier is penalized strongly. This can improve probability
quality, but only if labels and class meaning are trustworthy.

### Boundary case: flat region

Small gradients may mean a local plateau, saturation, bad scaling, or a bug. Inspect
curves and finite-difference checks before changing the optimizer.

### Counterexample: optimize training loss forever

Validation loss can rise as training loss falls. Early stopping or regularization
may be appropriate, but first inspect leakage and split quality.

## An illustrative story

A team blamed a learning rate after a model failed to train. A two-point gradient
check exposed a sign error in the loss implementation. The optimizer was following
the code exactly.

## Two ways to see it

### Calculus view

The gradient is local sensitivity: how a small parameter change alters the loss.

### Experiment view

Learning curves and controlled changes tell you whether the issue is data,
capacity, objective, or optimization.

## Hands-on

Implement one-dimensional gradient descent for a quadratic loss. Sweep three
learning rates, plot the path, and intentionally flip the gradient sign. Then
compare a finite-difference derivative with your analytic derivative.

## Checkpoint

- [ ] You can state what the loss rewards and punishes.
- [ ] Learning-rate behavior is visible in a plot or trace.
- [ ] A gradient check catches an implementation error.

## What this does not solve

Optimization cannot recover information absent from the data or make a harmful
objective acceptable because it converges.

## Continue, go deeper, apply it

- Continue: Linear regression
- Go deeper: Loss, gradients, and optimization in deep learning
- Apply it: add a gradient-check test to a learning implementation.

## Derive one update before trusting an optimizer

For one example with prediction wx and target y, squared loss is L(w) = (wx - y)². By the chain rule,

~~~text
dL/dw = 2(wx - y)x
w_new = w - η × 2(wx - y)x
~~~

Let x = 2, y = 5, w = 1, and η = 0.1. Prediction is 2, error is -3, gradient is 2×(-3)×2 = -12, and the update gives w = 1 - 0.1×(-12) = 2.2. The new prediction is 4.4, closer to 5. This small calculation tells you what the sign and scale of a correct implementation should do.

For many examples, mean squared error averages residual squares. Its gradient is proportional to Xᵀ(Xw-y). Division by the number of examples changes the gradient scale, so changing batch size may require learning-rate adjustment. The minimizer of a convex linear-regression objective is global, yet numerical scaling can still make optimization slow or unstable.

## Loss is a preference, not a neutral score

Squared error punishes a 10-unit error 100 times as much as a 1-unit error. Absolute error treats error linearly and targets a conditional median. Log loss rewards honest probabilities and punishes confident mistakes sharply. Hinge loss prioritizes classification margin. Choose the loss by asking what errors mean; then separately choose a decision threshold or action policy.

Regularized objectives add a term such as lambda times the squared norm of w. Its gradient adds 2 lambda w, pulling weights toward zero each update. The penalty must be scaled consistently with the data loss or its effective strength changes when dataset size changes.

## Reading training curves

| Trace | Likely interpretation | First response |
|---|---|---|
| loss explodes | step too large, bad scale, numerical overflow | lower eta; standardize; inspect values |
| loss barely moves | step tiny, feature scale, wrong gradient | gradient-check; raise eta cautiously |
| train falls, validation rises | overfit or validation mismatch | stop early; inspect split and regularization |
| both remain high | underfit, target/data issue | inspect labels and representation |

Do not infer a cause from a curve alone. A flat loss can arise from a saturated activation, all-zero features, a stale parameter copy, or a logging error.

## Debugging clinic: finite differences

For a parameter w, approximate a gradient numerically:

~~~python
eps = 1e-5
numeric = (loss(w + eps) - loss(w - eps)) / (2 * eps)
analytic = gradient(w)
assert abs(numeric - analytic) < 1e-4
~~~

Run this for several random parameters and a deliberately small dataset. If it fails, check signs, averaging factors, and whether the regularization derivative was included. Only after it passes should you tune optimizers.

## Assessment: choose and diagnose an objective

Derive the gradient of mean squared error for two data points, then perform one update by hand. Explain why absolute loss is more robust to an extreme target but harder to optimize smoothly at zero residual. Finally, given a training curve that oscillates while validation loss is also high, name three checks in priority order and justify each.
