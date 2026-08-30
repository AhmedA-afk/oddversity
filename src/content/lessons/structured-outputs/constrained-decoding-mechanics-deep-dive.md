---
title: "How Constrained Decoding Masks Tokens"
track: "structured-outputs"
status: live
summary: "The token-by-token mechanics of logit masking, traced through a hand-drawn state machine, plus the token-vs-character wrinkle that makes it hard."
duration: "8 min read"
---

*This is the deferred rigor behind [Constrained Decoding: How Guaranteed-Valid Output Actually Works](/learn/structured-outputs/constrained-decoding-under-the-hood). Read that first if you haven't — this lesson assumes you already know that masking happens, and goes into how.*

"The constraint engine masks invalid tokens" is a one-sentence summary that hides a genuinely fiddly mechanism. Let's open it up.

## The setup: sampling before and after masking

A model produces one probability distribution over its entire vocabulary at every step — tens of thousands of candidate tokens, each with a logit. Ordinary sampling takes that distribution more or less as-is (maybe reshaped by temperature or top-p) and draws from it. Constrained decoding inserts one step before sampling ever happens: for the current partial output, compute the set of tokens that keep the sequence on a path toward validity, and set every other token's logit to negative infinity. Softmax turns `-inf` into a probability of exactly `0`. Whatever sampling strategy runs afterward — greedy, temperature, top-p, top-k — is drawing from a distribution where the illegal mass has already been zeroed out. That ordering is the entire trick: the mask is applied to logits, before sampling touches them, not after a token is already chosen.

## Walking a tiny grammar by hand

Take a minimal target: an object with one boolean field, `{"ok": true}` or `{"ok": false}`. Written as a character-level grammar:

```
root  ::= "{\"ok\":" bool "}"
bool  ::= "true" | "false"
```

Trace the states a constraint engine would walk through, one character at a time:

```
q0 --{--> q1 --"--> q2 --o--> q3 --k--> q4 --"--> q5 --:--> q6
                                                          |
                                          +---------------+---------------+
                                          | "t"                           | "f"
                                          v                               v
                                         q7 --r--> q9 --u--> q10 --e--> q11   q8 --a--> q12 --l--> q13 --s--> q14 --e--> q15
                                          |                               |
                                          +---- both paths converge -----+
                                                          |
                                                         "}"
                                                          v
                                                         qF (accept)
```

At `q6` — right after the model has emitted `{"ok":` — the machine defines exactly two legal first characters: `t` or `f`. Every other token in the vocabulary that doesn't begin with one of those two characters gets its logit set to `-inf` before sampling. It doesn't matter if the model's raw, unconstrained distribution ranked `"unknown"` or a stray space as the single most likely continuation — that mass is gone. The model can still exercise judgment about *which* of the two remaining branches to take (and, past `t`, exactly how it tokenizes `rue`), but it cannot leave the two paths the grammar allows.

## The wrinkle: grammars are drawn in characters, models sample in tokens

Everything above is drawn as if one step produces one character. Real models don't work that way — a tokenizer might encode `"true"` as a single token, or split it as `tr` + `ue`, or merge `{"` into one token, depending on the vocabulary. The character-level automaton above is the *specification*; the constraint engine's real job is harder: at every step, scan the *entire* subword vocabulary and determine, for each token, whether appending its literal string keeps the partial output on some accepted path through the character-level grammar — not "is this token exactly the next character," but "does this token's text, whatever length it is, still parse."

Doing that scan naively at every single generation step, over a vocabulary that can run from ~30K to ~200K entries, would be far too slow to use. This is why libraries like Outlines precompute an index ahead of time: for each state the automaton can be in, they work out in advance which vocabulary tokens are legal, so the per-step cost at generation time is a cheap lookup rather than a fresh scan. That precomputation is the "compile" step referenced in [what constraints cost you](/learn/structured-outputs/what-constraints-cost-you) — it's paid once per grammar (and cached), not once per token.

## Why "impossible" is a stronger guarantee than "discouraged"

It's worth being precise about what separates this from things that only nudge a model. A repetition penalty, a lowered temperature, or a stern system prompt all change how *likely* a token is — none of them change whether it's *possible*. Masking sets the logit to `-inf`, which means the probability is exactly zero for every sampling strategy layered on top, including a high-temperature one that would otherwise go hunting in the distribution's tail. There is no temperature setting or top-p value that resurrects a masked token, because the mass was removed before those mechanisms ever see the distribution. That's the qualitative difference [Asking Nicely vs a Physical Rail](/learn/structured-outputs/guardrails-vs-guidance-intuition) is pointing at: everything else is a nudge; this is a wall.

## Nesting needs more than a flat state machine

One more precision point, because it matters if you ever look at how a real engine is built: JSON's grammar is not a *regular* language — it's context-free, because objects and arrays can nest to unbounded depth and the closing brace has to match whichever opening brace it belongs to. A pure finite-state machine can't track "how many levels deep am I" with a fixed number of states. Real implementations pair the per-step transition table with a stack (a pushdown automaton, effectively): entering a nested object or array pushes a marker, closing it pops one, and the "which tokens are legal here" lookup depends on both the current state *and* what's on the stack. This is why a [nested schema](/learn/structured-outputs/nested-and-array-schemas) is a strictly harder compile than a flat one — more states, plus stack depth to track — even though the masking mechanism at each individual step is unchanged.

## Where the analogy strains

Everything above guarantees *shape* — the sequence of tokens forms something parseable and structurally conformant. It says nothing about whether the value inside a masked-valid string field is true, real, or sensible. A grammar can force `"customer_id"` to be some digit string and simultaneously do nothing to stop that digit string from being invented. Masking is a syntax guarantee, full stop — the semantic half of reliability still needs [validation and repair](/learn/structured-outputs/validation-and-auto-repair) on top.

**Related:** [Constrained Decoding: How Guaranteed-Valid Output Actually Works](/learn/structured-outputs/constrained-decoding-under-the-hood), [Compiling a Schema into a Constraint](/learn/structured-outputs/schema-constrained-decoding-explained), [Writing a GBNF Grammar by Hand](/learn/structured-outputs/gbnf-grammar-worked-example), [Asking Nicely vs a Physical Rail](/learn/structured-outputs/guardrails-vs-guidance-intuition), [The Cost of Constraints](/learn/structured-outputs/what-constraints-cost-you)
