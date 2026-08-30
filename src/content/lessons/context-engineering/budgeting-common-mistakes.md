---
title: "Budgeting Mistakes That Bite Later"
track: "context-engineering"
status: live
summary: "Six budgeting mistakes that look fine in testing and break in production, with the concrete symptom and fix for each."
duration: "7 min read"
---

Every one of these mistakes ships fine. They fail on a turn, a model swap, or a user nobody tested against — later, and usually in a way that's harder to diagnose than the mistake itself.

### The mistake: no reply headroom reserved

**Why it's wrong:** if every other segment is sized first and the reply gets whatever's left, the reply allocation shrinks precisely on the turns that already used the most tokens elsewhere — which correlates with exactly the turns where a thorough answer matters most.

**Symptom:** answers that cut off mid-sentence, or an API error about `max_tokens` exceeding the remaining context, and it happens intermittently, correlated with long retrieval or deep conversation history rather than with any obvious input.

**Fix:** reserve reply headroom as a fixed line item, first, before any other segment is sized — the ordering [Budget as a Zero-Sum Pie](/learn/context-engineering/the-budget-allocation-mental-model) insists on. Nothing downstream should be able to spend into it.

### The mistake: budgeting in characters, not tokens

**Why it's wrong:** the ratio between characters and tokens isn't constant — it shifts with language, punctuation density, and especially code or JSON, where a "roughly 4 characters per token" rule of thumb can be off by a wide margin. See [Tokens Are Not Words](/learn/context-engineering/tokens-are-not-words) for why the mapping is this uneven.

**Symptom:** a segment that "should" fit under its cap by character count blows past the real token cap the first time it's mostly code, JSON, or a non-English language — a failure that looks random until someone checks what kind of content was actually in that request.

**Fix:** measure with the real tokenizer, every time — the `count_tokens` helper from [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice), not `len(text) / 4`.

### The mistake: ignoring tool-definition overhead

**Why it's wrong:** every tool's name, description, and schema goes out on every call, whether or not the model ends up using it — see [Context Window Anatomy](/learn/context-engineering/context-window-anatomy). Teams budget for system prompt, history, and retrieval, and quietly forget that tools are a segment too.

**Symptom:** the budget's arithmetic looks fine on paper, but the assembled request is already close to cap before any user content is added — usually discovered only when someone adds a ninth or tenth tool and an unrelated call starts failing.

**Fix:** measure tool schema tokens as their own named segment with its own cap, the way [Measuring What Fills the Window](/learn/context-engineering/measuring-what-fills-the-window) does, and cut the list down with [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure) instead of sending every tool on every call.

### The mistake: truncating mid-JSON

**Why it's wrong:** a token- or character-count truncation applied blindly can cut a tool result or retrieved document off partway through a structured object, leaving an unterminated string or an unbalanced brace.

**Symptom:** downstream JSON parsing throws, or worse, the model treats the truncated fragment as real content and "completes" it with a plausible-looking closing that's simply invented — a hallucination caused directly by the truncation, not by the model.

**Fix:** truncate at structural boundaries — whole chunks, whole messages, whole tool results — never mid-object. If a single document must be cut, cut at a paragraph or sentence boundary and validate the result is still well-formed before it goes anywhere near the request. See [Structured Context Injection](/learn/context-engineering/structured-context-injection).

### The mistake: assuming tokenizers are portable across models

**Why it's wrong:** vocabularies differ between model families and often between versions of the same family. A budget's caps, tuned by counting tokens under one model's tokenizer, can be meaningfully off — tighter or looser than intended — under a different one.

**Symptom:** a budget that worked without incident suddenly starts either rejecting calls that used to fit or leaving unexplained headroom, right after a model upgrade or provider switch — with no change to the actual conversation content.

**Fix:** re-measure with the target model's real tokenizer every time you change models. Never carry a hardcoded characters-per-token ratio or cap number across a model swap without re-verifying it.

### The mistake: no per-session ceiling

**Why it's wrong:** an average-token-per-session metric can look completely healthy while a small number of sessions — a loop that never triggers compaction, an unbounded retrieval, a user pasting an enormous log — consume far more than the average, because nothing is watching the distribution, only the mean.

**Symptom:** aggregate cost dashboards look normal while a handful of sessions account for a disproportionate share of total spend — the exact pattern [Instrumenting Token Spend in Production](/learn/context-engineering/instrumenting-token-spend-in-production) is built to surface, where one outlier session drove roughly 40% of a day's token spend.

**Fix:** enforce a hard per-session and per-turn ceiling in addition to the average-based budget, and alert on outliers specifically — not just on the mean drifting.

## Pre-flight checklist

- Reply headroom is reserved as a fixed line item, first, before any other segment is sized.
- Every segment is measured with the real tokenizer for the target model — never a character-count approximation.
- Tool definitions are measured and capped as their own segment, not folded into "system prompt" or ignored.
- Any truncation logic cuts on structural boundaries (chunks, messages, objects), never mid-string or mid-object.
- Budget caps are re-verified against the actual tokenizer whenever the model or provider changes.
- A hard per-session and per-turn ceiling exists independent of the average budget, with alerting on outliers.

**Related:** [What a Token Budget Actually Is](/learn/context-engineering/what-a-token-budget-is), [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice), [Context Window Anatomy](/learn/context-engineering/context-window-anatomy), [Instrumenting Token Spend in Production](/learn/context-engineering/instrumenting-token-spend-in-production)
