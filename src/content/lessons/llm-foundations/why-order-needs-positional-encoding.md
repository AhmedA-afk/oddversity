---
title: "Why Order Needs Positional Encoding"
track: "llm-foundations"
status: live
summary: "Self-attention computes the same token representations no matter what order tokens arrive in — position has to be added on purpose."
duration: "6 min read"
---

Shuffle the words in a sentence and feed both versions through raw self-attention, and each token gets back the exact same vector it would have gotten in the original order — just relabeled to match wherever it now sits. That's not a bug to guard against; it's how the math works by default, and it's why every transformer needs a separate mechanism just to know what order things came in.

## What it is

**Positional encoding** is any mechanism that injects information about a token's position in the sequence into the computation — because without it, [self-attention](/learn/llm-foundations/attention-mechanism-explained) genuinely cannot tell "dog bites man" from "man bites dog." Both sentences contain the same three tokens; attention computed on a set of tokens with no order information produces the same set of output vectors regardless of which order they were listed in.

## The mental model

Think of self-attention as a room full of people at a mixer, each holding a card describing themselves (their embedding). Every person looks around, decides how relevant every other card is to them, and updates their own understanding based on a weighted blend of everyone's cards. Nothing about that process depends on where people are standing in the room, or in what order they entered — only on what's written on the cards. If you re-run the mixer with everyone standing in different spots, but the same set of cards, everyone walks away having formed the exact same impression they did before. The room has no concept of "first person" or "the one who spoke third" unless someone writes that information on the cards themselves.

That's exactly the gap positional encoding fills: writing "you are the 3rd person in this room" directly onto the card, before the mixer starts, so the content itself carries position — because the mixing process (attention) has no other way to know it.

## Why it works this way

Attention scores are computed purely from content — a query vector's dot product against key vectors, both derived from token embeddings. Nowhere in that computation is there a variable for "index in the sequence." Formally, if you permute the rows of the input matrix `X` by some permutation `P`, the queries, keys, and values are all permuted by that same `P` (linear projections commute with row permutations), the attention score matrix comes out permuted in a way that keeps every score attached to the same pair of tokens, and the final output rows come out permuted by exactly `P` — meaning every token gets back the identical vector it would have gotten in the original order, just sitting in a different row. Attention is *permutation-equivariant*: reorder the input, and the output reorders the same way, with no value inside it actually changing.

This is a direct architectural consequence of removing recurrence. Older sequence models (RNNs) processed tokens one at a time, in order, so position was implicit in *when* a token was processed. Transformers process every token in parallel specifically to make training fast — which means they threw away the one mechanism that used to encode order for free, and have to buy it back explicitly.

## A concrete example (shown)

Three tokens, two dimensions each, using raw dot-product attention with the embeddings standing in directly as queries, keys, and values (no separate projection matrices, to keep the arithmetic visible):

```python
import numpy as np

def attention(X):
    scores = X @ X.T
    weights = np.exp(scores) / np.exp(scores).sum(axis=1, keepdims=True)
    return weights @ X

A, B, C = np.array([1., 0.]), np.array([0., 1.]), np.array([1., 1.])

order1 = np.array([A, B, C])
order2 = np.array([C, A, B])

print(attention(order1))
print(attention(order2))
```

```
attention(order1):
  A -> [0.8446, 0.5777]
  B -> [0.5777, 0.8446]
  C -> [0.7881, 0.7881]

attention(order2):
  C -> [0.7881, 0.7881]
  A -> [0.8446, 0.5777]
  B -> [0.5777, 0.8446]
```

Every token's output vector is bit-for-bit identical between the two runs — `A` gets `[0.8446, 0.5777]` whether it's listed first or second, `C` gets `[0.7881, 0.7881]` whether it's listed third or first. Nothing about "where in the sequence" changed a single number; only the row order in the printout changed, because the row order of the input changed. That's permutation-equivariance made concrete: attention alone cannot distinguish "A, B, C" from "C, A, B."

## Where it shows up

This is why positional encoding has to happen *before* the first attention layer ever runs, not somewhere downstream — it's added directly to the [token embedding](/learn/llm-foundations/the-embedding-lookup-table) (or folded into the query/key computation, depending on the scheme) at the very start of [the forward pass](/learn/llm-foundations/the-forward-pass-as-a-stack-of-blocks). Every transformer-based model needs some version of this fix — [sinusoidal, learned, RoPE, or ALiBi](/learn/llm-foundations/sinusoidal-vs-learned-vs-rope-vs-alibi) are the four schemes actually used in production, differing in exactly how and where they inject that signal.

## Watch out for

- **"Equivariant" is not "invariant."** The output *reorders* along with the input — it doesn't stay fixed. What's missing is any positional information being used to *change* a token's representation based on its role in the sequence, not the ability to tell inputs apart at all.
- **This isn't specific to language.** Any application of raw self-attention — over image patches, over graph nodes, over a set of database records — has the identical property. Positional (or structural) encoding is what turns a generic set-processing mechanism into a sequence-, grid-, or graph-aware one.
- **Causal masking is a separate concern.** [Causal masking](/learn/llm-foundations/causal-masking) stops a token from attending to future tokens; it does not, on its own, tell a token *where* it sits among the tokens it can see. Both mechanisms are needed together in an autoregressive model.

## Where next

[Sinusoidal vs learned vs RoPE vs ALiBi](/learn/llm-foundations/sinusoidal-vs-learned-vs-rope-vs-alibi) compares the four real schemes that solve this problem. To see the current default worked out in code, go to [implement RoPE in numpy](/learn/llm-foundations/implement-rope-in-numpy).

**Related:** [The Attention Mechanism, Explained](/learn/llm-foundations/attention-mechanism-explained), [Sinusoidal vs Learned vs RoPE vs ALiBi](/learn/llm-foundations/sinusoidal-vs-learned-vs-rope-vs-alibi), [Causal Masking](/learn/llm-foundations/causal-masking), [The Embedding Lookup Table](/learn/llm-foundations/the-embedding-lookup-table)
