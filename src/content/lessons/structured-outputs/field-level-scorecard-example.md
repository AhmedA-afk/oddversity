---
title: "A Field-Level Scorecard"
track: "structured-outputs"
status: live
summary: "One field drags a twenty-item invoice eval from fine to mediocre — here's the scorecard that finds it and the fix that lifts it."
duration: "7 min read"
---

[Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness) computes a `field_accuracy` dict and names a `weakest_field`. This lesson is what happens next: reading that scorecard, finding the actual cause, and fixing it — not just re-running the eval and hoping.

## The setup

An invoice-extraction pipeline against a schema with four fields:

```python
class Invoice(BaseModel):
    vendor: str
    total_cents: int
    due_date: str          # expected format: YYYY-MM-DD
    payment_terms: str      # e.g. "net_30", "due_on_receipt", "net_60"
```

Run through a 20-item gold set built the way [Curating a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset) describes — a random sample plus a handful of known-hard edge cases — the harness from [Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness) produces this scorecard:

```text
{'n': 20,
 'valid_rate': 1.0,
 'schema_conformance_rate': 1.0,
 'field_accuracy': {
     'vendor': 0.95,
     'total_cents': 0.90,
     'due_date': 0.95,
     'payment_terms': 0.60,
 },
 'exact_match_rate': 0.55,
 'weakest_field': 'payment_terms'}
```

Three fields sit in the low-90s to mid-90s — normal-looking noise for a 20-item set. `payment_terms` is at 60%, a full 30+ points below its nearest neighbor, and it's dragging exact-match down with it: an invoice can't count as fully correct if `payment_terms` is wrong, no matter how right the other three fields are.

## Step by step

#### 1. Don't average the gap away — pull the failing records

```python
failures = [r for r in results if not r["field_correct"].get("payment_terms", True)]
for f in failures:
    print(f["document"][:60], "->", f.get("got_payment_terms"), "expected", f.get("expected_payment_terms"))
```

```text
"Payment due within 30 days of receipt..." -> "due_on_receipt"  expected "net_30"
"Terms: Net 45" -> "net_30"                                     expected "net_45"
"Please remit within thirty (30) days" -> "due_on_receipt"      expected "net_30"
```

> **Why this step?** A single field-accuracy number tells you *that* something's wrong; it never tells you *what kind* of wrong. Pulling the actual failing records is the only way to see the pattern — here, two different bugs stacked in one field, not one.

#### 2. Name the two distinct failures

The first and third failures are the same bug: the model reads "within 30 days" and picks `due_on_receipt` instead of `net_30` — a confusion between two enum values whose names alone don't make the distinction obvious. The second failure is different: `net_45` isn't even in the enum the schema currently defines, so the model is forced to guess the closest legal value and picks wrong.

> **Why this step?** These need two different fixes. Confusing two existing enum values is a field-description problem. A value that's missing from the enum entirely is a schema-coverage problem — no description fix repairs a value that was never offered as an option.

#### 3. Fix the schema-coverage gap first

```python
class Invoice(BaseModel):
    vendor: str
    total_cents: int
    due_date: str
    payment_terms: Literal["due_on_receipt", "net_15", "net_30", "net_45", "net_60"]
```

> **Why this step?** Adding `net_45` doesn't touch the description-confusion bug at all, but it removes the one failure mode no amount of prompt tuning could have fixed — the value literally wasn't reachable before.

#### 4. Fix the description-confusion gap

Before, the field carried no description beyond its type — the model had to infer the distinction from the enum value names alone:

```python
payment_terms: Literal["due_on_receipt", "net_15", "net_30", "net_45", "net_60"]
```

After — a description that states the exact rule a human would use to disambiguate the case that kept failing:

```python
payment_terms: Literal["due_on_receipt", "net_15", "net_30", "net_45", "net_60"] = Field(
    description=(
        "Payment terms as stated on the invoice. Use 'due_on_receipt' only if the "
        "invoice explicitly says payment is due immediately or on receipt. If the "
        "invoice gives a number of days (e.g. 'within 30 days', 'net 45'), use the "
        "matching net_N value even if the word 'net' doesn't literally appear."
    )
)
```

> **Why this step?** This is [Field Descriptions as Prompts](/learn/structured-outputs/field-descriptions-as-prompts) applied directly to the failure that was actually observed — the description doesn't restate what the type already enforces, it resolves the exact ambiguity the failing records shared: "within N days" reads as urgency to a model guessing between an urgency-flavored value and a term-length value, when it's really always a term-length statement.

#### 5. Re-run the eval, on the same gold set

```text
{'field_accuracy': {'vendor': 0.95, 'total_cents': 0.90, 'due_date': 0.95, 'payment_terms': 0.90},
 'exact_match_rate': 0.85,
 'weakest_field': 'total_cents'}
```

`payment_terms` moves from 0.60 to 0.90 — back in line with the other three fields — and exact-match jumps from 0.55 to 0.85, because most of the records that were only failing on this one field now pass entirely. `total_cents` is now nominally the weakest field, but at 0.90 it's within normal range of the rest, not a standout the way `payment_terms` was.

> **Why this step?** Re-running against the *same* gold set, not a new one, is what makes this a valid before/after comparison — see the leakage warning in [Curating a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset) for why swapping the eval set mid-fix would make this number meaningless.

## Where it breaks (+fix)

This fix assumed the failures shared one root cause once separated into two buckets. A field regularly stuck below its neighbors after a description fix is often a sign the schema shape itself is wrong for the task, not that the wording needs another pass — see [Refactoring a Fragile Schema](/learn/structured-outputs/refactoring-a-fragile-schema-example) for what that looks like and how it's different from a wording fix. If a second description iteration doesn't move the number, stop iterating on wording and check the shape instead.

## Takeaways

- An aggregate field-accuracy dict is a starting point, not an answer — the failing records themselves tell you what's actually wrong, and different records can be failing for entirely different reasons even though they land on the same field.
- Distinguish "the model chose the wrong option from what was offered" (a description fix) from "the correct option wasn't offered" (a schema-coverage fix) — the first symptom often disguises the second until you've read the actual failures.
- Fix schema coverage before wording — a description can't route a value the enum doesn't contain.
- Validate the fix on the same gold set before declaring victory, and expect the "weakest field" label to simply move to whatever is next in line, not disappear.

**Related:** [Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness), [Metrics for Structured-Output Quality](/learn/structured-outputs/evaluating-structured-output-quality-metrics), [Field Descriptions as Prompts](/learn/structured-outputs/field-descriptions-as-prompts), [Schema Design Choices That Reduce Model Errors](/learn/structured-outputs/schema-design-for-reliability)
