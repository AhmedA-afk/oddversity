---
title: "Speculative Decoding Mechanics"
track: "llm-foundations"
status: live
summary: "The exact accept/reject rule that lets a cheap draft model's guesses through without ever changing what the target model would have said."
duration: "7 min read"
---

[Speculative decoding](/learn/llm-foundations/speculative-decoding) explains the headline idea: a small draft model guesses ahead, a large target model checks the guesses in one pass. This lesson is about the one detail that makes the whole technique trustworthy rather than a lossy shortcut — the precise rule that decides what gets kept.

## What it is

Speculative decoding pairs a cheap draft model (distribution `q`) with the expensive target model you actually want output from (distribution `p`). The draft proposes a short run of tokens, sampling each one from its own distribution `q`. The target model then runs a single forward pass over the entire proposed run at once — computing its own distribution `p` at every one of those positions in parallel — and applies an acceptance rule, token by token, that decides how much of the draft's run survives.

## The mental model

Think of the draft model as an intern drafting several paragraphs of a report and the target model as the editor who reviews the whole draft in one sitting rather than approving it sentence by sentence in real time. The editor doesn't rewrite everything from scratch — that would waste the intern's correct work. Instead, the editor reads through, keeps every sentence that holds up, and the moment one doesn't, stops there, fixes just that one, and hands the correction back rather than reading (or trusting) anything the intern wrote after the point where they went wrong. Critically, the editor's standard for "holds up" isn't "good enough" — it's a specific, calibrated rule that guarantees the final report reads exactly as if the editor had written every sentence themselves from the start.

## Why it works this way

The core requirement speculative decoding has to satisfy is that the final output token, at every position, is distributed exactly according to the target model's own distribution `p` — not `q`, not some blend of the two, not "close enough." That guarantee is what separates this from a quality-for-speed tradeoff.

The rule that achieves it: for a token `x` the draft proposed by sampling from `q(x)`, accept it with probability:

```text
accept(x) = min(1, p(x) / q(x))
```

If `p(x) ≥ q(x)` — the target agrees this token was at least as likely as the draft thought — accept it outright (probability 1). If `p(x) < q(x)` — the target thinks the draft overrated this token — accept it only with probability `p(x)/q(x)`, and reject it the rest of the time.

If a token is rejected, you don't just fall back to greedy or discard the position — you resample it from a specific corrected distribution:

```text
p'(x) = normalize(max(0, p(x) - q(x)))
```

This takes exactly the probability mass where the target disagreed with the draft (where `p` exceeded `q`) and turns it into a fresh distribution to draw from. The reason this specific correction is necessary, not just convenient: the accept rule above already "used up" agreement between `p` and `q` wherever they overlapped, so whatever's left over — the part of `p`'s mass the draft under-weighted — is exactly what a correct resample needs to draw from to make the combined accept-then-resample process land on `p` overall, not on some mixture biased by the draft's own opinions. This is a known result from rejection sampling: accept-with-`min(1, p/q)` paired with resample-from-`max(0, p-q)` is the specific combination that reconstructs the target distribution `p` exactly, regardless of how good or bad the draft distribution `q` is. A weak draft doesn't corrupt the output — it just gets rejected more often, which is a cost in speed, not correctness.

Whichever draft token is the first to be rejected, everything the draft proposed after it gets discarded too — the draft was building each subsequent guess assuming its own earlier guesses were being kept, and once one is overturned, that assumption is broken.

## A concrete example (shown)

Draft proposes token `x` with `q(x) = 0.4`. The target model, run in parallel over that same position, assigns it `p(x) = 0.4` as well — perfect agreement, `min(1, 0.4/0.4) = 1`, accepted with certainty. Now a second proposed token `y` has `q(y) = 0.5`, but the target only agrees `p(y) = 0.2` — the draft overrated it. Acceptance probability is `min(1, 0.2/0.5) = 0.4`: it survives 40% of the time and gets rejected 60% of the time. On rejection, the replacement token is drawn from `max(0, p - q)` computed across the whole vocabulary at that position — concentrating specifically on tokens the target favored more than the draft did, not a uniform re-roll. [Speculative decoding: an acceptance walkthrough](/learn/llm-foundations/speculative-decoding-acceptance-walkthrough) carries this exact mechanism through a full multi-token proposal and turns the acceptance rate into an actual speedup number.

## Where it shows up

Production inference stacks serving latency-sensitive traffic use this as a standard lever alongside [the KV cache](/learn/llm-foundations/the-kv-cache-what-and-why) and quantization — see [quantization and inference serving](/learn/llm-foundations/quantization-and-inference-serving) for how it fits alongside those other techniques. It composes cleanly with greedy decoding too: at `T = 0`, the accept rule simplifies to "accept only if the draft's token is exactly what the target's own argmax would have picked," which is the deterministic special case of the same general rule.

## Watch out for

- **Assuming any two models can be paired as draft and target.** A draft that's a poor stylistic match — different tokenizer, very different training distribution — gets rejected constantly, and the guarantee of correctness still holds, but the speedup evaporates because so little survives verification.
- **Forgetting rejection cascades.** One rejected token invalidates every proposed token after it in that round, even ones that might have been individually fine — the draft's proposal for token `k+2` was built assuming its guess for token `k+1` was accepted.
- **Treating the resample step as an afterthought.** Skipping the `max(0, p - q)` correction and just falling back to sampling from `p` alone after a rejection seems harmless but subtly biases the output, because it double-counts the probability mass where `p` and `q` already agreed.

## Where next

[Speculative decoding: an acceptance walkthrough](/learn/llm-foundations/speculative-decoding-acceptance-walkthrough) turns this rule into an actual number — expected tokens per round, and the speedup that number implies, including the case where a weak or slow draft makes things worse, not better.

**Related:** [Speculative Decoding: Generating Tokens Faster](/learn/llm-foundations/speculative-decoding) · [Speculative Decoding: An Acceptance Walkthrough](/learn/llm-foundations/speculative-decoding-acceptance-walkthrough) · [The KV Cache: What It Is and Why It Exists](/learn/llm-foundations/the-kv-cache-what-and-why) · [Sampling: Temperature, Top-k, and Top-p](/learn/llm-foundations/sampling-temperature-top-p) · [Quantization and Inference Serving](/learn/llm-foundations/quantization-and-inference-serving) · [Prefill vs Decode: Why Inference Is Memory-Bound](/learn/llm-foundations/prefill-vs-decode-memory-bound)
