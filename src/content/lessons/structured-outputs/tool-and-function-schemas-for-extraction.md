---
title: "Tool Calling as an Extraction Mechanism"
track: "structured-outputs"
status: live
summary: "A forced tool call is a structured-output mechanism wearing a different API — the tool's input schema is your extraction schema."
duration: "6 min read"
---

Tool calling was built so a model could ask your code to do something. Extraction repurposes it for the opposite: you never run the tool, you just want the model to fill out its call.

## What it is

When you force a model to call a specific tool, the model has to produce arguments matching that tool's input schema in order to "call" it at all. If the tool's `input_schema` *is* your extraction schema — the same fields, the same types, the same required list — then forcing that call is functionally identical to asking the model to produce a JSON object matching that schema. The tool never actually executes anything; its only job is to exist as a shape the model has to fill.

## The mental model

Two paths converge on the same destination. One path is a dedicated structured-output or JSON-mode feature: you hand the model a schema directly and ask for output matching it (see [JSON Mode: The Basics](/learn/structured-outputs/json-mode-basics)). The other path is tool calling: you hand the model a *tool definition* whose `input_schema` happens to be that same schema, force that tool, and read the arguments back. Same contract, same validation obligations on your side — just a different API surface asking for it.

## Why it works this way

Models are trained extensively on realistic tool-use traces: call a function, get a result, decide what to do next. That training makes them reliable at filling a well-described function's arguments — a model used to populating `{location: string, unit: "celsius" | "fahrenheit"}` for a weather tool brings the same discipline to a tool named `extract_receipt` whose arguments are exactly the fields you want out of a document. Naming the tool for what it *captures* rather than what it *does* — `extract_invoice`, not `process_document` — keeps the model's understanding of the tool aligned with what you're actually using it for.

## A concrete example (shown)

```json
{
  "name": "extract_ticket",
  "description": "Extract structured fields from a support ticket.",
  "input_schema": {
    "type": "object",
    "properties": {
      "category": {"type": "string", "enum": ["billing", "bug", "feature_request", "other"]},
      "priority": {"type": "string", "enum": ["low", "medium", "high", "urgent"]},
      "summary": {"type": "string"}
    },
    "required": ["category", "priority", "summary"]
  }
}
```

Force this tool and the model has no path forward except to produce a `category`, `priority`, and `summary` that satisfy the schema — there's nothing to "call," only arguments to fill. [Forcing a Tool Call to Extract](/learn/structured-outputs/function-calling-extraction-implementation) builds the full request around this exact tool.

## Where it shows up

- Codebases that already have tool-calling infrastructure (an agent loop, a tool registry) where adding a dedicated structured-output code path isn't worth it.
- Providers or SDK versions where the structured-output mode doesn't cover a shape you need, but tool schemas do.
- Extraction that has to choose *which* schema applies before filling it — define one tool per document type or record shape, and let tool choice act as a router instead of writing that branch yourself.

## Watch out for

- **Forced tool output still isn't automatically guaranteed valid.** Some providers apply strict schema validation to tool arguments; many don't by default. Treat the result the same way you'd treat any structured claim — validate it, and have a repair path (see [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair)) for a missing required field or a type mismatch.
- **A tool that's only for extraction should still be named and described honestly, but not left wired up to actually do the thing its name implies.** Calling it `send_invoice` when it never sends anything invites a future maintainer to accidentally make it real.
- **This doesn't replace structured-output mode when one exists.** If a dedicated schema-constrained output feature is available for your provider and model, prefer it — it's purpose-built and usually gives stronger conformance guarantees than tool-argument filling does.

## Where next

[Forcing a Tool Call to Extract](/learn/structured-outputs/function-calling-extraction-implementation) implements this end to end against a real API, including reading the arguments back off the response.

**Related:** [Tool/Function Schemas](/learn/structured-outputs/tool-function-schemas), [Forcing a Tool Call to Extract](/learn/structured-outputs/function-calling-extraction-implementation), [JSON Mode: The Basics](/learn/structured-outputs/json-mode-basics), [Extraction Is Schema-Filling](/learn/structured-outputs/extraction-as-a-structured-output-problem), [Cross-Provider Structured Output Differences](/learn/structured-outputs/cross-provider-structured-output-differences)
