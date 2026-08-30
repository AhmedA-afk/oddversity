---
title: "Grammars Beyond JSON"
track: "structured-outputs"
status: live
summary: "JSON Schema is not the ceiling — regexes, context-free grammars, and full language grammars constrain formats schemas can't touch."
duration: "7 min read"
---

Everything in this module so far has assumed the target is JSON. It doesn't have to be — masking works on any formal grammar.

## The four approaches

### 1. JSON Schema-derived grammar (the baseline)

**How it works:** your JSON Schema is compiled directly into the constraint, as covered in [Compiling a Schema into a Constraint](/learn/structured-outputs/schema-constrained-decoding-explained). **When it wins:** the target actually is JSON, which is most of the time — it's the path with the most provider support and the least setup. **Failure mode:** it can only constrain what JSON Schema can express — no fixed-width text, no non-JSON delimiters, weak support for patterns and cross-field rules. **Relative cost:** low — this is what most providers ship natively, with no separate library or hosting required.

### 2. Regex-constrained decoding

**How it works:** a plain regular expression is compiled into a finite-state automaton directly, with no JSON or object structure involved at all. **When it wins:** the whole output is one fixed-pattern string — a phone number matching `\d{3}-\d{3}-\d{4}`, a product SKU, a date in one exact format. This is a format [JSON Schema's `pattern` keyword *describes*](/learn/structured-outputs/json-schema-essentials-for-outputs) but that most providers' strict modes don't actually enforce at decode time — regex-constrained decoding enforces it directly, independent of whether it's wrapped in a schema at all. **Failure mode:** no help at all once you need any structure beyond one string — no nesting, no multiple fields. **Relative cost:** very low — regex automata are simple and cheap to compile.

### 3. Context-free grammars via GBNF (llama.cpp)

**How it works:** a grammar written in GBNF (llama.cpp's EBNF-like syntax) is loaded straight into the sampling loop; every generation step walks the grammar to determine legal next tokens, the same masking mechanism as JSON Schema but pointed at an arbitrary rule set. See [Writing a GBNF Grammar by Hand](/learn/structured-outputs/gbnf-grammar-worked-example) for a full worked trace. **When it wins:** the target format has real recursive or branching structure that isn't JSON — a subset of SQL (`SELECT` with optional `WHERE`, `JOIN`, and nested subqueries), a config file grammar, a domain DSL like chess move notation or a robot command language. None of these are expressible as a JSON Schema at all, because they aren't JSON. **Failure mode:** hand-writing a grammar for anything non-trivial is real, exacting work — an ambiguous or incomplete rule set produces confusing masking behavior that's hard to debug from the outside. **Relative cost:** moderate — grammar authoring time up front, plus the same per-token masking overhead as any constrained decode, and it's tied to running your own inference stack (llama.cpp or a compatible engine) rather than a hosted API flag.

### 4. Context-free grammars via Lark / EBNF (Outlines and similar)

**How it works:** functionally the same idea as GBNF — a formal grammar compiled into a token-level automaton — but expressed in Lark's EBNF dialect and built into a Python-first library, alongside JSON-Schema and regex support in the same tool. **When it wins:** you want one library covering JSON Schema, regex, *and* arbitrary CFGs from Python, or the target format is something like a specific CSV dialect with a fixed column count and per-column type, which has no brace-delimited structure for JSON Schema to even describe. **Failure mode:** the same authoring burden as GBNF, plus you're pinned to whatever inference backends the library integrates with (Outlines wraps Hugging Face Transformers, vLLM, llama.cpp, and a few others — not every hosted API). **Relative cost:** moderate, similar to GBNF — the win here is tooling convenience across formats, not a cheaper mechanism.

## Decision table

| Mechanism | Expressiveness | Tooling | Typical cost | Best for |
|---|---|---|---|---|
| JSON Schema-derived | Objects, arrays, types, enums | Native in most provider APIs | Low | Standard JSON extraction and tool calls |
| Regex-constrained | One fixed-pattern string | Outlines, some inference engines | Very low | Phone numbers, SKUs, fixed-format IDs |
| GBNF (llama.cpp) | Full context-free grammars | llama.cpp and compatible engines | Moderate | SQL subsets, DSLs, non-JSON formats, self-hosted models |
| Lark/EBNF (Outlines) | Full context-free grammars | Outlines (Python, multiple backends) | Moderate | Same as GBNF, when you want one library across formats |

## How to choose

Start from what the *target format actually is*, not from which tool you already have installed. If the destination genuinely is a JSON object your code will parse, stay on JSON-Schema-derived constraint — it's the best-supported, cheapest-to-adopt option, and reaching for a hand-written grammar here is one of the mismatches covered in [Picking the Wrong Mechanism](/learn/structured-outputs/mechanism-selection-mistakes). Drop to regex only when the entire output is one string with a fixed pattern. Reach for a full grammar (GBNF or Lark) only when the format isn't JSON at all, or when a real gap in JSON Schema's expressiveness — a pattern your provider won't enforce, a cross-field literal dependency — is actually costing you bad data today, not hypothetically. Every one of these is the same underlying mechanism from [How Constrained Decoding Masks Tokens](/learn/structured-outputs/constrained-decoding-mechanics-deep-dive); you're choosing a rulebook, not a different kind of guarantee.

**Related:** [Compiling a Schema into a Constraint](/learn/structured-outputs/schema-constrained-decoding-explained), [Writing a GBNF Grammar by Hand](/learn/structured-outputs/gbnf-grammar-worked-example), [Turning On Structured Modes in Code](/learn/structured-outputs/enabling-structured-modes-across-sdks), [Decoding Mechanisms Cheatsheet](/learn/structured-outputs/decoding-mechanisms-cheatsheet)
