---
title: "Attention as a Soft, Differentiable Lookup"
track: "llm-foundations"
status: live
summary: "Attention is a dictionary lookup where the key doesn't have to match exactly — it blends in proportion to how well it matches."
duration: "6 min read"
---

A Python dictionary gives you an all-or-nothing deal: the key matches or it doesn't, and you get exactly one value back. Attention runs the same idea with the hard edges sanded off — every key gets compared, every one contributes something, and the result is a blend weighted by how well each key matched. That single idea is the entire mechanism behind [self-attention](/learn/llm-foundations/attention-mechanism-explained), and this lesson gives you the vocabulary — query, key, value — that the rest of this module builds on.

## What it is

Every token in a sequence produces three vectors, each a learned linear projection of its embedding:

- **Query (Q)** — what this token is asking for right now
- **Key (K)** — the label this token advertises, for other tokens to match against
- **Value (V)** — the content this token actually hands over if it's picked

Attention for a given token works in three steps: compare its query against every token's key to get a raw score, turn those scores into weights that sum to 1 with softmax, then use those weights to take a weighted average of every token's value. No key is ever rejected outright — a poor match just gets a weight close to zero instead of being dropped.

```
score(i, j) = Q_i · K_j                    # how well query i matches key j
weight(i, :) = softmax(score(i, :))         # normalize into a probability distribution
output_i = Σ_j weight(i, j) * V_j           # blend of every value, weighted
```

The output for token `i` is a genuine mixture — a bit of `V_3`, a bit of `V_7`, mostly `V_2` — rather than a single retrieved item. That's what makes it a *soft* lookup.

## The mental model

Picture a real dictionary lookup: `d["cat"]` either finds the exact string `"cat"` as a key or it doesn't, and you get `d["cat"]`'s value or a `KeyError`. There's no notion of `"cats"` being 80% as good a match — it's binary, and the operation isn't differentiable, so you couldn't train anything through it with gradient descent even if you wanted to.

Attention replaces the exact-match test with a similarity score (the dot product) and replaces "return the winner" with "return a weighted average, weighted by similarity." Every operation in that pipeline — the dot product, the softmax, the weighted sum — is a smooth function with a well-defined gradient. That's not an incidental nicety; it's the entire reason attention can be learned at all. During training, gradients flow backward through the weighted sum, through the softmax, through the dot product, and all the way into the Q, K, and V projection matrices, nudging them so that queries end up pointing at the keys that actually help predict the next token.

## Why it works this way

A hard lookup forces a modeling decision at exactly the wrong moment: which single token matters most. Language rarely works that way — resolving a pronoun, tracking a verb's subject, or completing a phrase often depends on a *combination* of earlier tokens in different proportions, and the right proportions depend on context the model has to learn. A soft lookup defers that decision to a continuous weight, so the network can express "mostly this token, a little of that one" instead of being forced to commit early to a single, possibly wrong, answer.

It also composes cleanly with backpropagation. Because nothing in the pipeline branches or picks a discrete winner, the same machinery used to train every other layer in the network — matrix multiplies, softmax, elementwise ops — trains attention too. No special-cased reinforcement-learning trick or discrete search is needed just to make the lookup itself learnable.

## A concrete example

Take four one-hot value vectors, one per token, so you can read the output directly as attention weights:

```
V = [[1, 0, 0, 0],   # "The"
     [0, 1, 0, 0],   # "cat"
     [0, 0, 1, 0],   # "sat"
     [0, 0, 0, 1]]   # "down"
```

Say token 3 ("sat") produces attention weights `[0.05, 0.65, 0.25, 0.05]` after softmax — mostly attending to "cat," some to itself, a little to "The" and "down." The output for position 3 is:

```
output_3 = 0.05*V[0] + 0.65*V[1] + 0.25*V[2] + 0.05*V[3]
         = [0.05, 0.65, 0.25, 0.05]
```

With one-hot values, the output *is* the weight vector — a literal, visible blend of "cat," "sat," "The," and "down," in those proportions. In a real model, `V` holds learned dense vectors instead of one-hot rows, so the blend isn't human-readable at a glance, but the arithmetic is identical: a weighted average, not a single winner. [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy) runs this exact computation end to end on a 4-token example and prints every intermediate step.

## Where it shows up

This QKV vocabulary is not specific to one layer — it's the unit this entire module decomposes. [Multi-head attention](/learn/llm-foundations/multi-head-attention-why-many-heads) runs several of these soft lookups in parallel subspaces. [Causal masking](/learn/llm-foundations/causal-masking-mechanics) is a small patch applied to the scores before the softmax step, so a token can't perform a soft lookup against the future. Once attention output is computed, the [feed-forward block](/learn/llm-foundations/the-feed-forward-block-role) processes it further, and the whole thing sits inside a [residual stream](/learn/llm-foundations/residual-stream-and-layer-norm). Every one of those lessons assumes you have this Q/K/V frame in hand.

## Watch out for

- **Confusing "key" with "value."** The key is only ever used for matching (the dot product); it never appears in the output. If you find yourself averaging keys instead of values, the wiring is backwards.
- **Thinking the query must come from a different sequence.** In self-attention, Q, K, and V are all projections of the *same* sequence — that's what makes it "self." Cross-attention (queries from one sequence, keys/values from another, as in an encoder-decoder) is a variant, not the default in the decoder-only models this track focuses on.
- **Forgetting that weights are per-query, not global.** Each row of the attention matrix is its own softmax — token 3's weights over all keys sum to 1, independently of what token 1's weights look like. There is no sequence-wide normalization.

## Where next

[Queries, Keys, and Values: The Library Metaphor](/learn/llm-foundations/queries-keys-values-library-metaphor) gives you a second, more intuitive way to hold this same idea before you dive into the numpy implementation.

**Related:** [The Attention Mechanism, Explained](/learn/llm-foundations/attention-mechanism-explained), [Queries, Keys, and Values: The Library Metaphor](/learn/llm-foundations/queries-keys-values-library-metaphor), [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy), [Multi-Head Attention: Why Many Heads](/learn/llm-foundations/multi-head-attention-why-many-heads)
