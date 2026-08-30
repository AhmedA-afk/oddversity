---
title: "Greedy, Beam, Nucleus, and Min-p Decoding"
track: "llm-foundations"
status: live
summary: "Five ways to turn a probability distribution into a token, compared on determinism, diversity, and what they actually cost to run."
duration: "10 min read"
---

"Decoding strategy" and "sampling parameter" get used almost interchangeably, but they're different layers of the same pipeline: temperature reshapes the distribution, these five strategies decide how you actually pick a token (or a sequence of tokens) from it.

## Greedy decoding

**How it works.** At every step, take `argmax` — the single highest-probability token — no randomness, no filtering, no temperature effect at all (as covered in [temperature as flattening](/learn/llm-foundations/temperature-as-flattening), argmax is invariant to temperature since it only reorders by rank, and temperature never changes rank).

**When it wins.** Anywhere reproducibility matters more than variety: deterministic testing, debugging a prompt, or a narrow extraction task where there's genuinely one right token most of the time.

**Failure mode.** Repetition loops. Once greedy locks onto a phrase, the highest-probability continuation of a repeated phrase is often the same phrase again — nothing in the algorithm has a mechanism to notice or escape a loop, because each step only ever looks at the immediate next-token distribution, never the history of its own choices. See [sampling parameter mistakes](/learn/llm-foundations/sampling-parameter-mistakes) for exactly how this shows up in practice.

**Relative cost.** Cheapest possible — one `argmax` per step, no extra bookkeeping.

## Beam search

**How it works.** Instead of committing to one token per step, keep the top `B` partial sequences ("beams") ranked by their cumulative log-probability. At each step, expand every beam by every plausible next token, then prune back down to the top `B` sequences overall. At the end, return the highest-scoring complete sequence.

**When it wins.** Tasks with one target output and a real notion of "best complete sequence" — historically, machine translation, where a sentence has (roughly) one correct meaning to convey and you want the single most probable full translation, not a sample from many plausible ones.

**Failure mode.** Beam search optimizes for the single most probable *sequence*, which in open-ended generation tends to be bland, generic, repetitive text — the token-by-token equivalent of picking the safest word every time, compounded across many tokens. It also doesn't fix greedy's looping tendency; it just does it with `B` candidates instead of one, and it's markedly more expensive for text where there's no single "correct" continuation to converge toward. This is the direct reason open-ended chat rarely uses beam search: a chatbot answer isn't a translation with one right target, it's one plausible answer among many, and beam search's whole design is built around chasing a single best sequence that doesn't really exist for that kind of task.

**Relative cost.** `B` times the forward-pass work of greedy at every step (score `B` beams × vocabulary-many candidate expansions, then prune), and none of it caches as cleanly as a single autoregressive stream — juggling multiple divergent sequences complicates KV-cache reuse relative to decoding one at a time.

## Nucleus (top-p) sampling

**How it works.** Keep the smallest set of tokens whose cumulative probability clears a threshold `p`, renormalize, sample from that set — full mechanics and a worked example in [implement temperature, top-k, and top-p](/learn/llm-foundations/implement-temperature-top-k-top-p).

**When it wins.** The default for open-ended generation precisely because the candidate set adapts to the model's confidence: a two-token set when the model is sure, a wide set when it's genuinely uncertain. That adaptivity is what fixed top-k's core weakness.

**Failure mode.** On a moderately flat distribution, top-p can still admit a long tail of low-individual-probability tokens if enough of them are needed to clear the threshold — cumulative mass hitting 90% doesn't guarantee every individual survivor is a *good* option, just that collectively they account for most of the belief. It's also sensitive to `p` in a way that isn't always intuitive: 0.9 versus 0.95 can be the difference between 3 candidates and 8 on a sharp distribution.

**Relative cost.** One sort and one cumulative sum over the vocabulary per step — negligible next to the forward pass itself.

## Min-p sampling

**How it works.** Instead of a cumulative-probability threshold, set a *relative* floor tied to the top token's own probability: keep any token whose probability is at least `min_p × p_max`, where `p_max` is the top token's probability. When the model is very confident (`p_max` close to 1), the floor is high and the set stays tight. When the model is uncertain (`p_max` is low, say 0.15), the floor drops proportionally and more tokens qualify.

