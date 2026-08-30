---
title: "Reliable Schemas Checkpoint"
track: "structured-outputs"
status: live
summary: "Six scenario questions on the four reliability properties, field ordering, honest absence, safe versioning, and when splitting actually helps."
duration: "8 min read"
---

Six scenarios, not six definitions — each one puts you in front of a schema or a decision and asks what actually goes wrong, mechanically, not what the vocabulary is called.

## 1. Nesting that adds no grouping

A team building an invoice-extraction schema wraps every field inside three levels of nested objects "to keep things organized," even though every value is a single scalar that appears exactly once per invoice — nothing repeats, nothing needs to travel together as a unit. Which of the four reliability properties does this violate, and what failure does that invite?

- **A.** It violates "closed over open" — the nested objects behave like free-form dicts that accept arbitrary keys.
- **B.** It violates "shallow over deep" — each added level is a place the model can misplace a value or close a bracket a token early, with no grouping benefit to justify the risk, since nothing here repeats or needs to stay bound together.
- **C.** It violates "self-describing over cryptic" — nested field names are inherently harder to read than flat ones.
- **D.** It violates "explicit over inferred" — nested objects force the model to infer types instead of having them enforced.

<details><summary>Answer</summary>

**Correct: B.** Depth is a structural cost paid for every level regardless of whether that level groups anything real — see [When to Flatten and When to Nest](/learn/structured-outputs/flat-vs-nested-tradeoffs). Here it groups nothing, so the schema is paying the cost with no offsetting benefit. **A** nesting alone doesn't make a schema open — these are still fixed, named properties at each level, not an `additionalProperties: true` dict; openness and depth are separate axes. **C** a flat field named clearly (`invoice_total`) is no more or less self-describing than the same name nested three levels deep — naming quality and nesting depth don't interact this way. **D** type enforcement (string, integer, enum) is a property of the leaf field's own schema, not of how many objects wrap around it — a deeply nested integer is still just as strictly typed as a flat one.

</details>

## 2. A justification field that doesn't help

A teammate adds a `justification` field to a fraud-flagging schema, placed *after* `is_fraud: boolean`, expecting it to improve accuracy by forcing the model to explain itself. Accuracy doesn't move. Why not, mechanically?

- **A.** `justification` fields never help accuracy on boolean classification tasks specifically.
- **B.** Because generation is autoregressive, `is_fraud` is committed to context before `justification` is generated — the justification conditions on an already-fixed label instead of the label conditioning on the justification. It's positioned to rationalize a decision already made, not to inform one.
- **C.** The schema needs a `confidence` field placed between the two before ordering can have any effect.
- **D.** Boolean fields cannot be reordered relative to string fields in most schema implementations.

<details><summary>Answer</summary>

**Correct: B.** [Field Names and Order Change Behavior](/learn/structured-outputs/naming-and-ordering-fields) is exactly this mechanism: each field conditions on every token emitted before it, so whichever field comes first is generated "blind" relative to the one that follows. [Evidence Before Label](/learn/structured-outputs/reasoning-field-ordering-example) measures the swap directly. **A** justification fields do help, specifically when they're positioned to be generated *before* the label they support — the failure here is placement, not the concept. **C** a third field doesn't change the conditioning relationship between the first two; adding more fields doesn't fix an ordering problem between two existing ones. **D** there's no type-based restriction on field order in JSON Schema or any mainstream structured-output mode — order is a design choice, not a technical constraint tied to field types.

</details>

## 3. A required field with nothing to be required from

A resume-parsing schema has a required, non-nullable `graduation_year: integer` field. About a third of the resumes in the batch never state a graduation year at all. What actually happens on those resumes, and what's the fix?

- **A.** The API call fails validation and returns an error for every resume missing a graduation year.
- **B.** The model fills the field with a plausible-looking year that appears nowhere on the resume, because a required integer field has no legal way to represent "not stated." The fix is making the field nullable and pairing it with a `graduation_year_found: boolean`.
- **C.** The model returns the JSON literal `null` even though the schema forbids it, leaving downstream code to catch the schema violation.
- **D.** This is a model-capability problem, not a schema problem — the fix is switching to a larger model.

<details><summary>Answer</summary>

