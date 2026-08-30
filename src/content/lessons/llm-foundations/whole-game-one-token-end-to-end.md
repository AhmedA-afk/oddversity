---
title: "The Whole Game: One Token, End to End"
track: "llm-foundations"
status: live
summary: "Trace one sentence through a complete toy LLM, tensor shape by tensor shape, from raw text to a sampled word."
duration: "9 min read"
---

Every term you're about to meet in this track — attention, softmax, the KV cache, scaling laws — is a detail inside one repeated operation: turn a sequence of tokens into a distribution over the next one. Run that operation once, start to finish, and you have the whole game in front of you.

## The big picture

Take the string `"The capital of France is"` and walk it through a small, GPT-2-small-shaped toy model: 12 transformer blocks, a hidden size of 768, a vocabulary of roughly 50,000 tokens. Every stage below is owned by a lesson elsewhere in this track — this page just shows you how the shapes connect.

### 1. Tokenize: text becomes integers

```text
"The capital of France is"  →  ["The", " capital", " of", " France", " is"]
                             →  [464, 3139, 286, 4881, 318]
```

Five words became five integers — five token ids, each just an index into the model's vocabulary. (The exact ids depend on the tokenizer; treat these as illustrative.) Shape: `(5,)`, a single vector of integers. The mechanics of that split — why it isn't just "one token per word" — belong to [tokenization](/learn/llm-foundations/tokenization-explained) and [byte-pair encoding](/learn/llm-foundations/byte-pair-encoding).

### 2. Embed: integers become vectors

Each id is used to look up a row in an embedding matrix of shape `(50000, 768)`. Five ids in, five 768-dimensional vectors out:

```text
ids (5,)  →  embeddings (5, 768)
```

That lookup — and the fact that nearby rows end up meaning similar things — is the subject of [what embeddings are](/learn/llm-foundations/what-are-embeddings) and [the embedding lookup table](/learn/llm-foundations/the-embedding-lookup-table).

### 3. Add position: the vectors learn their order

"France" and "capital" would embed to the same vectors no matter where they sat in the sentence, so a positional signal is added element-wise, same shape in and out:

```text
embeddings (5, 768)  →  embeddings + positions (5, 768)
```

That's [positional encoding](/learn/llm-foundations/positional-encoding-explained) — without it, the model would see the sentence as a bag of words.

### 4. One transformer block: attention + FFN

This is where the shape stays the same but the content changes completely. Inside one block:

```text
x (5, 768)
  → Q, K, V projections           (5, 768) each
  → attention scores  Q @ Kᵀ      (5, 5)         # who attends to whom
  → causal-masked softmax          (5, 5)
  → weighted sum of V              (5, 768)
  → residual add + norm            (5, 768)
  → FFN: up-project                (5, 3072)
  → GELU, down-project             (5, 768)
  → residual add + norm            (5, 768)
x (5, 768)
```

In goes `(5, 768)`, out comes `(5, 768)` — same shape, new information mixed in. The attention half is [the attention mechanism](/learn/llm-foundations/attention-mechanism-explained) and [multi-head attention](/learn/llm-foundations/multi-head-attention); the second half is [the feed-forward block](/learn/llm-foundations/the-feed-forward-block); the plumbing holding both together is [residual connections and layer norm](/learn/llm-foundations/residual-connections-and-layer-norm).

### 5. Stack the block N times

Feed that `(5, 768)` output into an identical block, then another, eleven more times. The shape never moves — only the values inside it get refined, layer after layer. That repetition is the entire subject of [the forward pass as a stack of blocks](/learn/llm-foundations/the-forward-pass-as-a-stack-of-blocks), later in this same module.

### 6. Final norm and the unembedding

After block 12, one more normalization, then a linear projection back out to vocabulary size — but only the *last* position matters for predicting what comes next:

```text
hidden states (5, 768)  →  final norm (5, 768)  →  take last row (768,)
  →  unembed:  (768,) @ (768, 50000)  →  logits (50000,)
```

