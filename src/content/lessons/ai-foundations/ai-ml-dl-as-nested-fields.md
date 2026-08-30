---
title: "AI, ML, and Deep Learning as Nested Fields"
track: "ai-foundations"
status: live
summary: "Wrote the INTUITION-type lesson 'AI, ML, and Deep Learning as Nested Fields' as GitHub-flavored Markdown (no frontmatter/H1, body only). Built one strong analogy (three ways to tra"
duration: "7 min read"
---

## The chess engine that has never learned anything, and never will

Open any AI overview and you'll see the same picture: three circles, one nested inside the next, labeled AI, ML, and Deep Learning. It's correct — and almost useless on its own, because nobody tells you what actually happens at the boundary. What property does a system have to gain to cross from the outer circle into the middle one? What does it have to gain again to reach the center? If you already know the standard picture, [the circles overview](/learn/ai-foundations/ai-vs-ml-vs-deep-learning) covers what each one *is*. This page is about the two moments of transition — walked through with real, runnable code — so the boundaries stop being vibes and start being a checklist you can apply to anything.

## One analogy: three ways to train a new hire

Imagine you're onboarding someone to do a judgment-heavy task, and you have three completely different ways to get them competent at it.

**Option 1 — hand them a manual.** You write down every rule yourself: "if the customer says X, respond with Y." They execute your logic exactly. They never get better on their own, never worse either, and if the manual is wrong, they're wrong in exactly the way the manual is wrong. This is *your* intelligence, encoded, then run by someone else.

**Option 2 — hand them a spreadsheet of past cases and let them find the pattern.** You still tell them which columns matter — "look at word count, look at sender reputation, look at whether it's late at night" — but you don't tell them how to weigh those columns. They stare at a thousand solved examples and figure out, on their own, that sender reputation matters three times as much as word count. You picked the inputs; they picked the weights.

**Option 3 — hand them raw material and nothing else.** No spreadsheet columns, no pre-picked features — just the raw stuff (pixels, audio, text) and the right answers. They have to invent their own intermediate concepts before they can even get to a judgment: first something like "notice edges," then "notice shapes," then "notice objects" — none of which you specified. They built their own vocabulary for the problem.

Those three options are the three circles. Option 1 is AI without ML — intelligent-looking behavior with zero learning. Option 2 is ML without depth — learning, but only of *weights* on features you chose. Option 3 is deep learning — learning the *features themselves*, stacked in layers. Now let's make each one concrete enough that you could ship it.

## Circle 1: the chess rule — AI, not ML

Here's a real piece of chess logic, the kind every chess engine needs somewhere in it:

```python
def is_legal_rook_move(from_sq, to_sq, occupied):
    """occupied: a set of (row, col) squares currently holding any piece."""
    fr, fc = from_sq
    tr, tc = to_sq
    if fr != tr and fc != tc:
        return False  # a rook only ever moves in a straight line

    step_r = 0 if fr == tr else (1 if tr > fr else -1)
    step_c = 0 if fc == tc else (1 if tc > fc else -1)

    r, c = fr + step_r, fc + step_c
    while (r, c) != (tr, tc):
        if (r, c) in occupied:
            return False  # something is blocking the path
        r, c = r + step_r, c + step_c

    return True
```

This is unambiguously AI: it's a program producing behavior — correctly judging chess legality — that would require understanding if a human did it cold. But there is nothing to learn here, and nothing ever will get learned. `step_r`, `step_c`, the blocking check — you wrote every branch. Feed this function the same board a million times and it produces the same answer a million times. There's no data it improves from, no parameter that moves. A real engine adds a handful more lines for captures and for not leaving your own king in check, but the mechanism never changes: a human thought through the rule and typed it in.

This is the entire population of "AI but not ML": search algorithms, planning systems, rule-based expert systems, the pathfinding in a video game NPC. It's a huge, useful, and completely legitimate part of AI that has nothing to do with training on data.

## Circle 2: the spam filter — ML, not deep

