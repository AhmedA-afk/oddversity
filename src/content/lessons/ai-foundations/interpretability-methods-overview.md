---
title: "Ways to Peek Inside the Box"
track: "ai-foundations"
status: live
summary: "A practitioner's tour of the three interpretability method families — attention visualization, probing, and feature/circuit analysis — grounded in the idea that a feature is a dire"
duration: "16 min read"
---

This is the deep-dive companion to [the black-box problem](/learn/ai-foundations/interpretability-black-box-problem): that page tells you why looking inside is hard, this one gets concrete about the actual toolkit — three families of methods, what each one can rigorously claim, and where each one quietly runs out of road. Read the mechanics here even if you never run a probe yourself; knowing what "we visualized attention" or "we found the circuit" actually licenses you to believe is what separates reading an interpretability claim from being impressed by one.

## A feature is a direction, wherever it lives

You already met this idea for embeddings: in [word embedding space](/learn/ai-foundations/what-embeddings-are), a concept like "gender" or "capital-of" behaves like a consistent offset — the [king − man + woman ≈ queen](/learn/ai-foundations/embeddings-word-analogies-example) arithmetic only works because the concept is encoded as a direction, not a lookup table entry. The move that makes modern interpretability possible is applying that exact same assumption to the model's *internal* activations — the hidden states sitting between the input embedding and the output logits, at every layer, for every token position.

There's nothing metaphorical about this. A hidden state is a vector in, say, 4096-dimensional space. If "this text is written in a formal register" is something the model represents at all, it should show up as some direction in that space — a vector such that formal examples project further along it than casual ones. You can go find that direction with almost embarrassingly simple arithmetic:

```python
import numpy as np

# Toy hidden states (as if pulled from one layer of a real model,
# shrunk to 4 dimensions for readability)
formal = np.array([
    [0.9, 0.1, 0.4, -0.2],
    [0.8, 0.2, 0.5, -0.1],
    [1.0, 0.0, 0.3, -0.3],
])
casual = np.array([
    [0.1, 0.8, -0.2, 0.5],
    [0.2, 0.9, -0.1, 0.4],
    [0.0, 0.7, -0.3, 0.6],
])

# "difference of means": the simplest possible way to find a concept direction
direction = formal.mean(axis=0) - casual.mean(axis=0)
direction = direction / np.linalg.norm(direction)

# score a new hidden state by projecting it onto that direction
new_state = np.array([0.85, 0.15, 0.35, -0.25])
print(new_state @ direction)   # large positive -> reads as "formal"
```

This diff-of-means trick is a real, widely used technique — it's the cheapest way to turn "I have labeled examples of a concept" into "I have a direction I can measure or manipulate." Everything below is a more careful (or more automated, or more causal) version of this one idea. Keep the geometry — [the mechanics work the same way regardless of dimension](/learn/maths-foundations/high-dimensional-spaces) — in mind as the throughline; the three method families differ mainly in *how* they find the direction and *what they're willing to claim about it once found*.

## Attention visualization: seeing where the model is looking

Attention is the one internal quantity you get almost for free, because [the mechanism](/learn/llm-foundations/attention-mechanism-explained) is already computing it: for a given head, each query position produces a weight over every key position via `softmax(Q·Kᵀ / √d_k)`, and the head's output at that position is the weighted sum of value vectors, `weights @ V`. Plot those weights as a heatmap — rows are query tokens, columns are key tokens, color is weight — and you're looking at exactly the numbers the model computed, no proxy involved.

What that buys you: a genuinely faithful record of which positions a *specific head at a specific layer* pulled information from when updating a *specific token's* representation. That's useful for sanity checks (does an attention head reliably attend from a pronoun back to its antecedent?) and for spotting gross failures (a head that should attend to the current sentence attending to a distant, irrelevant one instead).

What it can't tell you, and this matters more than the heatmap ever suggests:

- **Weight isn't contribution.** The actual amount token *j* adds to token *i*'s update is `weight_ij × V_j` — a vector, not a scalar. A token can carry a large attention weight but a near-zero-norm value vector (contributing almost nothing) or a small weight on a huge value vector (contributing a lot). The heatmap only shows you half the multiplication.
- **One map is one head, one layer.** A model has dozens of layers and heads, and the residual stream — the shared vector every layer reads from and writes to — means a behavior is routinely the product of two or more heads composing across layers. Two heads can jointly implement something (a well-documented example is an "induction head" pattern, where one head copies positional information and a second uses it to predict a repeated token) that's invisible in either head's map alone.
- **Attention says nothing about the MLP blocks**, which hold most of a transformer's parameters and do the actual nonlinear feature-mixing. You can have a perfectly interpretable-looking attention pattern feeding into MLP computation you haven't looked at at all.
- **Attention patterns aren't guaranteed faithful to the output.** Researchers have shown you can sometimes construct a noticeably different attention pattern for the same input that leaves the model's output nearly unchanged — if the original pattern were "the explanation," that shouldn't be so easy to swap out. Treat a heatmap as a clue about mechanism, not a certificate of it.

