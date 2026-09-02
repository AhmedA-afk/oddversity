---
title: "Forcing extract_invoice Every Time"
track: "tools-function-calling"
status: live
summary: "An OCR pipeline compares auto tool choice against forcing extract_invoice, and pays for the reliability it buys."
duration: "7 min read"
---

A document pipeline that has to structure every incoming file cannot tolerate a model that sometimes decides to just describe the document in prose instead. This walks the same pipeline under `auto` and under a forced tool choice, and shows exactly what changes.

## The setup

The pipeline: a scanned invoice image comes in, gets OCR'd to raw text, and that text goes to the model with one tool defined:

```json
{
  "name": "extract_invoice",
  "description": "Extract structured invoice fields from OCR'd document text.",
  "input_schema": {
    "type": "object",
    "properties": {
      "vendor": {"type": "string"},
      "invoice_number": {"type": "string"},
      "total_amount": {"type": "number"},
      "due_date": {"type": "string", "format": "date"}
    },
    "required": ["vendor", "invoice_number", "total_amount"]
  }
}
```

Downstream, a billing system expects `extract_invoice` arguments every single time — it has no code path for "the model replied in prose."

## Step by step

### Step 1 — run it with `tool_choice: auto`

```json
{
  "tools": [/* extract_invoice */],
  "tool_choice": {"type": "auto"},
  "messages": [{"role": "user", "content": "<OCR text of a clean, standard invoice>"}]
}
```

On a clean invoice, this mostly works — the model recognizes the shape and calls `extract_invoice`. But feed it OCR text that's noisy, partial, or from a packing slip instead of an invoice, and you start seeing responses like:

```
I can see this appears to be a packing slip rather than an invoice —
it lists shipped items but no total amount or invoice number. Would
you like me to extract what fields are present anyway?
```

> **Why this step?** This is the model doing exactly what `auto` invites: judging whether calling the tool is the right move at all. That judgment is often correct and sometimes exactly what you want — but a billing pipeline parsing `response.tool_calls[0].input` just crashed on an empty list.

### Step 2 — same input, `tool_choice` forced to `extract_invoice`

```json
{
  "tools": [/* extract_invoice */],
  "tool_choice": {"type": "tool", "name": "extract_invoice"},
  "messages": [{"role": "user", "content": "<same packing-slip OCR text>"}]
}
```

Now the response is guaranteed to be a call:

```json
{
  "vendor": "Acme Distribution",
  "invoice_number": "",
  "total_amount": 0,
  "due_date": null
}
```

> **Why this step?** The model can no longer say "this isn't an invoice" — it must fill the schema, so it does its best with what's there: empty or zeroed fields where the source document simply doesn't have that data. The pipeline gets a parseable object on every call, at the cost of losing the model's judgment that something was wrong.

### Step 3 — measure the transcript difference

Over a batch of mixed documents (clean invoices, blurry scans, non-invoice documents mixed in by mistake):

- **auto**: parseable tool call on clean invoices; a mix of tool calls and prose refusals on anything ambiguous. Every refusal is a pipeline exception you have to catch and route somewhere.
- **forced**: parseable tool call on 100% of inputs, always. Some of those calls carry garbage or zeroed fields for non-invoice inputs — the model didn't refuse, it complied with bad data.

> **Why this step?** This is the actual tradeoff, made visible: forcing converts an *unhandled exception* (prose where you expected structure) into a *silent data-quality problem* (a syntactically valid but wrong invoice record). Neither failure disappears — forcing just moves it from "crashes your parser" to "corrupts your database," which is why forcing without a downstream check is dangerous.

### Step 4 — recover the lost signal

The fix isn't to go back to `auto` — it's to give the forced tool a way to say "no data here" *inside* its schema:

```json
{
  "name": "extract_invoice",
  "input_schema": {
    "type": "object",
    "properties": {
      "is_invoice": {"type": "boolean", "description": "false if this document is not an invoice"},
      "vendor": {"type": "string"},
      "invoice_number": {"type": "string"},
      "total_amount": {"type": "number"},
      "due_date": {"type": "string", "format": "date"}
    },
    "required": ["is_invoice"]
  }
}
```

> **Why this step?** This is the general pattern for forced tools: fold the "should I even do this?" judgment into a field of the schema instead of relying on the model's freedom to decline the call. You keep the guarantee (always a parseable call) and get the signal back (`is_invoice: false` is now a real, checkable value instead of an empty required field).

## Where it breaks (+ fix)

- **Breaks when**: the schema has no escape hatch and the input is genuinely out of scope — you get plausible-looking garbage that passes validation but is wrong, and nothing downstream notices.
- **Fix**: add an explicit status/confidence field to every forced tool's schema (`is_invoice`, `confidence`, `needs_review`) so "this doesn't apply" is representable data, not a refusal you've designed away.
- **Breaks when**: you force a tool on a genuinely open-ended first turn (e.g., a chat assistant that only sometimes needs to look something up) — see [When to Force and When to Let It Decide](/learn/tools-function-calling/when-to-force-vs-auto) for where the line is.

## Takeaways

Forcing a tool converts "the model might not call it" into "the model must call it, correctly or not." That's a strict reliability win for pipelines with no other outcome (structured output is the point), and a real risk anywhere the model's judgment that a tool doesn't apply was valuable information. Fix it by designing the schema to hold that judgment as data rather than relying on the model's freedom to decline — see [Tool Choice: auto, required, none, and Named](/learn/tools-function-calling/tool-choice-modes) for the mode reference and [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries) for catching bad forced output downstream.

**Related:** [Tool Choice: auto, required, none, and Named](/learn/tools-function-calling/tool-choice-modes), [When to Force and When to Let It Decide](/learn/tools-function-calling/when-to-force-vs-auto), [Structured Output vs. Tool Calls](/learn/tools-function-calling/structured-output-vs-tool-calls), [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries)
