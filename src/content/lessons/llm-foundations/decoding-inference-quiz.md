---
title: "Quiz: Decoding and Inference"
track: "llm-foundations"
status: live
summary: "Six questions on sampling, the KV cache, prefill vs decode, lost-in-the-middle, speculative decoding, and quantization — two require real arithmetic."
duration: "9 min read"
---

Six questions, one per mechanism this module covers. Two of them ask you to actually compute something rather than recognize a definition — that's deliberate, since the arithmetic is where most of the real understanding lives.

## 1. Temperature then top-p, by hand

A model's logits for tokens A, B, C, D are `[3.0, 2.0, 1.0, 0.0]`. Apply temperature `T = 0.5`, then top-p with `p = 0.9`. Which tokens survive?

- **A.** A, B, and C.
- **B.** Only A.
- **C.** A and B.
- **D.** All four tokens.

<details><summary>Answer</summary>

**Correct: C.** Dividing the logits by `T = 0.5` doubles them to `[6, 4, 2, 0]`. Softmax on that gives roughly `A=0.865, B=0.117, C=0.016, D=0.002`. Cumulative mass: A alone is 0.865 (under 0.9); A+B is 0.982 (clears 0.9). Top-p keeps the smallest set that clears the threshold, so only A and B survive. **A** is what you get if you skip the temperature step and run top-p directly on the raw logits' `T=1` softmax (`A≈0.644, B≈0.237, C≈0.087`) — cumulative mass there needs all three to clear 0.9, which is exactly the stacking-order mistake this module warns about elsewhere: temperature has to run first. **B** misreads top-p as "the one token whose individual probability exceeds p," rather than the cumulative-mass rule it actually is. **D** treats top-p as a no-op, ignoring that it's meant to filter, not just observe, the distribution.

</details>

## 2. What actually gets cached

In a transformer's decode step, which pair of tensors gets stored in the KV cache across steps, and why is it safe to reuse them for every future token?

- **A.** Query and Key vectors — because they're computed once per token and never change.
- **B.** Key and Value vectors — because causal masking guarantees a token's key and value never depend on any later token, so they never need to be recomputed.
- **C.** Key and Value vectors — because storing them is faster than storing the query vector.
- **D.** All of Q, K, and V — the entire attention computation is cached so no recomputation is ever needed.

<details><summary>Answer</summary>

**Correct: B.** As [the KV cache: what it is and why it exists](/learn/llm-foundations/the-kv-cache-what-and-why) lays out, causal masking is what makes this *safe*, not just convenient — a token's key and value are fixed the moment they're computed because nothing later in the sequence can ever reach back and change them. **A** gets the pair wrong: the query is recomputed fresh every step and never stored — it's used once, against the cache, then discarded. **C** invents a speed justification instead of the real one — the cache isn't about which tensor is faster to store, it's about which ones are safe to never recompute. **D** overclaims: attention weights and the query itself are recomputed every step precisely because they depend on *this* step's new information, not on anything fixed from the past.

</details>

## 3. Why decode is memory-bound

Why is a single decode step described as "memory-bound" rather than "compute-bound"?

- **A.** Generating one token requires reading the entire model's weights from memory but only performs enough compute for that one token — arithmetic intensity (FLOPs per byte moved) is very low.
- **B.** GPUs are physically incapable of doing more than one FLOP per memory access.
- **C.** Decode steps require more total FLOPs than prefill, saturating the compute units.
- **D.** The KV cache must be recomputed from scratch at every decode step, which is a slow memory operation.

<details><summary>Answer</summary>

**Correct: A.** [Prefill vs decode: why inference is memory-bound](/learn/llm-foundations/prefill-vs-decode-memory-bound) derives this directly: reading `2P` bytes of weights to do `2P` FLOPs for one token gives an arithmetic intensity around 1 FLOP/byte, far below what modern accelerators need to stay compute-bound — so the bottleneck is how fast bytes move, not how fast FLOPs execute. **B** is a fabricated hardware constraint; real accelerators do many FLOPs per byte accessed, that's the whole point of the roofline model. **C** is backwards on both counts — decode's *arithmetic intensity* per step is low precisely because it does relatively little compute per byte moved, and it's this low intensity, not high FLOP count, that leaves compute units under-utilized rather than saturated. **D** describes something that doesn't happen — the cache is appended to, one row per step, never recomputed from scratch; that's the entire reason the cache exists in the first place.

</details>

## 4. The mechanism behind lost-in-the-middle

In a long-context experiment, a fact placed at the very beginning or very end of a prompt is retrieved more reliably than the identical fact placed in the middle. Which explanation is correct?

- **A.** The model literally cannot attend to middle positions because of a hard limit in positional encoding.
- **B.** Middle positions fall outside the context window's KV-cache memory budget.
- **C.** A combination of attention sinks favoring the earliest tokens, positional-encoding schemes that favor recency, and less training exposure to long-range middle-of-context retrieval all combine to disadvantage the middle — none of them individually rules it out, but together they create a reliability gradient.
- **D.** Top-p sampling filters out tokens from the middle of long contexts before they can be attended to.

