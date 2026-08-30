---
title: "The Whole Game of Structured Output"
track: "structured-outputs"
status: live
summary: "One invoice pipeline, four stages, every later lesson in this track is a closer look at one of them."
duration: "9 min read"
---

A model reading an invoice, a schema describing what "done" looks like, a validator that doesn't trust the model, and a repair loop that fixes one bad field instead of throwing the whole thing away — that's the entire discipline of structured output. You can hold the whole shape in your head in one pass before spending the rest of this track on any single piece of it.

## The big picture

The pipeline is invoice processing. A vendor emails a PDF; an intake service extracts raw text from it: `INVOICE #4471 — ACME Bolts Ltd. Due Sep 12, 2026. 3 x M8 Hex Bolt @ $0.40, 2 x M6 Washer @ $0.05. Subtotal: $1.30. Tax: $0.10. Total: $1.40.` Four things have to happen to that text before it's a row in your database, in order, and each one is a station this track visits in depth.

**Stage 1 — a prompt plus a schema go to a schema-constrained model.** You don't ask the model to "describe the invoice in a sentence." You define the exact shape you need — `vendor`, `invoice_number`, `due_date`, `line_items: [{sku, qty, unit_price}]`, `subtotal`, `tax`, `total` — usually as a Pydantic model translated into a JSON Schema, and call the API in a mode that constrains generation to that shape. This is one of four mechanisms for getting structured output at all, compared head-to-head in [Four Roads to Structured Output](/learn/structured-outputs/three-ways-to-get-json-overview) and covered as an on-ramp in [JSON Mode Basics](/learn/structured-outputs/json-mode-basics); the deep mechanics of how constraining actually works at the token level live in [Constrained Decoding Under the Hood](/learn/structured-outputs/constrained-decoding-under-the-hood) and [Schema-Constrained Decoding, Explained](/learn/structured-outputs/schema-constrained-decoding-explained), in Module 2.

**Stage 2 — the raw text is validated against a Pydantic model.** Schema-constrained decoding only guarantees *shape*: right keys, right types, required fields present. It cannot guarantee that `"due_date": "2026-09-12"` is actually a valid calendar date, or that `total` genuinely equals `subtotal + tax`. That gap between "shaped correctly" and "actually correct" is the subject of [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means) elsewhere in this module, and the concrete validation mechanics live in [The Validation Layer](/learn/structured-outputs/the-validation-layer) and [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair), built on schemas from [Pydantic Models for Extraction](/learn/structured-outputs/pydantic-models-for-extraction).

**Stage 3 — a bounded repair loop fixes one broken field.** Say `total` comes back as the string `"$1.40"` instead of the float `1.40`. Rather than discard the whole invoice, a repair loop re-prompts with the specific validation error attached — "`total` must be a number, got string `'$1.40'`" — capped at a small number of attempts, then routes to human review if it still fails. That cap isn't arbitrary; it's a deliberate spend from a budget, covered in [Thinking in a Reliability Budget](/learn/structured-outputs/reliability-budget-thinking) later in this module and in full mechanical detail in [Auto-Repair Strategies](/learn/structured-outputs/auto-repair-strategies) and [Repair Loop Implementation](/learn/structured-outputs/repair-loop-implementation).

**Stage 4 — a typed object is written to a database.** Once the model (or its repaired output) validates cleanly, it stops being text you're suspicious of and becomes an object your code can trust structurally: `db.insert(invoice.model_dump())`. This is one of several homes structured output lands in — document extraction here, but also tool calls and agent state, mapped out in [Where Structured Output Shows Up in a System](/learn/structured-outputs/where-structured-output-fits-in-a-system) later in this module, with the tool-calling variant covered in [Tool and Function Schemas](/learn/structured-outputs/tool-function-schemas).

```python
from pydantic import BaseModel, ValidationError

class LineItem(BaseModel):
    sku: str
    qty: int
    unit_price: float

class Invoice(BaseModel):
    vendor: str
    invoice_number: str
    due_date: str
    line_items: list[LineItem]
    subtotal: float
    tax: float
    total: float

raw = call_model_with_schema(prompt, schema=Invoice.model_json_schema())
try:
    invoice = Invoice.model_validate_json(raw)
except ValidationError as e:
    invoice = repair_loop(raw, e, max_attempts=2)  # Stage 3

db.insert("invoices", invoice.model_dump())          # Stage 4
```

