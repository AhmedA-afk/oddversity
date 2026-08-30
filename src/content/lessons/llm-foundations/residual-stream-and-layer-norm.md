---
title: "The Residual Stream and Layer Norm"
track: "llm-foundations"
status: live
summary: "Every block reads from and writes to one shared stream of vectors — layer norm is what keeps that stream numerically usable."
duration: "6 min read"
---

Attention and the FFN each get their own lesson because they each do something distinctive. What they share — the thing that makes stacking dozens of them possible at all — is easy to skim past: both sublayers read from, and write back to, one continuous stream of vectors that runs the full depth of the network. This lesson is about that stream itself.

## What it is

Picture the residual stream as a single running total, one vector per token position, that starts at the embedding layer and gets *added to*, never replaced, by every sublayer it passes through:

```
stream = embed(tokens)                       # starting value
stream = stream + attention(norm(stream))    # attention reads, then writes an update
stream = stream + feed_forward(norm(stream)) # FFN reads, then writes an update
# ...repeated once per block, dozens of times...
logits = unembed(norm(stream))               # final read, turned into predictions
```

Every sublayer's actual output is a small delta, added into the stream with `+`, not a wholesale replacement of what was there. [The Transformer Architecture](/learn/llm-foundations/the-transformer-architecture) shows this same `x = x + Sublayer(...)` pattern as the shape of one block; this lesson is about what it means to have dozens of them sharing *one* stream rather than each starting fresh.

## The mental model

Think of the residual stream as a shared whiteboard that every layer in the network can read from and write on, rather than a series of sealed envelopes passed hand to hand. A pipeline of sealed envelopes — layer 1 fully transforms the input and hands off a finished product, layer 2 fully transforms *that* and hands off the next one — would mean any information layer 1 didn't think to preserve is simply gone by the time layer 40 needs it. A shared whiteboard works differently: layer 1 can jot down a small note (its attention output) without erasing anything already on the board, layer 2 reads the *whole* board including layer 1's note, adds its own note, and so on. Nothing has to be actively "carried forward" — staying on the board *is* the default; only active additions change it.

This is also why the residual stream is a genuinely useful unit for reading a model, not just an implementation detail: because every layer's contribution is an additive term, you can in principle decompose the final stream value back into the sum of what each layer contributed, layer by layer — a technique interpretability researchers actually use, sometimes called the "logit lens," to see what the model's running prediction looked like partway through the stack.

## Why it works this way

Two separate problems get solved by two separate pieces here, and it's worth keeping them apart:

**The residual connection (the `+`) solves a gradient problem.** Backpropagation through a plain stack of transformations multiplies a gradient by each layer's Jacobian in turn; across enough layers that product tends toward zero or blows up. Backprop through an addition instead just copies the gradient to both branches unchanged, so the `+x` term gives gradients a direct, mostly unimpeded path back to every earlier layer — often called a "gradient highway." This is the same fix ResNets introduced for image models, adapted to transformers.

**Layer norm solves a scale problem the residual stream creates.** If every layer keeps *adding* updates to a running sum, nothing stops the magnitude of that sum from drifting or growing as depth increases — after 80 additions, activation scales could be wildly different from what any single layer's weights were tuned to expect. Layer normalization rescales a token's vector back to a stable distribution — zero mean, unit variance across the feature dimension, then a learned scale and shift — so every sublayer sees inputs in a predictable range regardless of how many additions came before it. Unlike batch normalization, it normalizes across one token's own features, not across a batch, which is what makes it apply cleanly to variable-length text and to generating one token at a time.

## A concrete example (shown)

Say the residual stream at some position, going into layer 12, holds a vector that already encodes "this is the subject of the sentence," written there by an earlier attention layer. Layer 12's own attention sublayer doesn't need to re-derive that fact — it reads the *whole* stream (after layer norm rescales it), and its own contribution can be a small, targeted update, like adding information about a different, unrelated dependency, without disturbing the "subject" information already present. That's the additive, non-destructive property in action: layer 12 didn't have to reconstruct everything layer 3 already established.

## Where it shows up

This is the structural spine that [Assemble One Full Transformer Block](/learn/llm-foundations/assemble-one-full-transformer-block) wires attention and the FFN onto, and it's why that lesson's stacking works at all — every block reads the same shape of stream it writes back, so blocks can be chained without any adapter between them. Where exactly `norm()` sits relative to the `+` — before the sublayer or after it — turns out to matter enormously for how deep you can stack this reliably; [Why Pre-Norm Won, and What RMSNorm Changes](/learn/llm-foundations/why-pre-norm-won-and-rmsnorm) works through that placement question rigorously, with the gradient-flow argument spelled out in full.

## Watch out for

- **Thinking of the residual stream as "mostly attention's output."** It's the *sum* of every sublayer's contribution so far, including the original embedding — by a late layer, the running total may contain far more accumulated history than any single sublayer's most recent addition.
- **Confusing layer norm with batch norm.** Layer norm normalizes across one token's features; it has nothing to do with statistics computed across a batch of examples, and doesn't behave differently at inference time the way batch norm can.
- **Assuming normalization changes what information is present.** Layer norm rescales magnitude and (optionally) shifts and scales per-feature — it doesn't add, remove, or mix information across tokens or features the way attention or the FFN do; it's stabilization, not computation.

## Where next

[Why Pre-Norm Won, and What RMSNorm Changes](/learn/llm-foundations/why-pre-norm-won-and-rmsnorm) goes deep on the one design decision this lesson only gestured at: where norm sits relative to the residual add, and why that placement is what separates a transformer that trains stably at 100 layers from one that doesn't.

**Related:** [The Transformer Architecture](/learn/llm-foundations/the-transformer-architecture), [Why Pre-Norm Won, and What RMSNorm Changes](/learn/llm-foundations/why-pre-norm-won-and-rmsnorm), [Residual Connections and Layer Norm](/learn/llm-foundations/residual-connections-and-layer-norm), [Assemble One Full Transformer Block](/learn/llm-foundations/assemble-one-full-transformer-block)
