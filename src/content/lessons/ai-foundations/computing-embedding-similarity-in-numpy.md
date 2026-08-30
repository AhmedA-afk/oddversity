---
title: "Cosine Similarity and Nearest Neighbors in NumPy"
track: "ai-foundations"
status: live
summary: "Wrote the full markdown lesson body (implementation walkthrough) for 'Cosine Similarity and Nearest Neighbors in NumPy' — builds a runnable tiny semantic search engine in NumPy fro"
duration: "4 min read"
---

## Setup

Same file, one dependency:

```bash
pip install numpy
```

That's the whole environment — Python 3.8+ and NumPy, nothing else. Run everything below as a script, paste it into a REPL, or drop it into a notebook cell by cell. If array shapes and broadcasting are still fuzzy, [numpy-arrays-fundamentals](/learn/python-data-apis/numpy-arrays-fundamentals) is worth a five-minute detour first — you'll use `axis`, `keepdims`, and `@` constantly below.

## What we're building

Five hand-written sentences, a query, and a ranking of which sentences the query is "closest to" in meaning — a semantic search engine you can hold in your head. To keep every number inspectable, we won't call out to a real embedding model. Instead we'll hand-build small vectors ourselves (a crude bag-of-words count, one dimension per vocabulary word) so you can see *exactly* why two vectors end up similar, not just trust that they are. Swapping this toy vectorizer for a real one later is a one-line change — the cosine math doesn't care where the vectors came from.

Along the way we'll run the same comparison two ways — cosine similarity and raw Euclidean distance — and watch them disagree on a case where only one of them is right.

## Build it

### Turn sentences into vectors you can actually inspect

```python
import numpy as np

vocab = ["cat", "kitten", "sleep", "sun", "warm",
         "market", "stocks", "invest", "rate", "rain", "coast", "storm"]

sentences = [
    "The cat curls up to sleep in the warm sun.",
    "The kitten naps in a sunny warm spot.",
    "Investors watched the stock market and interest rate news.",
    "The market fell as investors worried about rates.",
    "Heavy rain and storms hit the coast this morning.",
]

def vectorize(text, vocab):
    words = text.lower().split()
    return np.array(
        [sum(1 for w in words if term in w) for term in vocab],
        dtype=float,
    )

X = np.stack([vectorize(s, vocab) for s in sentences])
print(X.shape)  # (5, 12) — 5 sentences, 12 vocabulary dimensions
```

Each row of `X` is a sentence, each column counts how often a vocabulary word shows up as a substring of some word in that sentence (a cheap trick that also catches "sunny" for "sun" and "storms" for "storm"). This is a real embedding in the most literal sense — a function from text to a fixed-length vector — just a dumb one. A trained model (see [what-embeddings-are](/learn/ai-foundations/what-embeddings-are)) replaces this hand-built rule with hundreds of learned dimensions capturing meaning, not just shared letters. Everything downstream works identically either way, which is the point of building the dumb version first.

### Write cosine similarity as one matrix multiplication

```python
def cosine_similarity(a, b):
    a = np.atleast_2d(a)
    b = np.atleast_2d(b)
    a_unit = a / np.linalg.norm(a, axis=1, keepdims=True)
    b_unit = b / np.linalg.norm(b, axis=1, keepdims=True)
    return a_unit @ b_unit.T
```

`np.linalg.norm(..., axis=1, keepdims=True)` gives each row's length as a column vector, so dividing broadcasts it back across every dimension of that row — every vector in `a` and `b` becomes unit length. Once both sides are unit vectors, their dot product *is* the cosine of the angle between them, by definition — no `arccos` needed. `a_unit @ b_unit.T` computes every pairwise dot product in one shot: pass a `(1, d)` query and a `(5, d)` corpus and you get back a `(1, 5)` matrix of similarities, computed together instead of in a Python loop. This is exactly the geometric object described in [the-geometry-of-embeddings](/learn/maths-foundations/the-geometry-of-embeddings): direction encodes meaning, and cosine similarity is the tool that measures direction while throwing magnitude away.

### Rank a query against the corpus

```python
query = "A small cat sleeps in the warm sunlight."
q = vectorize(query, vocab)

sims = cosine_similarity(q, X).ravel()
order = np.argsort(-sims, kind="stable")

for rank, idx in enumerate(order, start=1):
    print(f"{rank}. [{sims[idx]:.3f}] {sentences[idx]}")
```

