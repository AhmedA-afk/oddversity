---
title: "Context Extrapolation and RoPE Scaling"
track: "llm-foundations"
status: live
summary: "Why pushing RoPE past its trained length degrades quality, and how linear and NTK-aware scaling buy back usable context length."
duration: "9 min read"
---

> **Optional depth.** This lesson derives *why* RoPE degrades past its trained length and *how* scaling techniques fix it, in more rigor than day-to-day use requires. [Sinusoidal vs learned vs RoPE vs ALiBi](/learn/llm-foundations/sinusoidal-vs-learned-vs-rope-vs-alibi) and [implement RoPE in numpy](/learn/llm-foundations/implement-rope-in-numpy) are the prerequisites this builds on.

RoPE extrapolates better than absolute positional schemes, but "better" isn't "unlimited." Understanding exactly where it breaks is what makes the fix — RoPE scaling — legible as an engineering tradeoff rather than a magic knob.

## Where naive extrapolation actually goes wrong

Recall the mechanism from [implement RoPE in numpy](/learn/llm-foundations/implement-rope-in-numpy): each pair of query/key dimensions rotates at its own frequency, `theta_i = base^(-2i/dim)`. Low-index pairs (`i` small) rotate fast — close to a full radian per position step. High-index pairs (`i` large) rotate slowly, sometimes covering only a small fraction of a full rotation across the model's entire trained sequence length.

That range restriction is the crux of the problem. During training, every dimension pair's rotation angle only ever took on values within a bounded range — from `0` up to `(max_trained_position) × theta_i`, for whatever relative offsets actually occurred between tokens the model saw together. The fast-rotating pairs cycle through their full range many times over even a modest training length, so extrapolating them further mostly revisits angle values the model has already seen (rotation is periodic, so very large offsets can alias back onto familiar angles). The slow-rotating pairs are the real casualty: they were never pushed anywhere close to a full rotation during training, so every relative offset the model actually learned to interpret through those dimensions sits inside a narrow slice of that pair's possible angle range. Extend the sequence length past training, and those slow dimensions are asked to represent phase values *outside* the narrow slice the model ever learned anything about — for every layer, every head, simultaneously. The failure isn't localized to one broken component; it's a coordinated, compounding drift across every attention computation in the network, and it shows up as generation that gets less coherent, more repetitive, or loses track of earlier context as the sequence grows past the trained length.

## Linear scaling (position interpolation)

The direct fix: never let the angle computation see a position outside the range it was trained on, no matter how long the actual input sequence gets. Concretely, scale every position down by a fixed factor before computing rotation angles — feed `position × (L_train / L_new)` into the rotation formula instead of the raw position, where `L_train` is the original trained length and `L_new` is the desired extended length.

Illustrative before/after: say a model was trained at `L_train = 4,096` tokens, and you want `L_new = 16,384` — a scale factor of `4,096 / 16,384 = 0.25`. A token at real position 16,000 gets its rotation angle computed as if it were at position `16,000 × 0.25 = 4,000` — safely inside the range every dimension pair actually learned to interpret. Every angle the model ever computes, no matter how long the real input is, stays within the trained range. Nothing is extrapolated; the whole coordinate system is compressed to fit inside what's already known.

**The tradeoff.** Compression isn't free. If real positions 1 and 2 used to produce a rotation angle difference corresponding to "adjacent tokens" during training, after a 4x compression, real positions 1 and 2 now produce an angle difference corresponding to what used to mean *distance 0.25* — a step size four times smaller than the model ever saw as meaningfully distinct during training. Fine-grained local distinctions (exactly how far apart two nearby tokens are) blur together, because the model's learned sense of "this angle gap means immediately adjacent" no longer matches the angle gap actually being produced. In practice this is why position interpolation is paired with a short additional fine-tuning pass at the new length — a relatively small amount of further training lets the model relearn precise local behavior at the new, compressed angular scale, rather than shipping the compression cold.

## NTK-aware scaling

Linear scaling compresses every dimension pair by the same factor, fast-rotating and slow-rotating alike — but the problem described above only really afflicts the slow-rotating pairs, the ones that never got close to covering their full angular range during training. The fast-rotating pairs, responsible for fine local resolution, were already cycling through their whole range repeatedly and don't need much help.

NTK-aware scaling adjusts the RoPE frequency formula's base non-uniformly instead of scaling every position by one flat factor: it leaves high-frequency (fast-rotating, low-index) dimension pairs close to untouched, preserving their fine local resolution, while stretching low-frequency (slow-rotating, high-index) pairs more aggressively so they can represent the additional long-range distance the extended context needs. The name references Neural Tangent Kernel theory's observation that networks tend to learn coarse, low-frequency structure more readily than fine high-frequency detail — so it's the coarse, low-frequency dimensions that can safely absorb more distortion, while the fine-detail dimensions should be protected from it.

**The tradeoff.** Because local resolution is preserved rather than uniformly compressed, NTK-aware scaling generally needs less (sometimes none) of the fine-tuning that linear scaling relies on to recover quality — but it's still an approximation layered on frequencies that were never trained for this exact non-uniform stretch, and pushed far enough beyond the original trained length, it degrades too. It buys a larger comfortable extension range than linear scaling at similar quality, not an unbounded one.

## The precise tradeoff

Neither technique creates new information the model never had — both are ways of redistributing the fixed budget of "angles the model already learned to interpret" across a longer input. Linear scaling spends that budget uniformly and pays for it in blurred local resolution unless you fine-tune afterward. NTK-aware scaling spends it non-uniformly, protecting exactly the frequencies fine-grained understanding depends on, at the cost of being a less mathematically clean compression to reason about. Both remain approximations: extending a model's *effective* context this way is a genuine engineering technique with real, usable gains, but it is not the same claim as the model having been trained on sequences that long — quality at the far end of an extended context window is reliably a notch below quality at lengths the model actually trained on, which is worth remembering whenever [context window](/learn/llm-foundations/context-window-mechanics) limits and extension claims come up together.

**Related:** [RoPE: Rotary Position Embeddings, Explained](/learn/llm-foundations/rotary-position-embeddings), [Implement RoPE in Numpy](/learn/llm-foundations/implement-rope-in-numpy), [Sinusoidal vs Learned vs RoPE vs ALiBi](/learn/llm-foundations/sinusoidal-vs-learned-vs-rope-vs-alibi), [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics)
