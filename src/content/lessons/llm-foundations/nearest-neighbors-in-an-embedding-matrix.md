---
title: "Finding Nearest Neighbors in an Embedding Matrix"
track: "llm-foundations"
status: live
summary: "Compute cosine similarity by hand over a toy embedding matrix, rank neighbors for dog, cat, and car, and see why raw dot products lie."
duration: "7 min read"
---

"Similar tokens end up near each other" is easy to say and easy to take on faith. Here it is worked out in actual numbers: a tiny embedding matrix, real cosine similarities, and a ranked neighbor list you can check by hand.

## The setup

Six tokens, a toy 4-dimensional embedding space (real models use thousands of dimensions; four is enough to see the mechanism):

```python
import numpy as np

tokens = ["dog", "puppy", "cat", "kitten", "car", "truck"]

E = np.array([
    [ 4,  3,  0,  1],   # dog
    [ 4,  3,  0, -1],   # puppy
    [ 4, -3,  0,  1],   # cat
    [ 4, -3,  0, -1],   # kitten
    [ 0,  0,  5,  1],   # car
    [ 0,  0,  5, -1],   # truck
], dtype=float)
```

These numbers are hand-constructed, not pulled from a real model — but the pattern they encode is realistic: dogs and cats share a "domestic animal" component (the shared value `4` in the first coordinate) that cars and trucks don't, while a second coordinate separates canine from feline, and vehicles occupy an entirely different coordinate. This mirrors the clustering behavior discussed in [what lives in embedding space](/learn/llm-foundations/what-lives-in-embedding-space) — animal words share structure that vehicle words don't.

## Step by step

### Normalize every row to unit length

```python
def normalize(matrix):
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    return matrix / norms

E_unit = normalize(E)
```

> **Why this step?** Cosine similarity measures the *angle* between two vectors, not how long they are. Two embeddings pointing in nearly the same direction should count as similar even if one happens to have a larger magnitude — normalizing first is what makes the dot product that follows measure angle alone. See [cosine similarity](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) for why angle, specifically, is the right notion of "similar" here.

### Compute every similarity at once with a single matmul

```python
def nearest_neighbors(word, k=None):
    idx = tokens.index(word)
    sims = E_unit @ E_unit[idx]               # cosine similarity to every token
    order = [i for i in np.argsort(-sims) if i != idx]
    return [(tokens[i], round(float(sims[i]), 4)) for i in (order if k is None else order[:k])]
```

> **Why this step?** `E_unit @ E_unit[idx]` computes the dot product of the query token's normalized vector against *every* row of the matrix in one operation — because both sides are unit vectors, that dot product is exactly the cosine similarity. This is the real mechanism behind nearest-neighbor search at any scale: one matrix-vector product against the whole table, not a loop comparing pairs one at a time.

### Rank neighbors for dog, cat, and car

```python
print("dog:", nearest_neighbors("dog"))
print("cat:", nearest_neighbors("cat"))
print("car:", nearest_neighbors("car"))
```

```
dog: [('puppy', 0.9231), ('cat', 0.3077), ('kitten', 0.2308), ('car', 0.0385), ('truck', -0.0385)]
cat: [('kitten', 0.9231), ('dog', 0.3077), ('puppy', 0.2308), ('car', 0.0385), ('truck', -0.0385)]
car: [('truck', 0.9231), ('dog', 0.0385), ('cat', 0.0385), ('puppy', -0.0385), ('kitten', -0.0385)]
```

> **Why this step?** Check the arithmetic behind the top result: `dog · puppy` (before normalizing) is `4·4 + 3·3 + 0·0 + 1·(-1) = 24`, and both vectors have squared norm `26` (`16+9+0+1`), so cosine similarity is `24/26 ≈ 0.9231` — matching the output exactly. Every category clusters with itself first (puppy for dog, kitten for cat, truck for car), cross-category similarity is small but not zero (`0.0385`), and the animal-vehicle pairs even go slightly *negative* — a byproduct of this toy space's last coordinate, not a claim that dogs and trucks are "anti-similar" in any real model.

## Where it breaks (+fix)

Skip the normalization step and rank by raw dot product instead, and magnitude — not meaning — starts deciding the ranking. Add one more toy token, engineered to be large but only weakly related to `dog`:

```python
spam = np.array([0, 0, 0, 50])   # huge magnitude, mostly unrelated direction
raw_dot_dog_puppy = np.dot(E[0], E[1])     # 24
raw_dot_dog_spam  = np.dot(E[0], spam)     # 4*0 + 3*0 + 0*0 + 1*50 = 50
```

By raw dot product, `spam` (score 50) outranks `puppy` (score 24) as dog's nearest neighbor — purely because `spam`'s vector is long, not because it points in a similar direction. Normalize first and the picture flips back to correct: `spam`'s norm is 50, so its cosine similarity to dog is `50 / (5.099 × 50) ≈ 0.196` — far below puppy's `0.9231`, correctly ranking it as barely related.

**The fix** is exactly the normalization step above: always compare normalized vectors (cosine similarity) for nearest-neighbor and retrieval tasks, unless a system was specifically trained end-to-end to make raw dot-product magnitude meaningful (some retrieval models are deliberately trained this way — but that's an explicit design choice, not something you get for free).

## Takeaways

- Cosine similarity is a normalized dot product — `normalize(a) · normalize(b)` — and computing it against an entire embedding matrix at once is a single matrix-vector multiply, which is why nearest-neighbor search over millions of embeddings is tractable.
- Clustering by category and fine-grained separation within a category (dog vs. puppy) can coexist in the same handful of dimensions — real models just spread this across thousands of dimensions instead of four.
- Raw, unnormalized dot products confuse magnitude with meaning. A vector that's simply "long" can outrank a vector that's genuinely well-aligned, purely as an arithmetic artifact — normalize before you rank, every time similarity is the thing you actually care about.

**Related:** [What Lives in Embedding Space](/learn/llm-foundations/what-lives-in-embedding-space), [The Embedding Lookup Table](/learn/llm-foundations/the-embedding-lookup-table), [Cosine Similarity: Angular Distance for Embedding Retrieval](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval), [Embeddings and Semantic Similarity](/learn/rag/embeddings-and-semantic-similarity)
