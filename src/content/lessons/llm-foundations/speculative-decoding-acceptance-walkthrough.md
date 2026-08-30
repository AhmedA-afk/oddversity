---
title: "Speculative Decoding: An Acceptance Walkthrough"
track: "llm-foundations"
status: live
summary: "One round of draft-then-verify, then the formula that turns an acceptance rate into a speedup — and two ways that speedup turns negative."
duration: "8 min read"
---

The accept/reject rule from [speculative decoding mechanics](/learn/llm-foundations/speculative-decoding-mechanics) is easy to state and easy to under-appreciate until you run one round through by hand and watch a real acceptance rate turn into a real (or negative) speedup number.

## The setup

The target model is generating a continuation of "The quick," and a draft model proposes 4 tokens ahead: `["brown", "fox", "jumps", "high"]`. The target then runs one forward pass verifying all 4 positions in parallel, producing its own probability for each proposed token at each position — everything needed to apply the accept rule from [speculative decoding mechanics](/learn/llm-foundations/speculative-decoding-mechanics): accept with probability `min(1, p(x)/q(x))`, and on rejection, resample from `max(0, p(x) - q(x))`.

## Step by step

### Step 1 — one concrete round, position by position

```python
draft_tokens = ["brown", "fox", "jumps", "high"]
q = [0.60, 0.50, 0.40, 0.50]   # draft's own probability for its proposed token, per position
p = [0.70, 0.55, 0.35, 0.10]   # target's probability for that same token, per position

accept_prob = [min(1.0, pi / qi) for pi, qi in zip(p, q)]
print(list(zip(draft_tokens, accept_prob)))
```

```text
[('brown', 1.0), ('fox', 1.0), ('jumps', 0.875), ('high', 0.2)]
```

`brown` and `fox` are accepted outright — the target rated them at least as likely as the draft did, so `min(1, p/q)` saturates at 1. `jumps` survives with 87.5% probability — the target agreed almost as strongly as the draft did. `high` is the weak link: the target only gave it a 10% chance where the draft was 50% confident, so the accept probability drops to `0.1/0.5 = 0.2` — it survives only one time in five.

> **Why this step?** This is the part that's easy to gloss over in the abstract description: acceptance isn't one round-level probability, it's a per-token probability that depends entirely on how much the draft and target agree *at that specific position*. A draft can nail three tokens in a row and still miss the fourth, and nothing about the first three predicts the fourth.

### Step 2 — in this instance, the 4th token gets corrected

Suppose the draw for `high` lands outside its 20% acceptance window — it's rejected. The target now resamples that position from `max(0, p - q)` restricted to the vocabulary, concentrating on tokens the target favored more than the draft did. Say that lands on `over`:

```python
accepted = draft_tokens[:3]                 # brown, fox, jumps — kept
corrected = "over"                          # target's replacement for the rejected 4th token
final_round_output = accepted + [corrected]
print(final_round_output)
```

```text
['brown', 'fox', 'jumps', 'over']
```

Three draft tokens survived, one was corrected, and the draft's own 4th guess (`high`) is discarded entirely — the round produces 4 real tokens (`brown fox jumps over`) from one target forward pass plus 4 cheap draft steps, exactly the "propose 4, accept 3, correct the 4th" pattern this technique is built around.

> **Why this step?** Notice what did *not* happen: the target didn't need a second forward pass to produce the correction. The single verification pass already computed `p` for every position, including the rejected one — the correction is a resample from data the target already had, not an extra round-trip.

### Step 3 — turn one lucky instance into an expected speedup

One round rarely goes exactly "3 accepted, 1 corrected" — acceptance is probabilistic at every position. To estimate speedup in general, simplify with a constant per-token acceptance rate `p̄` (an approximation — real acceptance rates vary token to token, as step 1 showed, but a constant rate is enough to reason about expected speedup). With draft length `k`, the expected number of tokens produced per round is a geometric sum:

```python
def expected_tokens_per_round(p_bar, k):
    return sum(p_bar ** i for i in range(k + 1))   # 1 (the guaranteed correction/bonus) + p + p^2 + ... + p^k

for p_bar in [0.9, 0.75, 0.5, 0.3]:
    print(p_bar, round(expected_tokens_per_round(p_bar, k=4), 3))
```

```text
0.9 4.095
0.75 3.051
0.5 1.938
0.3 1.425
```

Read this as: with a strong draft (`p̄ = 0.9`), a round of proposing 4 tokens produces just over 4 tokens on average. With a mediocre draft (`p̄ = 0.5`), it barely beats 2 tokens per round despite still proposing 4.

