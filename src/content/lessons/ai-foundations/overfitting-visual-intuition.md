---
title: "Overfitting You Can See"
track: "ai-foundations"
status: live
summary: "A hands-on, visual walkthrough of overfitting: fit degree-1, degree-4, and degree-15 polynomials to the same dozen noisy points, watch the high-degree curve memorize noise instead "
duration: "12 min read"
---

Fit three curves to the same twelve noisy points, and the one that runs through all twelve exactly will usually be the worst guess at the thirteenth. That's the whole phenomenon in one sentence — the rest of this page is you watching it happen and building a gut feel for why.

If [generalization and overfitting](/learn/ai-foundations/generalization-and-overfitting) gave you the vocabulary — training error, test error, the gap between them — this page gives you the picture that vocabulary is describing. You're about to watch that gap open up in real time, on data small enough to hold in your head.

## Twelve flags on a ridge

Picture a ridge trail. It climbs, but not in a straight line — it doglegs partway up. Someone marked it with twelve flags, spaced out along the way, but they were using a cheap GPS unit, so each flag sits a few feet off from where the trail actually runs. You don't get to see the real trail. All you have is twelve flags.

Three hikers each have to draw their best guess at the trail using only those flags.

- **Hiker A** draws almost a straight line. It's stable, and it ignores every flag's exact position in favor of "the trail goes generally this way." It doesn't touch a single flag.
- **Hiker B** lets the path bend once or twice — enough to follow the real dogleg — while still smoothing over the GPS jitter. It passes close to most flags without chasing any of them exactly.
- **Hiker C** is a perfectionist. Every flag gets touched, exactly, no exceptions. Between flags that sit close together, fine — the path barely has to move. But between flags that are far apart, or near the two ends of the trail, Hiker C's path has to swing wildly to hit the next one dead-on, then swing back. From above, Hiker C's route looks like a seismograph reading laid over a ridge.

If you had to bet real money on where the trail runs at a spot you don't have a flag for, you would not bet on Hiker C — even though Hiker C is the only one who never missed. That gap between "never wrong about what I was given" and "wrong about almost everything else" is overfitting.

## The same idea, with numbers you can run

Swap "flags" for "data points" and "hikers" for "polynomials of increasing degree," and it's the identical picture. Here's a toy dataset built the same way: a real, gently curving trend, plus enough per-point jitter that you can't read the trend off any single point.

```python
import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(0)

x = np.linspace(0, 1, 12)
y_true = 3 * x + 2 * np.sin(4 * x)             # the real trend — hidden in practice
y = y_true + rng.normal(0, 0.3, size=x.shape)  # what you actually get to see

x_grid = np.linspace(0, 1, 300)

plt.plot(x_grid, 3 * x_grid + 2 * np.sin(4 * x_grid), "k--", alpha=0.4,
         label="true trend (you never see this line for real)")
plt.scatter(x, y, color="black", zorder=5, label="your 12 points")

for degree in (1, 4, 15):
    coeffs = np.polyfit(x, y, degree)
    plt.plot(x_grid, np.polyval(coeffs, x_grid), label=f"degree {degree}")

plt.ylim(-3, 9)   # a readable window — the degree-15 curve will likely try to escape it near the edges
plt.legend()
plt.show()
```

Run that, and expect a warning on the degree-15 line: numpy's `RankWarning`, saying the fit "may be poorly conditioned." That's not noise to ignore — it's numpy telling you something true. A degree-*d* polynomial has *d* + 1 coefficients to solve for: degree 1 needs 2 numbers, degree 4 needs 5, degree 15 needs 16. You handed it 12 points. There is no unique curve that has 16 free coefficients and only 12 constraints — numpy's `lstsq` picks one of the infinitely many curves that satisfy those constraints, and it happens to be an extreme one. You are, quite literally, asking for more explanation than your data can support, and the shape of that excess is the wiggle on the plot.

What you should see, roughly:

- **Degree 1** sits close to the true trend on average but is visibly wrong through the dogleg in the middle — it can't bend, so it doesn't.
- **Degree 4** tracks the hump-and-dip shape of the real trend without chasing every point individually. This is the one you'd actually want to ship.
- **Degree 15** sits at or extremely close to all 12 points, then does something dramatic in between, especially near x = 0 and x = 1 where it has the least data pinning it down. This specific flavor of edge blow-up has a name in numerical analysis — Runge's phenomenon — because evenly spaced points plus a high-degree polynomial is a classic recipe for it.

## The wrong instinct, and what it misses

