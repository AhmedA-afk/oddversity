---
title: "king - man + woman: Reading Meaning as Arrows"
track: "ai-foundations"
status: live
summary: "A worked example building a tiny 4-dimensional toy embedding space by hand, verifying that a consistent gender direction and plural direction exist, running king - man + woman = qu"
duration: "1 min read"
---

You've probably seen the claim that `king - man + woman ≈ queen` tossed around as proof embeddings "understand" gender. It's real, it's checkable by hand, and it's also a much narrower trick than it sounds. Let's build the actual numbers, watch a second direction (plural) show up for free, and then find exactly where the trick stops working.

## The setup

Real word embeddings (from word2vec, GloVe, or the token embeddings inside a modern LLM) have hundreds of dimensions, and no single dimension means "royalty" or "gender" on its own — meaning is smeared across all of them, which is a big part of why looking inside a trained model rarely gives you a clean answer (see [interpretability and the black-box problem](/learn/ai-foundations/interpretability-black-box-problem)). To make every step of this lesson checkable with a calculator, I've built a tiny 4-dimensional toy space by hand instead of training one. These numbers are illustrative — I chose them, no corpus produced them — but the property they demonstrate is the same one that emerges from real training on real text via [self-supervised learning](/learn/ai-foundations/self-supervised-learning): related words end up separated by consistent, reusable offsets. If you want the geometric picture behind "words as points in space" before diving in, see [what embeddings are](/learn/ai-foundations/what-embeddings-are).

Here's the vocabulary, as plain vectors:

| word | d1 | d2 | d3 | d4 |
|---|---|---|---|---|
| man | 2.0 | 1.0 | -1.0 | 0.0 |
| woman | 2.0 | 1.0 | 1.0 | 0.0 |
| king | 4.0 | 3.0 | -1.0 | 0.0 |
| queen | 4.0 | 3.0 | 1.0 | 0.0 |
| boy | 1.0 | 0.0 | -1.0 | 0.0 |
| girl | 1.0 | 0.0 | 1.0 | 0.0 |
| kings | 4.0 | 3.0 | -1.0 | 1.0 |
| queens | 4.0 | 3.0 | 1.0 | 1.0 |

I'm deliberately not telling you what d1–d4 "mean." Nobody labels dimensions during real training either — you find out what a direction encodes by subtracting related pairs and seeing what stays constant. That's the whole method for the rest of this lesson.

## Step by step

### Step 1 — Turn the words into arrays

```python
import numpy as np

vocab = {
    "man":    np.array([2.0, 1.0, -1.0, 0.0]),
    "woman":  np.array([2.0, 1.0,  1.0, 0.0]),
    "king":   np.array([4.0, 3.0, -1.0, 0.0]),
    "queen":  np.array([4.0, 3.0,  1.0, 0.0]),
    "boy":    np.array([1.0, 0.0, -1.0, 0.0]),
    "girl":   np.array([1.0, 0.0,  1.0, 0.0]),
    "kings":  np.array([4.0, 3.0, -1.0, 1.0]),
    "queens": np.array([4.0, 3.0,  1.0, 1.0]),
}
```

> **Why this step?** "Subtract man" only means something once `man` is a vector — a list of numbers you can literally do arithmetic on. That's the leap embeddings make over a dictionary lookup or a one-hot ID: meaning stops being a symbol and becomes something you can compute with, using nothing but [numpy arrays](/learn/python-data-apis/numpy-arrays-fundamentals).

### Step 2 — Check whether "gender" is really one direction

```python
d_man_woman = vocab["woman"] - vocab["man"]
d_king_queen = vocab["queen"] - vocab["king"]
d_boy_girl = vocab["girl"] - vocab["boy"]

print(d_man_woman)   # [0. 0. 2. 0.]
print(d_king_queen)  # [0. 0. 2. 0.]
print(d_boy_girl)    # [0. 0. 2. 0.]
```