Nothing here stops once the row lands, either — a pipeline like this only stays trustworthy if you keep measuring its actual invalid rate against real traffic, which is what [Evaluating Structured Output Quality: Metrics](/learn/structured-outputs/evaluating-structured-output-quality-metrics) and [Monitoring Structured Output in Production](/learn/structured-outputs/monitoring-structured-output-in-production) cover in the last module of this track.

## What trips people up

| Idea | Confusion | Where to learn it |
|---|---|---|
| "It's valid JSON, so it's correct" | Conflates syntactic validity with schema conformance with truth — three separate guarantees | [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means) |
| "I'll just regex the model's answer" | Prose has infinite equivalent phrasings; a pattern matches wording, not meaning | [Why Parsing Prose Always Breaks](/learn/structured-outputs/strings-are-not-data-intuition) |
| "The schema is documentation for the model" | The schema is a contract your code owns and must enforce, not a suggestion either side can drift from | [The Schema as a Contract](/learn/structured-outputs/the-contract-between-model-and-code) |
| "One bad field is a minor bug" | A wrong-but-plausible value can silently poison everything downstream before anyone notices | [What One Bad Field Costs Downstream](/learn/structured-outputs/cost-of-getting-it-wrong-intuition) |
| "We should retry until it's perfect" | No pipeline hits 100%; the real decision is what invalid rate you'll tolerate and where you spend effort closing the gap | [Thinking in a Reliability Budget](/learn/structured-outputs/reliability-budget-thinking) |

## A reading path

1. Finish this module first — it's the map everything else refines: [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means), [Why Parsing Prose Always Breaks](/learn/structured-outputs/strings-are-not-data-intuition), [The Schema as a Contract](/learn/structured-outputs/the-contract-between-model-and-code), [Where Structured Output Shows Up in a System](/learn/structured-outputs/where-structured-output-fits-in-a-system).
2. Mechanisms — the real machinery behind Stage 1: [JSON Mode Basics](/learn/structured-outputs/json-mode-basics), [Constrained Decoding Under the Hood](/learn/structured-outputs/constrained-decoding-under-the-hood), [Grammar-Constrained Generation](/learn/structured-outputs/grammar-constrained-generation).
3. Schema design — making Stage 1 and 2 easier to get right: [JSON Schema for Outputs](/learn/structured-outputs/json-schema-for-outputs), [Pydantic/Zod Schema Patterns](/learn/structured-outputs/pydantic-zod-schema-patterns), [Schema Design for Reliability](/learn/structured-outputs/schema-design-for-reliability).
4. Validation and repair — Stage 2 and 3 in full: [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair), [Structured Output Failure Modes](/learn/structured-outputs/structured-output-failure-modes), [Incremental JSON Repair](/learn/structured-outputs/incremental-json-repair).
5. Extraction and beyond — Stage 4's other homes: [Structured Extraction from Documents and Images](/learn/structured-outputs/structured-extraction-from-documents-and-images), [Tool and Function Schemas](/learn/structured-outputs/tool-function-schemas).
6. Cross-provider and evaluation — keeping the whole thing honest over time: [Cross-Provider Structured Output Differences](/learn/structured-outputs/cross-provider-structured-output-differences), [Evaluating Structured Output Quality](/learn/structured-outputs/evaluating-structured-output-quality).
7. Check yourself: [Foundations Checkpoint](/learn/structured-outputs/foundations-quiz).

**Related:** [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means) · [The Schema as a Contract](/learn/structured-outputs/the-contract-between-model-and-code) · [Where Structured Output Shows Up in a System](/learn/structured-outputs/where-structured-output-fits-in-a-system) · [Thinking in a Reliability Budget](/learn/structured-outputs/reliability-budget-thinking) · [Foundations Checkpoint](/learn/structured-outputs/foundations-quiz)