**Correct: B.** This is the core mechanism in [Letting the Model Say 'I Don't Know'](/learn/structured-outputs/representing-uncertainty-in-schemas): a required field must be satisfied with *some* value before generation can finish, and if the source doesn't supply one, the model invents one that fits the type — a syntactically perfect, semantically fabricated year. [A Not-Found Sentinel That Stops Hallucination](/learn/structured-outputs/not-found-sentinel-example) walks this exact failure on a different field. **A** decoder-enforced or schema-constrained generation satisfies the schema at generation time — there's no missing-value error to catch after the fact, which is precisely why this failure mode is dangerous: nothing flags it. **C** under real schema enforcement the model can't emit a value the schema forbids; it satisfies the constraint instead of violating it, which is the whole problem. **D** a bigger model still has to satisfy a required field with no legal way to say "unstated" — this is a shape problem, and no amount of capability fixes a schema that structurally forbids the honest answer.

</details>

## 4. A safe change, shipped unsafely

A `customer.phone` field changes from `string` (always populated) to `string | null` (now sometimes absent) in the next release. Nobody adds a `schema_version` field or bumps an existing one. Months later, a downstream report averaging call duration by "has a phone on file" is quietly wrong for records written before the change. What actually went wrong?

- **A.** Widening `phone` to also allow `null` was itself a breaking change and should never have shipped without a major version bump.
- **B.** The type change itself was safe — every old record's real phone number is still a valid string under the new type. The actual failure is that nothing marks which records predate `null` becoming legal, so a consumer can't distinguish "genuinely no phone" from "written before this field could express that," and the report silently conflates the two.
- **C.** The dashboard team should have anticipated the change without being told, since `null` is a standard JSON value every consumer should already expect.
- **D.** This wouldn't have happened if `phone` had been made `required` instead of nullable.

<details><summary>Answer</summary>

**Correct: B.** [Versioning a Schema Without Breaking Consumers](/learn/structured-outputs/schema-versioning-basics) draws exactly this line: widening a type is additive and safe on its own — old data stays valid. The real damage here is silent drift with no version marker, which is the most dangerous row in that lesson's decision table precisely because nothing fails loudly. **A** widening to include `null` doesn't invalidate any existing record; per the safe/breaking table, this is an additive change, not a breaking one. **C** no consumer can "anticipate" a change it was never told about — that's the entire argument for stamping a version, not an excuse to skip it. **D** making `phone` required again would just reintroduce the older, worse failure — a required field forces a value even where the source genuinely has none, per question 3.

</details>

## 5. The splitting argument that sounds right and isn't

An engineer wants to improve a 30-field extraction schema's reliability by splitting it into two 15-field passes, reasoning: "each pass only has to get 15 fields right instead of 30, so the combined accuracy will be higher." Assuming per-field accuracy `a` is measured and comes out identical in both the one-pass and two-pass versions, is this reasoning correct?

- **A.** Yes — requiring two smaller passes to each succeed is always mathematically better than requiring one large pass to succeed.
- **B.** No — if per-field accuracy `a` doesn't change, `a^15 × a^15` equals `a^30` exactly. The split gains nothing from the arithmetic alone; any real accuracy gain has to come from the split actually raising per-field accuracy, not from the pass count itself.
- **C.** No — splitting a schema always lowers accuracy, because the extra round trip and merge step introduce new errors that outweigh any gain.
- **D.** The comparison is meaningless, because per-field accuracy can't be modeled as a probability in the first place.

<details><summary>Answer</summary>

**Correct: B.** [Complexity vs Accuracy, and When to Split](/learn/structured-outputs/schema-complexity-vs-model-accuracy) works through this exact algebra: `a^15 × a^15 = a^30` for any `a`, so splitting with unchanged per-field accuracy is a wash by construction. The real lever is whether a narrower pass actually raises `a` — less to track per generation, less interference between fields — which has to be measured, not assumed. **A** this is the tempting-but-wrong intuition the lesson corrects directly; the multiplication alone buys nothing when `a` is held constant. **C** overstates a real cost (round trips, merge complexity) into an absolute rule — splitting can still be a net win when it measurably raises `a`, or even at unchanged `a`, when isolating failures makes repair cheaper. **D** the independence-based probability model is a stated simplification, not an exact law, but it's a legitimate and useful approximation for reasoning about the tradeoff — dismissing it as meaningless throws away a genuinely useful mental model.

</details>

## 6. Spot the fragility

```json
{
  "type": "object",
  "properties": {
    "result": {
      "type": "object",
      "properties": {
        "data": {
          "type": "object",
          "properties": {
            "label": { "type": "string" },
            "extra": { "type": "object", "additionalProperties": true }
          }
        }
      }
    }
  },
  "required": ["result"]
}
```

Which of the following claims about this schema is **not** a genuine source of unreliable output?

- **A.** `label` has no enum and no description, so its legal values are entirely unconstrained.
- **B.** `extra` accepts arbitrary keys with `additionalProperties: true`, so no consumer can rely on a fixed shape coming back.
- **C.** `result` and `data` are two levels of nesting wrapped around fields that never repeat and don't need to travel together as a group.
- **D.** `required` lists only `result` at the top level instead of requiring `label` and `extra` all the way down the nesting.

<details><summary>Answer</summary>

**Correct: D.** JSON Schema's `required` keyword applies within each object level, not transitively down through nested objects — that's simply how the keyword works, not a design flaw in this schema. Leaving `label` un-required at its own level is actually a legitimate choice if a missing label is a real possible outcome; the fix, if it's a real field, is adding `required: ["label"]` inside `data`'s own schema — but the absence of that is a completeness gap to double-check, not inherently "the" fragility issue on the level of A–C. **A** is a genuine issue — see the ambiguous-enum failure covered throughout [Refactoring a Fragile Schema](/learn/structured-outputs/refactoring-a-fragile-schema-example). **B** is a genuine issue — an open dict is exactly the "closed over open" violation from [Four Properties of a Reliable Schema](/learn/structured-outputs/what-makes-a-schema-reliable). **C** is a genuine issue — two levels of nesting around scalars that never repeat is pure structural risk with no grouping payoff, the same pattern as question 1.

</details>

If more than one of these caught you out, the fix isn't memorizing these six answers — it's running the [Pre-Ship Schema Checklist](/learn/structured-outputs/reliable-schema-checklist) against your own schemas until spotting fragility becomes reflexive. For the mistakes behind each wrong answer above, see [Reliability-Design Mistakes](/learn/structured-outputs/reliability-design-mistakes).

**Related:** [Four Properties of a Reliable Schema](/learn/structured-outputs/what-makes-a-schema-reliable), [Reliability-Design Mistakes](/learn/structured-outputs/reliability-design-mistakes), [Pre-Ship Schema Checklist](/learn/structured-outputs/reliable-schema-checklist), [Schema Design Quiz](/learn/structured-outputs/schema-design-quiz)