## Probing hidden states: what's decodable, not what's used

Probing asks a narrower, more disciplined question: *is concept X linearly recoverable from this layer's representation at all?* The recipe: freeze the model, run it over a labeled dataset (say, sentences tagged for tense, or statements tagged true/false), pull the hidden state at layer L for each example, and train a small classifier — usually plain logistic regression — to predict the label from that frozen vector. You're not asking the model to do anything new; you're asking whether the information is *sitting there* for a linear readout to find.

Running it is the same shape of problem as the diff-of-means trick above, just fit by gradient descent instead of eyeballed as a mean difference — and the resulting weight vector *is* a concept direction, found by optimization instead of by hand:

```python
import numpy as np

# Six toy hidden states with a binary concept label
# (e.g. "does the sentence have a plural subject?")
X = np.array([
    [ 0.9,  0.2, -0.4],
    [ 0.8,  0.1, -0.3],
    [ 1.0,  0.3, -0.5],
    [-0.7,  0.6,  0.5],
    [-0.6,  0.5,  0.4],
    [-0.8,  0.7,  0.6],
])
y = np.array([1, 1, 1, 0, 0, 0])

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

rng = np.random.default_rng(0)
w = rng.normal(scale=0.01, size=X.shape[1])
b = 0.0
lr = 0.5

for _ in range(2000):
    p = sigmoid(X @ w + b)
    w -= lr * (X.T @ (p - y) / len(y))
    b -= lr * np.mean(p - y)

print("probe direction:", w / np.linalg.norm(w))
print("train accuracy:", np.mean((sigmoid(X @ w + b) > 0.5) == y))
```

Run probes like this at every layer and you get a curve — the concept's decodability as a function of depth — which is genuinely informative about *where in the network* information appears, sharpens, or gets discarded.

Here's the trap, and it's the one thing to hold onto from this whole section: **high probe accuracy tells you the information is present and linearly separable — it does not tell you the model uses it for anything.** Two failure modes hide behind a clean-looking accuracy number:

1. **Confounds.** Your "plural subject" probe might really be reading sentence length, or a punctuation pattern, that happens to correlate with plurality in your dataset. The representation the model actually computes for some *other* purpose can accidentally make your concept linearly readable as a side effect.
2. **Probe capacity.** A powerful enough probe can fit patterns that aren't robustly *in* the representation in any meaningful sense — it can partly be memorizing quirks of your particular dataset. The standard defense is a **control task**: fit the same probe architecture to a task of matched difficulty but scrambled, meaningless labels (e.g., a random assignment of the same label distribution). If your probe fits the nonsense task almost as well as the real one, its accuracy on the real task tells you more about the probe than the model.

Either way, probing is observational. It answers "is X here," never "does the model act on X" — for that you need to actually intervene, which is the next section's whole point.

## From directions to circuits: causal interpretability

Mechanistic interpretability tries to go one step further than "here's a direction correlated with a concept" to "here's the specific piece of the network that computes and uses it, and I can prove it causally." Two things make this harder than it sounds, and one family of tools that makes it possible anyway.

**Superposition** is the first complication. A model has vastly more concepts it plausibly needs to represent than it has neurons to dedicate to them, so instead of one neuron per feature, many features get packed as overlapping, non-orthogonal combinations across many neurons — the geometric price of packing more directions into a space than that space has orthogonal dimensions to spare, the same kind of high-dimensional-space argument that makes [near-orthogonality cheap](/learn/maths-foundations/high-dimensional-spaces) in the first place. The visible symptom is **polysemanticity**: a single neuron that appears to fire for several unrelated concepts at once, because it's really one coordinate of several different overlapping feature directions rather than a clean feature detector on its own.

**Sparse autoencoders (SAEs)** are the current standard tool for undoing this. You train a small autoencoder on a layer's activations with a sparsity penalty on its hidden layer, forcing it to reconstruct each activation as a sparse combination of a much larger, learned set of dictionary directions. The premise — and it's a premise, not a proof — is that this learned overcomplete basis lands closer to the model's "true," more monosemantic features than the raw neuron basis does. Notice this is still exactly the same object as everywhere else in this lesson: an SAE feature is a direction; you've just found it by unsupervised dictionary learning instead of a labeled diff-of-means or a supervised probe.

Directions found this way are still only correlational until you test them causally, and the toolkit for that is **intervention**, not observation:

