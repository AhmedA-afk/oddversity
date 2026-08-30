---
title: "What a Model Actually Is"
track: "ai-foundations"
status: live
summary: "A deep concept lesson defining a model as a parameterized function f(x; w), showing the identical structure across a line, a logistic classifier, and a small neural net, and drawin"
duration: "14 min read"
---

When someone says a model "learned" to flag spam or write a sentence, here is literally what happened: a fixed-shape function had its internal numbers nudged, over and over, until it did the job well. That's the whole trick. Once you can see a straight line, a spam filter, and a neural network as the same object — a function with adjustable numbers inside it — nothing later in this track will feel like magic; it'll feel like calculus applied to bigger and bigger versions of the same thing.

## What it is

A model is a function, written `f(x; w)`, where:

- `x` is the input (a square footage, a pixel grid, a sequence of tokens)
- `w` is a collection of numbers called **parameters** — weights and biases — that controls exactly how `x` gets turned into an output
- the semicolon is doing real work: it separates "the thing that changes per prediction" (`x`) from "the thing that changes per model" (`w`)

The **architecture** is the fixed recipe for how `x` and `w` combine — how many numbers are in `w`, how they're grouped, what operations sit between them. A line, a logistic classifier, and a neural net are three different architectures, but every one of them is an `f(x; w)`.

**Learning** (equivalently: training) is the process of searching for a setting of `w` that makes `f(x; w)` produce good outputs on data you have, as measured by a [loss function](/learn/ai-foundations/loss-functions-explained). That's the entire definition. Nobody hand-writes the rules a trained model follows — someone hand-writes the *architecture*, and a search process finds the `w`.

## The mental model

Picture the architecture as a machine built out of empty slots, and `w` as the numbers you drop into those slots. Before any training happens, the machine is fully wired — you can see exactly how many slots there are and how they're connected — but every slot reads zero, or some random placeholder. Training is the only step where the slots get filled with numbers that make the machine do something useful.

This reframes "choosing a model" into two separate decisions that people conflate constantly:

1. **Choosing the machine** — how many slots, wired how. You make this decision *before* you see a single training example. It's fixed once training starts.
2. **Filling the slots** — done automatically, by an optimizer watching a loss function and adjusting `w` to make it smaller. You don't do this by hand; a search algorithm does it, guided by data.

Decision 1 is your **hyperparameters**. The output of decision 2 is your **parameters**. Keeping these two piles of numbers mentally separate is the single most useful habit this page can give you — it's why the table below exists.

## Why it works this way

Writing every model as `f(x; w)` — instead of, say, a line for linear regression and a totally different kind of object for a neural net — is what lets one training algorithm work on all of them. As long as `f(x; w)` is a smooth mathematical expression in `w`, you can compute how a tiny nudge to any single number in `w` changes the loss, and nudge every number a little in the direction that reduces it. That's [gradient descent](/learn/ai-foundations/gradient-descent-explained), and it doesn't care whether `w` has 2 entries or 2 billion — the machinery is identical, only the size of the list changes.

That's also the honest answer to "why do bigger models tend to do more"? A bigger `w` means the architecture can represent a larger family of possible functions — more distinct input-output relationships are reachable by *some* setting of the slots. Whether training actually *finds* a good setting in that larger space is a separate question (see [scaling laws](/learn/ai-foundations/scaling-laws) and the pitfalls below), but the reason parameter count is the number everyone quotes — "8B," "70B" — is that it's a direct, literal count of how long the list `w` is.

## A concrete example

Same idea, three architectures. Watch `w` change shape while the underlying pattern — a linear combination of `x`, sometimes reused, sometimes squashed — stays put.

**A line.** `f(x) = w·x + b`. Two parameters, `w` and `b`.

```python
import numpy as np

def f(x, w, b):
    return w * x + b

# square footage (hundreds) -> price (thousands), made-up numbers
x = np.array([1.0, 1.5, 2.0, 2.5])
y = np.array([150.0, 200.0, 260.0, 300.0])

# same architecture, two different guesses for w
for w, b in [(100.0, 20.0), (140.0, -10.0)]:
    preds = f(x, w, b)
    mse = np.mean((preds - y) ** 2)
    print(f"w={w}, b={b} -> mse={mse:.1f}")
```

Run it and you'll get `mse=1075.0` for the first guess and `mse=525.0` for the second — same `f`, same data, and the second `w, b` fits better. Training is nothing more than an automated, much smarter version of that loop: instead of you guessing two pairs, an optimizer tries thousands of nearby settings and keeps moving toward lower error.

**A logistic classifier.** Same linear score, squashed through a sigmoid so the output reads as a probability. This is [classification](/learn/ai-foundations/classification-vs-regression) instead of prediction of a number, but the parameters play the exact same role:

```python
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def f(x, w, b):
    z = w * x + b        # identical linear step to the line above
    return sigmoid(z)    # squashed into [0, 1]

# feature: count of suspicious words in an email
x = np.array([0, 1, 2, 5, 8])
w, b = 0.8, -2.5
print(f(x, w, b).round(3))
```

The output climbs from near 0 for clean emails toward near 1 for word-heavy ones. `w` and `b` are still the only two numbers doing any work — training a spam filter means searching for values of `w, b` that push clean emails toward 0 and spam toward 1.

**A small neural net.** Stack that same "linear combination, then squash" step twice, with a hidden layer of several units in between:

```python
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def f(x, W1, b1, W2, b2):
    h = sigmoid(W1 @ x + b1)   # hidden layer: still just w's and a squash
    y = sigmoid(W2 @ h + b2)   # output layer: the same recipe again
    return y

x = np.array([0.6, 0.2])                                # 2 input features

W1 = np.array([[0.4, -0.7], [0.1, 0.9], [-0.5, 0.3]])    # 3 hidden units, 2 inputs each
b1 = np.array([0.0, 0.1, -0.2])
W2 = np.array([0.8, -0.6, 0.5])                          # 1 output, 3 hidden units
b2 = 0.05

print(f(x, W1, b1, W2, b2))
```

Count the numbers: `W1` has 6, `b1` has 3, `W2` has 3, `b2` has 1 — 13 parameters, for a network that takes 2 inputs and produces 1 output. That ratio is the whole story of why [neural networks](/learn/ai-foundations/what-is-a-neural-network) scale into the billions: every additional layer or unit adds more slots to `w`, and the "linear step, then squash" recipe repeats unchanged no matter how many times you stack it.

Now the table the brief is really about — same three models, split into what training touches and what you touch:

| Model | Parameters `w` (found by training) | Hyperparameters (fixed by you, before training) |
|---|---|---|
| Line `f(x) = wx + b` | `w`, `b` — 2 numbers | learning rate, number of training steps |
| Logistic classifier `f(x) = sigmoid(wx + b)` | `w`, `b` (a full weight vector + bias once `x` has many features) | learning rate, regularization strength, decision threshold |
| Small neural net (2 → 3 → 1) | `W1`, `b1`, `W2`, `b2` — 13 numbers total | number of hidden layers, units per layer, activation function, learning rate, batch size, epochs |
| Large language model | every weight and bias in every attention and feed-forward block — billions of numbers | number of layers, embedding dimension, attention heads, context length, learning-rate schedule, vocabulary size |

The test for which column a number belongs in is mechanical, not philosophical: does the loss function's gradient reach it? If gradient descent can compute "nudge this number up or down to reduce error," it's a parameter. If it's a setting you pick before the first training step even runs — one that shapes *how big or how the search happens* rather than being touched *by* the search — it's a hyperparameter. Nobody's gradient ever points at "should this network have 4 layers or 6"; that number is chosen, not learned, no matter how carefully it's chosen.

## Where it shows up

Every model you'll meet in this track fits the pattern:

- **Classical ML** — linear and logistic regression, the two [supervised learning](/learn/ai-foundations/supervised-learning-explained) workhorses above, are `f(x; w)` with `w` small enough to inspect by eye.
- **Neural networks** of any depth are the same recipe stacked — see [what a neural network is](/learn/ai-foundations/what-is-a-neural-network) and, for the arithmetic behind one layer, [building a neuron in numpy](/learn/ai-foundations/building-a-neuron-in-numpy).
- **LLMs** are `f(x; w)` at a scale where `w` has billions of entries — see [how LLMs work](/learn/ai-foundations/how-llms-work). The relationship between the size of `w`, the amount of training data, and how good the resulting model gets is itself a studied pattern; see [scaling laws](/learn/ai-foundations/scaling-laws).
- **"Open-weight" model releases** are literally publishing `w` — the specific numbers a training run found — while keeping the architecture and training recipe separate questions. See [open-weight vs. closed models](/learn/ai-foundations/open-weight-vs-closed-models) for what that distinction does and doesn't tell you.
- **Model selection in practice** is mostly a hyperparameter comparison before you've trained anything — context length, size, cost per token — which is why it gets its own decision framework rather than being folded in here.

## Watch out for

**More parameters isn't automatically a better model.** A bigger `w` means a larger family of representable functions, but a larger search space is also easier to search badly — the model can fit noise in your training data instead of the real pattern. That failure mode has its own name and its own page: [generalization and overfitting](/learn/ai-foundations/generalization-and-overfitting).

**Don't let hyperparameters sneak into the "learned" column.** It's an easy slip to say "the model decided to use a deeper network" — it didn't; you or a config file decided that before training started, and the model's gradient never had access to that number in the first place. If you catch yourself describing an architecture choice as something the model "found," you've mixed up the two piles in the table above.

**"It's just a function" doesn't mean "it's readable."** `f(x; w)` being precisely defined — every operation known, every number in `w` sitting in a file you could open — is completely compatible with nobody being able to explain *why* a specific input produced a specific output once `w` has billions of entries. Precision and interpretability are different properties; see the [black-box problem](/learn/ai-foundations/interpretability-black-box-problem) for why exact math still ends up opaque in practice.

## Where next

You now have the frame this entire track sits on top of: pick an architecture (hyperparameters), search for `w` (training), and the resulting model *is* that particular `w`, not the architecture alone — two networks with identical architecture but different `w` are two different models. Where you go next depends on which side of the search you want to see up close: how the search itself works, or how much structure the architecture can hold.

**Related:** [Gradient descent, explained](/learn/ai-foundations/gradient-descent-explained) · [Backpropagation, explained](/learn/ai-foundations/backpropagation-explained) · [Classification vs. regression](/learn/ai-foundations/classification-vs-regression) · [Bias-variance tradeoff](/learn/ai-foundations/bias-variance-tradeoff) · [How LLMs work](/learn/ai-foundations/how-llms-work) · [Scaling laws](/learn/ai-foundations/scaling-laws)
