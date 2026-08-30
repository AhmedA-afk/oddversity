---
title: "Repetition Penalties and Constrained Decoding"
track: "llm-foundations"
status: live
summary: "Penalties nudge logits down for used tokens; constrained decoding masks invalid tokens to -infinity, guaranteeing structure instead of hoping for it."
duration: "9 min read"
---

*This is the deferred-rigor version of "how do I stop the model from repeating itself or breaking my JSON" — worth the depth once you've used these settings casually and want to know exactly what they do to the numbers.*

Both techniques in this lesson operate on the same object — the logit vector, before softmax — but they make fundamentally different kinds of promises. A penalty makes a repeated token *less likely*. A constraint makes an invalid token *impossible*. Confusing the two is where most JSON-mode disappointments come from.

## Repetition, frequency, and presence penalties: adjustments, not rules

All three penalties modify logits before the temperature/top-k/top-p pipeline described in [from logits to a chosen token](/learn/llm-foundations/from-logits-to-a-chosen-token) — they're a preprocessing step, not a separate mechanism. None of them ever set a probability to exactly zero; they only shift the odds.

**Presence penalty** subtracts a flat amount from the logit of any token that has appeared *at least once* in the generated text so far, regardless of how many times:

```text
logit[token] -= presence_penalty   if count(token) >= 1
```

It's binary — used once or used ten times costs the same fixed subtraction. This targets vocabulary diversity: discouraging the model from returning to any word it's already reached for, once.

**Frequency penalty** scales with how often a token has already appeared:

```text
logit[token] -= frequency_penalty * count(token)
```

A token used five times accumulates five times the penalty of a token used once. This targets *how hard* to suppress a token, not just whether to, which makes it the right tool for stopping a token that's already looping heavily, and a weaker, more forgiving tool for a token that's shown up only once or twice.

**Repetition penalty** (the CTRL-style version used in most open-source decoding libraries) works multiplicatively rather than additively, and treats positive and negative logits differently:

```text
logit[token] = logit[token] / penalty   if logit[token] > 0
logit[token] = logit[token] * penalty   if logit[token] <= 0
```

for any `penalty > 1` and any token already seen. Dividing a positive logit shrinks it toward zero; multiplying a negative logit by something greater than 1 pushes it further negative. Either way, the token's rank drops relative to unseen tokens, but the *amount* it drops depends on the logit's own sign and magnitude — a very confident already-used token (large positive logit) needs a larger absolute penalty to suppress than a marginal one, and this formula naturally scales the penalty to the logit rather than applying a flat subtraction.

**Why "adjustment, not rule" matters.** Push any of these penalties hard enough and you can suppress a token that's linguistically mandatory — an article, a common preposition, a variable name that legitimately needs to reappear. The penalty has no concept of *why* a token repeated; it only counts occurrences. This is the mechanism behind [sampling parameter mistakes](/learn/llm-foundations/sampling-parameter-mistakes)' warning about applying repetition penalties uniformly across code and numeric output — a variable name or a repeated digit gets the exact same downward pressure as a genuinely stuck phrase, because the penalty can't tell the difference.

## Constrained decoding: making invalid tokens impossible, not unlikely

Penalties bias a distribution. Constrained decoding does something categorically stronger: it identifies, at every single decoding step, the full set of tokens that would produce syntactically invalid output if chosen — and sets their logits to `-infinity` before softmax ever runs.

```text
logit[token] = -inf   for every token not permitted by the grammar at this position
```

Once a logit is `-∞`, `exp(-∞) = 0`, so that token's probability is exactly zero after softmax — not small, not discouraged, *zero*. No value of temperature, top-k, or top-p can ever revive it, because those stages only redistribute or filter probability mass that already exists; they have nothing to work with once a candidate has been reduced to true zero. This is the precise difference from a penalty: a penalty is a downward push a large enough temperature could theoretically overcome, and a mask is a wall that no sampling setting can climb.

