---
title: "Tools and Caching Quiz"
track: "context-engineering"
status: live
summary: "Twelve questions on tool-output pruning, dedup, source merging, and cache-aware ordering, including a cache-busting scenario."
duration: "10 min read"
---

Twelve questions covering the whole module. Each one links to where to go if you miss it.

## 1. Trimming a bloated tool result

A search tool returns 40,000 tokens for a query whose actual answer is a two-sentence snippet. What should happen before that result is injected into context?

- **A.** Inject it all — trimming risks losing information the model might need later.
- **B.** Trim it at the tool boundary to the relevant part, before it's appended to the window.
- **C.** Let the model read all 40,000 tokens and decide for itself what to ignore.
- **D.** Cache the full 40,000-token result so at least it's cheaper on the next call.

<details><summary>Answer</summary>

**Correct: B.** Trimming has to happen at the boundary, where the result re-enters the harness — that's the entire point of the trim-at-the-boundary principle in [Tool Output Is Context Too](/learn/context-engineering/tool-output-is-context-too). **A** is exactly backwards: injecting everything doesn't protect information, it buries the useful 2% in 98% of noise, risking [lost in the middle](/learn/context-engineering/lost-in-the-middle) effects on top of the wasted tokens. **C** still costs the same tokens and attention whether or not the model "decides" to use them — nothing is free just because the model is the one skimming past it. **D** caching a bloated result makes the noise cheaper on repeat, but it's still noise competing for space and attention every time it's read.

</details>

## 2. Deduping paginated overlap

Three paginated calls to the same list endpoint return overlapping rows because of an off-by-one cursor bug. What's the right unit to deduplicate on?

- **A.** The full raw JSON string of each entire page.
- **B.** A stable per-record key (like a row id), not the page as a whole.
- **C.** The character count of each page.
- **D.** The tool name and arguments used for the call.

<details><summary>Answer</summary>

**Correct: B.** When results carry a natural identifier, comparing keys is exact and free — no similarity threshold needed. This is the row-level dedup approach in [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication-deep) and built out fully in [Deduping Overlapping Tool Results](/learn/context-engineering/deduping-overlapping-tool-results). **A** hashing whole pages would only catch pages that are entirely identical, missing the partial overlap that's the actual problem here. **C** character count tells you nothing about which specific records repeat. **D** the tool and arguments were different across the three calls (different page numbers) — that's not what's overlapping.

</details>

## 3. Near-duplicates that hashing misses

A file is read at lines 1-100, then re-read minutes later at lines 1-150 because the agent needed more context. Exact-hash dedup won't catch this since the content isn't identical. What should happen?

- **A.** Nothing — exact-hash is the only safe method, so treat both reads as entirely new information.
- **B.** Diff against the previously injected version and inject only the new lines (101-150), noting the rest is unchanged.
- **C.** Discard the second read entirely, since it overlaps with the first.
- **D.** Always keep both reads in full — more context can only help.

<details><summary>Answer</summary>

**Correct: B.** This is exactly the near-duplicate case [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication-deep) distinguishes from exact duplication — overlapping but not identical content should be diffed, not simply hashed or discarded. **A** gives up on a real, cheap opportunity to save tokens just because the simplest method doesn't apply. **C** would silently drop the genuinely new lines (101-150) along with the redundant ones. **D** pays full price twice for the 100 lines that didn't change, with no benefit.

</details>

## 4. Two sources disagree on a fact

A live inventory API reports a refund window of 14 days; a cached knowledge-base article says 30. What should the merged context tell the model?

- **A.** Show only 14 days, since live data is presumably fresher — drop the 30-day value silently.
- **B.** Average the two values to 22 days, so the model isn't biased toward either source.
- **C.** Show both values labeled by source and recency, with an explicit note on which one to prefer.
- **D.** Pause and ask the user to resolve the discrepancy before answering anything.

<details><summary>Answer</summary>

**Correct: C.** [Merging Context From Many Sources](/learn/context-engineering/merging-multi-source-context) resolves exactly this case: surface both values with provenance and a resolution rule, rather than deleting information or inventing a new value. **A** discards a data point that might itself be the answer to what the user actually needs to know — and removes any way to debug the disagreement later. **B** averaging two discrete, conflicting facts produces a third value nobody reported and that's true of neither source — a classic mistake when the underlying values aren't continuous quantities to begin with. **D** most conflicts can and should resolve automatically via a pre-decided source hierarchy; stopping for user input on every one adds friction the situation doesn't need.

</details>

## 5. Normalizing mismatched units before merge

Source A returns `"mrr_cents": 24000`; Source B returns the string `"$240.00"` — both describing the same underlying value. Before merging, what has to happen?