- **Activation patching** (causal tracing): run the model once on a "clean" input and once on a "corrupted" variant, then copy a specific activation from one run into the other mid-computation and see how much of the output effect transfers. If patching a single component recovers most of the effect, you have real causal evidence that component matters — not just that it correlates.
- **Ablation**: zero out (or otherwise remove) a head's or direction's contribution and check whether the behavior degrades in the way your hypothesis predicts.
- **Steering**: add `α × direction` to the residual stream mid-forward-pass and continue the computation — literally the king − man + woman move, injected inside the network instead of computed on its output — then check whether the output shifts the way the direction's supposed meaning predicts.

A **circuit** is the payoff of stringing these together: a specific, small subgraph of heads and MLP directions across layers that you've shown — by patching and ablating each piece — jointly implements some identifiable piece of behavior. The best-known published examples (like induction heads, mentioned above) were found exactly this way: a hypothesis about what a head might be doing, then causal tests confirming it.

Be honest with yourself about the limits here, because circuit-analysis writeups tend to read more conclusively than the method supports:

- **It doesn't scale by brute force.** The search space is every component, at every layer, at every token position, and checking each candidate requires running interventions — this is combinatorially expensive, which is why almost every published circuit covers a narrow, hand-picked task on a small-to-medium model.
- **Faithfulness and completeness are separate, both-fragile claims.** A found circuit being *faithful* (it really produces the effect you attribute to it) doesn't mean it's *complete* (it accounts for the whole behavior, on every input, not just your test set). Most published circuits explicitly claim only partial credit for the behavior they target.
- **Superposition doesn't fully go away** just because you ran an SAE — decomposing activations into more directions than you started with is progress, not a solved decomposition, and picking the "right" dictionary size and sparsity is still an empirical, unsettled choice.
- **Scaling this to "audit a frontier model for property X"** — as opposed to "we found one interesting circuit in one mid-sized model for one narrow task" — remains an open research problem, not a solved engineering pipeline.

## Putting the three side by side

| Method | Question it answers | What it costs you | What it can't establish |
|---|---|---|---|
| Attention visualization | Which positions is this head, at this layer, drawing from right now? | Nothing extra — the weights already exist | Whether that information is actually used downstream; anything about the MLP; multi-head composition |
| Probing hidden states | Is concept X linearly decodable at this layer? | A labeled dataset + a small classifier, per layer you want to check | Whether the model causally *uses* that information (needs a control task to even trust the number) |
| Feature/circuit analysis (SAEs, patching, ablation, steering) | Which specific directions/components causally implement this behavior? | Interventions on live activations, often paired clean/corrupted inputs, sometimes a trained SAE | Scales poorly; found circuits are typically partial and narrow, not guaranteed to generalize |

As a rule of thumb: reach for attention maps as a first, cheap sanity check; reach for probing when you want to know *where* a concept lives across depth; reach for causal intervention only when you actually need to claim the model *uses* something, because that's the one claim the first two methods structurally cannot make on their own.

## What none of these get you

Even stacked together, these three families share blind spots worth naming explicitly, because they're easy to forget once you've seen one convincing result:

- **Every one of them is hypothesis-driven.** You have to already suspect "formality" or "truthfulness" or "this specific head" is worth checking before you can probe it, visualize it, or patch it. None of these methods hands you an unprompted list of everything a model represents or does — they confirm or refute a guess you brought in the door.
- **A negative result is rarely a clean result.** Failing to find a linear probe, a clean attention pattern, or a tidy circuit for some behavior doesn't mean the behavior isn't represented — it might be nonlinear, spread across more components than you checked, or just not where you looked.
- **Results are local to a model, a dataset, and often a narrow task slice** — a circuit or a decodable direction found on your examples is evidence, not a proof that generalizes to the full input distribution the deployed model will actually see.

That combination — hypothesis-driven, rarely conclusive when it comes up empty, and locally scoped — is why interpretability results read best as targeted, falsifiable claims about one mechanism, not as a general certificate that a model is (or isn't) doing something concerning. That framing is exactly where the case-study evidence on [alignment failures](/learn/ai-foundations/alignment-failure-case-studies) and the broader [safety and alignment basics](/learn/ai-foundations/ai-alignment-and-safety-basics) picks up.

**Related:** [The black-box problem](/learn/ai-foundations/interpretability-black-box-problem) · [Attention mechanism explained](/learn/llm-foundations/attention-mechanism-explained) · [What embeddings are](/learn/ai-foundations/what-embeddings-are) · [The geometry of embeddings](/learn/maths-foundations/the-geometry-of-embeddings) · [Alignment failure case studies](/learn/ai-foundations/alignment-failure-case-studies) · [Safety and interpretability quiz](/learn/ai-foundations/safety-and-interpretability-quiz)
