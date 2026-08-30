---
title: "What Embeddings Are"
track: "ai-foundations"
status: live
summary: "Foundational concept lesson defining embeddings as learned vectors whose geometry encodes meaning, contrasting one-hot encoding with dense learned embeddings, and showing with a ru"
duration: "14 min read"
---

Type "puppy" into a search box built on embeddings and it can surface pages about dogs, leashes, and vets — even ones that never use the word "puppy." That's not a synonym dictionary at work. That's geometry standing in for meaning.

## What it is

An embedding is a vector — a fixed-length list of numbers — that a model produces or looks up to represent something: a word, a sentence, an image, a user, a product. What makes it an *embedding* rather than just "some numbers" is one property: the geometry of the space it lives in is meaningful. Distance and direction between vectors correspond to similarity and relationship between the things they represent. Two vectors sitting close together represent two things the model treats as alike; two vectors far apart represent things it treats as unrelated.

That's the whole definition. Everything else — how many dimensions, whether it's trained on text or images or clickstreams, whether you measure "close" with cosine similarity or Euclidean distance — is detail sitting on top of that one idea: coordinates that carry meaning.

Contrast that with the encoding you'd reach for if you'd never heard of embeddings: one-hot encoding. Give every item in your vocabulary its own dimension, put a 1 in that dimension and 0 everywhere else. It's simple, it's exact, and it throws away everything about how items relate to each other:

```python
import numpy as np

vocab = ["cat", "kitten", "dog", "car", "truck"]
one_hot = np.eye(len(vocab))

cat, kitten, truck = one_hot[0], one_hot[1], one_hot[4]

print(cat @ kitten)                    # 0.0 -- no relationship at all
print(cat @ truck)                     # 0.0 -- exactly as unrelated as kitten
print(np.linalg.norm(cat - kitten))    # 1.4142...
print(np.linalg.norm(cat - truck))     # 1.4142...  -- identical distance
```

Every distinct pair of one-hot vectors has a dot product of exactly 0 and a Euclidean distance of exactly √2. "cat" is precisely as similar to "kitten" as it is to "truck" — which is to say, not similar at all, by construction. One-hot vectors don't encode meaning; they encode identity. They're a way of saying "this is item #47," full stop.

A learned embedding for the same words might be 100, 300, or 4096 real-valued numbers, none of them assigned by a person. "Cat" and "kitten" end up near each other in that space not because anyone declared them similar, but because of what happened during training. That shift — from vectors you hand-design to vectors the model discovers — is what this lesson is about.

## The mental model

Picture a large empty room, and every word or item you care about gets placed somewhere in it. One-hot encoding puts everything on the surface of a sphere, each item at its own private point, every point exactly the same distance from every other — like assigning each employee a unique badge number. The number tells you nothing about who works with whom.

A learned embedding space is more like a room arranged by a librarian who has never read the books, only tracked which ones get checked out together. Books that keep getting borrowed alongside each other end up on nearby shelves — not because someone read them and judged them thematically similar, but because their usage overlapped enough to make nearby shelving useful. After enough reshelving, animal-behavior books cluster in one corner and cookbooks in another, and nobody explicitly designed that layout. It emerged from co-occurrence.

That's the model to hold onto: **an embedding space is a map built from behavior, not from definitions.** "Cat" and "kitten" end up close together because they show up in similar contexts — similar sentences, similar neighboring words — not because a linguist told the model a kitten is a young cat. The model never sees that fact. It infers a geometric relationship from a statistical one.

One more piece matters: individual dimensions of that space usually aren't labeled anything you'd recognize. There's rarely a dimension that cleanly means "furriness" and another that means "domesticated." Meaning is distributed across the whole vector — the relationships between vectors carry it, not any single coordinate read in isolation. You can rotate the entire space and every distance and angle stays the same, which is why asking "what does dimension 47 mean?" is usually the wrong question, even though "what's near this vector?" is exactly the right one.

## Why it works this way

Here's the mechanism, stripped down: an embedding is a set of learned parameters, no different in kind from any other weight in a neural network (see [what a model actually is](/learn/ai-foundations/what-a-model-actually-is) if "parameters" still feels fuzzy). Concretely, it's usually a lookup table — an embedding matrix with one row per vocabulary item, each row a vector of, say, 300 or 4096 numbers. When training starts, that table is filled with small random numbers. "Cat" and "kitten" begin essentially unrelated, sitting at arbitrary points, for the boring reason that random numbers don't know anything about cats.

Training then pushes those rows around using an ordinary objective — often something [self-supervised](/learn/ai-foundations/self-supervised-learning), like "given the words around this position, predict the missing word." Every time the model sees "kitten" in "the ___ curled up and slept" and separately sees "cat" in the same frame, it's asked to make similar predictions from similar contexts. The easiest way for [gradient descent](/learn/ai-foundations/gradient-descent-explained) to satisfy that, repeatedly, is to give "cat" and "kitten" similar vectors — the rest of the network can then treat them almost interchangeably. Nothing about cats or kittens is hardcoded; the closeness is a side effect of both words being useful in the same predictive contexts, over and over, across enormous amounts of text.

This is also exactly why one-hot vectors can't do this. A one-hot vector isn't a parameter — it's a fixed, deterministic function of "which item is this." There's no gradient that can move it closer to another word's vector, because doing so would mean putting a nonzero value somewhere a one-out-of-N encoding forbids by definition. Dense embeddings are learnable precisely because every coordinate is a free parameter the optimizer is allowed to adjust. That single difference — fixed versus learnable — is the entire reason one gives you geometry and the other doesn't.

