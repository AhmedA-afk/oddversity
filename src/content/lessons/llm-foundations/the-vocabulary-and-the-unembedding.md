---
title: "The Vocabulary and the Unembedding Head"
track: "llm-foundations"
status: live
summary: "The final linear layer that turns a hidden vector into one logit per possible token, and why it's usually huge."
duration: "6 min read"
---

Whatever a transformer's hidden size is — 768, 4096, whatever — the very last thing that happens to a token's representation is a jump to a completely different size: the size of the vocabulary. That jump is the unembedding.

## What it is

The unembedding (sometimes called the "LM head") is a linear layer that projects a hidden state out of the model's working dimension and into vocabulary space:

```text
hidden state (d_model,)  @  W_unembed (d_model, vocab_size)  →  logits (vocab_size,)
```

For a GPT-2-small-shaped model, that's `(768,) @ (768, 50257) → (50257,)` — one raw score, one logit, for literally every token the model could possibly produce next. It's the last operation in the forward pass traced in [the whole-game walkthrough](/learn/llm-foundations/whole-game-one-token-end-to-end), immediately before [softmax turns those logits into probabilities](/learn/llm-foundations/logits-to-probabilities-by-hand).

## The mental model

The embedding matrix, back at the start of the model, is a lookup table: token id in, vector out, one row read per id — cheap. The unembedding runs the same idea in reverse, but it can't be a lookup, because the input isn't an id anymore — it's a dense 768-number vector that could be anywhere in that space. So instead it's a full matrix multiply: every one of the 50,257 output logits is a weighted combination of *all 768* numbers in the hidden state. Same conceptual direction — vector space to token space — completely different mechanism.

## Why it works this way

Next-token prediction is framed as classification over the vocabulary, and a softmax classifier needs exactly one raw score per class before it can normalize them into probabilities. There's no way around producing `vocab_size` numbers if you want a probability for every candidate token — this is why the unembedding's output dimension isn't a design choice you can shrink; it's fixed by the size of the vocabulary the tokenizer defined back in [tokenization](/learn/llm-foundations/tokenization-explained).

## A concrete example (shown)

Two ways to get `W_unembed`:

**Untied:** learn a completely separate `(768, 50257)` matrix during training, independent of the input embedding matrix. More flexibility — the model can represent "good token to read in this context" and "good token to output here" differently — at the cost of `768 × 50257 ≈ 38.6M` extra parameters that do nothing but this one projection.

**Tied:** reuse the *transpose* of the input embedding matrix as the unembedding — literally the same 38.6M numbers, used in both directions. This is what GPT-2 does. It saves the entire 38.6M-parameter duplication, and imposes a useful bias: a token whose embedding lands near another token's embedding will tend to score similarly for both "was this token here" and "predict this token next."

The size of that saving is not small. In [reading a real model's config](/learn/llm-foundations/reading-a-real-model-config), a GPT-2-small-shaped model's ~124M total parameters would grow to roughly ~163M — a 31% jump — if the unembedding weren't tied to the embedding.

## Where it shows up

Every time a model's vocabulary grows — multilingual tokenizers routinely push past 100k or even 250k tokens to cover more scripts — the embedding and (if untied) unembedding matrices grow in direct proportion, at fixed `d_model`. That trade-off, and how it interacts with tokenized sequence length, is the subject of [vocab size vs. sequence length](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff).

## Watch out for

- **Assuming a bigger vocabulary is architecturally free.** It directly adds `d_model × vocab_size` parameters (doubled if untied) and adds compute to *every single token generated*, since a full vocab-sized softmax has to run every step.
- **Thinking tied weights mean the unembedding step is skipped.** It isn't — it's still a real `(768, 50257)` matrix multiply at every forward pass; tying only means those numbers are shared with the embedding table instead of learned twice.
- **Reading pre-softmax logits as if they were already probabilities.** They aren't bounded, aren't non-negative, and don't sum to anything meaningful — that conversion is [softmax's entire job](/learn/llm-foundations/logits-to-probabilities-by-hand).

## Where next

[Reading a real model's config](/learn/llm-foundations/reading-a-real-model-config), next in this module, uses the tied-weights arithmetic above as one line in a full parameter count for a real architecture.

**Related:** [Logits to Probabilities, by Hand](/learn/llm-foundations/logits-to-probabilities-by-hand), [The Embedding Lookup Table](/learn/llm-foundations/the-embedding-lookup-table), [Vocab Size vs. Sequence Length Tradeoff](/learn/llm-foundations/vocab-size-vs-sequence-length-tradeoff)