Now attach a cost model. A target verification pass costs `1` unit regardless of how many positions it checks — the whole premise of [speculative decoding mechanics](/learn/llm-foundations/speculative-decoding-mechanics) is that checking `k` tokens in parallel costs about the same as generating 1 token normally. Say, illustratively, the draft model costs `c = 1/8` of a target step per token (a stand-in ratio — the real number depends entirely on how much smaller the draft model is):

```python
def speedup(p_bar, k, draft_cost_ratio):
    tokens = expected_tokens_per_round(p_bar, k)
    round_cost = 1 + k * draft_cost_ratio          # 1 target pass + k cheap draft steps
    plain_cost = tokens                             # plain decoding: 1 target pass per token
    return tokens / round_cost

for p_bar in [0.9, 0.75, 0.5, 0.3]:
    print(p_bar, round(speedup(p_bar, k=4, draft_cost_ratio=0.125), 3))
```

```text
0.9 2.73
0.75 2.034
0.5 1.292
0.3 0.95
```

At `p̄ = 0.75` — a solid, unremarkable draft — this illustrative model predicts about a 2x speedup. At `p̄ = 0.3`, the speedup drops below 1.0: **slower than plain decoding**, because most rounds spend the cheap draft steps only to have them rejected, paying for 4 draft tokens' worth of work to keep, on average, less than half of one.

> **Why this step?** This is the number that makes "acceptance rate" a real engineering metric rather than a vague quality descriptor — it's the single input that decides whether speculative decoding is worth deploying at all for a given draft/target pair, everything else held constant.

## Where it breaks (+fix)

**A too-weak draft.** At `p̄ = 0.3` above, speedup is `0.95` — genuinely worse than not using speculative decoding, because the round pays for 4 draft-model calls and gets back less than 1.5 tokens of useful output on average. **Fix:** measure the empirical acceptance rate on representative traffic before committing to a draft model, not just on the easy cases it was picked to look good on — a draft that only agrees with the target on boilerplate will show a misleadingly high acceptance rate if that's mostly what you test it on.

**A too-slow draft.** Keep the good acceptance rate (`p̄ = 0.75`, 3.05 expected tokens per round) but make the draft expensive — say `draft_cost_ratio = 1.0`, meaning the "draft" isn't actually much cheaper than the target per token:

```python
print(speedup(p_bar=0.75, k=4, draft_cost_ratio=1.0))
```

```text
0.610
```

Even with the same strong acceptance rate that produced a 2x speedup before, an expensive draft turns the same round into a net slowdown — `round_cost` grows to `1 + 4×1 = 5` while the tokens produced per round stay at 3.05. **Fix:** the draft's per-token cost relative to the target matters as much as its acceptance rate. A draft that's stylistically excellent but only marginally cheaper than the target model it's meant to accelerate isn't doing its job, regardless of how often its guesses survive verification.

## Takeaways

- Acceptance is per-token, not per-round — a strong run of accepted tokens says nothing about the next one, as step 1 shows directly.
- Expected tokens per round, under a constant-acceptance simplification, is a geometric sum in the acceptance rate — `(1 - p̄^(k+1)) / (1 - p̄)` — which grows toward `k+1` as `p̄` approaches 1 and collapses toward 1 as `p̄` approaches 0.
- Speedup depends on two independent numbers: how often the draft is right (`p̄`) and how cheap the draft is relative to the target (`draft_cost_ratio`). Either one alone being bad is enough to erase the gain or make things worse, as the two failure cases above show separately.
- None of this changes what the final output actually is — every accepted or corrected token in the walkthrough above is exactly as valid as if the target model had generated the whole sequence alone, by the guarantee derived in [speculative decoding mechanics](/learn/llm-foundations/speculative-decoding-mechanics).

**Related:** [Speculative Decoding Mechanics](/learn/llm-foundations/speculative-decoding-mechanics) · [Speculative Decoding: Generating Tokens Faster](/learn/llm-foundations/speculative-decoding) · [Prefill vs Decode: Why Inference Is Memory-Bound](/learn/llm-foundations/prefill-vs-decode-memory-bound) · [Quantization and Inference Serving](/learn/llm-foundations/quantization-and-inference-serving) · [The KV Cache: What It Is and Why It Exists](/learn/llm-foundations/the-kv-cache-what-and-why) · [Sampling: Temperature, Top-k, and Top-p](/learn/llm-foundations/sampling-temperature-top-p)
