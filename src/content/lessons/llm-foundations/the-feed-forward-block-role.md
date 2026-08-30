---
title: "The Feed-Forward Block and Its Role"
track: "llm-foundations"
status: live
summary: "Attention moves information between positions; the feed-forward block is what processes it once it's arrived."
duration: "5 min read"
---

Attention answers "which other tokens matter to me right now." It doesn't answer "what do I do with what I just gathered." That second question is the feed-forward block's entire job, and the split between the two is one of the cleanest ways to understand what a transformer layer is actually doing.

## What it is

The feed-forward network (FFN) is a small two-layer MLP applied to each position independently — no attention, no mixing across the sequence, just the same weights run on every token's vector one at a time:

```
h = activation(x @ W1)   # expand, d_model -> roughly 4 * d_model
y = h @ W2                # contract back, 4 * d_model -> d_model
```

`W1` and `W2` are shared across every position in the sequence — token 1 and token 40 pass through the identical weights, applied independently, with zero information exchanged between them at this step. [The Feed-Forward Block](/learn/llm-foundations/the-feed-forward-block) covers the shape of this MLP, the expansion ratio, and why it holds most of a model's parameters in more depth; this lesson is about the narrower question of *what job* it's doing inside the layer.

## The mental model

Give attention and the FFN two different verbs: attention **moves** information between positions, and the FFN **processes** information at each position. A transformer layer runs one of each, in sequence:

```
x = x + attention(x)     # communicate: gather relevant info from other tokens
x = x + feed_forward(x)  # compute: transform what arrived, per token
```

Attention is the only place in the entire architecture where token `i`'s output can depend on token `j`'s input. Once attention has run, every position holds a vector that's already a blend of relevant context — and the FFN's job is to take that blend and do something with it, without needing to look anywhere else, because everything relevant has already been gathered in.

## Why it works this way

Splitting "gather" from "compute" into two separate sublayers, rather than one combined operation, buys a specific kind of modularity. Attention's whole design — queries, keys, values, softmax — is built for the gather step: comparing positions against each other. None of that machinery is naturally suited to nonlinear, per-item transformation; softmax-weighted averaging is fundamentally a *linear combination* of what's already present, so on its own attention can only ever produce blends of existing value vectors, never a genuinely new nonlinear function of them.

The FFN fills exactly that gap. Its nonlinearity (typically GeLU or SwiGLU) is what lets the network express curved, non-additive transformations — detecting whether a particular combination of features is present and reacting accordingly, rather than only re-weighting a mixture. Put the two together and a layer can both reach across the sequence *and* apply a genuinely nonlinear transformation to what it finds — either piece alone can't do both.

## A concrete example (shown)

Suppose attention at some position has just resolved a pronoun, so that position's vector now encodes something like "this pronoun's referent is a *singular, animate* noun." The FFN's job, at that same position, might be to use that resolved information to influence the *next* prediction — for instance, biasing toward a singular verb form. Critically, the FFN does this using only the vector already sitting at that one position; it has no separate mechanism to go re-check what the referent was. Whatever attention didn't put into the vector, the FFN cannot retrieve.

This is why bugs in one sublayer can look like they belong to the other: if pronoun resolution seems to be failing, the first place to check is whether attention gathered the right information at all — the FFN can't fix a gather that never happened.

## Where it shows up

This same "communicate, then compute" rhythm repeats at every layer of the stack, which is exactly what [Assemble One Full Transformer Block](/learn/llm-foundations/assemble-one-full-transformer-block) wires together. It's also the frame behind [Mixture of Experts, Explained](/learn/llm-foundations/mixture-of-experts-explained): because the FFN runs independently per token, it's the natural place to route different tokens to different specialized sub-networks — routing wouldn't make sense inside attention, which by design has to see every position at once.

## Watch out for

- **Expecting the FFN to "see" other tokens.** It can't — by construction it runs on one position's vector with no access to any other position. Any cross-token behavior you observe downstream came from an attention layer, not the FFN.
- **Treating the FFN as a minor add-on.** It typically holds the majority of a dense transformer's parameters — see [The Feed-Forward Block](/learn/llm-foundations/the-feed-forward-block) for the parameter-count comparison against attention.
- **Assuming the two sublayers are interchangeable in order.** Running the FFN before attention at a given layer would mean each token computes on stale, not-yet-gathered context — the gather-then-compute order isn't a style choice, it's what makes the compute step meaningful.

## Where next

[The Feed-Forward Block as Key-Value Memory](/learn/llm-foundations/ffn-as-key-value-memory) goes one layer deeper into *how* the FFN's compute step works — the interpretation of its neurons as a lookup mechanism in their own right, distinct from attention's.

**Related:** [The Feed-Forward Block](/learn/llm-foundations/the-feed-forward-block), [The Feed-Forward Block as Key-Value Memory](/learn/llm-foundations/ffn-as-key-value-memory), [Attention as a Soft, Differentiable Lookup](/learn/llm-foundations/attention-as-soft-lookup), [Assemble One Full Transformer Block](/learn/llm-foundations/assemble-one-full-transformer-block)
