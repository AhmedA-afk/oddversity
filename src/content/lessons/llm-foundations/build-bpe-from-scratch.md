---
title: "Build Byte-Pair Encoding From Scratch"
track: "llm-foundations"
status: live
summary: "Train a tiny BPE tokenizer in plain Python, watch the merge list grow, then use it to encode a word the training data never contained."
duration: "9 min read"
---

[Byte-pair encoding](/learn/llm-foundations/byte-pair-encoding) describes the merge loop in prose. This lesson writes it — training and encoding — in about 40 lines of Python, on a corpus small enough to trace by hand.

## What we're building

Two functions: `train_bpe`, which learns an ordered list of merge rules from a corpus of word frequencies, and `encode`, which applies those frozen rules to tokenize new text. That split — an expensive one-time training pass, a cheap deterministic encoding pass — is exactly how production tokenizers work; we're just doing it on three words instead of billions.

## Setup

No libraries beyond the standard library. The whole state of a BPE model is a `dict` mapping each word (as a tuple of symbols) to how often it occurs, plus the growing list of merge rules:

```python
from collections import defaultdict

CORPUS = {"ab": 5, "abc": 3, "bc": 4}   # word -> frequency
EOW = "_"                                # end-of-word marker
```

The end-of-word marker matters more than it looks: without it, a merge could fuse the last letter of one word with the first letter of the next, which would make tokens boundary-dependent on where a word happens to sit in a sentence. Real tokenizers solve the same problem differently — GPT-style BPE folds a leading space into the token instead of a trailing marker — but the purpose is identical: keep merges from crossing word boundaries. More on those variants in [BPE vs WordPiece vs Unigram vs byte-level](/learn/llm-foundations/bpe-vs-wordpiece-vs-unigram).

### Step 1: Represent words as symbol sequences

```python
def word_to_symbols(word, eow=EOW):
    return list(word) + [eow]

def get_vocab(corpus):
    """word -> frequency  becomes  tuple-of-symbols -> frequency"""
    return {tuple(word_to_symbols(w)): f for w, f in corpus.items()}
```

> **Why this step?** BPE never looks at "words" directly — it looks at sequences of symbols and merges the ones that co-occur most. Starting every word as individual characters is what makes this "byte-pair" (or here, character-pair) encoding: the smallest possible units, merged upward.

### Step 2: Count adjacent pairs

```python
def get_pair_counts(vocab):
    pairs = defaultdict(int)
    for symbols, freq in vocab.items():
        for i in range(len(symbols) - 1):
            pairs[(symbols[i], symbols[i + 1])] += freq
    return pairs
```

> **Why this step?** A pair that appears inside a frequent word should outweigh a pair that appears inside a rare one — that's the whole compression logic of BPE. Weighting by `freq` instead of just counting occurrences per unique word is what makes the merges track real usage in the corpus, not just vocabulary variety.

### Step 3: Merge the most frequent pair

```python
def merge_pair(pair, vocab):
    a, b = pair
    merged = a + b
    new_vocab = {}
    for symbols, freq in vocab.items():
        out, i = [], 0
        while i < len(symbols):
            if i < len(symbols) - 1 and symbols[i] == a and symbols[i + 1] == b:
                out.append(merged)
                i += 2
            else:
                out.append(symbols[i])
                i += 1
        new_vocab[tuple(out)] = freq
    return new_vocab
```

> **Why this step?** This is a single, mechanical rewrite: wherever `a` is immediately followed by `b`, replace both with one new symbol `a+b`. Applying it everywhere at once, rather than one word at a time, is what lets the same merge propagate consistently across the whole corpus.

### Step 4: Loop until you hit the target vocabulary size

```python
def train_bpe(corpus, num_merges):
    vocab = get_vocab(corpus)
    merges = []
    for step in range(num_merges):
        pairs = get_pair_counts(vocab)
        if not pairs:
            print(f"stopping early at step {step}: no pairs left to merge")
            break
        best_pair = max(pairs, key=pairs.get)
        vocab = merge_pair(best_pair, vocab)
        merges.append(best_pair)
        print(f"merge {step + 1}: {best_pair} -> '{''.join(best_pair)}'  (count={pairs[best_pair]})")
    return merges, vocab
```

> **Why this step?** `num_merges` stands in for target vocabulary size — each merge adds exactly one new symbol to the vocabulary. `max(pairs, key=pairs.get)` is the entire "learning" in BPE: at every step, look at what's most frequent *right now* (after all previous merges) and fuse it. Nothing is decided in advance; each merge only makes sense in light of the merges before it.

### Step 5: Encode new text with the learned merges

