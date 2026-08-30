---
title: "Capstone: Train and Evaluate a Classifier From Scratch"
track: "ai-foundations"
status: live
summary: "Wrote the Capstone project page for Oddversity's AI Foundations track: a from-scratch NumPy 2-layer classifier build on two-moons or digits, covering brief, measurable acceptance c"
duration: "4 min read"
---

## The brief

Build a two-layer neural network in raw NumPy — no PyTorch, no TensorFlow, no `sklearn.neural_network.MLPClassifier` — and train it to classify a real toy dataset: either the two-moons dataset (`sklearn.datasets.make_moons`) or the digits dataset (`sklearn.datasets.load_digits`). You write the [forward pass](/learn/ai-foundations/neural-network-forward-pass-by-hand), the loss, the [backprop](/learn/ai-foundations/backprop-worked-example), and the [gradient descent](/learn/ai-foundations/gradient-descent-in-numpy) update loop yourself. Everything else in this module was building toward the moment where those four things have to work together on data that wasn't cherry-picked for you.

The audience is a skeptical reviewer — imagine a hiring manager, a teammate doing code review, or future-you in six months — who doesn't want to hear "it worked" and instead wants to see the [train/validation/test split](/learn/ai-foundations/train-validation-test-splits) you used, the curves that show it learning, and a test number you can defend because you only looked at it once. That's the actual skill this capstone tests: not "can you write backprop" (you already can, from earlier pages) but "can you tell, honestly, whether the thing you built actually generalizes."

Pick one dataset and go deep rather than doing both shallowly. Two-moons is easier to build intuition on because you can plot the decision boundary directly. Digits is a better test of whether your network handles real dimensionality (64 input features, 10 classes) instead of a toy 2D problem.

## Acceptance criteria

- [ ] Network is implemented from scratch in NumPy: at least one hidden layer, a nonlinearity, a softmax + cross-entropy (or equivalent) output, manual backprop, and a gradient descent update loop — no autograd library and no pre-built classifier doing the learning for you
- [ ] Gradients are verified at least once with a numerical gradient check (finite-difference approximation) before you trust the training loop, and you can show the check passing
- [ ] Data is split three ways — train, validation, test — and the test set is touched exactly once, after every hyperparameter decision is final
- [ ] Per-epoch train and validation loss/accuracy are logged and plotted as learning curves
- [ ] At least one deliberate fight against overfitting is run and compared against a baseline with a number attached (e.g., L2 penalty on/off, hidden-layer size small vs. large, early stopping vs. full run) — not just asserted, shown
- [ ] Final test-set results are reported with more than a single accuracy number: a confusion matrix or per-class breakdown that shows where the model actually fails
- [ ] A short written summary (a paragraph or two is fine) states the train/validation/test accuracy side by side, explains the size of the gap between them, and says what you'd try next with more time or data

## Suggested stack

- **NumPy** for every piece of the model — forward pass, loss, gradients, weight updates
- **scikit-learn**, used only as a data source and utility: `make_moons(n_samples=..., noise=...)`, `load_digits()`, and `train_test_split` for slicing — not for the model itself
- **Matplotlib** for learning curves, and for two-moons, a decision-boundary plot (a filled contour over a mesh grid colored by predicted class is the classic version)
- A plain `.py` script or a notebook — a notebook makes the iterative tuning loop faster to work in

Nothing here costs money or needs a GPU. A two-layer net on either dataset trains in seconds on a laptop CPU.

## Milestones

These are capabilities to build, in roughly this order, not a checklist to execute line by line — you'll loop back and rerun earlier ones as you tune.

