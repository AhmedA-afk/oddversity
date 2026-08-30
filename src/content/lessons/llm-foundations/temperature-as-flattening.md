---
title: "Temperature as Flattening the Distribution"
track: "llm-foundations"
status: live
summary: "Temperature never changes which token is most likely — only how much more likely it is than everything else."
duration: "6 min read"
---

The name "temperature" isn't a marketing metaphor — it's borrowed directly from statistical mechanics, where raising a system's temperature makes its particles occupy more states more evenly. Softmax with a temperature term is the same equation physicists use for the Boltzmann distribution. Turning it up genuinely does make a probability distribution behave like a hotter, more agitated system.

## One analogy: a spotlight becoming a floodlight

Picture the model's belief about the next token as light cast on a wall of candidate words. At low temperature, it's a tight spotlight — nearly all the light lands on one or two words, everything else is barely lit. At `T = 1`, it's the light the model actually calculated, unmodified. Crank the temperature up and the beam widens into a floodlight — light spreads out across far more of the wall, and words that were previously in near-darkness get a real, visible share.

Critically, the floodlight doesn't move. It doesn't shine brightest on a different word than the spotlight did — it just stops being so exclusively concentrated on the brightest one.

## Walk it through the numbers

Take the logits from [from logits to a chosen token](/learn/llm-foundations/from-logits-to-a-chosen-token) — a model finishing "The chef added a pinch of":

| Token | Logit |
|---|---|
| salt | 4.0 |
| pepper | 3.0 |
| sugar | 2.0 |
| garlic | 1.0 |
| cinnamon | 0.5 |
| love | 0.0 |
| the | -1.0 |
| xylophone | -6.0 |

**At `T = 0.5`** (divide logits by 0.5, i.e. double them, then softmax):

| Token | Probability |
|---|---|
| salt | 0.864 |
| pepper | 0.117 |
| sugar | 0.016 |
| garlic | 0.002 |
| everything else | ~0.001 combined |

**At `T = 1.0`** (unchanged):

| Token | Probability |
|---|---|
| salt | 0.622 |
| pepper | 0.229 |
| sugar | 0.084 |
| garlic | 0.031 |
| everything else | ~0.034 combined |

**At `T = 2.0`** (divide logits by 2, then softmax):

| Token | Probability |
|---|---|
| salt | 0.385 |
| pepper | 0.234 |
| sugar | 0.142 |
| garlic | 0.086 |
| everything else | ~0.153 combined |

Look at what's constant across all three columns: `salt > pepper > sugar > garlic > ... > xylophone`, every time, in that exact order. That ranking never moves. What moves is the *gap* — salt outpolls pepper by 7.4x at `T = 0.5`, by 2.7x at `T = 1.0`, and by only 1.6x at `T = 2.0`. The floodlight metaphor is literal: the same words are lit in the same relative order, just with the contrast dialed up or down.

**When low temperature helps:** extraction, code generation, arithmetic, anything with a single defensible right answer — you want the model committing hard to its best guess, not occasionally wandering into its 5th-best guess. **When higher temperature helps:** brainstorming, creative writing, generating diverse options for a downstream reranker — you want the 2nd- and 3rd-best guesses to have a real shot, because "best" is a matter of taste, not correctness. This is the same practical split [sampling: temperature, top-k, and top-p](/learn/llm-foundations/sampling-temperature-top-p) recommends, now with the arithmetic behind why it works.

## The wrong intuition, corrected

The common wrong intuition: "raising the temperature could make the model change its mind about which token is best — pick pepper instead of salt if you turn it up enough." It feels plausible because higher temperature clearly makes output more varied, and "more varied" sounds like it should include "sometimes disagreeing about the top choice."

It's wrong because of a property of the softmax function itself: dividing every logit by the same positive number `T` is a **monotonic transformation** — it preserves order. If `logit(salt) > logit(pepper)` before dividing by `T`, then `logit(salt)/T > logit(pepper)/T` after, for any `T > 0`. Softmax itself is also order-preserving (it's just an increasing function of each input). So the *rank order* of every token's probability is fixed the instant the logits come out of the model — temperature can never change it, at any positive value.

What temperature actually changes is entropy: how *spread out* the probability mass is across that fixed ranking. This is exactly the quantity [entropy and uncertainty](/learn/maths-foundations/entropy-and-uncertainty) formalizes — low temperature produces low-entropy distributions (concentrated, closer to certain), high temperature produces high-entropy ones (closer to uniform). Notice one direct consequence: **greedy decoding is completely unaffected by temperature.** Greedy always takes `argmax`, and argmax of a monotonically-transformed vector is identical to argmax of the original — so if you're not sampling at all, temperature is a no-op you can delete from your request.

## When the analogy breaks

The spotlight-to-floodlight picture holds well across ordinary temperature ranges, but it strains at the extremes.

**As `T → 0`**, the "spotlight" doesn't just narrow — it converges to a single point of light with probability 1, and everything else drops to exactly 0. This is identical to greedy decoding, and it's a real discontinuity: infinitesimally above `T = 0` you still have a (vanishingly small) chance of any token; at the limit, you have none. In practice, `T = 0` is often implemented as a special case that just runs argmax directly, not as softmax with a literal zero denominator — dividing logits by 0 is undefined, and most libraries either error or silently substitute greedy decoding.

**As `T → ∞`**, the floodlight doesn't just widen — it flattens completely into a uniform distribution, where every token in the vocabulary is equally likely regardless of what the logits actually said. At that point the model's entire forward pass has been discarded; you're sampling uniformly from the vocabulary, logits and all, which is a very different failure mode from "creative" — it's noise.

**The metaphor also doesn't capture what temperature can't fix.** No matter how you set `T`, the full vocabulary is still in play — a token with a logit of `-6.0`, however dim, is never literally impossible, just dim. That's the gap [greedy, beam, nucleus, and min-p decoding](/learn/llm-foundations/greedy-beam-sampling-min-p) picks up: filtering methods like top-p physically remove candidates rather than merely dimming them, which is a different kind of control that temperature alone cannot provide.

**Related:** [Sampling: Temperature, Top-k, and Top-p](/learn/llm-foundations/sampling-temperature-top-p) · [From Logits to a Chosen Token](/learn/llm-foundations/from-logits-to-a-chosen-token) · [Implement Temperature, Top-k, and Top-p](/learn/llm-foundations/implement-temperature-top-k-top-p) · [Entropy and Uncertainty](/learn/maths-foundations/entropy-and-uncertainty) · [Greedy, Beam, Nucleus, and Min-p Decoding](/learn/llm-foundations/greedy-beam-sampling-min-p) · [Logits to Probabilities, by Hand](/learn/llm-foundations/logits-to-probabilities-by-hand)
