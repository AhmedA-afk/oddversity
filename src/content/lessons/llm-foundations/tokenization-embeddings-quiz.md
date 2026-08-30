---
title: "Quiz: Tokenization and Embeddings"
track: "llm-foundations"
status: live
summary: "Nine questions on BPE merges, the vocab/sequence tradeoff, embedding geometry, permutation invariance, and positional schemes."
duration: "10 min read"
---

Nine questions covering the whole module — from [why tokens exist at all](/learn/llm-foundations/why-models-need-tokens-not-characters) through [RoPE scaling](/learn/llm-foundations/context-extrapolation-and-rope-scaling). Work through the stem before opening the answer.

### 1. During BPE training, which pair gets merged at each step?

A) The least frequent adjacent pair remaining in the corpus
B) The most frequent adjacent pair remaining in the corpus
C) The alphabetically first pair in the vocabulary so far
D) The longest pair by character count

<details>
<summary>Answer</summary>

**Correct: B.** [Build BPE from scratch](/learn/llm-foundations/build-bpe-from-scratch) counts every adjacent symbol pair across the corpus and merges whichever one occurs most, then repeats on the updated corpus.

- A is backwards — merging the least frequent pair first would spend vocabulary slots on rare substrings before common ones, the opposite of what makes BPE a good compression scheme.
- B is correct — greedily merging the current maximum is the entire training loop; no future-looking optimization happens, only the count that's true right now.
- C describes no real algorithm — alphabetical order has nothing to do with frequency in the corpus.
- D is a common guess but wrong — pair length doesn't factor into the merge decision at all; a single-character pair with high frequency beats a longer one that's rare.

</details>

### 2. Apply these merges, in order — `(a,b)→ab`, `(c,_)→c_`, `(ab,_)→ab_`, `(b,c_)→bc_`, `(ab,c_)→abc_` — to the new word `"abd"` (as symbols `a, b, d, _`). What's the final token sequence?

A) `['a', 'b', 'd', '_']`
B) `['ab', 'd', '_']`
C) `['ab', 'd_']`
D) `['abd_']`

<details>
<summary>Answer</summary>

**Correct: B.** Trace it: merge 1 `(a,b)→ab` turns `a,b,d,_` into `ab,d,_`. Merge 2 `(c,_)→c_` doesn't apply — there's no `c` here, so `d,_` doesn't match. Merges 3, 4, and 5 all require a `c_` or a lone `_` directly after `ab`, and in `ab,d,_` the `d` sits between `ab` and `_`, blocking every remaining rule. The result stops at `['ab', 'd', '_']` — exactly the case from [build BPE from scratch](/learn/llm-foundations/build-bpe-from-scratch) showing a novel character (`d`, never seen in training) simply surviving unmerged rather than causing any kind of failure.

- A is what you'd get with *zero* merges applied — it ignores that `(a,b)` does apply here.
- B is correct — one merge fires (`a,b→ab`), and every later rule is blocked by the `d` sitting in the way.
- C incorrectly assumes `(c,_)→c_` matches `d,_` — merge rules match exact symbols, not "any single character before the end marker."
- D assumes the whole word merges into one token, which only happens for words the training corpus fully absorbed — `"abd"` was never in the training corpus at all.

</details>

### 3. You increase a tokenizer's vocabulary from 8,000 to 100,000 tokens, keeping the corpus fixed. What's the expected effect?

A) Shorter sequences, smaller embedding table
B) Shorter sequences, larger embedding table
C) Longer sequences, larger embedding table
D) No change to sequence length, only the embedding table grows

<details>
<summary>Answer</summary>

**Correct: B.** [The vocab-size vs sequence-length tradeoff](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff) works out the arithmetic directly: a bigger vocabulary means more whole words and longer fragments earn their own token, shortening the average sequence — but the embedding table's size is `vocab_size × d_model`, so a 12.5x larger vocabulary means a roughly 12.5x larger table.

- A gets sequence length right but embedding table wrong — the table scales directly with vocabulary size, it cannot shrink when vocabulary grows.
- B is correct — this is the actual tradeoff, shorter sequences bought at the cost of a much larger lookup table.
- C gets both directions backwards from what a larger vocabulary does to sequence length.
- D misses that more available whole-word tokens reliably shortens sequences — that's the entire reason larger vocabularies exist.

</details>

### 4. Which tokenizer property guarantees that no input string can ever produce a true "unknown token," even in a script the vocabulary never saw during training?

A) Whitespace-based pre-tokenization, as used in WordPiece
B) A byte-level base alphabet, as used in byte-level BPE
C) A large enough vocabulary size, regardless of base alphabet
D) Restricting input to a single supported language

<details>
<summary>Answer</summary>

**Correct: B.** [BPE vs WordPiece vs Unigram vs byte-level](/learn/llm-foundations/bpe-vs-wordpiece-vs-unigram) explains that starting from all 256 possible byte values means every conceivable input, in any script, decomposes into some sequence of tokens the vocabulary already contains — worst case, individual bytes.

- A is wrong in the opposite direction — WordPiece keeps an actual `[UNK]` token and depends on whitespace segmentation, so it can and does fail on unfamiliar input.
- B is correct — a byte-level base alphabet is what removes "unknown" as a possible outcome entirely.
- C is a trap — vocabulary size alone doesn't matter if the base alphabet (whatever the very smallest units are) doesn't already cover every possible byte or character.
- D sidesteps the problem rather than solving it, and isn't how any of these tokenizers are actually built.

</details>

### 5. Which operation is mathematically equivalent to looking up row `i` of an embedding matrix `E`?

A) `E @ E.T`
B) `softmax(E[i])`
C) `one_hot(i) @ E`
D) `E[:, i]`