<details><summary>Answer</summary>

**Correct: C.** [The lost-in-the-middle effect](/learn/llm-foundations/the-lost-in-the-middle-effect) walks through all three mechanisms stacking into the observed U-shaped curve — none of them alone would produce a dip specifically in the middle, but together they do. **A** overstates the effect into an absolute limit — the middle is retrieved *less reliably*, not never; that's a reliability gradient, not a hard wall — a genuinely hard positional limit is a separate, different failure covered elsewhere in this module. **B** confuses two different concepts — KV-cache memory determines whether content fits in context at all, not how evenly the model attends across content that already fits. **D** conflates two unrelated mechanisms: top-p filters candidate *output tokens* from the vocabulary at generation time; it has nothing to do with which *input* positions the model attends over.

</details>

## 5. Estimating speculative decoding's speedup

A draft model proposes `k = 3` tokens per round with an average per-token acceptance rate of `p̄ = 0.6`, and costs `1/6` of a target forward pass per token. Using expected tokens per round `= (1 − p̄^(k+1)) / (1 − p̄)` and round cost `= 1 + k × draft_cost_ratio`, what's the approximate speedup over plain decoding?

- **A.** ~0.69x (slower than plain decoding).
- **B.** ~1.45x.
- **C.** ~2.18x.
- **D.** ~2.67x.

<details><summary>Answer</summary>

**Correct: B.** Expected tokens per round: `(1 − 0.6⁴) / (1 − 0.6) = (1 − 0.1296) / 0.4 ≈ 2.176`. Round cost: `1 + 3 × (1/6) = 1.5`. Speedup: `2.176 / 1.5 ≈ 1.45x` — a real but modest win, exactly the kind of result [speculative decoding: an acceptance walkthrough](/learn/llm-foundations/speculative-decoding-acceptance-walkthrough) works through for several acceptance rates. **A** inverts the ratio (computing round cost ÷ tokens instead of tokens ÷ round cost) — a common arithmetic slip, not a different model of the mechanism. **C** is the expected-tokens-per-round figure on its own, `2.176`, with the division by round cost skipped entirely — a real number in the calculation, but not the speedup, since it ignores that the draft steps aren't free. **D** assumes perfect acceptance (`p̄ = 1`, giving exactly `k+1 = 4` tokens every round) and divides by the correct round cost of 1.5 — but the question specifies `p̄ = 0.6`, not certainty, and plugging in the wrong acceptance rate is exactly the mistake that erases a speculative decoding deployment's real-world gain relative to its optimistic estimate.

</details>

## 6. What GPTQ actually adds over naive 4-bit rounding

A 7B-parameter model stored in fp16 (2 bytes/parameter) takes about 14 GB. Which statement about quantizing it to INT4 with GPTQ is correct?

- **A.** INT4 uses 4 bytes per parameter, so memory would actually increase to 28 GB.
- **B.** GPTQ's main contribution is choosing each weight's rounded value while compensating for the rounding error already introduced by previously-quantized weights in the same layer, rather than rounding every weight independently.
- **C.** GPTQ retrains the entire model from scratch at 4-bit precision to recover lost quality.
- **D.** INT4 quantization requires no calibration data at all, unlike INT8.

<details><summary>Answer</summary>

**Correct: B.** As [quantization and inference serving](/learn/llm-foundations/quantization-and-inference-serving) covers, this error-compensation scheme — using an approximation of the layer's loss curvature to decide which weights can absorb rounding error most cheaply, and adjusting remaining weights to compensate — is specifically what makes 4-bit precision practical; naive independent rounding at 4 bits degrades quality far more. **A** confuses bits with bytes: "4-bit" means 0.5 bytes per parameter, a quarter of fp16's 2 bytes, so the model shrinks to roughly 3.5 GB — the opposite direction from this answer's claim. **C** is a real quality-recovery method for some other techniques, but not this one — GPTQ is explicitly a post-training method precisely because it avoids the cost of full retraining. **D** is backwards — GPTQ requires a calibration dataset to compute its layer-wise error compensation, if anything a more involved calibration process than INT8's single scale-factor pass, not a lighter one.

</details>

If any of these took more than one pass, the fix isn't memorizing these six answers — it's going back to whichever lesson the explanation pointed at and re-deriving the number yourself. [From logits to a chosen token](/learn/llm-foundations/from-logits-to-a-chosen-token) is the place in this module built specifically for that kind of hands-on re-derivation.

**Related:** [From Logits to a Chosen Token](/learn/llm-foundations/from-logits-to-a-chosen-token) · [The KV Cache: What It Is and Why It Exists](/learn/llm-foundations/the-kv-cache-what-and-why) · [Prefill vs Decode: Why Inference Is Memory-Bound](/learn/llm-foundations/prefill-vs-decode-memory-bound) · [The Lost-in-the-Middle Effect](/learn/llm-foundations/the-lost-in-the-middle-effect) · [Speculative Decoding: An Acceptance Walkthrough](/learn/llm-foundations/speculative-decoding-acceptance-walkthrough) · [Quantization and Inference Serving](/learn/llm-foundations/quantization-and-inference-serving)
