---
title: "Returning Results the Model Can Use"
track: "tools-function-calling"
status: live
summary: "Shape a tool result to the call's id, as compact readable text with enough context and no noise."
duration: "6 min read"
---

Execution safety gets a call to actually run. What comes back still has to be turned into something the model can reason over correctly — a correct result formatted badly is nearly as useless as a wrong one.

## What it is

A tool result is the message you send back after execution, and it has to satisfy three separate constraints at once: it's **keyed** to the exact call it answers, it's **structured** as text the model reads well (not a format optimized for a database or a UI), and it carries **enough context to be useful without extra noise** the model has to filter past. Miss any one of the three and the round trip degrades — a misrouted key breaks the turn outright, bad structure gets misread even when the content is right, and noise wastes context the model needs for reasoning.

## The mental model

Write every tool result as if you were handing a colleague the answer to a question they just asked — not as if you were dumping a database row into a log file. A colleague wants the number, plus the one or two facts that make the number interpretable ("total: $482, 3 items, discount already applied") — not the full row with internal ids, timestamps in three formats, and a `__version__` field. The model reads results the same way it reads everything else: as text competing for attention with the rest of the conversation, so every irrelevant token is a small tax on the next reasoning step.

## Why it works this way

Tool calling is a two-turn round trip. The model's turn ends with a `tool_use` block — a name, an id, and arguments. It never sees your function execute; it only sees whatever you put in the matching `tool_result` block on the next turn. That's the entire channel. Get the id wrong and the turn errors out, or worse, silently misattributes a result to the wrong call — a real risk once you're running [parallel tool calls](/learn/tools-function-calling/parallel-tool-calls) and several results have to map to several ids in one message. Get the content wrong — too raw, too sparse, too noisy — and the model has correct information sitting right in front of it that it still reasons about incorrectly, because the shape of the text worked against it rather than for it.

## A concrete example (shown)

A tool that looks up an order, matched to Claude's `tool_result` format:

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01A2b3",
      "content": "Order #4471: 3 items, total $84.20, status: shipped (tracking: 1Z999AA1)"
    }
  ]
}
```

Compare that to the raw database row it likely came from:

```json
{
  "order_id": "ord_4471", "customer_id": "cus_9981", "created_at": "2026-08-14T09:22:11.004Z",
  "updated_at": "2026-08-29T15:03:44.221Z", "status": "shipped", "status_history": [...],
  "line_items": [{"sku": "SKU-118", "qty": 2, "unit_price_cents": 1200, ...}, ...],
  "shipping": {"carrier": "UPS", "tracking": "1Z999AA1", "address_id": "addr_221", ...},
  "internal_flags": {"fraud_score": 0.02, "priority_tier": "standard"}
}
```

Both are "correct." The first is what the model needed to answer "where's my order" — the second buries that answer under fields (`fraud_score`, `address_id`, three timestamp formats) that add nothing to this turn and cost real context tokens across every subsequent turn the model reads this history in.

If the lookup fails, say so plainly and mark it as an error rather than an empty string or a raw exception:

```json
{ "type": "tool_result", "tool_use_id": "toolu_01A2b3", "content": "error: no order found with id ord_9999", "is_error": true }
```

This is the output-side counterpart to the input-side error handling in [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher) — the model needs a legible failure signal either way, at whichever end of the call it occurs.

## Where it shows up

Every tool result, but the stakes rise with call volume: a chatbot with three tools where results are read once can tolerate some noise; an agent running [sequential, multi-step](/learn/tools-function-calling/sequential-multi-step-tool-use) tool use accumulates every result into the transcript it re-reads on every subsequent turn, so a wasteful format compounds. It's also the layer where injected content first enters the conversation — a fetched webpage or document becomes a tool result, which is why [Tool Results Are an Injection Vector](/learn/tools-function-calling/tool-results-as-injection-vector) treats result-shaping as a security concern, not just a formatting one.

## Watch out for

- **Trusting the raw output format is good enough because it's technically correct.** A deeply nested JSON blob with fields the model doesn't need parses fine and still degrades reasoning quality — correctness and legibility are different properties.
- **Silent truncation.** Cutting a long result down without saying so reads to the model as a complete answer, which produces confidently wrong conclusions about data that was actually cut off. [Returning a 5,000-Row Result Without Blowing Context](/learn/tools-function-calling/formatting-large-tool-results) covers this directly.
- **Getting `tool_use_id` wrong under concurrency.** With parallel calls in flight, mismatching ids is the single most common way a multi-tool turn breaks — verify the mapping explicitly rather than assuming call order matches result order.

## Where next

[Returning a 5,000-Row Result Without Blowing Context](/learn/tools-function-calling/formatting-large-tool-results) works through the large-result problem this lesson sets up. [Caching Tool Results Across Calls](/learn/tools-function-calling/caching-tool-results) picks up once a result is well-shaped and asks when it's safe to reuse rather than re-fetch.

**Related:** [Returning a 5,000-Row Result Without Blowing Context](/learn/tools-function-calling/formatting-large-tool-results), [Tool Results Are an Injection Vector](/learn/tools-function-calling/tool-results-as-injection-vector), [Caching Tool Results Across Calls](/learn/tools-function-calling/caching-tool-results), [Returning Tool Results to the Model](/learn/tools-function-calling/returning-tool-results-to-the-model), [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls)
