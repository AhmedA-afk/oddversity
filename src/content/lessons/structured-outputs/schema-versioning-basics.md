---
title: "Versioning a Schema Without Breaking Consumers"
track: "structured-outputs"
status: live
summary: "Additive changes are safe, renames and type changes aren't, and the real cost of skipping a version tag is silently corrupted history."
duration: "7 min read"
---

The schema you ship today is not the schema you'll be running in six months, and the gap between those two versions is where a surprising amount of quiet data corruption comes from.

## What it is

A versioning strategy for output schemas has three parts: know which kinds of changes are safe versus breaking, stamp every output with a version marker so consumers branch on fact rather than guesswork, and treat unversioned changes as a live risk to every record already sitting in storage — not just an inconvenience for whoever updates the code next. [Schema Versioning: Evolving a Contract Without Breaking Consumers](/learn/structured-outputs/schema-versioning-and-migration) covers the payload-tagging pattern and the boundary-migration approach in depth; this lesson zooms into the part that's easy to underweight — what happens to data you already have when nobody bumped the version.

## The mental model

Treat every schema like an API contract, because functionally it is one: something downstream — a database write, a UI render, another service — depends on its exact shape. A version number is what turns "did this record come from the old extraction logic or the new one?" from a guess into a lookup. Without it, every schema change is invisible until something downstream breaks on a shape it wasn't expecting, and by then the change has usually already been running in production for a while, quietly writing records nobody can distinguish from the ones before it.

## Why it works this way

**Additive changes are safe** because nothing that already reads the old shape has to change to keep working — a new optional field, a new enum value nothing switches on yet, widening a type. **Breaking changes** are exactly the ones that make an old reader's assumptions false: a rename, a removed field, a type change, a narrowed enum, an optional field becoming required. The test isn't "did I intend this to be safe" — it's "does anything currently parsing the old shape still parse the new one correctly." A field rename that "obviously" means the same thing to a human reviewer is still invisible to a piece of code that does `record["customer_name"]` and gets a `KeyError` the moment that key stops existing.

**Silent drift corrupts history specifically**, not just future writes. Picture a schema that goes from `amount: number` (a bare figure) to `amount: number` meaning something subtly different — say, switching from including tax to excluding it — with the field name, type, and shape completely unchanged. Every validator passes. Every downstream consumer keeps running without a single error. But now your historical `amount` column contains two different definitions of the same number, indistinguishable from each other by anything a machine can check, and any aggregate computed across the boundary — a monthly total, a trend line — is quietly wrong from that point forward. This is the failure mode a version tag exists to prevent even more than it exists to prevent code crashes: a crash gets noticed and fixed; a silently redefined field under an unchanged name can sit in a data warehouse for a year before someone notices the numbers don't reconcile.

## A concrete example: the decision table

Run any proposed change through this before shipping it:

| Change | Verdict | Why |
|---|---|---|
| Add a new optional/nullable field | Safe | Old consumers ignore keys they don't recognize |
| Add a new enum value | Conditionally safe | Safe unless a consumer has an exhaustive `switch` with no default case |
| Widen a type (enum → string, int → number) | Safe | Every old valid value is still valid under the new type |
| Rename a field | Breaking | Old key access fails; new key is invisible to old readers |
| Remove a field | Breaking | Any consumer still reading it fails or silently gets `undefined` |
| Narrow a type (string → enum, number → int) | Breaking | Previously valid values can now fail validation |
| Make an optional field required | Breaking | Old records that never populated it now fail on re-validation |
| Split one field into two | Breaking | No old record has the new fields; needs an explicit migration (see next lesson) |
| Redefine a field's meaning, same name and type | **Silently breaking** | Nothing fails — this is the drift case above, and it's the most dangerous row in this table precisely because it trips no validator |

That last row is worth sitting with. Every other breaking change gets caught by something — a validator, a type checker, a crash in staging. A silent redefinition gets caught by nothing except someone eventually noticing the numbers don't add up, which is why it deserves a version bump even when, technically, no field name or type in the schema changed at all.

## Where it shows up

Anywhere output gets persisted and re-read later, not just consumed once and discarded — a database of extracted records, a cache of parsed API responses, an audit log. [Data Contracts and Validation](/learn/python-data-apis/data-contracts-and-validation) covers the same discipline from the consuming side: validating that what arrives still matches what your code expects, which is the other half of this same handshake.

## Watch out for

- **"It's just a rename, the meaning is the same" is the excuse behind most accidental breaking changes** — the meaning being the same to a human doesn't make it the same to a `dict.get("old_key")` call.
- **Version numbers in your head don't count.** If the version isn't stamped on the output itself, "which records are v1 vs v2" becomes an unanswerable question the moment more than one person or more than one week is involved.
- **Bumping the version is necessary but not sufficient** — old records tagged v1 still need somewhere to go. That's the migration layer, covered next.

## Where next

[Migrating v1 to v2 in Code](/learn/structured-outputs/migrating-a-schema-version) builds the actual transformer, the version-aware parser, and the regression test that proves old records still load correctly after a real breaking change.

**Related:** [Schema Versioning: Evolving a Contract Without Breaking Consumers](/learn/structured-outputs/schema-versioning-and-migration), [Migrating v1 to v2 in Code](/learn/structured-outputs/migrating-a-schema-version), [Data Contracts and Validation](/learn/python-data-apis/data-contracts-and-validation), [Pre-Ship Schema Checklist](/learn/structured-outputs/reliable-schema-checklist)
