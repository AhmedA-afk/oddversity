---
title: "Structured Output vs. Tool Calls: Which and When"
track: "tools-function-calling"
status: live
summary: "Both produce schema-shaped JSON — the decision rule is whether anything needs to happen outside the answer."
duration: "6 min read"
---

Structured output and tool calls look almost identical on the wire — both constrain the model to emit JSON matching a schema. That similarity is exactly why people reach for the wrong one: the choice isn't about the shape of the output, it's about what happens after the model produces it.

## What it is

**Structured output** shapes the model's *final answer* — you give it a schema, it returns data matching that schema, and the conversation is done. Nothing outside the model runs as a result. **Tool calling** shapes an *intermediate request* — the model asks for something, your code does something (a lookup, a write, a side effect), and the result flows back in before the model produces its actual answer. [What Is Tool Calling](/learn/tools-function-calling/what-is-tool-calling) and [Why Structured Output](/learn/structured-outputs/why-structured-output) each cover their half in isolation; this lesson is about the seam between them.

## The mental model

Ask one question: **after the model emits this JSON, does anything need to happen outside the conversation before the task is done?** If no — the JSON *is* the deliverable, ready to insert into your database or hand to another system — that's structured output. If yes — the JSON is a request that something be looked up, changed, or triggered, and the real answer can't be written until that happens — that's a tool call. The existing lesson [Structured Output vs. Tool Calls](/learn/tools-function-calling/structured-output-vs-tool-calls) covers the API-level overlap between the two; this is the decision rule to apply before you get there.

## Why it works this way

The overlap exists because both features use the same underlying machinery — a JSON Schema constraining generation, sometimes down to the same decoding-time enforcement (see [How Models Learn to Emit Tool Calls](/learn/tools-function-calling/how-models-learn-to-call-tools)). But they answer to different consumers. Structured output's schema describes *the answer* — its consumer is whatever code receives the final response. A tool call's schema describes *a function signature* — its consumer is your dispatcher, which has to actually execute something and hand a result back before the real answer exists. Conflate them and you either build an action-and-return loop for data that never needed one (wasted round trips, more failure surface) or you extract fields from an answer that secretly still needs a live lookup (data that's already stale or fabricated by the time it's extracted).

## A concrete example (shown)

**Case 1 — extracting fields from an invoice: structured output.** You have the invoice text already, in full, in the conversation. The task is "pull out vendor, amount, and due date into this schema." Nothing needs to be looked up or changed — the answer is a transformation of data you already handed the model. One request, one schema-constrained response, done:

```json
{
  "vendor": "Acme Supplies",
  "amount_usd": 482.10,
  "due_date": "2026-09-14"
}
```

No tool, no loop, no round trip.

**Case 2 — looking up an order and acting on it: tool call.** "Cancel my order if it hasn't shipped yet." The model doesn't have the order's shipping status — it's not in the conversation, and even if it guessed, guessing isn't good enough when the next step is a real cancellation. This needs a `get_order_status` call, a decision based on the real result, and then possibly a `cancel_order` call — two side-effect-relevant steps, each needing to actually happen in your system, not just be described:

```json
{ "type": "tool_use", "name": "get_order_status", "input": { "order_id": "A-4471" } }
```

only *after* that result comes back does the model know whether `cancel_order` is even the right next move.

The difference isn't the presence of JSON — both cases produce JSON. It's that Case 1's JSON is the finish line and Case 2's JSON is a mid-race checkpoint.

## Where it shows up

This decision recurs constantly in agent design: a "generate a report" feature is almost always structured output (the report is the deliverable); a "check on X and handle it" feature is almost always tool calls (something has to be checked, in the real system, before an honest answer exists). Systems that need both — extract structured data *and* look something up to fill in a field — commonly run a tool-calling loop first to gather live data, then a final structured-output pass to shape the answer for a downstream consumer. See [Tool/Function Schemas](/learn/structured-outputs/tool-function-schemas) for where the schema conventions of the two features actually converge.

## Watch out for

- **Using tool calls to fake a schema constraint.** Defining a `submit_answer` tool purely to force JSON-shaped output, with no actual execution behind it, is structured output wearing a tool-shaped costume — use `output_config.format` / a `response_format` directly instead, and save the tool-call machinery for things that truly need to run.
- **Using structured output when data is stale by construction.** Asking the model to "output the current stock price in this schema" with no tool behind it guarantees a plausible-looking, uncontrolled-freshness number — the schema constrains the *shape* of the hallucination, not whether it's true.
- **Forgetting the two can — and often should — compose.** A tool-calling loop to gather facts, followed by one structured-output call to package the final answer, is a completely normal pipeline shape, not a sign you chose wrong.

## Where next

[Structured Output vs. Tool Calls](/learn/tools-function-calling/structured-output-vs-tool-calls) goes deeper on the API mechanics of each; [JSON Schema for Outputs](/learn/structured-outputs/json-schema-for-outputs) covers writing the schema itself well, a skill that transfers directly to [Designing a Tool Schema](/learn/tools-function-calling/designing-a-tool-schema).

**Related:** [What Is Tool Calling](/learn/tools-function-calling/what-is-tool-calling), [Structured Output vs. Tool Calls](/learn/tools-function-calling/structured-output-vs-tool-calls), [Why Structured Output](/learn/structured-outputs/why-structured-output), [Tool/Function Schemas](/learn/structured-outputs/tool-function-schemas), [Designing a Tool Schema](/learn/tools-function-calling/designing-a-tool-schema)
