---
title: "The Feed-Forward Block as Key-Value Memory"
track: "llm-foundations"
status: live
summary: "FFN neurons behave like a second, static key-value lookup — one with learned, fixed keys instead of ones computed per input."
duration: "8 min read"
---

*This is a deep-dive into an interpretability finding about the feed-forward block from [The Feed-Forward Block and Its Role](/learn/llm-foundations/the-feed-forward-block-role) — optional depth on how that sublayer's compute step is thought to actually work.*

Attention's key-value lookup, from [Attention as a Soft, Differentiable Lookup](/learn/llm-foundations/attention-as-soft-lookup), is computed fresh at every forward pass — the keys and values come from whatever tokens happen to be in the current context. The feed-forward block runs a structurally similar lookup, but with keys and values that are *fixed after training*, baked into the weights rather than computed from the current input. This reframing — first laid out clearly by Geva et al. in "Transformer Feed-Forward Layers Are Key-Value Memories" (2020) — is one of the more useful lenses for understanding what the FFN's parameters are actually for.

## The mechanism

Recall the FFN's two matrix multiplies:

```
h = activation(x @ W1)   # (d_model,) -> (d_ff,), d_ff ≈ 4 * d_model
y = h @ W2                # (d_ff,) -> (d_model,)
```

Look at this row by row instead of as two opaque matrices. Each row of `W1` is a fixed vector of length `d_model` — call it `k_i`, for neuron `i`. The pre-activation value for that neuron is `x · k_i`, a dot product between the current input and that fixed vector: structurally identical to the `Q · K` comparison in attention, except `k_i` never changes with the input — it's a **key** learned once during training and frozen at inference.

The activation function (say, GeLU) turns that dot product into a scalar "how strongly did this pattern fire" score. Then, symmetrically, each row of `W2` is a fixed vector `v_i` of length `d_model` — a **value**. The FFN's output is:

```
y = Σ_i activation(x · k_i) * v_i
```

That's a weighted sum of value vectors, weighted by how well the input matched each key — the same shape as attention's `Σ_j weight(i,j) * V_j`, with one structural difference: attention's weights come from a softmax that forces them to sum to 1 across a small set of *sequence positions*; the FFN's weights come from an elementwise activation with no such constraint, applied across a much larger set of *learned pattern detectors* — often 4x the residual stream's width, so a model with `d_model = 4096` typically has roughly 16,384 of these detectors per layer.

## What the keys detect, and what the values write

Geva et al.'s empirical finding, examining trained language models, is that individual rows of `W1` often respond to surprisingly specific, human-nameable input patterns — one neuron firing reliably on inputs related to a particular topic or a specific surface pattern in the text, for instance. Not every neuron is this cleanly interpretable, and many respond to patterns with no tidy human label, but enough of them are legible enough that the "pattern detector" framing holds up as more than a metaphor.

The paired value row then determines what gets *written back into the residual stream* when that pattern fires — often described as pushing the model's output distribution toward specific tokens associated with that pattern. Put together: a key detects "is this pattern present," and its paired value says "if so, nudge the output this way." That's a factual or associative memory, implemented as one row of two matrices.

## The 4x expansion ratio

Widening `d_ff` to roughly `4 * d_model` before the down-projection isn't an arbitrary convention — under the key-value framing, it's a direct capacity choice: more rows in `W1`/`W2` means more independent pattern-detector slots. A narrower FFN has fewer keys available to memorize distinct input patterns; a wider one has more room to store more of them, at the cost of more parameters and more compute per token. Since the FFN typically dominates a dense transformer's parameter count (see [The Feed-Forward Block](/learn/llm-foundations/the-feed-forward-block) for the `4d^2` vs `d^2` comparison against attention), this expansion ratio is a major lever on how much of a model's factual and associative "knowledge" it can hold, separate from how deep or how wide the residual stream itself is.

## GeLU vs. SwiGLU

The activation function sitting between the two projections isn't a minor implementation detail — it changes how sharply a "key" needs to match before its value gets written in.

- **GeLU** (Gaussian Error Linear Unit) is a smooth approximation to a step function, used in GPT-2/GPT-3-era models. It's a straightforward `activation(x @ W1) @ W2` — exactly the two-matrix shape above.
- **SwiGLU**, used in LLaMA and many subsequent open models, adds a second, separate linear projection that gates the first: roughly `(activation(x @ W1) * (x @ W3)) @ W2`, with `W1`, `W2`, and `W3` all learned. The extra gating term lets the network modulate how strongly a detected pattern gets passed through, based on the input itself, rather than passing every detected pattern through with a fixed activation curve.

SwiGLU costs more parameters for the same `d_model` (three weight matrices instead of two, so implementations usually shrink `d_ff` somewhat to compensate) and has become the more common default in recent open-weight model families, on the strength of consistently measured — though model-dependent and not universally reported as identical in magnitude — quality improvements per parameter over plain GeLU. Neither is a settled "solved" choice; it's an active area where architecture papers still report small deltas from swapping activations.

## The tradeoff, precisely

The key-value framing has real predictive and interpretive value: it explains where a good chunk of the FFN's `4d^2`-scale parameter budget goes conceptually (many independent, narrow pattern detectors), and it gives interpretability researchers a concrete unit — one neuron, one key-value pair — to probe and, in some cases, directly edit. But it's a lens, not a complete mechanistic account: it doesn't explain everything the FFN does (some of the block's function is genuinely distributed across many neurons acting jointly, resisting a clean single-neuron story), and "editing one fact by changing one row of W2" works better in illustrative cases than as a reliable general-purpose editing method, since facts and patterns are often represented redundantly across more than one neuron.

## Where this leaves you

Attention and the FFN turn out to share a surprisingly similar mathematical shape — both are weighted sums of value vectors, gated by a similarity score against a key. The difference that matters is *when* the keys and values are set: attention's are computed fresh from the current context every forward pass; the FFN's are frozen at the end of training, which is exactly why the FFN is the more natural place to look for a model's stored facts, and attention the more natural place to look for how it combines and moves information around.

**Related:** [The Feed-Forward Block and Its Role](/learn/llm-foundations/the-feed-forward-block-role), [The Feed-Forward Block](/learn/llm-foundations/the-feed-forward-block), [Attention as a Soft, Differentiable Lookup](/learn/llm-foundations/attention-as-soft-lookup), [Mixture of Experts, Explained](/learn/llm-foundations/mixture-of-experts-explained)