Now a different task: is this email spam? You *could* hand-write rules ("if it contains 'FREE MONEY', flag it"), but rules like that go stale the moment spammers adjust their wording. Instead, you pick a small set of signals you believe are informative, and let the weighting be learned from labeled examples — exactly the [supervised learning](/learn/ai-foundations/supervised-learning-explained) setup:

```python
import numpy as np

# hand-picked features per email: [count of "free", count of "!", count of "click", length/100]
X = np.array([
    [3, 5, 2, 0.8],   # spam
    [0, 0, 0, 1.2],   # not spam
    [2, 4, 1, 0.5],   # spam
    [0, 1, 0, 2.0],   # not spam
])
y = np.array([1, 0, 1, 0])

weights = np.zeros(X.shape[1])
bias = 0.0
lr = 0.1

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

for epoch in range(1000):
    z = X @ weights + bias
    preds = sigmoid(z)
    error = preds - y
    grad_w = X.T @ error / len(y)
    grad_b = error.mean()
    weights -= lr * grad_w
    bias -= lr * grad_b

print(weights)  # you never chose these numbers -- gradient descent did
```

Run it (this toy set is tiny and illustrative, not a benchmark) and `weights` comes out non-zero and different from each other — the model decided, from the data, that some of these four columns matter more than others. That's the mechanism [gradient descent](/learn/ai-foundations/gradient-descent-explained) is doing on every pass: nudging each weight in the direction that reduces error, until the weights stop moving much.

This is ML, and specifically not deep. Notice what you still did by hand: you chose the four columns. Nobody told the model "count exclamation marks" — you did, because you already suspected it was predictive. The model's entire contribution is the weighting: one layer of learned numbers sitting between features you engineered and the final decision. That's the exact property that moved this system from circle 1 into circle 2 — **the rule is fit to data instead of written by a person** — and the exact property keeping it out of circle 3 — **the representation it operates on (those four counts) is still yours, not learned.**

## Circle 3: the image classifier — deep learning

Last task: is this a photo of a cat? You could try to hand-engineer features the way you did for spam — "average brightness of the top third," "edge density," whatever — but nobody has ever successfully hand-designed features good enough for general image recognition. So instead, you feed in something close to raw pixels and let the model build its own intermediate features, via a [neural network](/learn/ai-foundations/what-is-a-neural-network) with at least one hidden layer:

```python
import numpy as np

def relu(z):
    return np.maximum(0, z)

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

# a tiny 4-pixel "image," flattened -- nothing hand-picked, just raw values
x = np.array([0.9, 0.1, 0.8, 0.2])

# layer 1: learns its own intermediate detectors straight from the pixels
W1 = np.random.randn(4, 3) * 0.1
b1 = np.zeros(3)
hidden = relu(x @ W1 + b1)      # 3 numbers -- not features you ever named

# layer 2: combines those learned detectors into a final decision
W2 = np.random.randn(3, 1) * 0.1
b2 = np.zeros(1)
output = sigmoid(hidden @ W2 + b2)
```

Compare the shapes carefully against the spam filter. The spam filter went `features -> weights -> output`: one learned layer, sitting on top of features a person picked. This goes `raw pixels -> learned hidden layer -> learned hidden layer -> output`: the values in `hidden` are themselves *learned*, not chosen. Nobody wrote down what those three numbers should represent — training decided that, the same way it decided the weight values. Stack more of these transformations and, with enough layers and data, the earlier ones tend to respond to low-level structure (edges, textures) and later ones to higher-level structure (parts, objects), entirely as a side effect of minimizing error, not because anyone specified a curriculum. The nonlinearity (`relu`) matters here for a real reason, not decoration — stack purely linear layers and they collapse into one linear layer no matter how many you use, so [nonlinearity is what lets depth do anything at all](/learn/ai-foundations/why-nonlinearity-matters).

That's the second crossing, and it's a different kind of step than the first one. Circle 1 to circle 2: **stop writing the rule, start fitting it to data.** Circle 2 to circle 3: **stop hand-designing the representation, start learning the representation too.**

## The exact test, as a checklist

You now have everything you need to classify any system you meet, not just these three toy ones. Ask, in order:

1. **Is the output produced by logic a person wrote and could point to, line by line, with no fitting to data?** If yes — rule engine, search, planner, hand-tuned scoring function — you're in AI-not-ML. Stop here.
2. **Is it fit to data, using inputs/features a person chose?** If yes, you're in ML-not-deep, whether the fitting method is logistic regression, a decision tree, or an SVM.
3. **Does it learn its own intermediate representation, through multiple layers of transformation, starting from something close to raw input?** If yes, you're in deep learning.

Every "is this AI or ML?" argument you'll ever have collapses into one of these three questions if you actually run it.

## The wrong intuition, and why it's wrong

> **Wrong:** "AI → ML → Deep Learning is a difficulty ladder — DL is the smartest, most advanced circle, so it's 'better AI' than the others."

This feels true because deep learning is what's behind today's most visible systems, but it doesn't hold up. The hand-coded rook-move checker is *more reliable* than any learned alternative — it's never wrong, never needs a training set, and costs nothing to run. A chess engine's search-and-evaluate tree (classical AI, arguably not even ML) can still outplay almost every human on earth. Nesting describes generality of technique — every ML system is also an AI system, every DL system is also an ML system — not a scoreboard of quality. Picking the smallest circle that solves your problem is usually the right engineering call, not a concession.

> **Wrong:** "If it learns from data at all, it's basically the same as deep learning — the ML/DL split is just about scale, more data or more compute."

The spam filter and the image classifier can be trained on identical amounts of data and it doesn't close the gap between them, because the difference isn't scale — it's architecture. The spam filter has exactly one layer of learned parameters sitting on features you engineered; the image classifier has multiple layers learning the features themselves. You could 100x the spam filter's training set and it would still never discover a "curve detector" on its own, because its architecture has no hidden layer for one to exist in. Depth is a structural property of the model, not a quantity of data thrown at it.

## When the analogy breaks

The new-hire story is useful, but push on it and two places give way.

**Real systems are stacks, not single circles.** A strong modern chess engine typically combines a hand-coded rule layer (legal move generation — circle 1), classical tree search deciding which moves to even consider (also mostly circle 1), and a deep network scoring how good a resulting position is (circle 3) — with no ML-only, feature-engineered layer in the middle at all for that particular system. Ask "which circle is this product?" and you'll get confused; ask "which circle is *this component*?" and it resolves instantly. [How modern AI actually fits together](/learn/ai-foundations/how-modern-ai-fits-together) is worth reading once this distinction clicks, because almost nothing shipped today is purely one circle.

**"Learns its own concepts" oversells what's happening inside the hidden layer.** The new-hire analogy implies something like understanding — noticing edges, then shapes, the way a person would describe their own reasoning. What's actually in `hidden` after training is just three floating-point numbers that happened to reduce error during optimization. They often *correlate* with human-nameable concepts like edges in early layers of real image models, but there's no guarantee, and pinning down what a given hidden unit is actually responding to is a genuinely hard, unsolved-in-general problem — this is exactly the territory of the [interpretability / black-box problem](/learn/ai-foundations/interpretability-black-box-problem). Depth buys you learned representations, not human-readable ones for free.

One more soft edge worth naming honestly: there's no official layer count where "ML" flips to "deep." One hidden layer is technically a (shallow) neural network and still usually gets called ML rather than DL in practice; the field's convention settled on "deep" once stacking more than a couple of hidden layers became normal and useful, not because of a hard rule. The checklist above — is the *representation itself* learned, layer over layer — is the mechanism; "how many layers counts" is just a naming convention riding on top of it.

**Related:** [AI vs. ML vs. Deep Learning](/learn/ai-foundations/ai-vs-ml-vs-deep-learning) · [What Is a Neural Network](/learn/ai-foundations/what-is-a-neural-network) · [Supervised Learning, Explained](/learn/ai-foundations/supervised-learning-explained) · [Gradient Descent, Explained](/learn/ai-foundations/gradient-descent-explained) · [How Modern AI Fits Together](/learn/ai-foundations/how-modern-ai-fits-together) · [Narrow AI vs. General AI](/learn/ai-foundations/narrow-ai-vs-general-ai)
