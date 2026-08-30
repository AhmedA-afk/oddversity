---
title: "Pre-Ship Schema Checklist"
track: "structured-outputs"
status: live
summary: "The go/no-go gate for an output schema: closed, shallow enough, every field has an absence path, reasoning ordered first, versioned."
duration: "6 min read"
---

Run this against any output schema before it ships. It's the reference version of the whole module — five gates, what to check for each, and what to reach for if it fails.

## The five gates

| Gate | Check | If it fails, go to |
|---|---|---|
| **Closed** | No `additionalProperties: true`, no unconstrained `oneOf` across dissimilar shapes, every enum has a real fixed set | [Schema Shape Antipatterns](/learn/structured-outputs/schema-shape-antipatterns) |
| **Shallow enough** | 2–3 levels of nesting for genuine groupings; no numbered top-level fields standing in for an array | [When to Flatten and When to Nest](/learn/structured-outputs/flat-vs-nested-tradeoffs) |
| **Absence path** | Every field that can legitimately be missing has a nullable slot or a status/found flag — nothing required "to be safe" | [Letting the Model Say 'I Don't Know'](/learn/structured-outputs/representing-uncertainty-in-schemas) |
| **Reasoning ordered first** | Any evidence, reasoning, or extracted-raw-value field appears before the derived field it supports | [Field Names and Order Change Behavior](/learn/structured-outputs/naming-and-ordering-fields) |
| **Versioned** | `schema_version` is stamped on every output before any consumer exists | [Versioning a Schema Without Breaking Consumers](/learn/structured-outputs/schema-versioning-basics) |

Ship only when all five are checked. A schema that fails even one gate isn't unreliable in some vague sense — it's unreliable in the specific, named way that gate exists to catch.

## Start here, then measure — sensible defaults

| Decision | Start here | Then measure |
|---|---|---|
| Nesting depth | 2–3 levels max | If deeper structures keep breaking, split into two passes — see [Complexity vs Accuracy, and When to Split](/learn/structured-outputs/schema-complexity-vs-model-accuracy) |
| Field count per schema | Under ~20 shallow fields | Track per-field validation failure rate; if concentrated in a subset, that subset is a split candidate |
| Absence representation | `null` + a status enum (`found` / `not_present` / `illegible`), one convention project-wide | Never mix `null`, `""`, and `"N/A"` for the same meaning — see [Reliability-Design Mistakes](/learn/structured-outputs/reliability-design-mistakes) |
| Confidence fields | Use for ranking/routing only | Calibrate against a labeled sample before trusting the number as a real probability |
| Version tagging | `schema_version` as a required string, from day one | Bump on any breaking change; never retrofit a version onto ambiguous historical data if you can help it |

## Safe vs. breaking, at a glance

| Change | Safe? |
|---|---|
| Add an optional/nullable field | Yes |
| Widen a type (enum → string, int → number) | Yes |
| Add a new enum value | Usually — check for exhaustive `switch`/`match` on the old set |
| Rename a field | No |
| Remove a field | No |
| Narrow a type or an enum | No |
| Make an optional field required | No |
| Split one field into two | No — needs an explicit migration |
| Redefine a field's meaning under the same name and type | No, and the most dangerous row — nothing fails, it just silently corrupts history |

Full derivation and the migration code for the last two rows: [Versioning a Schema Without Breaking Consumers](/learn/structured-outputs/schema-versioning-basics) and [Migrating v1 to v2 in Code](/learn/structured-outputs/migrating-a-schema-version).

## Minimal absence pattern

```json
{
  "value": ["string", "null"],
  "value_status": { "enum": ["found", "not_present", "illegible"] }
}
```

Reach for this shape by default on any field that isn't present in effectively every valid input.

## Minimal version-aware parse

```python
def parse(payload: dict):
    version = payload.get("schema_version", "1")  # untagged = legacy
    if version == "1":
        return migrate_v1_to_v2(ModelV1.model_validate(payload))
    if version == "2":
        return ModelV2.model_validate(payload)
    raise ValueError(f"Unrecognized schema_version: {version!r}")
```

Full build-out, with tests proving old records still load: [Migrating v1 to v2 in Code](/learn/structured-outputs/migrating-a-schema-version).

## Field-ordering rule

Evidence and raw extracted values before derived fields. `{evidence, label}`, never `{label, evidence}` — [Evidence Before Label](/learn/structured-outputs/reasoning-field-ordering-example) has the measured gap between the two orderings.

## Go/no-go

Ship if:

- All five gates above pass.
- At least one sample batch has been hand-checked for semantic correctness, not just schema validity — a schema that validates isn't a schema that's right.
- `schema_version` is present and something downstream actually reads it.

Don't ship on "it validated in testing" alone — a schema-conformant object can still be confidently, silently wrong, which is the entire reason this checklist exists as a separate gate from your JSON Schema linter.

**Related:** [Four Properties of a Reliable Schema](/learn/structured-outputs/what-makes-a-schema-reliable), [Reliability-Design Mistakes](/learn/structured-outputs/reliability-design-mistakes), [Versioning a Schema Without Breaking Consumers](/learn/structured-outputs/schema-versioning-basics), [Complexity vs Accuracy, and When to Split](/learn/structured-outputs/schema-complexity-vs-model-accuracy)