The grammar itself is typically implemented as a state machine (for JSON: are we expecting a key, a colon, a value, a comma, or a closing brace right now?) or, for more complex formats, as a full context-free grammar compiled into an automaton. At every decode step, the current state determines which tokens are legal, the mask is built from that, and it's applied to the raw logits before any of the sampling pipeline runs.

## A worked example: masking logits to force valid JSON

Say you're generating `{"name": ..., "age": ...}` and, for clarity, treat each quoted key, punctuation mark, and value as one indivisible token — a simplified vocabulary of eleven tokens:

```python
vocab = ['{', '}', '"name"', '"age"', ':', ',', '"Ahmed"', '"Sam"', '30', '25', ' ']
```

Walk the grammar state by state, showing which tokens are masked to `-inf` at each position:

| Step | State | Permitted tokens | Masked to -inf |
|---|---|---|---|
| 1 | start of object | `{` | everything else |
| 2 | expecting first key | `"name"` | everything else |
| 3 | expecting colon | `:` | everything else |
| 4 | expecting string value | `"Ahmed"`, `"Sam"` | `{`, `}`, `"name"`, `"age"`, `:`, `,`, `30`, `25` |
| 5 | expecting comma or close | `,` (more keys required) | everything else |
| 6 | expecting next key | `"age"` | everything else |
| 7 | expecting colon | `:` | everything else |
| 8 | expecting numeric value | `30`, `25` | `{`, `}`, `"name"`, `"age"`, `:`, `,`, `"Ahmed"`, `"Sam"` |
| 9 | expecting close | `}` | everything else |

At step 4, suppose the model's raw logits (before masking) actually favor `,` and `30` over either name string — maybe the underlying distribution genuinely thinks a comma is more likely to come next, because it's confused about position. It doesn't matter. The mask zeroes out every token except `"Ahmed"` and `"Sam"` regardless of what the raw logits said, then temperature and sampling run only over those two surviving options. The model *cannot* emit `{"name": 30, ...}` or `{"name": ,}` — those tokens are structurally excluded before sampling begins, not merely made improbable.

> **Why this matters more than "the model is usually good at JSON."** A raw, unconstrained model can produce a syntax error on any given call — a missing quote, a trailing comma, a truncated brace — because those are just tokens like any other, sampled with whatever probability the model happened to assign them. Masking removes that failure mode structurally: with a correct grammar, the output is guaranteed syntactically valid on every single call, not merely valid most of the time. This is the mechanism underneath tool-calling and structured-output features in production APIs.

## Where the two techniques trade off

| | Repetition penalties | Constrained decoding |
|---|---|---|
| What it guarantees | Nothing — only shifts odds | Syntactic validity, exactly |
| Can be overridden by sampling | Yes — a high enough temperature can still pick a penalized token | No — masked tokens have zero probability regardless of settings |
| Risk | Can suppress legitimate repetition (variable names, digits) | Can only enforce *syntax*, not semantic correctness — valid JSON with the wrong values still passes |
| Setup cost | A few extra lines of logit math | Requires a grammar or schema compiled into a state machine at generation time |

The two are not competitors — you can (and often do) run both at once, since one governs *content quality* and the other governs *structural validity*. Neither substitutes for the other: constrained decoding will happily produce syntactically perfect, structurally guaranteed JSON that repeats the same value in every field if nothing is discouraging that repetition, and repetition penalties will happily make a model less likely to repeat a phrase while doing nothing whatsoever to stop it from emitting malformed JSON.

**Related:** [From Logits to a Chosen Token](/learn/llm-foundations/from-logits-to-a-chosen-token) · [Sampling Parameter Mistakes](/learn/llm-foundations/sampling-parameter-mistakes) · [Implement Temperature, Top-k, and Top-p](/learn/llm-foundations/implement-temperature-top-k-top-p) · [Greedy, Beam, Nucleus, and Min-p Decoding](/learn/llm-foundations/greedy-beam-sampling-min-p) · [The Vocabulary and the Unembedding](/learn/llm-foundations/the-vocabulary-and-the-unembedding) · [Sampling: Temperature, Top-k, and Top-p](/learn/llm-foundations/sampling-temperature-top-p)