`argsort(-sims)` sorts ascending on the *negated* scores, which is the standard trick for getting a descending ranking; `kind="stable"` keeps tied scores in their original corpus order instead of an arbitrary one (more on why that matters in Harden it). This loop — vectorize a query, score it against every stored vector, sort — is the entire retrieval step of RAG. Nothing here changes when the corpus is 5 sentences or 5 million chunks; see [what-is-rag-and-when-to-use-it](/learn/rag/what-is-rag-and-when-to-use-it) for where this fits in the bigger pipeline.

### Show exactly where Euclidean distance breaks

```python
repeated_text = sentences[0] + " " + sentences[0]  # the same sentence, said twice
doubled = vectorize(repeated_text, vocab)

cos_to_double = cosine_similarity(X[0], doubled)[0, 0]
euclid_to_double = np.linalg.norm(X[0] - doubled)
euclid_to_kitten = np.linalg.norm(X[0] - X[1])

print(f"cosine(original, original said twice)     = {cos_to_double:.3f}")
print(f"euclidean(original, original said twice)   = {euclid_to_double:.3f}")
print(f"euclidean(original, unrelated kitten line) = {euclid_to_kitten:.3f}")
```

`doubled` is literally `2 * X[0]` — same words, each counted twice, so it points in the exact same direction. Cosine similarity is invariant to positive scaling by construction: normalizing divides the scale back out, so `cosine(v, 2v) = 1.0` for any `v`, always. Euclidean distance has no such protection. `‖X[0] - doubled‖ = ‖X[0] - 2·X[0]‖ = ‖-X[0]‖ = ‖X[0]‖`, which for this vector is `2.0` (four matched terms, each counted once: `sqrt(1+1+1+1)`). Compare that to `‖X[0] - X[1]‖`, the distance to the *unrelated* kitten sentence — the shared terms differ just enough (`sqrt(1+1+1) ≈ 1.732`) that raw Euclidean distance ranks a duplicate of the original sentence as farther away than a different sentence about a different animal. That's backwards, and the cause is structural, not a bug in this example: Euclidean distance conflates "how big is this vector" with "which way does it point," and vector magnitude in text data tracks things like length and repetition — not meaning.

There's a precise relationship between the two metrics that explains this: for unit vectors, `‖a - b‖² = ‖a‖² + ‖b‖² - 2·a·b = 2 - 2·cos(a, b)`. Once you normalize, Euclidean distance and cosine similarity produce the *same ranking* — they're a monotonic transform of each other. The disagreement above only happens because the raw vectors weren't normalized first. Cosine similarity just bakes that normalization in so you never forget the step.

## Run it

Running the ranking block, expect a clear top pick, a clear second, and a tie at the bottom. The query and sentence 0 share every matched term (`cat`, `sleep`, `sun`, `warm`), so their vectors are identical in this toy feature space and cosine similarity comes out to `1.000` — a perfect match. Sentence 1 (the kitten sentence) shares two of those four terms and lands around `0.58` — clearly related, clearly not as strong. Sentences 2, 3, and 4 share *zero* vocabulary terms with the query, so their cosine similarity is exactly `0.0` — not "low," but geometrically orthogonal, since nothing in the query points along any dimension those sentences occupy.

You'll also notice sentences 2 and 3 — two different sentences about markets and rates — produce the exact same vector and therefore tie exactly. That's not a bug in cosine similarity; it's a real limitation of a 12-word hand-built vocabulary, where distinct sentences can collide. A trained embedding model uses hundreds of dimensions specifically so a collision like that is vanishingly unlikely — a good preview of why real systems don't hand-roll their vectorizer.

For the Euclidean comparison block, expect `cosine ≈ 1.000`, `euclidean(original, doubled) = 2.000`, and `euclidean(original, kitten) ≈ 1.732` — the duplicate scoring as *more distant* than the unrelated sentence under raw Euclidean distance, exactly as derived above.

## Harden it

The code above is deliberately minimal so the math stays visible. Before you'd trust it on real data:

- **All-zero vectors.** A query made entirely of out-of-vocabulary words vectorizes to all zeros. Dividing by a norm of `0` produces `NaN` silently — no crash, just corrupted results propagating downstream. Guard it explicitly rather than papering over it with a small epsilon (which would silently turn "undefined" into a *misleadingly confident* similarity of `0`):