<details>
<summary>Answer</summary>

**Correct: C.** [The embedding lookup table](/learn/llm-foundations/the-embedding-lookup-table) shows that a one-hot vector with a `1` at position `i` and `0`s elsewhere, multiplied against `E`, zeroes out every row except row `i` and returns it unchanged — identical to direct indexing, `E[i]`.

- A computes a similarity matrix between every pair of rows in `E` — unrelated to retrieving a single row.
- B applies softmax to an already-retrieved row's values — a transformation on the result, not the lookup operation itself.
- C is correct — this is the literal matrix-multiply formulation of "look up row `i`."
- D indexes a *column*, not a row — the wrong axis entirely, and generally the wrong shape for a single token's embedding.

</details>

### 6. Why do embedding nearest-neighbor searches normalize vectors to unit length before computing similarity?

A) To make the matrix multiplication run faster
B) So magnitude doesn't distort the ranking — only direction (angle) determines similarity
C) Because raw embedding values aren't valid floating-point numbers
D) To force all token embeddings to become mutually orthogonal

<details>
<summary>Answer</summary>

**Correct: B.** [Finding nearest neighbors in an embedding matrix](/learn/llm-foundations/nearest-neighbors-in-an-embedding-matrix) shows a case where an unrelated but large-magnitude vector outranks a genuinely similar one under a raw dot product — normalizing first removes magnitude from the comparison, leaving only the angle between vectors, which is what cosine similarity is meant to measure.

- A is false — normalization doesn't meaningfully change compute cost; it's about correctness of the ranking, not speed.
- B is correct — this is exactly the "where it breaks" failure mode the worked example demonstrates numerically.
- C misunderstands the problem — raw embedding values are perfectly ordinary floats; the issue is what they measure, not their validity.
- D is not a real effect of normalization — normalizing to unit length changes vector *lengths* to 1, it does nothing to force vectors toward orthogonality.

</details>

### 7. You shuffle the order of tokens fed into raw self-attention with no positional encoding at all. What happens to each token's output vector?

A) It changes to a new, unrelated value
B) It comes back exactly the same value, just reordered to match the token's new position in the input
C) It becomes a zero vector
D) It's unaffected only for sequences shorter than about 10 tokens

<details>
<summary>Answer</summary>

**Correct: B.** [Why order needs positional encoding](/learn/llm-foundations/why-order-needs-positional-encoding) works this out with actual numbers: attention is permutation-*equivariant* — reordering the input reorders the output rows by exactly the same permutation, but every value inside those rows is untouched.

- A overstates the effect — the values don't change at all, only their position in the output does.
- B is correct — this is the precise mathematical property demonstrated numerically in the lesson.
- C describes no real behavior of attention under any circumstance relevant here.
- D is a fabricated qualifier — the property holds for any sequence length; there's no size threshold involved.

</details>

### 8. You're designing a model that needs to generalize well to sequence lengths well beyond training, with a strong built-in bias toward attending locally. Which positional scheme fits best?

A) Learned absolute positional embeddings
B) Sinusoidal encoding
C) ALiBi
D) None of the standard schemes handle this case

<details>
<summary>Answer</summary>

**Correct: C.** [Sinusoidal vs learned vs RoPE vs ALiBi](/learn/llm-foundations/sinusoidal-vs-learned-vs-rope-vs-alibi) describes ALiBi's fixed distance penalty added directly to attention scores — it was specifically built and evaluated for exactly this "train short, generalize long" pattern, with locality as an explicit built-in prior.

- A is the weakest possible choice here — learned absolute embeddings have no representation at all for positions beyond the trained maximum.
- B extrapolates better than learned absolute embeddings but still degrades past the trained range and has no particular built-in locality bias.
- C is correct — a fixed, distance-proportional penalty on attention scores is precisely ALiBi's mechanism, and it's the scheme with the strongest documented length-generalization behavior of the four.
- D is wrong — this is a real, named, shipped scheme (used in BLOOM and MPT), not an unsolved case.

</details>

### 9. In RoPE, a query at position 12 attending to a key at position 9 produces some attention score. All else equal, what score does a query at position 112 attending to a key at position 109 produce?

A) A completely different, unrelated score, since the absolute positions are much larger
B) The same score, because both pairs share the same relative offset of 3
C) A score of exactly zero, because the positions exceed some fixed limit
D) It depends on how much training data involved sequences longer than 109 tokens

<details>
<summary>Answer</summary>

**Correct: B.** [Implement RoPE in numpy](/learn/llm-foundations/implement-rope-in-numpy) verifies this numerically: rotating both the query and key by an equal additional angle (from a shared shift in absolute position) cancels out of their dot product entirely, leaving a score that depends only on the relative offset — `3` in both cases here.

- A is exactly the intuition RoPE was built to defeat — absolute position drops out of the score, by construction.
- B is correct — this is RoPE's headline property, confirmed with actual numbers in the implementation lesson.
- C invents a cutoff that doesn't exist in the mechanism itself — RoPE's rotation is a smooth function of position with no hard zero threshold.
- D confuses RoPE's relative-offset invariance (a property of the rotation math, true regardless of training data) with the separate, real issue of extrapolation degradation covered in [context extrapolation and RoPE scaling](/learn/llm-foundations/context-extrapolation-and-rope-scaling) — that lesson is about quality far past the trained length, not about this specific score-equality property.

</details>

**Related:** [Byte-Pair Encoding](/learn/llm-foundations/byte-pair-encoding), [What Are Embeddings](/learn/llm-foundations/what-are-embeddings), [RoPE: Rotary Position Embeddings, Explained](/learn/llm-foundations/rotary-position-embeddings), [Whole-Game Quiz](/learn/llm-foundations/whole-game-quiz)