- **A.** Concatenate both representations and let the model reconcile them.
- **B.** Convert both to one canonical unit and type (for example, `240.0` as a float in dollars) before comparing or merging.
- **C.** Prefer whichever source's tool call happened to run first.
- **D.** Round both values to the nearest hundred and merge them.

<details><summary>Answer</summary>

**Correct: B.** [Normalizing Sources Before Merge](/learn/context-engineering/normalizing-tool-schemas-for-merge) exists precisely because `24000` and `"$240.00"` will never compare equal without a conversion step, no matter how the comparison is written — normalize into one schema first, always. **A** pushes a data-engineering problem into inference, where it's slower and unauditable. **C** call order has nothing to do with which value is correct. **D** rounding loses precision for no reason and doesn't address the actual mismatch (one is cents, one is a formatted dollar string).

</details>

## 6. What a prompt cache actually matches on

What does a provider's prompt cache use to decide whether to reuse previously computed work?

- **A.** Semantic similarity between the new request and a previous one.
- **B.** An exact, byte-for-byte prefix match against a previously processed request.
- **C.** The user's account or organization ID.
- **D.** The total token count of the request.

<details><summary>Answer</summary>

**Correct: B.** As covered in [How Prompt Caching Works](/learn/context-engineering/prompt-caching-mechanics), the match is on literal token sequence, not meaning — a hash of the prefix, checked for an exact match. **A** the cache doesn't evaluate whether two prompts "mean" the same thing; it checks bytes. **C** account identity might gate *access* to a cache in some systems but isn't what determines a match. **D** two requests of identical total length with different content don't match at all — length is irrelevant to the mechanism, as [KV Cache and Context Prefixes](/learn/context-engineering/kv-cache-and-context-prefixes) explains in detail.

</details>

## 7. Why one changed token invalidates everything after it

Why does changing a single early token in an otherwise-identical prompt force recomputation of everything positioned after it?

- **A.** The provider re-hashes the entire request for billing purposes whenever anything changes.
- **B.** Causal attention means every later token's key/value computation depends on the tokens before it, so a changed token changes every position downstream of it.
- **C.** Tokenizers re-tokenize the whole string whenever any character changes.
- **D.** The context window resets whenever any edit is made to the prompt.

<details><summary>Answer</summary>

**Correct: B.** This is the precise mechanical derivation in [KV Cache and Context Prefixes](/learn/context-engineering/kv-cache-and-context-prefixes): because of causal masking, a token's key/value depends only on itself and what came before it, so changing token i changes the KV for position i and for every position after it that attended to it — while everything strictly before position i is provably unaffected. **A** billing hashing is a business detail, not the underlying reason recomputation is actually required. **C** re-tokenization would only affect nearby tokens in most tokenizer designs, not explain why *every* later position needs new computation. **D** there's no window "reset" — the mechanism is about which cached computation remains valid, not about window size.

</details>

## 8. Ordering for maximum cache hits

Which ordering maximizes cache-hit potential across repeated calls?

- **A.** Volatile content (timestamp, live user turn) first, stable content (system prompt, tools) last.
- **B.** Stable content (system prompt, tool definitions) first, volatile content (the current turn) last.
- **C.** Alphabetical ordering of every field, regardless of how often each one changes.
- **D.** Whatever order the request-building framework happens to serialize fields in.

<details><summary>Answer</summary>

**Correct: B.** [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits) and [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design-deep) both build on this: putting the part that never changes first, and the part that always changes last, is what lets the shared portion of the request stay a stable, cacheable prefix. **A** is exactly backwards — it puts the divergence point at the very front, defeating caching entirely. **C** alphabetical order has no relationship to volatility and could easily interleave stable and volatile fields. **D** leaving it to framework defaults is how the timestamp-in-the-system-prompt mistake happens in the first place — see [Cache and Merge Mistakes](/learn/context-engineering/cache-invalidation-mistakes).

</details>

## 9. Scenario: find what's busting the cache

An agent builds its system prompt as: `f"You are a helpful assistant. Session: {session_id}. Tools: {json.dumps(tools)}"`. Cache hit rate is measured at 0% across thousands of otherwise-similar calls. What's the most likely cause?

- **A.** The tools list is too large to ever be cacheable.
- **B.** `session_id` is unique per session and sits inside the frozen prefix, ahead of the tools and instructions — so every request's prefix diverges at the very first templated token.
- **C.** The provider only supports caching user messages, never system prompts.
- **D.** `json.dumps(tools)` runs too slowly, causing a timeout before the cache entry can be written.

<details><summary>Answer</summary>

