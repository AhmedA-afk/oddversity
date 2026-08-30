---
title: "Multi-Head Attention: Why Many Heads"
track: "llm-foundations"
status: live
summary: "One softmax per layer can only express one notion of relevance — splitting into heads is how the model gets several at once."
duration: "6 min read"
---

The attention function from [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy) produces exactly one weighting scheme per token, per layer. Real sentences need more than one at a time — this lesson covers why splitting into heads is how transformers get that, and how the pieces come back together.

## What it is

Multi-head attention doesn't run attention once over the full embedding width. Instead, it splits the model dimension `d_model` into `h` equal slices, runs a complete, independent attention computation — its own Q, K, V projections, its own softmax — in each slice, and then puts the results back together:

```
input: (seq_len, d_model)
  → project to Q, K, V, each (seq_len, d_model)
  → reshape each into h heads of size (seq_len, d_model / h)
  → run scaled dot-product attention independently, per head
  → concatenate the h outputs back to (seq_len, d_model)
  → one more learned linear layer (W_O) mixes across heads
```

If `d_model = 512` and `h = 8`, each head operates on 64-dimensional queries, keys, and values, and there are 8 independent attention matrices computed per layer instead of one.

## The mental model

A single attention operation is a single softmax over a single set of query-key comparisons — one answer, per token, to "what matters here." A sentence usually needs several different answers to that question simultaneously: which word does this pronoun refer to, which word does this verb agree with, which earlier token opened the bracket this one is closing. A lone head has to compromise, blending all of those signals into one weighted average that partially satisfies each and fully satisfies none.

Splitting into heads sidesteps the compromise by giving each concern its own private subspace with its own projections. Nothing forces head 3 to specialize in coreference and head 5 in syntax — gradient descent discovers that division of labor on its own, because separate parameter subspaces competing to reduce the same loss tend to settle into different, complementary roles. [What Different Attention Heads Learn](/learn/llm-foundations/what-different-heads-learn) tours what real heads in trained models actually end up doing.

## Why it works this way

The key fact making this worth doing at (nearly) no extra cost: splitting a wide vector into `h` narrower ones and running `h` cheaper attention operations is roughly the same total compute as one attention operation over the full width, because each head does proportionally less work over a proportionally smaller dimension. You're not paying `h` times the cost for `h` times the specialization — you're getting `h` independent relevance judgments for close to the cost of one, and every head's computation runs in parallel on the same hardware.

The other half of "why this shape" is the concatenate-then-project step. Simply gluing `h` head outputs together side by side gives the network `h` independent chunks; the final linear layer `W_O` is what lets information from different heads combine and interact before the result is handed to the next sublayer. Drop that projection and you'd have heads that never talk to each other downstream — the mixing has to happen somewhere, and this is where it's placed.

## A concrete example (shown)

Take the same 4-token, `d_k = 2` attention computation from [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy) and imagine it as one of two heads, each seeing a different 2-dimensional slice of a `d_model = 4` embedding. Head 1's slice might, after training, end up producing the weight pattern from that lesson — moderate attention spread fairly evenly across earlier tokens. Head 2, looking at a *different* 2-dimensional slice of the same embeddings, could learn an entirely different pattern from the same input — for instance, concentrating almost all its weight on the immediately preceding token, the kind of "previous-token head" documented in interpretability work. Concatenating the two 4-dimensional outputs (each head here has `d_v = 4` for illustration) and projecting back gives every downstream layer access to both patterns at once, rather than forcing one blended compromise.

## Where it shows up

Multi-head splitting is applied identically whether or not [causal masking](/learn/llm-foundations/causal-masking-mechanics) is active — every head gets its own copy of the same triangular mask. It's also the layer where a major inference-cost decision gets made: every head needs its own cached keys and values at generation time, which is most of what [the KV cache](/learn/llm-foundations/the-kv-cache) has to store per token, and exactly what [grouped-query attention](/learn/llm-foundations/grouped-query-attention) trims by sharing K/V across groups of heads instead of giving every head its own.

## Watch out for

- **Assuming more heads is strictly better.** Each head's dimension shrinks as `h` grows for a fixed `d_model` — at some point heads become too narrow to represent a useful relevance signal at all. Head count is a tuned architectural choice, not a dial you maximize.
- **Skipping the output projection.** Concatenating heads without a learned `W_O` afterward leaves the model unable to mix information across heads before the next sublayer — a cheap-looking shortcut that quietly caps what the layer can express.
- **Reshaping the heads dimension incorrectly.** Getting the reshape/transpose order wrong when splitting `(seq_len, d_model)` into `(h, seq_len, d_model/h)` scrambles which dimensions belong to which token or head, producing a model that still trains but attends to nonsense. [Implement Multi-Head Attention](/learn/llm-foundations/implement-multi-head-attention) walks through the exact reshape that avoids this, and [Transformer Block Wiring Bugs](/learn/llm-foundations/transformer-block-wiring-bugs) catalogs the failure mode in more detail.

## Where next

[Implement Multi-Head Attention](/learn/llm-foundations/implement-multi-head-attention) builds all of this in numpy, with every shape tracked explicitly through the split, the per-head attention, and the concatenation back.

**Related:** [Scaled Dot-Product Attention in Numpy](/learn/llm-foundations/scaled-dot-product-attention-in-numpy), [Implement Multi-Head Attention](/learn/llm-foundations/implement-multi-head-attention), [What Different Attention Heads Learn](/learn/llm-foundations/what-different-heads-learn), [Grouped-Query and Multi-Query Attention](/learn/llm-foundations/grouped-query-attention)