**When it wins.** At higher temperatures, where top-p can struggle: raising temperature flattens the distribution, which can push top-p's fixed cumulative threshold into admitting a very large, noisy candidate set. Min-p's threshold scales with the top token's own probability, so it tends to stay more proportionate to the model's actual confidence even as temperature rises — a useful pairing with the "higher temperature for creativity" advice from [temperature as flattening](/learn/llm-foundations/temperature-as-flattening), since it stops that flattening from admitting near-random garbage into the candidate pool.

**Failure mode.** It's newer and less universally supported across inference APIs than top-p, and the right `min_p` value isn't as widely established or intuitive as "0.9 or 0.95" is for top-p — you're more likely to be tuning it from scratch for your use case.

**Relative cost.** Essentially identical to top-p — one pass to find the max, one comparison per token.

## Typical sampling

**How it works.** Rather than chasing the highest-probability tokens at all, typical sampling keeps tokens whose *information content* (`-log(probability)`) is closest to the distribution's expected information content — its entropy (see [entropy and uncertainty](/learn/maths-foundations/entropy-and-uncertainty) for the underlying quantity). This deliberately excludes both the single most probable token, if it's an outlier of low surprise, and the deep tail of highly surprising tokens, aiming for what a "typical" draw from the distribution would look like rather than the most confident one.

**When it wins.** Text generation where you specifically want to avoid the generic, most-predictable phrasing that top-p and even mild temperature increases still favor most of the time — cases where "the obvious next word" is exactly what you're trying not to produce.

**Failure mode.** It's the least intuitive of the five to reason about — "closest to expected information content" doesn't map onto a simple mental picture the way "top few tokens" or "top cumulative mass" does — and it's the least commonly exposed as a first-class parameter in production APIs, so you're more likely to need custom logit processing to use it at all.

**Relative cost.** Requires computing the full distribution's entropy every step (an extra pass over the vocabulary beyond what top-p needs), still trivial next to the forward pass.

## Decision table

| Approach | Best when | Avoid when | Relative cost |
|---|---|---|---|
| Greedy | Reproducibility, extraction, debugging a prompt | Open-ended generation of any length | Lowest |
| Beam search | A single correct target output exists (classic MT) | Open-ended chat, creative writing | High (×B beams) |
| Nucleus (top-p) | General-purpose open-ended generation | You need it paired thoughtfully with temperature, not on its own | Low |
| Min-p | High temperature, want confidence-proportional filtering | Your stack doesn't expose it; you want a well-trodden default | Low |
| Typical sampling | Explicitly want to avoid the most predictable phrasing | You want a simple, well-understood default | Low-moderate |

## How to choose

1. **Do you need the exact same output every time?** Greedy. Nothing else is deterministic.
2. **Is there one demonstrably correct target sequence, not a range of acceptable ones?** Beam search is worth its cost here — but recognize that most LLM use cases (chat, drafting, summarizing) don't actually have this property, even though it feels intuitive that "the best answer" should exist.
3. **Open-ended generation, no established reason to deviate?** Top-p (nucleus) paired with a moderate temperature is the standard default for good reason — it's well-understood, well-supported everywhere, and works.
4. **Running hot (temperature well above 1) and top-p feels noisy?** Try min-p — it's built for exactly this interaction.
5. **Specifically fighting generic, predictable output even at reasonable temperature?** Typical sampling is the one strategy actually designed to filter out "obvious" tokens rather than just "unlikely" ones — worth reaching for once top-p and temperature tuning have plateaued.

None of these strategies fix a distribution that's badly shaped to begin with — a model repeating itself because of context, not decoding, needs [repetition penalties](/learn/llm-foundations/repetition-penalties-and-constrained-decoding), not a different sampling strategy. And whichever one you pick, [sampling parameter mistakes](/learn/llm-foundations/sampling-parameter-mistakes) covers the ways people misconfigure even the right strategy.

**Related:** [Implement Temperature, Top-k, and Top-p](/learn/llm-foundations/implement-temperature-top-k-top-p) · [Temperature as Flattening the Distribution](/learn/llm-foundations/temperature-as-flattening) · [Sampling: Temperature, Top-k, and Top-p](/learn/llm-foundations/sampling-temperature-top-p) · [Sampling Parameter Mistakes](/learn/llm-foundations/sampling-parameter-mistakes) · [Repetition Penalties and Constrained Decoding](/learn/llm-foundations/repetition-penalties-and-constrained-decoding) · [Entropy and Uncertainty](/learn/maths-foundations/entropy-and-uncertainty)