**Correct: B.** This is the canonical case from [Cache and Merge Mistakes](/learn/context-engineering/cache-invalidation-mistakes) and the exact bug walked through in [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits): a volatile field placed ahead of everything else in the prefix means nothing after it ever gets reused, no matter how stable the tools and instructions actually are. **A** size isn't the blocker — a large but genuinely stable prefix caches fine; a small but volatile one doesn't. **C** most caching providers support caching system prompts specifically; that's a common use case, not an exception. **D** a slow serialization step would show up as latency, not as a 0% hit rate — those are different symptoms with different causes.

</details>

## 10. Reading the usage numbers

Turn 1 of a session shows `cache_creation_input_tokens: 2600, cache_read_input_tokens: 0`. Turn 2 shows `cache_read_input_tokens: 2600, input_tokens: 45`. What does this tell you?

- **A.** The cache isn't working — turn 1 should already have shown a nonzero `cache_read_input_tokens`.
- **B.** Turn 1 correctly paid to write the stable prefix to cache; turn 2 read that same prefix from cache instead of recomputing it — this is a cache hit.
- **C.** The two turns used two different underlying models.
- **D.** `input_tokens` should always read zero whenever caching is enabled at all.

<details><summary>Answer</summary>

**Correct: B.** As walked through in [Measuring Cache Savings](/learn/context-engineering/measuring-cache-savings), turn 1 always has to populate the cache — there's nothing to read yet — and the payoff shows up starting on turn 2, exactly as these numbers show. **A** misunderstands the sequence: a write has to happen before any read is possible. **C** nothing about these fields indicates a model change; that would show up in a separate `model` field, not the usage counts. **D** `input_tokens` correctly reflects the small amount of genuinely new content each turn (the fresh user message) — caching only eliminates recomputation of the *stable* portion, not all input tokens.

</details>

## 11. Why compaction crashed the hit rate

A team compacts and rewrites the middle of a long conversation history to save space, then notices the cache hit rate collapses and cost spikes right after. Why?

- **A.** Compaction always disables caching as a safety measure.
- **B.** The rewrite changed bytes in what was previously a stable, cached prefix, so every cache entry built on top of the old version is now invalid and must be recomputed once.
- **C.** Compacted text is always longer than the original, so of course cost went up.
- **D.** The provider charges a higher per-token rate for summarized content.

<details><summary>Answer</summary>

**Correct: B.** This is the last mistake cataloged in [Cache and Merge Mistakes](/learn/context-engineering/cache-invalidation-mistakes), and it follows directly from the mechanics in [KV Cache and Context Prefixes](/learn/context-engineering/kv-cache-and-context-prefixes): editing content earlier in the prefix invalidates everything cached on top of it, regardless of how small the edit is. **A** there's no such blanket safety feature — the invalidation is a direct mechanical consequence of changing prefix bytes, not a deliberate provider policy. **C** compaction is meant to shrink content, and the cost spike has nothing to do with the compacted text's length — it's about the one-time cost of recomputing everything downstream of the edit. **D** there's no separate pricing tier for summarized content; the cost increase is from a cache miss, not a rate change.

</details>

## 12. The highest-leverage first fix

An agent is both burning context on redundant tool output and getting a 0% cache hit rate. Which single move should you prioritize first?

- **A.** Switch to a model with a bigger context window so both problems matter less.
- **B.** Trim and dedup tool output at the boundary, and move volatile content out of the frozen prefix — the two problems are independent, and both fixes are cheap.
- **C.** Increase `max_tokens` on the output side.
- **D.** Disable tool use entirely until the whole pipeline can be redesigned.

<details><summary>Answer</summary>

**Correct: B.** These are two separate, low-cost fixes that don't depend on each other — see the full recipe in the [Tools and Caching Cheatsheet](/learn/context-engineering/tools-and-caching-cheatsheet). Neither requires a model change or an architecture rewrite, just applying the boundary discipline from [Tool Output Is Context Too](/learn/context-engineering/tool-output-is-context-too) and the ordering discipline from [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits). **A** a bigger window raises the ceiling but does nothing about waste or cost per call — both problems get bigger in absolute terms even if they matter proportionally less. **C** `max_tokens` bounds the output length, unrelated to either input redundancy or caching. **D** disabling tool use removes the capability that makes the agent useful in the first place, to solve problems that have much cheaper, targeted fixes.

</details>

**Related:** [Tools and Caching Cheatsheet](/learn/context-engineering/tools-and-caching-cheatsheet) · [Tool Output Is Context Too](/learn/context-engineering/tool-output-is-context-too) · [Cache and Merge Mistakes](/learn/context-engineering/cache-invalidation-mistakes) · [Ordering for Cache Hits](/learn/context-engineering/ordering-for-cache-hits)