Five tokens went in; one 50,000-long vector of raw scores comes out — one number per possible next token. That projection is [the vocabulary and the unembedding head](/learn/llm-foundations/the-vocabulary-and-the-unembedding), the very next lesson in this module.

### 7. Softmax: scores become a probability distribution

```text
logits (50000,)  →  softmax  →  probs (50000,), all ≥ 0, summing to 1
```

Worked by hand, with real numbers, in [logits to probabilities](/learn/llm-foundations/logits-to-probabilities-by-hand).

### 8. Sample: pick one token

```text
probs (50000,)  →  sample  →  next_id  (a single integer, e.g. 6342 → " Paris")
```

Whether that pick is "always the top one" or something looser is [sampling, temperature, and top-p](/learn/llm-foundations/sampling-temperature-top-p).

### 9. Loop: feed it back in

```text
"The capital of France is" + " Paris"  →  6 tokens  →  back to step 1
```

One token became a habit. That loop — what makes a model produce paragraphs instead of single words — is [the autoregressive generation loop](/learn/llm-foundations/the-autoregressive-generation-loop), worked through step by step in [generating a sentence token by token](/learn/llm-foundations/generating-a-sentence-token-by-token).

Every one of those nine steps is a real matrix operation on real numbers. There's no step where the model "thinks" outside this pipeline — the whole trick is that stacking enough of the right operations, trained on enough text, makes step 8 pick "Paris" far more often than "banana."

## What trips people up

| Idea | Confusion | Where to learn it |
|---|---|---|
| The output is one distribution | People imagine the model "decides" a whole answer at once | [What a language model actually computes](/learn/llm-foundations/what-a-language-model-actually-computes) |
| Logits aren't probabilities yet | People read raw scores as confidence percentages | [Logits to probabilities, by hand](/learn/llm-foundations/logits-to-probabilities-by-hand) |
| Generation is a loop, not one shot | People assume a long answer was produced in a single pass | [The autoregressive generation loop](/learn/llm-foundations/the-autoregressive-generation-loop) |
| Weights ≠ activations ≠ training data | People think the model "looks things up" in stored text | [Parameters, activations, and data](/learn/llm-foundations/parameters-activations-and-data) |
| Depth is repetition | People expect each layer to have a distinct, nameable job | [The forward pass as a stack of blocks](/learn/llm-foundations/the-forward-pass-as-a-stack-of-blocks) |

## A reading path

If you want to walk this module in the order it was built to be read:

1. [What a language model actually computes](/learn/llm-foundations/what-a-language-model-actually-computes) — the precise definition behind everything above.
2. [Why predicting the next word is enough](/learn/llm-foundations/why-next-word-prediction-is-enough) — why one objective produces all this behavior.
3. [Logits to probabilities, by hand](/learn/llm-foundations/logits-to-probabilities-by-hand) and [the autoregressive generation loop](/learn/llm-foundations/the-autoregressive-generation-loop) — steps 7-9 above, slowed down.
4. [The forward pass as a stack of blocks](/learn/llm-foundations/the-forward-pass-as-a-stack-of-blocks), [parameters, activations, and data](/learn/llm-foundations/parameters-activations-and-data), and [the vocabulary and the unembedding head](/learn/llm-foundations/the-vocabulary-and-the-unembedding) — steps 4-6, in depth.
5. [Myths about how LLMs work](/learn/llm-foundations/myths-about-how-llms-work) and the [whole-game quiz](/learn/llm-foundations/whole-game-quiz) to check what stuck.

From here, the next modules zoom into single stages of this pipeline: [the transformer architecture](/learn/llm-foundations/the-transformer-architecture) covers step 4 in full, and [pretraining](/learn/llm-foundations/pretraining-explained) covers how the weights used in every step above got their values in the first place.

**Related:** [The Transformer Architecture](/learn/llm-foundations/the-transformer-architecture), [Next-Token Prediction](/learn/llm-foundations/next-token-prediction), [Sampling, Temperature, and Top-p](/learn/llm-foundations/sampling-temperature-top-p)
