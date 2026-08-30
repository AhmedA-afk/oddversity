---
title: "The Beginner Traps"
track: "structured-outputs"
status: live
summary: "Five mistakes nearly everyone makes first, each with the two-line before and after that fixes it."
duration: "7 min read"
---

Five mistakes that show up in almost every first structured-output pipeline, each cheap to fix once you can name it.

### The mistake: scraping prose instead of requesting JSON

**Why it's wrong:** You're pattern-matching the model's phrasing, not asking for the value — see [Why Parsing Prose Always Breaks](/learn/structured-outputs/strings-are-not-data-intuition). Any rewording invisibly breaks every extraction built on the old wording.

**Symptom:** Extraction silently returns `None` or throws on inputs that "look basically the same" as ones that worked yesterday, with no change on your end.

**Fix:** Request the field directly and parse the object instead of its description.

```python
# Before: regex on prose
rating = int(re.search(r"(\d) out of 5", reply).group(1))

# After: ask for the field, parse the object
rating = ReviewSummary.model_validate_json(reply).rating
```

### The mistake: skipping validation entirely

**Why it's wrong:** "The model almost always gets it right" describes the common case, not a guarantee. Without a validation step, nothing stands between an occasional bad value and your database — see [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair).

**Symptom:** An intermittent, hard-to-reproduce production bug, traced weeks later to one malformed row that was never checked coming in.

**Fix:** Always validate against the schema, even when using schema-constrained decoding — decoding constraints and validation catch overlapping but not identical things.

```python
# Before
data = json.loads(raw)
save_to_db(data)

# After
data = json.loads(raw)
invoice = Invoice.model_validate(data)  # raises on bad shape
save_to_db(invoice.model_dump())
```

### The mistake: coding only the happy path

**Why it's wrong:** A nondeterministic producer fails in ways a deterministic API never would — truncated output, an extra hallucinated key, a null where a value was required. Code with no error branch treats every one of these as a crash instead of a handled case.

**Symptom:** An unhandled `ValidationError` — or worse, a silent `except: pass` — takes down a batch job over one bad document out of ten thousand.

**Fix:** Wrap validation in a try/except that routes failures to a repair loop or a review queue; never let one bad item kill the batch.

```python
# Before
invoice = Invoice.model_validate(data)
process(invoice)

# After
try:
    invoice = Invoice.model_validate(data)
    process(invoice)
except ValidationError as e:
    route_to_repair(data, e)
```

### The mistake: over-nesting the schema on day one

**Why it's wrong:** Deeply nested objects and arrays-of-objects-of-arrays are harder for a model to fill correctly than flatter equivalents, and harder for you to validate and repair field by field. See [Schema Design for Reliability](/learn/structured-outputs/schema-design-for-reliability) and [Flat vs. Nested Tradeoffs](/learn/structured-outputs/flat-vs-nested-tradeoffs).

**Symptom:** Fields several levels deep come back empty, null, or wrongly shaped far more often than top-level fields; a repair prompt has to explain a whole nested path just to fix one leaf value.

**Fix:** Start with the flattest schema that represents the data faithfully. Nest only where the data genuinely nests (like line items), and keep it to one or two levels on day one.

```python
# Before: nested from day one
class Invoice(BaseModel):
    parties: dict  # {"vendor": {"name": ..., "address": {...}}, "buyer": {...}}

# After: flatten what doesn't need to nest
class Invoice(BaseModel):
    vendor_name: str
    vendor_address: str
```

### The mistake: treating a successful parse as proof of correctness

**Why it's wrong:** Parsing and schema validation only cover the first two of three reliability layers — see [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means). A value can be perfectly typed and still be wrong.

**Symptom:** A dashboard built on "clean" extracted data drifts quietly from reality, because nothing ever checked values against ground truth — only their shape.

**Fix:** Add at least one semantic check in the loop, even a simple business-rule check, before trusting the value downstream.

```python
# Before: ship on validation alone
invoice = Invoice.model_validate(data)
save_to_db(invoice)

# After: add a semantic gate
invoice = Invoice.model_validate(data)
if invoice.total != round(invoice.subtotal + invoice.tax, 2):
    route_to_review(invoice)
else:
    save_to_db(invoice)
```

## Pre-flight checklist

- [ ] Are you requesting a field directly, never regexing prose for it?
- [ ] Does every parse path have an explicit validation step, even under schema-constrained decoding?
- [ ] Does every validation call have a real failure branch — repair, queue, or reject — instead of an unguarded call?
- [ ] Is your schema as flat as the underlying data honestly allows?
- [ ] Does anything check semantic correctness, not just shape, before a value is trusted downstream?

**Related:** [Why Parsing Prose Always Breaks](/learn/structured-outputs/strings-are-not-data-intuition) · [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair) · [Schema Design for Reliability](/learn/structured-outputs/schema-design-for-reliability) · [Three Layers of Reliability](/learn/structured-outputs/what-reliable-structure-really-means)
