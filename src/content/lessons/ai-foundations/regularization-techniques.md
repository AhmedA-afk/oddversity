---
title: "Regularization: Making Models Simpler on Purpose"
track: "ai-foundations"
status: live
summary: "A hands-on tour of L2 weight decay, dropout, and early stopping — three different ways to deliberately limit how well a model fits its training data so it generalizes better — all "
duration: "14 min read"
---

Every model you train has more freedom than it needs — enough free parameters to trace a path through every training point, noise included, if you let it. Regularization is what happens when you refuse to let it: you build a small handicap into training itself so the model settles for a simpler answer that actually holds up on data it hasn't seen yet.

## What it is

Regularization is any change you make to *training* — not the architecture, not the data — that trades a bit of training-set accuracy for a model that generalizes better. It works by discouraging the model from using its full capacity, even when using all of it would fit the training data marginally better. If you've already met the [bias-variance tradeoff](/learn/ai-foundations/bias-variance-tradeoff) and [why models overfit](/learn/ai-foundations/generalization-and-overfitting), this is the practical toolbox for pushing back on the variance side of that trade.

Three of the most common levers, one line each:

- **L2 weight decay** — add a penalty to the loss for having large weights, so the optimizer prefers smaller ones whenever the data doesn't strongly demand otherwise.
- **Dropout** — randomly switch off a fraction of units (or features) on every training step, so no single one can become load-bearing.
- **Early stopping** — stop training before the model has fully minimized the training loss, at the point where a held-out validation set stops improving.

They intervene at three different points — the loss function, the forward pass, and the training schedule — but they all push in the same direction: smaller-magnitude, less-flexible, harder-to-memorize-with models.

## The mental model

Picture your model's weights as a set of dials, and the training data as the thing turning them. With no constraints, the optimizer will turn every dial as far as it needs to squeeze out the last bit of training error — including the error that's really just noise. Each regularizer applies a different kind of resistance to those dials:

- L2 weight decay attaches a rubber band from every dial back to zero. The dial can still turn far if the data pulls hard enough, but it costs more the further it goes, so it only travels that far when the evidence is strong.
- Dropout is like running practice drills where a random subset of your team sits out each rep. No player — and no weight — gets to become the one thing the whole system leans on, because it might not be there next time.
- Early stopping is a curfew. Let training run long enough and it eventually starts fitting the noise, so you end the session while it still only knows the signal.

None of these change what the model is capable of representing in principle — a big enough network with dropout, or a polynomial with weight decay, can still represent a wild function. They change what the model finds *convenient* to represent, given a finite amount of data and a finite amount of training.

## Why it works this way

Each lever fights overfitting for a mechanically different reason.

**L2 weight decay works because it changes the gradient, not just the ranking of solutions.** If your loss is L(w) and you add λ‖w‖², the gradient of that extra term is 2λw — so every training step nudges every weight a little toward zero, in proportion to its own size, independent of what the data gradient wants. That's the literal meaning of "weight decay": each update decays the weight before the data-driven signal is added back in. Big, wild coefficients — the kind that trace one training point exactly and swing wildly in between — cost more under this penalty than smooth, modest coefficients that fit almost as well, so the optimizer settles for the modest ones.

**Dropout works because it turns one network into an implicit ensemble.** On any given step, the network you're actually training is a random thinned-out sub-network — some fraction of the [hidden units](/learn/ai-foundations/what-is-a-neural-network) simply aren't there. A weight that only pays off when paired with a few specific other units, and breaks the moment one of them is missing, gets penalized indirectly: it makes the loss worse on the steps where its partners disappear. Weights that keep working across many different random sub-networks are, by construction, weights that don't over-rely on brittle co-adaptation with a handful of others — which is close to training a large ensemble of smaller networks and averaging them, exactly the kind of variance reduction that fights overfitting.

**Early stopping works because it exploits the order in which a model learns.** Signal — the real relationship between inputs and outputs — is consistent across a training set and a held-out validation set, so a model that fits it improves both losses together. Noise is specific to the training set by definition, so fitting it only ever helps the training loss; it never helps, and eventually hurts, the validation loss. That's why a validation curve so often looks like a U: it falls while the model learns signal, then flattens and rises once the model runs out of signal and starts spending its remaining capacity on noise. Stopping at the bottom of that curve regularizes the *optimization path* rather than the loss function itself — you simply never let the weights travel far enough to reach the noise-fitting region.

