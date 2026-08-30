---
title: "Dissecting a Live Context Payload"
track: "context-engineering"
status: live
summary: "Label every segment of one real assistant turn by token count and the two categories quietly outweigh everyone's guess."
duration: "7 min read"
---

Ask most engineers what's eating their context window and they'll guess retrieved documents or conversation history. Pull the actual request apart, segment by segment, and the answer is usually more embarrassing than either guess.

## The setup

The scenario: Aria, the support agent from [The Whole Game of Context Engineering](/learn/context-engineering/the-whole-game-of-context-engineering), is on turn twelve of a thread. The customer originally asked about a login problem, that got resolved by turn four, and they've since moved on to a billing question. Nobody trimmed anything along the way. Here's the actual request body sent to the model on turn twelve, with segments labeled (contents abbreviated, structure real):

```json
{
  "system": "You are Aria, Fernway's support assistant. Be concise, cite policy exactly, escalate refunds over $200. [~640 tokens total]",
  "tools": [
    { "name": "get_account", "description": "...", "parameters": { "...": "..." } },
    { "name": "get_invoice", "description": "...", "parameters": { "...": "..." } },
    { "name": "search_kb", "description": "...", "parameters": { "...": "..." } },
    { "name": "create_ticket", "description": "...", "parameters": { "...": "..." } },
    { "name": "issue_refund", "description": "...", "parameters": { "...": "..." } },
    { "name": "escalate_to_human", "description": "...", "parameters": { "...": "..." } }
  ],
  "messages": [
    { "role": "user", "content": "hi, I can't log in" },
    { "role": "assistant", "content": "I'm sorry to hear that — let's fix it. Can you confirm..." },
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "...password reset link sent..." },
    { "role": "user", "content": "that worked, thanks!" },
    { "role": "assistant", "content": "Glad to hear it! Anything else?" },
    { "role": "user", "content": "actually yes, I was double charged this month" },
    { "role": "tool", "content": "{ invoice_id: 'INV-2291', amount: 58.00, ... } [full raw JSON, ~1,900 tokens]" },
    { "role": "assistant", "content": "I see two charges of $29 on the 3rd and the 4th..." },
    { "role": "user", "content": "yeah that's wrong, can you fix it" },
    { "role": "tool", "content": "{ invoice_id: 'INV-2291', amount: 58.00, ... } [same JSON, refetched, ~1,900 tokens]" }
  ],
  "current_message": "so is that getting refunded or not?"
}
```

## Step by step

### Step 1: pull the raw request, not a summary of it

The payload above is what actually left the application on this call — not what the developer *thinks* they're sending. This distinction matters: the developer would have said "a system prompt, some tools, and the recent conversation." What's actually there also includes a duplicated tool result and five turns about a problem that's already solved.

> **Why this step?** You can't fix what you haven't measured. Guessing at composition from memory is exactly how a 1,900-token duplicate JSON blob survives eleven turns unnoticed.

### Step 2: label every segment against the reference taxonomy

Match each part of the payload to the standard categories from [Context Window Anatomy](/learn/context-engineering/context-window-anatomy): system prompt, tool definitions, conversation history, retrieved/tool context, current message. Nothing here is "extra" — every segment fits one of the five buckets, which is exactly what makes them easy to undercount individually and easy to underestimate in total.

> **Why this step?** A shared taxonomy is what lets you compare this payload to the next one, and to the budget you set in [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies), instead of describing each request in ad hoc terms.

### Step 3: count tokens per segment

Run each labeled segment through an actual tokenizer — not a word count — using the helper built in [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice). The real counts, illustrative but representative of this shape of payload:

| Segment | Tokens | % of total |
|---|---:|---:|
| System prompt | 640 | 6.8% |
| Tool definitions (6 tools) | 2,180 | 23.1% |
| Conversation history (11 turns, incl. duplicate JSON) | 6,300 | 66.7% |
| Current message | 130 | 1.4% |
| Scratchpad / carried notes | 190 | 2.0% |
| **Total** | **9,440** | **100%** |

> **Why this step?** Percentages, not raw counts, are what reveal a skewed split. 6,300 tokens sounds like "the conversation" until you see it's 60% of the entire payload for a question that's one sentence long.

### Step 4: separate "expected cost" from "surprising cost"

Retrieved KB content — the thing most people guess is the big line item — isn't even in this payload; Aria's `search_kb` tool wasn't called this turn because the answer looked answerable from history alone. Instead, two categories dominate that nobody budgeted for on purpose: tool definitions (21%, sent on every call whether or not any tool gets used this turn) and history (60.6%, more than half of it about a problem closed eight turns ago, plus one tool result present twice).

> **Why this step?** Naming which costs are load-bearing and which are accidental is the difference between "this agent needs a bigger window" and "this agent needs to stop resending a duplicate invoice fetch and five turns of resolved small talk."

### Step 5: find the specific waste

Two concrete, fixable items inside that 60.6%: the duplicate `get_invoice` result (≈1,900 tokens, verbatim, present twice for no reason) and the four fully-resolved login turns (≈900 tokens) that have zero bearing on "is that getting refunded or not." Combined, that's roughly 2,800 of the 6,300 history tokens — nearly 27% of the *entire* payload — spent on content the current question doesn't need at all.

> **Why this step?** This is the step that turns a percentages table into an action list: dedupe the tool result ([Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication)), and compact or drop the resolved sub-thread ([Summarization for Compaction](/learn/context-engineering/summarization-for-compaction)).

## Where it breaks (+fix)

This exact pattern compounds if nothing intervenes: turn twelve's payload becomes turn twenty's starting point, duplicate tool calls keep appending rather than replacing, and tool definitions never shrink even after the conversation moves permanently away from billing and refunds. The fix isn't one-time cleanup — it's making steps 1–5 above a standing check: log segment breakdowns on real traffic (see [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting)), and only expose the tool definitions actually relevant to where the conversation currently is (see [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure)).

## Takeaways

- Measure the actual outgoing payload, segment by segment, in tokens — not what you assume it contains.
- Percentages surface skew that raw counts hide; a segment can be individually "reasonable" and still dominate the total.
- Tool definitions and stale history are the two categories that reliably surprise people, because both are easy to set once and forget.
- A duplicate or stale sub-thread found once is a bug fix; the same audit run as a habit is observability.

**Related:** [Context Window Anatomy](/learn/context-engineering/context-window-anatomy) · [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice) · [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication) · [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting) · [Reading a Context Budget](/learn/context-engineering/reading-a-context-budget-pie)