```python
def encode(word, merges, eow=EOW):
    symbols = word_to_symbols(word, eow)
    for a, b in merges:
        out, i = [], 0
        while i < len(symbols):
            if i < len(symbols) - 1 and symbols[i] == a and symbols[i + 1] == b:
                out.append(a + b)
                i += 2
            else:
                out.append(symbols[i])
                i += 1
        symbols = out
    return symbols
```

> **Why this step?** Encoding does *not* recompute frequencies — it has no idea what was common in the training corpus anymore. It just replays the merge list, in the exact order it was learned, against whatever new text shows up. That order dependency is the whole reason tokenizer training and tokenizer inference are different code paths in real systems: training is a slow, corpus-wide search; encoding is a fast, deterministic replay.

## Run it

Train on `{"ab": 5, "abc": 3, "bc": 4}` for 5 merges:

```python
merges, vocab = train_bpe(CORPUS, num_merges=5)
```

```
merge 1: ('a', 'b') -> 'ab'    (count=8)
merge 2: ('c', '_') -> 'c_'    (count=7)
merge 3: ('ab', '_') -> 'ab_'  (count=5)
merge 4: ('b', 'c_') -> 'bc_'  (count=4)
merge 5: ('ab', 'c_') -> 'abc_' (count=3)
```

Trace why merge 1 wins: `(a,b)` appears in both `"ab"` (freq 5) and `"abc"` (freq 3), for a combined count of 8 — higher than any other pair. Once `a` and `b` are fused everywhere, `(c, _)` becomes the new leader (count 7, from `"abc"` and `"bc"` both ending in `c_`). By merge 5, every word in this tiny corpus has been absorbed into a single whole-word token — a sign the corpus is far too small for 5 merges, which is exactly why real training runs stop at a target vocabulary size long before every pair is exhausted, rather than running to completion. That's the mechanism behind [the vocab-size vs sequence-length tradeoff](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff): more merges always means fewer, longer tokens, so the stopping point is a deliberate choice, not something the algorithm decides for you.

Now encode a word the training corpus never contained as a whole unit:

```python
print(encode("abcbc", merges))   # ['ab', 'c', 'bc_']
print(encode("abd", merges))     # ['ab', 'd', '_']
```

`"abcbc"` decomposes into pieces built from training data even though the full word never appeared. `"abd"` contains a `d`, a character this tiny vocabulary never learned any merges for — it simply falls through every rule unmerged and survives as its own raw symbol. Nothing breaks, and nothing becomes an unknown-token placeholder. That's the byte-level robustness property from [why models use tokens, not characters or words](/learn/llm-foundations/why-models-need-tokens-not-characters): the worst case for novel input is more, smaller tokens, never a lookup failure.

## Harden it

This toy version cuts three corners that matter at real scale:

- **Recomputing all pair counts every step is wasteful.** `get_pair_counts` rescans the entire vocabulary after every single merge. Production BPE trainers maintain an incremental count table and only update the pairs touched by the merge that just happened — the difference between roughly linear and roughly quadratic training time on a corpus with hundreds of thousands of unique words.
- **Word splitting here is naive.** Real tokenizers pre-split text with a regex before ever starting BPE, so that letters, digits, and punctuation don't get merged across category boundaries by accident — it's part of why ["12345"](/learn/llm-foundations/tokenizing-tricky-strings) or a URL tokenizes the way it does.
- **This trains on characters; production trains on bytes.** Swap `word_to_symbols` to start from UTF-8 bytes instead of Unicode characters, and the same algorithm becomes byte-level BPE — the scheme behind GPT-style tokenizers, immune to "unknown character" failures in any script or emoji. See [BPE vs WordPiece vs Unigram vs byte-level](/learn/llm-foundations/bpe-vs-wordpiece-vs-unigram) for what that buys you.

## Extend it

A few directions worth actually coding, not just reading about:

- Add a `decode(token_ids)` that reverses a learned vocabulary back to text, and check it round-trips every word in `CORPUS` exactly.
- Feed in a bigger, real corpus (a few paragraphs of English) and watch whether the first handful of merges look like the ones you'd guess by eye — common letter pairs like `t/h` or `e/r` tend to win early.
- Tokenize the same sentence with `num_merges=5` and `num_merges=50` and count the resulting tokens, reproducing the shortening effect from [the vocab-size vs sequence-length tradeoff](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff) with your own code instead of a hand-worked example.

**Related:** [Byte-Pair Encoding](/learn/llm-foundations/byte-pair-encoding), [Why Models Use Tokens, Not Characters or Words](/learn/llm-foundations/why-models-need-tokens-not-characters), [BPE vs WordPiece vs Unigram vs Byte-Level](/learn/llm-foundations/bpe-vs-wordpiece-vs-unigram), [Tokenizing Tricky Strings](/learn/llm-foundations/tokenizing-tricky-strings)