All three come out identical: `[0, 0, 2, 0]`. Columns 1, 2, and 4 wobble depending on which pair you pick (they encode whatever else distinguishes "man" from "king" from "boy" — status, formality, whatever), but column 3 shifts by exactly +2 every time you cross from a male-coded word to its female-coded counterpart, and by 0 whenever you don't. That's what it means for a direction to exist: not that a human declared "column 3 is gender," but that subtracting the right pairs isolates the same offset independent of which pair you used.

> **Why this step?** One worked example proves nothing — it could be a coincidence of the two words you happened to pick. Three independent pairs landing on the exact same offset is what turns "huh, that's a cool trick" into "this space has actually organized itself around a male ↔ female axis." That distinction is exactly what fails in the second half of this lesson, so hold onto it.

### Step 3 — Check whether a second, unrelated direction also exists

```python
p_king = vocab["kings"] - vocab["king"]
p_queen = vocab["queens"] - vocab["queen"]

print(p_king)   # [0. 0. 0. 1.]
print(p_queen)  # [0. 0. 0. 1.]
```

Same pattern, different column: singular → plural always adds exactly `[0, 0, 0, 1]`, completely independent of the gender offset in column 3.

> **Why this step?** To show the phenomenon isn't special to gender. Real embedding spaces routinely fold many relationships — number, tense, capital-of-a-country, comparative/superlative — into different directions of the same space, and they mostly don't interfere with each other. That's only possible because high-dimensional spaces have room for a large number of near-independent directions at once; see [high-dimensional spaces](/learn/maths-foundations/high-dimensional-spaces) for why that room exists.

### Step 4 — Do the actual analogy arithmetic

```python
result = vocab["king"] - vocab["man"] + vocab["woman"]
print(result)          # [4. 3. 1. 0.]
print(vocab["queen"])  # [4. 3. 1. 0.]
```

Component by component: `[4-2+2, 3-1+1, -1-(-1)+1, 0-0+0] = [4, 3, 1, 0]` — exactly `queen`. You're not asking anything in words. You're moving a point by the same offset that separated every man/woman pair you already checked, and trusting the geometry to land somewhere meaningful.

> **Why this step?** This is the whole trick laid bare. It works here because I built the vectors to make it work — the honest test is whether it survives contact with a system that doesn't have equality baked in, which is the next step.

### Step 5 — Confirm it the way real systems actually do

Real trained embeddings almost never land exactly on another word's vector — you don't get to check for equality. You rank every candidate by cosine similarity and take the closest, the same operation behind semantic search and [RAG retrieval](/learn/rag/embeddings-and-semantic-similarity). See [cosine similarity and angular distance](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) for the geometry, and [computing embedding similarity in numpy](/learn/ai-foundations/computing-embedding-similarity-in-numpy) for a fuller build-out of this function.

```python
def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

query_words = {"king", "man", "woman"}
scores = {
    word: cosine_sim(result, vec)
    for word, vec in vocab.items()
    if word not in query_words
}
best = max(scores, key=scores.get)
print(best, round(scores[best], 3))   # queen 1.0
```

> **Why this step?** Notice `query_words` gets excluded from the ranking before we look for a winner. That's not a stylistic choice — it's load-bearing, and the next section shows exactly why.

## Where it breaks

### Break 1: the closest rival to your answer is often a word you typed in

Look at how close `king` itself is to the result, even though `queen` wins:

```python
print(cosine_sim(result, vocab["king"]))   # 0.923
print(cosine_sim(result, vocab["queen"]))  # 1.0
```

`0.923` is uncomfortably high for a word that isn't the answer. It's not a fluke — it's guaranteed by the algebra:

```python
print(result - vocab["king"])   # [0. 0. 2. 0.]  == woman - man, exactly
```

`result = king - man + woman`, so `result - king` is *always* precisely `woman - man` — the gender offset, no more and no less, for any vocabulary you plug in. Whether `king` ends up dangerously close to the "correct" answer depends entirely on how large that one offset is relative to everything else `king`'s vector has to encode. In a real embedding, a token's vector carries hundreds of overlapping properties — topic, era, register, syntactic role, frequency — and gender is one small slice of that budget. The margin between the right answer and the word you started with can get thin fast. That's exactly why the original word2vec analogy evaluation explicitly excludes the query words from the candidate pool before reporting a top match — without that exclusion rule, the arithmetic can quietly "solve" the puzzle by handing you back one of the words you fed it.

