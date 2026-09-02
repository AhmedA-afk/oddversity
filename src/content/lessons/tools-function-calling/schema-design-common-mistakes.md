---
title: "Schema Design Mistakes"
track: "tools-function-calling"
status: live
summary: "The recurring offenders — over-nesting, ambiguous names, missing required flags, unstable enums, and jargon — with the symptom each produces and the fix."
duration: "6 min read"
---

Almost every schema-related bug in production traces back to one of five patterns. None of them are exotic — they're the default outcome of writing a schema quickly and not looking at it from the model's side of the table.

### The mistake: over-nested objects

**Why it's wrong:** every level of nesting is a place the model can put a field at the wrong depth, wrap a value in an extra object it doesn't need, or omit a whole sub-object because it wasn't sure how to structure it. Nesting that mirrors your database schema or your internal API's object graph is optimized for your code, not for what a model reliably produces.

**Symptom:** calls that are almost right — the data is all there, but one level too shallow or too deep (`{"location": "SF"}` instead of `{"location": {"city": "SF"}}`, or the reverse), or entire optional sub-objects silently missing because the model wasn't confident where they belonged.

**Fix:** flatten to sibling properties wherever the data is genuinely single-valued. Reserve nesting for data that's actually plural or composite — a list of attendees, a list of line items — per /learn/tools-function-calling/parameter-design-patterns, and cap it at one level deep in the common case.

### The mistake: ambiguous tool names

**Why it's wrong:** `get_order`, `fetch_order`, and `search_orders` registered side by side give the model three near-synonyms to choose between with almost no signal in the names themselves about which is which. Naming conventions that vary by author ("get" for one integration, "fetch" for another, "retrieve" for a third) turn every tool choice into a coin flip disguised as a decision.

**Symptom:** the model calls a plausible-sounding tool that isn't the best fit — a search tool where an exact-ID lookup was available and would have been faster and more precise, or vice versa.

**Fix:** pick one verb convention (`get_`, `search_`, `create_`, `update_`, `delete_`) and use it consistently across the whole registry, then let the description carry the actual disambiguation — see /learn/tools-function-calling/good-vs-bad-tool-descriptions for what that sentence looks like when two tools are genuinely close.

### The mistake: missing or dishonest required flags

**Why it's wrong:** `required` that doesn't match what the underlying call actually needs sends the wrong signal both directions — marking something required that has a sensible default makes the model over-ask or refuse to call the tool on incomplete input; leaving something out of `required` when the call genuinely fails without it lets malformed calls through to your dispatcher, where the failure is more expensive to diagnose than it would have been at the schema level.

**Symptom:** either the model asks clarifying questions for fields that didn't need to be specified, or your dispatcher throws on missing fields the schema implied were optional.

**Fix:** audit `required` against what actually makes the underlying operation fail, not against what would be "nice to have." Anything with a real, statable default belongs out of `required` and into the description — see the three-draft progression in /learn/tools-function-calling/designing-a-tool-schema-walkthrough for exactly this correction in action.

### The mistake: giant, unstable enums

**Why it's wrong:** an enum communicates "this set is closed and I've listed every member." A 40-item enum built from a database table that gets new rows every month isn't closed — it's a snapshot wearing an enum's clothing, and it will fall behind reality on a predictable schedule.

**Symptom:** a valid, real value that isn't yet in the enum gets force-fit into the nearest existing member, silently producing wrong data, or the model refuses to produce a value at all because nothing in the list fits.

**Fix:** for a set that's large or actively growing, use a validated free string with a documented format instead — see /learn/tools-function-calling/enum-vs-freeform-parameters for the full comparison — or an enum with an explicit escape-hatch member paired with a free-text companion field.

### The mistake: internal jargon the model has never seen

**Why it's wrong:** field and value names lifted straight from an internal system — a status code like `"STAT_4"`, an abbreviation like `"whs_loc"` for warehouse location — carry no meaning to a model that's never seen your internal documentation. The model either guesses at a mapping (often wrong) or passes through whatever the user said verbatim, which may not match your internal vocabulary at all.

**Symptom:** arguments that are syntactically valid but semantically wrong — the model picks the wrong internal code because nothing in the schema explained what it means, or it passes a human-readable value your system doesn't recognize.

**Fix:** either translate internal codes to descriptive names at the schema boundary (`"STAT_4"` becomes `"backordered"` in the tool schema, translated back to the internal code inside your dispatcher), or, if you must keep the internal code as the wire value, spell out the mapping explicitly in the field's description or as enum labels.

### The mistake: descriptions that document instead of instruct

**Why it's wrong:** a description like `"Searches orders."` is technically accurate and functionally useless — it tells the model nothing about when to prefer this tool over a sibling, what each field means, or what happens when a field is omitted. Treating the description as a docstring rather than a prompt is the single most common root cause behind the other mistakes on this list looking worse than they'd otherwise be — a good description can partially compensate for an imperfect schema shape, but a bad one makes even a well-shaped schema fail.

**Symptom:** wrong-tool selection between similar tools, and arguments that are the right *type* but the wrong *value* because the model had to guess at meaning the description should have supplied.

**Fix:** rewrite every description against the three-question bar in /learn/tools-function-calling/writing-descriptions-models-follow-deep — what it does, when to use it (and not), and what each parameter means.

## Pre-flight checklist

Before shipping any new or changed schema, check it against each mistake above directly:

- [ ] No property is nested more than one level deep unless the data is genuinely a list of records
- [ ] The tool's name follows the same verb convention as the rest of the registry, and the description names any easily-confused sibling tool
- [ ] `required` matches exactly what makes the underlying call fail — nothing more, nothing less — and every field with a sensible default documents it in prose
- [ ] Every enum is a set you're confident is closed and that you have a process for keeping in sync; anything else is a validated string or an enum-plus-escape-hatch
- [ ] No field or value name is internal jargon without either a translation layer or an explicit mapping in the description
- [ ] Every description answers what/when/when-not, not just what

For the same checklist in reference-card form, see /learn/tools-function-calling/tool-schema-design-cheatsheet.

**Related:** /learn/tools-function-calling/parameter-design-patterns · /learn/tools-function-calling/writing-descriptions-models-follow-deep · /learn/tools-function-calling/enum-vs-freeform-parameters · /learn/tools-function-calling/designing-a-tool-schema-walkthrough · /learn/tools-function-calling/tool-schema-design-cheatsheet
