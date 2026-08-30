---
title: "From Logits to a Chosen Token"
track: "llm-foundations"
status: live
summary: "Decoding is a four-stage pipeline — scale, filter, renormalize, sample — and each stage exists to fix a specific problem with the one before it."
duration: "7 min read"
---

The forward pass ends with one number per vocabulary entry — a logit. Turning that vector into an actual next token is a separate, deliberate pipeline, and every knob you've heard of (temperature, top-k, top-p) is just one named stage in it.

## What it is

A model's [unembedding layer](/learn/llm-foundations/the-vocabulary-and-the-unembedding) produces one raw score per vocabulary entry — tens of thousands of unbounded real numbers called logits. Decoding is the fixed sequence of operations that turns that vector into a single chosen token id:

1. **Scale** the logits by temperature.
2. **Filter** the candidate set (top-k and/or top-p).
3. **Renormalize** the surviving scores back into a valid probability distribution.
4. **Sample** one token from what's left.

Every production API parameter you can set — `temperature`, `top_p`, `top_k` — is a dial on one specific stage of this pipeline, applied in this order, every single step, for every single token generated.

## The mental model

Think of it as a funnel with a valve at the top and a lottery at the bottom. The logits enter at the top as a wide, uneven spread of scores. Temperature is the valve that decides how much that spread gets exaggerated or smoothed before anything else happens. Top-k and top-p are a coarse filter partway down — they physically remove the tokens you've decided are too unlikely to be worth considering at all, whatever their exact probability. Renormalization is just bookkeeping: once you've thrown candidates away, what's left needs to sum back to 1 to be a valid distribution again. Sampling is the lottery draw at the bottom — one token wins, weighted by its (renormalized) probability.

The order matters. Filtering happens *after* temperature scaling, not before — because filtering decisions (which tokens are "in the top-k" or "in the top-p mass") depend on the reshaped distribution, not the raw one. Get the order backwards in your own code and top-p will compute cumulative mass over the wrong shape entirely.

## Why it works this way

Each stage exists to patch a specific failure of the stage before it:

- **Raw logits aren't probabilities.** They're unbounded (`-∞` to `+∞`) and don't sum to anything meaningful. [Softmax](/learn/llm-foundations/logits-to-probabilities-by-hand) is what turns them into a distribution, and temperature is nothing more than a knob inserted before that softmax: divide every logit by `T` first, then apply softmax as usual. At `T = 1` this changes nothing; away from 1 it reshapes how sharply probability mass concentrates on the top candidates. See [temperature as flattening](/learn/llm-foundations/temperature-as-flattening) for exactly what that reshaping looks like.
- **Softmax alone still touches every token, forever.** Even a token with 0.001% probability will occasionally get sampled, and over a long enough generation, occasionally is often enough to matter. Left alone, temperature can make bad tokens more likely to survive (raise it enough and the tail fattens) but it never removes them outright.
- **Filtering fixes that by deleting the tail.** Top-k keeps a fixed count of the highest-scoring tokens; top-p keeps the smallest set whose cumulative probability clears a threshold. Either way, everything outside that set gets its probability set to zero — permanently excluded from this step's draw, not just made less likely.
- **Renormalization is required, not optional.** After you zero out most of the vocabulary, the surviving probabilities no longer sum to 1. Sampling from an un-renormalized distribution isn't just sloppy — most sampling implementations (`np.random.choice`, categorical samplers) require probabilities that sum to 1, or the draw is subtly biased toward whichever elements happen to be first.
- **Sampling, finally, is the only place randomness enters.** Everything upstream is deterministic given the logits and the settings. The dice roll happens exactly once, at the very last stage.

## A concrete example (shown)

Say the model is completing "The chef added a pinch of" and its logits over eight relevant vocabulary entries are:

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

**Stage 1 — scale by temperature.** At `T = 1`, nothing changes yet; the raw logits pass through untouched (that's the whole point of `T = 1` as a baseline — see [temperature as flattening](/learn/llm-foundations/temperature-as-flattening) for what changing it does to this exact table).

**Stage 2 — softmax to get a distribution.** Exponentiating and normalizing (`exp(logit) / sum(exp(all logits))`) gives:

| Token | Probability |
|---|---|
| salt | 0.622 |
| pepper | 0.229 |
| sugar | 0.084 |
| garlic | 0.031 |
| cinnamon | 0.019 |
| love | 0.011 |
| the | 0.004 |
| xylophone | 0.00003 |

**Stage 3 — filter.** Apply top-p at `p = 0.9`: walk down the sorted list adding probability until the running total clears 0.9. `salt` (0.622) + `pepper` (0.229) = 0.851, still under 0.9; add `sugar` (0.084) to reach 0.935, which clears it. Keep exactly those three tokens, zero out the other five.

**Stage 4 — renormalize and sample.** The kept probabilities (0.622, 0.229, 0.084) sum to 0.935, not 1 — divide each by 0.935 to get 0.665, 0.245, 0.090, which do sum to 1. Now draw: `salt` wins about two-thirds of the time, `pepper` about a quarter, `sugar` about one time in eleven, and nothing else can ever be chosen at this step.

This is exactly the pipeline behind the settings on [sampling: temperature, top-k, and top-p](/learn/llm-foundations/sampling-temperature-top-p) — that page covers what each knob is for; this one is about the fixed order they execute in and why that order is load-bearing. [Implement temperature, top-k, and top-p](/learn/llm-foundations/implement-temperature-top-k-top-p) builds exactly this pipeline in code, filter by filter, over this same logit vector.

## Where it shows up

Every text generation call to every LLM API runs this pipeline, once per output token, whether or not you ever touch the parameters yourself — defaults just mean someone else picked the temperature and top-p for you. It's also the exact mechanism repetition penalties and constrained decoding hook into elsewhere in this module: those techniques work by adjusting logits *before* stage 1, or by masking candidates during stage 2, riding the same pipeline rather than replacing it.

## Watch out for

- **Assuming a "probability" from an API is the model's raw confidence.** By the time you see it, it's already been through temperature scaling and filtering — it reflects your request's settings as much as the model's own belief.
- **Setting top-k and top-p together without realizing they compose.** Both filters can apply in sequence (implementation-dependent, but common); if top-k=5 already cut the field down, a generous top-p on top of it does nothing, because there's nothing left to include.
- **Forgetting renormalization changes relative odds among survivors.** The three tokens above keep their *relative* order and rough proportions, but their absolute probabilities all shift upward once the excluded 6.5% of mass is redistributed among them.

## Where next

[Implement temperature, top-k, and top-p](/learn/llm-foundations/implement-temperature-top-k-top-p) turns every stage above into runnable numpy over this same vocabulary. [Temperature as flattening](/learn/llm-foundations/temperature-as-flattening) zooms into stage 1 alone, and the rest of this module surveys alternative ways to run stages 3 and 4, and what comes after sampling.

**Related:** [Sampling: Temperature, Top-k, and Top-p](/learn/llm-foundations/sampling-temperature-top-p) · [Logits to Probabilities, by Hand](/learn/llm-foundations/logits-to-probabilities-by-hand) · [The Vocabulary and the Unembedding](/learn/llm-foundations/the-vocabulary-and-the-unembedding) · [Next-Token Prediction](/learn/llm-foundations/next-token-prediction) · [Implement Temperature, Top-k, and Top-p](/learn/llm-foundations/implement-temperature-top-k-top-p) · [Temperature as Flattening the Distribution](/learn/llm-foundations/temperature-as-flattening)