1. **A forward pass that produces real probabilities.** Feed a batch through your weights, apply your hidden-layer nonlinearity, and get a softmax output that sums to 1 per row. If you're unsure why the nonlinearity matters at all, that's what [why nonlinearity matters](/learn/ai-foundations/why-nonlinearity-matters) is for.
2. **A backprop implementation you've verified, not just trust.** Compute gradients analytically, then spot-check a handful of them against a numerical approximation — perturb one weight by a small epsilon, measure the loss change, compare. If your analytical and numerical gradients disagree by more than a rounding error, your backprop has a bug, and no amount of training will fix it.
3. **A training loop that reliably decreases loss and is reproducible.** Fix a random seed, run it twice, get the same curve. This sounds trivial until your first run doesn't reproduce and you spend twenty minutes finding the unseeded `np.random.randn` call.
4. **A model-selection process where validation data — not test data — drives every decision.** Hidden layer size, learning rate, number of epochs, regularization strength: tune all of it against validation loss. The [train/validation/test split](/learn/ai-foundations/train-validation-test-splits) page explains why this separation exists; this milestone is where you find out how easy it is to accidentally violate it.
5. **A capacity or regularization intervention with a measured before/after.** Pick one lever — [L2 weight decay, dropout, or early stopping](/learn/ai-foundations/regularization-techniques) — and show a run where the train/validation gap is worse, then a run where it's better. [Generalization and overfitting](/learn/ai-foundations/generalization-and-overfitting) is the concept; this is where you make it happen on your own loss curve instead of reading about someone else's.
6. **A results report a stranger could audit.** Final test accuracy, per-class breakdown, the exact split sizes and seed, and an honest paragraph about the gap between validation and test performance — including if there isn't one.

## What good looks like

A strong submission reports test accuracy once, and it sits close to validation accuracy — not because the model is flawless, but because validation was actually used for tuning instead of being peeked at repeatedly until the split leaked. The learning curves show train loss dropping smoothly and validation loss tracking it for a while before either plateauing or diverging, and the write-up correctly names which of those happened and why.

For two-moons, the decision boundary plot should visibly bend to separate the two curved clusters — a straight line means your network isn't learning anything a linear model couldn't. For digits, the confusion matrix should show mistakes concentrated in genuinely similar-looking digit pairs (like 4 and 9, or 3 and 8), not scattered randomly, which is a sign the model is learning real structure rather than noise.

The strongest submissions can answer "why did you pick that learning rate / hidden size / epoch count" with a specific reason tied to something they observed — loss diverging at a higher rate, validation accuracy plateauing earlier with fewer units — rather than "I copied a number that seemed common." That's the difference between a working model and an understood one, and it's the entire point of building this by hand instead of calling `.fit()`.

Weak submissions report only a single train accuracy, never split off a validation set, tune hyperparameters against the test set, or claim a result without showing the curve that produced it. If your write-up can't show the reader the gap between train and test performance, the reader has no reason to trust the number.

## Extensions

- Add k-fold cross-validation in place of a single validation split and see how much your hyperparameter choices actually depend on which slice of data you validated against
- Compare your from-scratch network against a simple baseline — logistic regression, or scikit-learn's own `MLPClassifier` with matched architecture — and be honest about whether the extra complexity earned its keep
- Swap full-batch gradient descent for mini-batches, and separately try adding momentum; measure whether either changes how many epochs you need to reach the same validation loss
- Try both datasets and compare what made one easier to fit well than the other — dimensionality, class separability, and noise all matter differently
- Add a third hidden layer and see whether it helps, hurts, or does nothing on a dataset this small — a useful firsthand lesson in when more capacity isn't the answer
- Turn your gradient check into a small reusable function you'd trust to drop into a future project before ever trusting a new backprop implementation again

**Related:** [Data splits and leakage, worked example](/learn/ai-foundations/data-splits-and-leakage-worked-example) · [Bias-variance tradeoff, worked example](/learn/ai-foundations/bias-variance-worked-example) · [Building an eval set, worked example](/learn/ai-foundations/building-an-eval-set-worked-example) · [Loss functions, worked examples](/learn/ai-foundations/loss-functions-worked-examples) · [Overfitting: visual intuition](/learn/ai-foundations/overfitting-visual-intuition) · [Benchmarks and what they miss](/learn/ai-foundations/benchmarks-and-what-they-miss)
