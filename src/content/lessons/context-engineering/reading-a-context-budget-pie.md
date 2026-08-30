---
title: "Reading a Context Budget"
track: "context-engineering"
status: live
summary: "One 80,000-token payload, broken into a pie of six slices, with the two dominant ones needing three different fixes."
duration: "7 min read"
---

A budget breakdown is only useful if you can look at it and immediately know what to do next. Here's one real-shaped payload, sliced into a pie, with the cut candidates identified and a different fix picked for each.

## The setup

Aria's window is a 200,000-token model, and on this particular turn the outgoing request sits at 80,000 tokens — 40% full. Forty percent doesn't sound alarming on its own, which is exactly why this is worth slicing open rather than glancing at.

## Step by step

### Step 1: get the real per-segment breakdown

Running the `segment_report` helper from [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice) against the actual outgoing request produces this:

| Segment | Tokens | % of total |
|---|---:|---:|
| System prompt | 900 | 1.1% |
| Tool definitions | 4,200 | 5.3% |
| Retrieved KB docs (this turn) | 6,000 | 7.5% |
| Conversation history | 38,700 | 48.4% |
| Duplicated tool result | 30,000 | 37.5% |
| Current message | 200 | 0.25% |
| **Total** | **80,000** | **100%** |

> **Why this step?** A single number ("40% full") tells you nothing about where to act. The pie tells you immediately: two slices — history and the duplicated tool result — make up 85.9% of the entire payload. Everything else is close to rounding error by comparison. This is the budget-as-pie framing this track comes back to directly in [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies) and [What a Token Budget Is](/learn/context-engineering/what-a-token-budget-is).

### Step 2: investigate the duplicated tool result first — it's the easy one

Digging into the 30,000-token slice: it's one customer analytics export, roughly 15,000 tokens, fetched once — then fetched again after a request timeout triggered a retry, with the first copy never removed. Two byte-identical copies of the same document, both replayed on every subsequent turn.

> **Why this step?** Not every large slice needs a judgment call. This one doesn't: a duplicate carries zero additional information over the original, so removing the second copy is a pure win — see [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication). Fix: dedupe on tool-result insertion, keyed by request or content hash. This alone recovers 15,000 tokens — 18.75% of the entire budget — with no information loss whatsoever.

### Step 3: investigate the history slice — it needs three different answers, not one

The 38,700-token history slice isn't uniform, and treating it as one blob leads to a bad decision either way (keep it all, or trim it all). Breaking it down by content:

- **~14,000 tokens:** eight turns from an already-resolved, unrelated login issue earlier in the thread.
- **~1,200 tokens:** one fact worth keeping forever — the customer's account tier and a partial credit issued two tickets ago — currently surviving only because it happens to still be inside the replayed window.
- **~23,500 tokens:** the last several turns of the actual, currently-relevant billing conversation.

> **Why this step?** "Trim history" and "summarize history" sound like the same instinct, but applied uniformly, either one is wrong here. The resolved sub-thread should be dropped or reduced to a one-line summary — it's not needed verbatim, ever again. The one durable fact should not depend on staying inside a shrinking or summarized window at all — it should be pulled out into something that persists on its own. The recent, live sub-thread should be kept close to verbatim, because it's exactly what the current question depends on.

### Step 4: apply three distinct fixes to one slice

| Piece | Fix | Where it's covered |
|---|---|---|
| Resolved login sub-thread (~14,000 tok) | **Summarize** into a one-line note, or drop entirely | [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction) |
| Account tier + credit fact (~1,200 tok) | **Externalize** into a durable record, fetched on demand instead of replayed | [Conversation Memory and State](/learn/context-engineering/conversation-memory-and-state) |
| Recent billing sub-thread (~23,500 tok) | **Keep**, close to verbatim | — it's the load-bearing content this turn actually needs |

> **Why this step?** Trim, summarize, and externalize are different tools for different reasons a piece of context is currently taking up space: trim/drop for content with no remaining value, summarize for content whose gist still matters but whose exact wording doesn't, externalize for a fact that needs to survive independent of how history gets managed at all.

## Where it breaks (+fix)

The obvious trap after this exercise: over-correct, and cut the resolved sub-thread so aggressively that a fact buried in it — a promised follow-up, a prior commitment — turns out to matter after all three turns later. The fix isn't "be more conservative" as a vague instinct; it's to test the change before trusting it. Run the compacted version against a held-out set of real conversations, including ones that reference something from the "resolved" section, and check whether answers change — see [Context Window Testing and Eval](/learn/context-engineering/context-window-testing-and-eval). A cut that only ever gets eyeballed on the one conversation you were staring at isn't validated, it's just unbroken so far.

## Takeaways

- A single "% full" number hides which slices are actually large — always break it down before acting.
- The biggest slice isn't automatically the hardest problem: a clean duplicate is a free fix, while a mixed history slice needs to be split into pieces before you can decide anything.
- Trim, summarize, and externalize solve different problems — picking the wrong one for a given piece either loses information you needed or keeps cost you didn't.
- After applying fixes, this payload drops from 80,000 to roughly 34,800 tokens — the duplicate gone, the resolved sub-thread reduced to a line, the durable fact moved out of the replay path entirely — well under half its starting size, with nothing load-bearing lost.

**Related:** [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies) · [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication) · [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction) · [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting)
