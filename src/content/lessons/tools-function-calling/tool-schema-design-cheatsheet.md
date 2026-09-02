---
title: "Production Schema Checklist"
track: "tools-function-calling"
status: live
summary: "A pre-ship checklist for any tool schema, formatted to paste straight into a PR review."
duration: "4 min read"
---

Paste this into a PR description or a review comment template. Every line is a yes/no check, and every no points at exactly one other lesson in this module for the fix.

## The checklist

```
□ Name is unambiguous and follows the registry's verb convention
  (get_/search_/create_/update_/delete_ — pick one, apply it everywhere)

□ Description states, in this order: what it does, when to use it,
  when NOT to use it (especially vs. any similar sibling tool)

□ Every parameter has a type and a description — no bare
  { "type": "string" } with nothing else

□ Closed, stable value sets are enums. Open or fast-changing sets
  are validated strings with format + anti-hallucination wording.

□ `required` matches exactly what makes the underlying call fail —
  not "usually present," not "would be nice to have"

□ Nesting is at most one level deep, and only for data that's
  genuinely a list of records (not a single value wearing an object)

□ Every default is stated in prose in the description, not left
  implicit

□ No internal jargon, abbreviations, or raw internal status codes
  without a translation layer or an explicit mapping

□ Token cost of this tool measured, registry total tracked
  (see the counting script — aim to trim, don't just add)

□ A version/deprecation strategy is chosen BEFORE this ships,
  not improvised after the first breaking change is needed
```

## Start-here defaults

When you're not sure, start with these and measure before deviating:

| Decision | Start here, then measure |
|---|---|
| Nesting depth | Flat. Add nesting only when the data is provably a list of records. |
| Enum vs. free string | Enum, if you can enumerate the set today and it changes rarely. |
| `required` | Only fields the call literally cannot succeed without. |
| Description length | Long enough to state what/when/when-not. Trim only after you've measured token cost and confirmed behavior holds — never trim first. |
| New field on an existing tool | Additive (optional, with a default). Never a rename without a deprecation window. |
| Ambiguous pair of tools | One sentence in each description naming the other and the exact condition that routes between them. |

## Quick snippets

**Minimal well-formed tool:**

```json
{
  "name": "search_orders",
  "description": "Search order history by keyword, date range, or status. Use when the user doesn't have a specific order ID — for an exact ID, use get_order_by_id instead.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Keyword search over item names." },
      "status": { "type": "string", "enum": ["pending", "shipped", "delivered", "cancelled", "refunded"] }
    }
  }
}
```

**Enum with an escape hatch, when you expect the closed set to have gaps:**

```json
"status": {
  "type": "string",
  "enum": ["pending", "shipped", "delivered", "cancelled", "refunded", "other"],
  "description": "Use 'other' and populate status_note if the user's described status isn't in this list."
}
```

**Backward-compatible field rename, dispatcher side:**

```python
if "body" in call_args and "html_body" not in call_args:
    log_deprecated_field_use("send_email", "body")
    call_args["html_body"] = call_args.pop("body")
```

## Decision rules, one-liners

- **Nest or flatten?** Flatten unless it's genuinely a list.
- **Enum or string?** Enum if closed and stable; validated string if open or shape-only; enum-plus-escape-hatch if closed-but-leaky.
- **Required or optional?** Required only if the call fails without it.
- **New field or breaking rename?** Additive first, always. Rename only inside a deprecation window.
- **Trim or keep a sentence?** Keep it if removing it changes model behavior in your eval; cut it if it doesn't.

**Related:** /learn/tools-function-calling/schema-design-common-mistakes · /learn/tools-function-calling/parameter-design-patterns · /learn/tools-function-calling/enum-vs-freeform-parameters · /learn/tools-function-calling/schema-versioning-strategies · /learn/tools-function-calling/measuring-and-trimming-schema-tokens
