---
title: "Tool Output Is Context Too"
track: "context-engineering"
status: live
summary: "Tool results aren't free bytes — they compete for the same budget and attention as everything else in the window."
duration: "6 min read"
---

Calling a tool feels like it happens outside the prompt: you ask, something fetches, you get an answer back. But the moment that answer returns, it gets serialized straight into the message list, and every token of it now costs exactly what a hand-written paragraph would cost — in tokens, in dollars, and in the model's attention.

## What it is

Tool output is context. Not "context-adjacent," not "a special case with its own rules" — the same budgeting, ordering, and pruning discipline you'd apply to a retrieved document or a system prompt applies to a JSON blob a function just returned. The moment a tool result is appended to the messages array, it is indistinguishable from any other tokens the model reads: it takes up window space, it gets re-sent on every subsequent turn in the conversation, and it competes for attention against the actual question being answered.

The reason this needs saying is that tool output *doesn't feel* like something you wrote, so it's easy to treat it as exempt from the discipline you'd apply to a prompt — see [what to include vs. what to cut](/learn/context-engineering/what-to-include-vs-what-to-cut). It isn't exempt. It's often the single largest source of low-value tokens in an agent's context, precisely because nobody applied editorial judgment to it before it landed in the window.

## The mental model

Think of every tool call as producing a draft, not a final answer. A search API, a database query, a file read, a `curl` to some internal service — none of them know what the model actually needs. They return whatever their own contract promises: the top 50 rows, the whole file, the entire HTML document, the full JSON response body. The harness's job is to sit between the tool and the context window and ask the same question you'd ask of any other content: does this earn its place?

That editorial step is the thing most agent loops skip. The default behavior — dump `tool_result.content` straight into the next message — treats the tool's return value as if it were already curated. It almost never is.

## Why it works this way

Tools are built to be complete and general-purpose. A search tool that silently dropped 90% of its results because they "seemed unimportant" would be a bad search tool — that judgment belongs downstream, where you actually know what the current turn needs. So the tool over-returns by design, and the burden of trimming falls on whatever calls it. If nothing does that trimming, the raw completeness of the tool becomes the model's problem to solve at inference time, which is slower, more expensive, and less reliable than solving it in code before the result is ever injected.

## A concrete example (shown)

Say an agent calls a code-search tool with the query "where do we validate refund eligibility," and the tool — reasonably, from its own point of view — returns every function in the codebase whose docstring or body contains the word "refund," fully expanded:

```json
{
  "matches": 47,
  "results": [
    {"file": "billing/refunds.py", "lines": "1-340", "content": "... 6,800 tokens of full file body ..."},
    {"file": "billing/legacy_refunds.py", "lines": "1-210", "content": "... 4,100 tokens ..."},
    {"file": "tests/test_refunds.py", "lines": "1-890", "content": "... 15,200 tokens ..."},
    "... 44 more matches, averaging ~280 tokens each ..."
  ]
}
```

Total payload: roughly 40,000 tokens. The function that actually validates refund eligibility — `is_refund_eligible()` in `billing/refunds.py`, lines 12–38 — is about 800 tokens, including a bit of surrounding context. Everything else is noise relative to this turn's question: test files, a deprecated legacy path, and 44 incidental mentions.

Injected raw, this call alone would consume roughly a third of a 128K window on one tool result, 98% of which does no work. The fix is a trim-at-the-boundary step — applied where the tool result re-enters the harness, before it ever reaches the messages array:

```python
def call_and_trim(tool_fn, query, token_budget=1000):
    raw = tool_fn(query)
    ranked = rank_by_relevance(raw["results"], query)  # cheap heuristic or reranker
    kept, used = [], 0
    for r in ranked:
        cost = estimate_tokens(r["content"])
        if used + cost > token_budget:
            break
        kept.append(r)
        used += cost
    return {"matches_shown": len(kept), "matches_total": raw["matches"], "results": kept}
```

The trimmed result — `is_refund_eligible()` plus one or two of the most relevant neighbors, under the budget — is what actually gets appended. The other 46 matches aren't lost forever; they're one more tool call away if the model needs them, which is a much better trade than paying for all of them on every turn regardless of whether they're used once.

## Where it shows up

- **Search and RAG tools** that return full documents or full top-k chunks instead of the passages that actually matched.
- **Code search / grep-style tools** that return entire files instead of the matching lines plus a little context.
- **API wrappers** that pass through an entire JSON response body when the caller asked one question about one field.
- **Web fetch tools** that hand back full HTML or a full article when a summary or a specific section was what was needed.

## Watch out for (2-3 pitfalls)

1. **Trimming too late.** If the harness appends the full result and *then* asks the model to "ignore the irrelevant parts," you've already paid the token cost and the attention cost — the model still has to read past 40,000 tokens to find the 800 that matter. Trimming has to happen at the boundary, before injection, or it isn't doing its job.
2. **Confusing a tool's own "top-k" limit with a token budget.** A tool that caps itself at "20 results" hasn't capped its token cost — 20 full-file matches can be far more expensive than 100 one-line matches. Budget in tokens, not row counts.
3. **Trimming so aggressively you cut the one fact the query needed.** Aggressive pruning without a real relevance signal risks discarding the answer along with the noise — see [relevance filtering](/learn/context-engineering/relevance-filtering) and [lost in the middle](/learn/context-engineering/lost-in-the-middle) for how position and salience interact once content does make it into the window.

## Where next

Trimming a single tool call is the first move. The next problems show up once an agent calls tools *repeatedly* — the same search with slightly different wording, the same file re-read a few lines further each time — which is where [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication-deep) picks up, and once results start arriving from *multiple* tools describing the same thing, which is where [Merging Context From Many Sources](/learn/context-engineering/merging-multi-source-context) takes over.

**Related:** [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication-deep) · [Deduping Overlapping Tool Results](/learn/context-engineering/deduping-overlapping-tool-results) · [Relevance Filtering](/learn/context-engineering/relevance-filtering) · [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies) · [Context Window Anatomy](/learn/context-engineering/context-window-anatomy)