**The fix** is the exclusion you already saw in Step 5 — it's not optional cleanup, it's the difference between a real answer and a trivial one.

### Break 2: it isn't "the" gender direction — it's whatever the pairs you picked happened to share

Extend the same toy vocabulary with two more words:

```python
vocab["doctor"] = np.array([3.0, 2.0, -0.3, 0.0])
vocab["nurse"]  = np.array([2.8, 1.8,  1.7, 0.0])

result2 = vocab["doctor"] - vocab["man"] + vocab["woman"]
print(result2)   # [3.  2.  1.7 0. ]

query_words_2 = {"doctor", "man", "woman"}
scores_2 = {w: cosine_sim(result2, v) for w, v in vocab.items() if w not in query_words_2}
for word, score in sorted(scores_2.items(), key=lambda kv: -kv[1]):
    print(f"{word:8s} {score:.3f}")
```

```
nurse    0.999
queen    0.969
queens   0.951
girl     0.834
king     0.802
kings    0.787
boy      0.231
```

`doctor - man + woman` lands almost exactly on `nurse` — not "a female doctor" (there's no single token for that concept in this vocabulary at all), a *different occupation entirely*. In this constructed example I put `nurse` there on purpose to make the point concrete, but the pattern is a real, well-documented one: when researchers examined actual trained word embeddings, occupation analogies reliably reproduced the gender associations baked into the training text — this is the finding behind Bolukbasi et al.'s widely cited 2016 paper on debiasing word embeddings. The arithmetic doesn't fail loudly here. It confidently hands you a real word, and that word encodes a statistical association from the corpus, not a fact about the word "doctor." Column 3 was never a pure, universal "gender" axis — it's just the direction that happened to separate the handful of pairs you used to define it, and it will just as happily separate pairs you didn't intend.

**The fix** isn't a single trick — it's treating the direction with the suspicion it deserves: average it over many diverse pairs rather than trusting one, explicitly test it against words like occupations where you don't want it to apply, and where it matters, project it out of the vectors that shouldn't be affected by it (the "hard debiasing" approach from that same line of research). More broadly, this exact setup — one fixed vector per word, learned once from static co-occurrence statistics — is a word2vec/GloVe-era design. Modern LLMs mostly use *contextual* embeddings, recomputed per token per input by attention (see [how LLMs work](/learn/ai-foundations/how-llms-work)), so you won't find this literal offset trick sitting inside a transformer's residual stream in this clean a form — though whether relationships still show up as linear directions in there is a live, open question in interpretability research.

## Takeaways

- A relationship between two words shows up as a vector *difference*. If that difference recurs across several unrelated pairs, you've found a real direction in the space — one lucky pair proves nothing.
- Analogy arithmetic (`a - b + c`) is just vector addition using a difference you already trust. There's no separate "reasoning" mechanism hiding inside it.
- In practice you find the answer by nearest-neighbor ranking over the whole vocabulary, not by checking for exact equality — and you must exclude the query words from that ranking, because algebraically the result is always exactly one relationship-vector away from one of its own inputs.
- A direction computed from a handful of pairs is only as trustworthy as those pairs are representative. The identical arithmetic that finds `queen` will just as confidently hand back whatever bias sits in the training data, with no signal that it did.
- Treat `king - man + woman = queen` as a diagnostic for how static embeddings organize meaning — not as a technique you'd ship, and not as proof the underlying model has anything like a concept of "gender" the way you do.

**Related:** [What a vector is](/learn/maths-foundations/what-is-a-vector) · [Embeddings quiz](/learn/ai-foundations/embeddings-quiz) · [Embeddings and semantic similarity in RAG](/learn/rag/embeddings-and-semantic-similarity) · [How LLMs work](/learn/ai-foundations/how-llms-work) · [Alignment failure case studies](/learn/ai-foundations/alignment-failure-case-studies)
