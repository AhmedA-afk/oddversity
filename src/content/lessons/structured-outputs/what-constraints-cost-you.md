---
title: "The Cost of Constraints"
track: "structured-outputs"
status: live
summary: "Constrained decoding isn't free: a compile step, a per-token masking tax, and sometimes a smaller usable output space. Here's where each cost actually comes from."
duration: "6 min read"
---

"Just constrain it" is a one-line decision with three separate costs hiding behind it, and each one behaves differently depending on what you're doing.

## What it is

Constrained decoding spends compute in three distinct places, and conflating them is how "it's basically free" and "it's way too slow" end up being said about the same feature by different people looking at different parts of it:

1. **Grammar compilation** — turning your schema or grammar into the automaton the masker will walk.
2. **Per-token masking overhead** — the extra work done at every single generation step to compute (or look up) which tokens are legal next.
3. **Sampling-quality effects** — not a latency cost, but a *quality* cost: forcing tokens the model wouldn't naturally pick can occasionally produce worse output, covered in full in [When Tight Constraints Hurt Reasoning](/learn/structured-outputs/constraints-and-model-quality-interaction).

## The mental model

Think of compilation as building a lookup table once, and masking as consulting it thousands of times. A complex grammar (deep nesting, many branches, long enums) makes the *table* bigger and slower to build — a one-time cost you pay before the first token comes out. Masking is a cost you pay at *every* token regardless of grammar complexity, because the engine has to consult the current state at every step even when the state only allows one obvious next move.

## Why the numbers vary so much

**Compilation time** scales with grammar complexity, not with prompt length. A flat schema with a handful of string and number fields compiles into a small automaton almost instantly. A deeply nested schema, a schema with several large enums, or a hand-written recursive grammar (a SQL subset, say) can take noticeably longer to compile the first time, because the compiler is enumerating more states and, for token-level engines, working out which vocabulary tokens are valid from each of them. This is exactly why libraries like Outlines build and cache that per-grammar index: pay the compile cost once, reuse the cached automaton on every subsequent call with the *same* schema. If your schema changes on every request — dynamically generated per user, say — you're paying the compile cost every time, which is the single biggest lever you control here: keep schemas stable and reusable, and this cost amortizes to near-zero.

**Per-token masking overhead** is smaller and more consistent, but it's not zero, because it runs on every token of every response regardless of grammar size. At minimum it's a lookup or a small scan over the vocabulary to zero out illegal logits before sampling; some engines optimize this to a near-constant-time table lookup per state (the precomputed-index approach from [How Constrained Decoding Masks Tokens](/learn/structured-outputs/constrained-decoding-mechanics-deep-dive)), others recompute more per step. The practical upshot: expect a small, roughly per-token overhead layered on top of ordinary generation cost, not a rewrite of the model's own forward-pass latency — but "small per token" still adds up across a long response, so throughput-sensitive, high-volume routes are exactly where it's worth measuring rather than assuming.

**Reduced sampling freedom** isn't a latency number at all — it's a quality tradeoff. A tightly constrained grammar removes tokens the model's own distribution might have ranked highly, and in the rare case where the "natural" continuation was actually informative, forcing a different one can hurt. This shows up as an accuracy cost, not a speed cost, and is worth measuring separately from latency.

## A concrete way to reason about it

Say a request needs a 200-token structured response. If per-token masking overhead is a fixed small tax `t` per token, the total added latency is roughly `200 × t` — linear in output length, not in prompt length. Compilation, by contrast, is a one-time cost `c` paid once per *distinct schema*, amortized across every request that reuses it: with `N` requests against the same cached schema, the per-request compilation cost is `c / N`, which trends toward negligible as `N` grows. This is the arithmetic that makes "compile once, reuse often" the practical guidance — a schema you invoke once per session behaves very differently, cost-wise, than one invoked per user-generated field.

## Where to feel this in practice

- **First call after a schema changes** is the slowest call you'll see from this mechanism — that's compilation, not a fluke.
- **Long structured outputs at high request volume** are where per-token overhead is worth benchmarking directly against your own provider and model, rather than assumed away — the actual magnitude depends on engine, grammar complexity, and whether the constraint is hosted (their infrastructure absorbs the compile/cache cost) or self-run (you own it).
- **A schema regenerated per request** (built dynamically from user input, say) forfeits the amortization that makes compilation cheap — this is worth flagging explicitly if you see it in your own code.

## Watch out for

- **Assuming constrained decoding is "free" because a provider's API makes it look like one parameter.** The cost didn't disappear — it moved onto infrastructure you're not looking at, and it still shows up in latency under load.
- **Blaming "constrained decoding is slow" on a single bad measurement taken right after a schema change.** That's compilation, a one-time tax; re-measure on a warm cache before drawing a conclusion about steady-state cost.
- **Optimizing latency while ignoring the quality cost.** A cheap-and-fast tight constraint that quietly degrades accuracy on hard tasks is not actually a win — see the next lesson for exactly when that trade bites.

**Related:** [How Constrained Decoding Masks Tokens](/learn/structured-outputs/constrained-decoding-mechanics-deep-dive), [When Tight Constraints Hurt Reasoning](/learn/structured-outputs/constraints-and-model-quality-interaction), [Decoding Mechanisms Cheatsheet](/learn/structured-outputs/decoding-mechanisms-cheatsheet)