```python
def cosine_similarity(a, b):
    a = np.atleast_2d(np.asarray(a, dtype=float))
    b = np.atleast_2d(np.asarray(b, dtype=float))
    if a.shape[1] != b.shape[1]:
        raise ValueError(f"dimension mismatch: {a.shape[1]} vs {b.shape[1]}")

    a_norm = np.linalg.norm(a, axis=1, keepdims=True)
    b_norm = np.linalg.norm(b, axis=1, keepdims=True)
    if np.any(a_norm == 0) or np.any(b_norm == 0):
        raise ValueError("cosine similarity is undefined for an all-zero vector")

    sims = (a / a_norm) @ (b / b_norm).T
    return np.clip(sims, -1.0, 1.0)
```

- **Floating-point drift past ±1.** Two genuinely-parallel unit vectors can compute a dot product of `1.0000000000000002` due to rounding — harmless until something downstream calls `arccos` on it and gets `NaN`. The `np.clip` above costs nothing and removes the failure mode entirely.
- **Unstable tie-breaking.** `np.argsort`'s default `kind="quicksort"` doesn't guarantee ties keep their original order — rerun the same ranking twice and tied results can silently swap places. Pass `kind="stable"` whenever tie order matters (e.g., "prefer the earlier document when scores are equal").
- **The vectorizer's own bug.** `term in w` is a substring check, not a word check — `"cat"` would also match inside a longer word like `"category"` if one existed in your corpus. Fine for a ten-line toy; a false positive like that in a real system would silently pollute retrieval. Real tokenization (splitting on punctuation, matching whole tokens, not substrings) fixes it — another reason production systems hand this off to a trained tokenizer rather than string rules.
- **Shape and emptiness checks.** Assert your query dimension matches the corpus dimension before the matrix multiply throws a confusing broadcast error, and decide up front what an empty corpus should return (an empty ranking, not a crash).

## Extend it

Two changes take this from a toy to something closer to real retrieval:

**Swap the vectorizer for a real embedding model.** Everything after `X = ...` is unchanged — only `vectorize` changes, from hand-built word counts to a call against an embedding API (see [calling-llm-apis-in-python](/learn/python-data-apis/calling-llm-apis-in-python)). The payoff is synonymy: a query about "a small feline" would score `0.0` against every sentence here, because "feline" isn't in the 12-word vocabulary — a real embedding model places "feline" near "cat" and "kitten" in vector space because it learned the relationship, not because you hand-coded it. That gap — lexical overlap versus learned meaning — is most of the reason embeddings replaced keyword search; see [embeddings-and-semantic-similarity](/learn/rag/embeddings-and-semantic-similarity) for the deeper version of this idea.

**Stop sorting everything when you only need the top few.** `argsort` sorts the whole corpus even if you only want the top 3 results — wasted work once the corpus is large. `np.argpartition` finds just the top-k without fully ordering the rest, then you sort only those k:

```python
def top_k(sims, k):
    k = min(k, len(sims))
    candidates = np.argpartition(-sims, k - 1)[:k]
    order = np.argsort(-sims[candidates], kind="stable")
    return candidates[order]
```

This — a precomputed, normalized matrix of vectors plus a fast top-k lookup — is a minimal vector index, which is exactly what a real vector database is doing at a much larger scale (approximate nearest-neighbor structures trade a small amount of ranking accuracy for speed once you're past millions of vectors, but the underlying operation is this one). Chain it together — chunk documents, embed each chunk, store the matrix, embed an incoming query, rank with cosine similarity, feed the top-k chunks to an LLM as context — and you've built the retrieval half of a RAG pipeline end to end. Whether that retrieval step is actually *good* (are the top-k results the ones that would help a human, or just the ones that happen to be lexically or geometrically close?) is a separate, harder question — worth reading [evaluating-rag-quality](/learn/rag/evaluating-rag-quality) before you trust it in production.

**Related:** [cosine-similarity-angular-distance-embedding-retrieval](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) · [what-is-a-vector](/learn/maths-foundations/what-is-a-vector) · [high-dimensional-spaces](/learn/maths-foundations/high-dimensional-spaces) · [embeddings-word-analogies-example](/learn/ai-foundations/embeddings-word-analogies-example) · [embeddings-quiz](/learn/ai-foundations/embeddings-quiz)
