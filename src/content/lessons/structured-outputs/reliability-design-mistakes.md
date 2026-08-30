---
title: "Reliability-Design Mistakes"
track: "structured-outputs"
status: live
summary: "Six ways reliability efforts backfire — each with the downstream symptom that actually surfaces in production, not the mistake itself."
duration: "8 min read"
---

Every mistake in this lesson comes from someone correctly applying half of a rule from this module and stopping there. That's what makes them worth cataloging separately from the rules themselves — they don't look like carelessness, they look like reasonable effort that didn't go far enough.

### The mistake: over-constraining until the model can't express reality

**Why it's wrong:** "closed over open" from [Four Properties of a Reliable Schema](/learn/structured-outputs/what-makes-a-schema-reliable) gets read as "constrain everything as tightly as possible" — a five-value enum with no escape value, every field marked required "to be safe," no nullable anywhere. That's over-applying the rule past the point it was solving a real problem. A closed schema with no legal way to represent a genuinely edge-case input doesn't make edge cases stop existing; it just forces the model to force-fit them into the nearest legal value.

**Symptom:** a category distribution that looks suspiciously clean — almost nothing ever lands in the categories that should be rare or edge-case — because inputs that don't fit anything get silently coerced into whatever's closest, rather than flagged. Discovered months later when someone manually reviews a sample and finds the "billing_issue" bucket quietly full of things that were never about billing.

**Fix:** every enum needs an honest escape value (`other`, `unclear`) and every field needs to earn `required` by actually being present in effectively all valid inputs — see [Letting the Model Say 'I Don't Know'](/learn/structured-outputs/representing-uncertainty-in-schemas) for the fuller pattern.

### The mistake: confusing sentinels — null vs `""` vs `"N/A"` vs `0`

**Why it's wrong:** representing absence honestly, per [Letting the Model Say 'I Don't Know'](/learn/structured-outputs/representing-uncertainty-in-schemas), only works if "absent" means one specific thing. Different fields, different schema versions, or different engineers on the same team end up using `null` in one place, an empty string in another, and the literal text `"N/A"` in a third — all meaning the same "not present," but indistinguishable to any code trying to check for it in one pass.

**Symptom:** a filter or aggregation that silently drops or miscounts records — `WHERE tax_id IS NOT NULL` finds every record using `null` correctly but keeps every record that used `""` or `"N/A"` instead, both of which read as "present" to that query even though neither is a real tax ID.

**Fix:** pick exactly one absence representation per field and document it in the field's schema description; prefer `null` paired with an explicit status field (`tax_id`, `tax_id_status: "not_present"`) over any string sentinel, because a string sentinel can always collide with a real value someday and `null` structurally can't.

### The mistake: shipping a schema change with no version tag

**Why it's wrong:** [Versioning a Schema Without Breaking Consumers](/learn/structured-outputs/schema-versioning-basics) exists because an unversioned change is invisible the moment it ships — nothing marks which records came from before versus after, and the riskiest case is a change that doesn't even break validation (a field silently redefined under the same name and type).

**Symptom:** an aggregate metric that quietly stops reconciling — a monthly total, a trend line — with no error anywhere in the pipeline, discovered only when someone compares numbers across a boundary nobody remembers being a boundary at all.

**Fix:** stamp `schema_version` on every output the moment it's persisted anywhere, before the first consumer exists — retrofitting a version tag onto data that's already ambiguous is far more expensive than adding it on day one. [Migrating v1 to v2 in Code](/learn/structured-outputs/migrating-a-schema-version) shows the parser shape this enables.

### The mistake: ordering the reasoning field after the label it's supposed to justify

**Why it's wrong:** [Field Names and Order Change Behavior](/learn/structured-outputs/naming-and-ordering-fields) covers why this matters mechanically — a `label` generated before its `reasoning` is committed with nothing behind it, and the `reasoning` that follows is written to support a decision already locked in, not to have actually informed it. Teams often add a reasoning field specifically to improve accuracy, then place it wherever felt natural in the schema, which is usually after the field it's meant to support.

**Symptom:** the reasoning field always seems to agree with the label — suspiciously so — and reading a sample of outputs, the "reasoning" reads like a restatement of the label in different words rather than an independent argument for it.

**Fix:** literally swap the field order — evidence and reasoning fields first, the fields that depend on them after. [Evidence Before Label](/learn/structured-outputs/reasoning-field-ordering-example) shows the measurable gap this one change produces on the same inputs.

### The mistake: flattening away a genuine one-to-many relationship

**Why it's wrong:** "prefer flat" from [When to Flatten and When to Nest](/learn/structured-outputs/flat-vs-nested-tradeoffs) gets applied even to structures that genuinely repeat — numbered fields (`item_1_name`, `item_2_name`, `item_3_name`) standing in for what should be an array. This isn't a reliability improvement, it's a silent cap on how much data the schema can represent, dressed up as a simplification.

**Symptom:** records that mysteriously seem to lose line items past a certain count, or a fourth item that gets crammed into the third slot as `"Widget A / Widget B"` because the schema only offered three slots and the input had four.

**Fix:** if you're numbering field names, that's the schema telling you it needed an array. [Nested Objects and Arrays in Output Schemas](/learn/structured-outputs/nested-and-array-schemas) covers the array-of-objects pattern this replaces it with.

### The mistake: treating a model's self-reported confidence score as a calibrated probability

**Why it's wrong:** a `confidence: 0.92` field looks like a real statistic and isn't one by default — the model generates that number the same way it generates any other token, as a plausible-looking completion, not by measuring its own actual error rate against ground truth. Teams build threshold logic (`if confidence > 0.8: auto-approve`) that quietly assumes the number means what a calibrated probability would mean.

**Symptom:** the auto-approve threshold's error rate doesn't match its own confidence numbers — records auto-approved at "0.9+ confidence" turn out wrong noticeably more or less often than 10% of the time, because nothing tied that number to an actual measured rate in the first place.

**Fix:** use self-reported confidence to *rank and route* (send the lowest-confidence third to review), never to compute anything that assumes it's a real probability — and if you need an actual calibrated rate, measure it empirically against a held-out labeled set, the way [Evaluating Structured Output Quality](/learn/structured-outputs/evaluating-structured-output-quality) and [Extraction Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing) both describe.

## Pre-flight checklist

- Every closed enum has an honest escape value; nothing is `required` just to feel safe.
- Exactly one absence representation is used per field, documented in its description — never `null`, `""`, and `"N/A"` interchangeably for the same meaning.
- `schema_version` is stamped on every output before the first consumer exists, not added retroactively once it's already needed.
- Evidence and reasoning fields are ordered before the fields that depend on them, not after.
- No repeating structure is represented as numbered top-level fields.
- Self-reported confidence scores are used for ranking and routing only, never as an input to a calculation that assumes real calibration.

**Related:** [Four Properties of a Reliable Schema](/learn/structured-outputs/what-makes-a-schema-reliable), [Pre-Ship Schema Checklist](/learn/structured-outputs/reliable-schema-checklist), [Letting the Model Say 'I Don't Know'](/learn/structured-outputs/representing-uncertainty-in-schemas), [Versioning a Schema Without Breaking Consumers](/learn/structured-outputs/schema-versioning-basics)
