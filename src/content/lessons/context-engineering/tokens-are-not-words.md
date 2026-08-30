---
title: "Tokens Are Not Words"
track: "context-engineering"
status: live
summary: "Budgets built on word counts quietly break the moment your text stops looking like plain English prose."
duration: "6 min read"
---

If you budget a context window by counting words, you will be wrong by a little on plain English and wrong by a lot the moment a URL, a JSON blob, or non-English text shows up. Here's the mental model that survives contact with real payloads.

## The analogy

A tokenizer doesn't cut text at word boundaries — it tiles text using a fixed vocabulary of subword pieces it memorized during training, picking the tiling that reconstructs your exact text using as few common pieces as possible. Think of it like a box of irregularly-sized tiles: some tiles are whole common words ("the", "and"), some are common word-fragments ("un", "ing", "tion"), and some are single characters, kept around for anything the tiler has never seen a bigger tile for. A word made of pieces the vocabulary has seen often tiles in one or two pieces. A word, symbol, or script the vocabulary rarely saw during training gets tiled into many small, ugly pieces — because there's no big tile that matches it.

## Walk it through, step by step

Take four short inputs and reason through how the tiling changes, not the exact boundary a specific vocabulary would choose (that depends on the tokenizer), but the shape of what happens:

**"unhappiness"** — a common English word built from common English pieces. A typical modern tokenizer tiles this in something like two or three pieces — a common prefix, a common root, roughly matching the word's own morphology. Close to the "~4 characters per token" rule of thumb most people carry around for English prose.

**A long URL** like `https://api.fernway.example.com/v2/accounts/9f21c-a88e/invoices?status=paid&limit=50` — mostly random-looking path segments, query parameters, and punctuation the vocabulary has rarely seen as a unit. This tiles into far more, far smaller pieces than its character count would suggest under the 4-characters-per-token rule: individual path segments, punctuation, and parameter names each tend to cost their own token or two, so an ~85-character URL can easily run to 35 or more tokens — well above the ~21 the 4-characters-per-token rule would estimate — with query strings and hashes pushing it higher still.

**Minified JSON** like `{"id":"INV-2291","amt":58.0,"paid":true}` — dense punctuation (`{`, `"`, `:`, `,`, `}`) with almost no whitespace to act as a natural tiling seam. Punctuation-heavy, whitespace-free text tends to tokenize less efficiently per character than prose does, because much of what made the 4-chars-per-token rule work in English — common whole words, spaces as natural breakpoints — is largely absent.

**CJK text** (Chinese, Japanese, Korean) — these scripts don't use spaces between words at all, and a large share of tokenizer vocabularies are trained predominantly on space-delimited scripts. The practical result: CJK text commonly runs close to one token per character, sometimes a bit more, which is a dramatically different ratio than English prose's roughly four characters per token — a budget sized for "so many words" in English can be off by several times over on the equivalent CJK content.

## The wrong intuition, corrected

The common wrong belief is: *a token is roughly a word, so I can estimate context usage by counting words.* This holds up only for plain, common-vocabulary English prose, and even then it's an approximation, not a rule. It breaks the moment the input drifts even slightly from that shape — code, identifiers, URLs, structured data formats, non-English text, emoji, even unusual capitalization or repeated characters all tokenize less efficiently than clean prose. See [Tokens, Context, and Cost](/learn/ai-foundations/tokens-context-cost) for how this same gap plays out in pricing, not just budgeting.

The second wrong belief this corrects: *the ~4-characters-per-token rule is a safe upper bound, so it's fine to plan around it everywhere.* It's a rough average for English prose specifically — nowhere close to safe for the URL, JSON, and CJK cases above, all of which comfortably use *more* tokens per character than the rule predicts. If your payload is mostly retrieved documents, tool JSON, or non-English content, the rule of thumb isn't just imprecise here — it's optimistic in exactly the wrong direction, meaning a budget sized against it will overflow.

## When the analogy breaks

The tile analogy implies a clean, deterministic tiling that's the same every time for the same text — true within one tokenizer, but not across tokenizers. Two different models can tokenize the identical string into a meaningfully different number of tokens, because each has its own vocabulary trained on its own data. A budget tuned against one model's tokenizer doesn't automatically transfer to another; see [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics) for what else changes underneath a "just swap the model" decision.

The analogy also breaks if you assume more tokens always means more meaning conveyed. A 500-token minified JSON blob and a 500-token paragraph cost the same against your budget but are not remotely equal in how much useful signal they carry per token — which is exactly why [Relevance Filtering](/learn/context-engineering/relevance-filtering) cares about content quality, not just token count, once you've got the counting right.

**Related:** [Tokens, Context, and Cost](/learn/ai-foundations/tokens-context-cost) · [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics) · [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice) · [Context Window Anatomy](/learn/context-engineering/context-window-anatomy)