If you rank these three curves by error on the 12 points you have, degree 15 wins, degree 4 is respectable, and degree 1 loses badly. If your instinct says "lower error, better model, ship the winner," that instinct is exactly what produces the seismograph curve. Training error only measures agreement with data you already had. It cannot tell a coefficient that captured the real dogleg apart from a coefficient that captured the fact that point #7 happened to land low that day. Both lower the number. Only one of them is worth anything — this is what "overfitting" precisely means: spending the model's flexibility on the particular noise in front of it instead of on the pattern that produced it.

> The part of this that surprises most people isn't that overfitting hurts on new, far-away data. It's that it hurts on data sitting right between two points you already have. Degree 15 isn't failing at extrapolation — it's failing at interpolation, on inputs as squarely inside the training range as it's possible to be. If your mental model of overfitting is "the model gets worse the further you stray from what it saw," the ridge trail should correct it: Hiker C is often furthest off exactly halfway between two flags.

This is why you can't judge a fit by staring at the points it was built from — you need points it never saw, which is the entire premise behind [train/validation/test splits](/learn/ai-foundations/train-validation-test-splits). Without a held-out check, degree 15 and degree 4 look almost equally good on paper — both "explain the data" — and only one of them is lying to you.

## Bias and variance: the axis that explains all three curves

There's a name for the two different ways a curve can be wrong here, worth attaching now even though [bias-variance tradeoff](/learn/ai-foundations/bias-variance-tradeoff) is where it gets formalized:

- **Bias** is being systematically, consistently wrong in the same direction because the model's shape is too rigid to represent the truth. Degree 1 has high bias — a straight line structurally cannot bend the way the real trend does, no matter what data you feed it.
- **Variance** is being wildly *inconsistent* — the fit swings based on which particular noise you happened to draw, not on the pattern underneath. Degree 15 has high variance — the fit is basically a function of this one noisy sample, not of the trend that generated it.

Degree 4 sits closer to the middle on both counts, which is why it's the one that would actually generalize. You can watch variance directly instead of taking it on faith: keep the same `x` and `y_true` from above, draw new noise, and refit.

```python
rng2 = np.random.default_rng(1)     # same true trend, a different noisy sample
y2 = y_true + rng2.normal(0, 0.3, size=x.shape)

fit1_v2 = np.polyfit(x, y2, 1)
fit15_v2 = np.polyfit(x, y2, 15)
```

Plot `fit1_v2` next to your original degree-1 fit and they'll look almost identical — barely nudged. Plot `fit15_v2` next to the original degree-15 fit and the wiggle pattern relocates entirely — different peaks, different valleys, same underlying trend. That instability *is* variance, made visible. Low bias bought you nothing here, because it came at the cost of a model whose output depends more on which random sample you happened to draw than on reality.

This split is also the map for what to do about it: shrink the hypothesis space (lower degree, fewer parameters), penalize extreme coefficients directly ([regularization](/learn/ai-foundations/regularization-techniques)), or add more flags to the trail — more data narrows how far a high-degree fit can wander. Three different levers on the same dial, worked through with actual numbers in the [bias-variance worked example](/learn/ai-foundations/bias-variance-worked-example).

## Where the ridge-trail analogy stops being a good guide

Two places this picture will mislead you if you push it too far.

First: the trail has one obvious axis to wiggle along, so overfitting shows up as literal, visible wiggle. Most real models — a classifier over images, an LLM predicting the next token — don't have a single ordered axis like that, so there's no curve to squint at. The mechanism is identical (capacity spent explaining accidents in this batch of data instead of the general pattern), but the symptom looks different: say every training photo of one class happened to be shot against the same wall — a high-capacity model can quietly learn "that wall" instead of "that object," and you'd never see it as a wiggle, only as a model that inexplicably fails once the background changes.

Second, and more important if you're heading toward neural networks: this page's whole argument leaned on "16 coefficients, 12 points, therefore doomed" — more parameters than data, guaranteed disaster. Modern deep networks routinely have vastly more parameters than training examples and often still generalize fine, which isn't a contradiction of anything here so much as a sign that the classical bias-variance picture is incomplete once you're at that scale. [Grokking and double descent](/learn/llm-foundations/grokking-and-double-descent) is where that more surprising, non-classical version of this story lives — worth reading once this page's version feels solid, not before.

**Related:** [generalization and overfitting](/learn/ai-foundations/generalization-and-overfitting) · [bias-variance tradeoff](/learn/ai-foundations/bias-variance-tradeoff) · [bias-variance worked example](/learn/ai-foundations/bias-variance-worked-example) · [regularization techniques](/learn/ai-foundations/regularization-techniques) · [train/validation/test splits](/learn/ai-foundations/train-validation-test-splits) · [grokking and double descent](/learn/llm-foundations/grokking-and-double-descent)