## A concrete example

Here's the standard overfitting demo from this track — a high-degree polynomial fit to a handful of noisy points — with all three levers applied to it in turn. If you've seen the wildly oscillating curve before (see [overfitting: visual intuition](/learn/ai-foundations/overfitting-visual-intuition)), this is the same failure mode with the fixes shown side by side.

Start with the setup: 20 noisy points sampled from a sine wave, and a degree-9 polynomial (10 coefficients) fit with plain least squares — enough parameters to nearly interpolate every point.

```python
import numpy as np

def make_data(n, seed):
    rng = np.random.default_rng(seed)
    x = rng.uniform(-1, 1, n)
    y = np.sin(2 * np.pi * x) + rng.normal(scale=0.2, size=n)
    return x, y

def poly_features(x, degree=9):
    return np.vstack([x ** d for d in range(degree + 1)]).T  # (n, degree+1); column 0 is the bias

x_train, y_train = make_data(20, seed=0)
x_val, y_val = make_data(20, seed=1)
X_train, X_val = poly_features(x_train), poly_features(x_val)

w_plain = np.linalg.lstsq(X_train, y_train, rcond=None)[0]
print(np.round(w_plain, 1))
```

With only 20 points and 10 free coefficients, plain least squares has almost enough freedom to hit every training point exactly — and it uses that freedom. Print `w_plain` and you'll see coefficients with two or three digits, alternating sign from one power to the next: the classic signature of a polynomial oscillating wildly between data points to thread the noise, not the signal.

**L2 weight decay.** This is ridge regression — the closed-form version of adding λ‖w‖² to the loss.

```python
def ridge_fit(X, y, alpha):
    n_features = X.shape[1]
    penalty = alpha * np.eye(n_features)
    penalty[0, 0] = 0.0          # don't shrink the intercept/bias term
    return np.linalg.solve(X.T @ X + penalty, X.T @ y)

w_ridge = ridge_fit(X_train, y_train, alpha=0.5)
print(np.round(w_ridge, 1))
```

Solving `(XᵀX + αI)w = Xᵀy` instead of `XᵀX w = Xᵀy` is what you get from taking the gradient of the ridge loss and setting it to zero. Push `alpha` up from 0.5 and watch every coefficient shrink toward zero — the high-order ones fastest, since those were doing the most oscillating. At a well-chosen `alpha`, the fitted curve stops chasing individual noisy points and starts looking like a smooth approximation of the sine wave underneath: worse training error than the plain fit, better validation error.

**Early stopping.** This needs an iterative optimizer to have something to stop *early* — so switch to gradient descent on the same, unregularized loss, and track train and validation error at every step.

```python
def mse(X, y, w):
    return np.mean((X @ w - y) ** 2)

w = np.zeros(X_train.shape[1])
lr = 0.05
history = []

for step in range(3000):
    grad = 2 * X_train.T @ (X_train @ w - y_train) / len(y_train)
    w = w - lr * grad
    history.append((mse(X_train, y_train, w), mse(X_val, y_val, w)))

train_curve = [h[0] for h in history]
val_curve = [h[1] for h in history]
best_step = int(np.argmin(val_curve))
print(f"best step: {best_step}, val mse there: {val_curve[best_step]:.3f}")
```

> If the loss explodes instead of settling, lower `lr` — the high-order columns of `X_train` make this a poorly-conditioned optimization problem, which is a separate, unrelated headache from the one this lesson is about.

`train_curve` keeps falling for the whole run — plain gradient descent is happy to shrink training error forever. `val_curve` falls with it at first, bottoms out around `best_step`, and then climbs back up as the remaining steps go into fitting noise the validation set doesn't share. `best_step` is where you'd checkpoint the model and stop: keep the weights from the step with the best validation score, throw away the training you did after that.

**Dropout.** It doesn't have an obvious meaning for a single linear model — it's built for networks with hidden units to disable. But you can see the same mechanism here by treating the 10 polynomial powers as 10 input features and randomly dropping some of them on every step:

```python
def train_step_with_dropout(X, y, w, lr, keep_prob, rng):
    mask = rng.binomial(1, keep_prob, size=X.shape[1]).astype(float)
    mask[0] = 1.0                     # always keep the bias term
    X_dropped = X * mask / keep_prob  # inverted dropout: rescale so the expected input is unchanged
    grad = 2 * X_dropped.T @ (X_dropped @ w - y) / len(y)
    return w - lr * grad

rng = np.random.default_rng(42)
w = np.zeros(X_train.shape[1])

for step in range(3000):
    w = train_step_with_dropout(X_train, y_train, w, lr=0.05, keep_prob=0.7, rng=rng)

val_mse_dropout = mse(X_val, y_val, w)
```

On roughly 30% of steps, any given power of `x` — including the high, wiggly ones — simply isn't there, and `w` has to get its loss reduction from whichever powers survived that step. A coefficient that only pays off when paired with one specific other power gets punished on the steps where that partner is missing, so the fit that emerges leans less on any single high-order term. Dividing by `keep_prob` during training (inverted dropout) means you use every feature, undivided, at evaluation time — no separate test-time rescaling to remember. In a real network you'd apply this same mask to hidden-layer activations rather than raw inputs, but the mechanism — random masking while training, none at inference — is identical.

## Where it shows up

- **L2 weight decay** is everywhere in classical ML under the name *ridge regression*, and it's built into most neural network optimizers — AdamW, for instance, applies weight decay as a step decoupled from the gradient update rather than folding it into the loss, which in practice works better than the naive version. It also shows up in fine-tuning, where keeping updated weights close to their pretrained values is effectively weight decay toward the pretrained model instead of toward zero.
- **Dropout** was the default regularizer for deep vision and NLP models for years, applied to hidden-layer activations, embeddings, and sometimes attention weights. It's used less aggressively in some large-scale transformer training runs, where the sheer volume and diversity of pretraining data already does a lot of the regularizing work dropout used to provide on smaller datasets — but it hasn't disappeared, and it's still standard whenever your dataset is small enough, relative to the model, that memorization is a real risk.
- **Early stopping** is close to universal, because it's nearly free: you're almost always tracking a validation metric during training anyway (see [train/validation/test splits](/learn/ai-foundations/train-validation-test-splits)), so checkpointing the best-so-far model and stopping when it stalls costs nothing but a little training time. It's the regularizer you get by default just from monitoring your run properly.

## Watch out for

- **A leaky or too-small validation set makes early stopping worthless.** "Best step" is only meaningful if the validation loss is actually measuring generalization — if it's leaked into training or too noisy itself, you'll stop at a step that's just as overfit to the validation set instead. See [data splits and leakage, worked](/learn/ai-foundations/data-splits-and-leakage-worked-example).
- **Too much regularization turns a variance fix into a bias problem.** Push `alpha` too high or `keep_prob` too low and both train and validation error rise together — that's underfitting, the other side of the [bias-variance tradeoff](/learn/ai-foundations/bias-variance-tradeoff), not the improvement you were going for. Regularization strength is a hyperparameter to tune, not a switch to max out.
- **Dropout left on at inference is a real, common bug**, and the "validation loss always turns upward" story early stopping relies on isn't a law of nature — [grokking and double descent](/learn/llm-foundations/grokking-and-double-descent) documents real cases where training well past the point validation loss rises leads to renewed improvement later. Treat "stop at the first uptick" as a solid default, not a guarantee.

## Where next

- New to the update rule itself? [Gradient descent in numpy](/learn/ai-foundations/gradient-descent-in-numpy) walks through it without a penalty term to worry about.
- For the bigger picture these three levers are fighting for, revisit the [bias-variance tradeoff](/learn/ai-foundations/bias-variance-tradeoff), with a fully [worked example](/learn/ai-foundations/bias-variance-worked-example).
- For the validation-set discipline early stopping depends on, see [train/validation/test splits](/learn/ai-foundations/train-validation-test-splits).
- For the complication to the early-stopping story, read [grokking and double descent](/learn/llm-foundations/grokking-and-double-descent).
- To check what stuck, try the [generalization quiz](/learn/ai-foundations/generalization-quiz).

**Related:** [Bias-variance tradeoff](/learn/ai-foundations/bias-variance-tradeoff) · [Generalization and overfitting](/learn/ai-foundations/generalization-and-overfitting) · [Overfitting: visual intuition](/learn/ai-foundations/overfitting-visual-intuition) · [Train/validation/test splits](/learn/ai-foundations/train-validation-test-splits) · [Gradient descent in numpy](/learn/ai-foundations/gradient-descent-in-numpy)