It's worth being precise about one more thing: in a modern transformer, a token's initial embedding — its row in that lookup table — is only the starting point. As it flows through the network, [attention](/learn/llm-foundations/attention-mechanism-explained) reshapes it based on surrounding tokens, so "bank" in "river bank" and "bank" in "savings bank" start from the same row but end up as different vectors by the time the model uses them. This lesson focuses on that foundational, static lookup-table embedding — one vector per item — because it's the clearest place to see "geometry encodes meaning" without also tracking context. The contextual version builds on exactly the same idea.

## A concrete example

You can watch this happen with nothing more than numpy, in a toy setup small enough to reason about by hand. Say you've decided — however roughly — how often five words co-occur in some body of text: "cat" and "kitten" show up near each other a lot, "car" and "truck" show up near each other a lot, and the two groups almost never overlap. (These counts are illustrative, invented to make a clean example — not measured from a real corpus.)

```python
import numpy as np

np.random.seed(0)

vocab = ["cat", "kitten", "dog", "car", "truck"]
n = len(vocab)

# Illustrative co-occurrence counts -- how often each word
# shows up near each other word in some imagined corpus.
cooc = np.array([
    [20., 18., 10.,  1.,  1.],   # cat
    [18., 20.,  8.,  1.,  1.],   # kitten
    [10.,  8., 20.,  1.,  1.],   # dog
    [ 1.,  1.,  1., 20., 17.],   # car
    [ 1.,  1.,  1., 17., 20.],   # truck
])

target = np.log(cooc)
np.fill_diagonal(target, 0)   # ignore self-pairs

dim = 2
emb = np.random.randn(n, dim) * 0.1   # start as noise -- no structure yet
lr = 0.02

for step in range(3000):
    pred = emb @ emb.T
    np.fill_diagonal(pred, 0)
    error = pred - target
    grad = (error @ emb) * (2 / n)
    emb -= lr * grad

def cosine(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

for i in range(n):
    for j in range(i + 1, n):
        print(f"{vocab[i]:6s} vs {vocab[j]:6s}: {cosine(emb[i], emb[j]):.2f}")
```

This is a simplified version of how real word-embedding methods worked — matrix-factorization approaches like GloVe are close cousins of this exact loop: start from random vectors, and repeatedly nudge each pair's dot product toward a target derived from how often they co-occur, using ordinary gradient descent. Run it and watch the cosine similarities as `step` climbs from 0 to 3000: cat-kitten and car-truck should climb toward values close to 1, while cat-car and kitten-truck should stay near 0. Nobody told the optimizer that cats and kittens are related — it never sees the words as anything but row indices. The geometry comes entirely from which pairs were pushed to agree.

Compare that to the one-hot version from the first section: no amount of training moves those vectors, because a one-hot encoding has no free parameters to move — it's a lookup key, not a fit. That's the concrete difference between handed coordinates and learned coordinates.

## Where it shows up

- **Every modern LLM** starts by turning each input token into an embedding before anything else happens — attention, feed-forward layers, all of it operate on these vectors (see [how LLMs work](/learn/ai-foundations/how-llms-work)).
- **Semantic search and RAG** embed documents and queries into the same space and retrieve by nearest-neighbor distance instead of keyword overlap — why a search for "affordable" can surface a document that only says "budget-friendly" (see [embeddings and semantic similarity](/learn/rag/embeddings-and-semantic-similarity)).
- **Recommendation systems** embed users and items into a shared space so "users like this one" and "items like this one" both fall out of the same distance calculation.
- **Clustering and anomaly detection** run directly on embeddings, since grouping by geometric closeness is exactly what a clustering algorithm wants as input.
- **Lightweight classification** — take a frozen embedding, run it through a small classifier head — is a common shortcut instead of training a full model from scratch.

## Watch out for

- **"Close" means close for whatever that model was trained on — not close in some universal sense of meaning.** An embedding trained on purchase co-occurrence might put "umbrella" near "sunscreen" (bought in the same season) rather than near "raincoat" (similar meaning). Always ask what signal produced the embedding before trusting what "similar" means inside it — see the-data-the-model-learned-from for why the training data shapes everything downstream.
- **Individual dimensions usually aren't interpretable.** It's tempting to go looking for "the gender dimension" or "the sentiment dimension" in a 300-d embedding. Rough directions like that sometimes emerge and are even usable, but there's no guarantee any single coordinate maps to a human concept — which is exactly why embeddings are hard to audit directly, a theme that runs through interpretability-black-box-problem more broadly.
- **A word doesn't have one embedding forever in a modern LLM.** The lookup-table vector this lesson focuses on is only the starting point; by the time attention has run, "bank" has a different effective vector in "river bank" than in "bank account." If you're debugging why two occurrences of the same word behave differently downstream, that's usually why.

## Where next

From here, the natural moves are hands-on: measure similarity precisely instead of eyeballing it, watch the same geometry produce full analogies, and see how "nearness" holds up once you're working in more dimensions than you can picture.

**Related:** [computing embedding similarity in numpy](/learn/ai-foundations/computing-embedding-similarity-in-numpy) · [embeddings and word analogies](/learn/ai-foundations/embeddings-word-analogies-example) · [the geometry of embeddings](/learn/maths-foundations/the-geometry-of-embeddings) · [high-dimensional spaces](/learn/maths-foundations/high-dimensional-spaces) · [embeddings quiz](/learn/ai-foundations/embeddings-quiz) · [the data the model learned from](/learn/ai-foundations/the-data-the-model-learned-from)
