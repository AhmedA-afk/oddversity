---
title: "Lab: the vendor changed a field name overnight"
phase: craft
module: debugging-unfamiliar-systems
kind: lab
summary: A vendor's API pushes a breaking change with no notice, your nightly inventory sync fails at 3 a.m., and a retail customer's morning stock report is empty. Reproduce it, fix it without breaking yesterday's data, and stop it from happening silently again.
duration: 3 h
updated: "2026-09-02"
outcomes:
  - Reproduce a production failure from an alert alone, using captured fixtures rather than guessing.
  - Patch a parsing layer to accept two shapes of the same data during a transition window, without silently dropping records.
  - Add a schema-drift check so the same class of failure surfaces as a warning next time, not a 3 a.m. page.
artifact: A patched ingestion service with before/after fixtures, a passing regression test for both payload shapes, a schema-drift monitor, and a one-paragraph note to the customer explaining what happened.
sources:
  - https://www.firstresonance.io/blog/a-day-in-the-life-of-a-forward-deployed-systems-engineer-fdse-c
---

## The situation

**Northgate Retail**, a fictional mid-size Indian retail chain, receives nightly inventory updates from its point-of-sale vendor through a paginated JSON API. Your ingestion service pulls the feed at 2 a.m., writes it into a staging table, and a morning report tells store managers what to reorder before the shop floor opens at 9.

At 6 a.m. the on-call alert fires: the nightly job failed with a stack trace, and the morning report is empty for all 60 stores. A First Resonance account of a forward deployed engineer's actual working day describes this exact situation: a vendor renames a field overnight with no changelog, and the fix has to land the same day because the business runs on the feed. This lab is that day, worked end to end.

**What you are told, at 6:05 a.m.:** the vendor's support inbox has an out-of-office autoresponder. No changelog, no notice, no one to ask yet. The store managers arrive at 9.

## Deliberately out of scope

No renegotiating the vendor contract, no building a general-purpose schema-validation platform. The job today is: get tonight's data flowing again, without corrupting what is already in the staging table, and leave a trip wire so this specific failure mode announces itself next time instead of paging you at 6 a.m.

## Build the fixtures first

Before you can debug this for real, build the two payload shapes yourself, because that is what actually happened to the vendor's feed and you need both versions to test against.

```python
# fixtures/inventory_before.json — the shape that worked yesterday
{"records": [{"sku_code": "NG-4821", "store_id": "S014", "qty_on_hand": 12, "last_counted": "2026-08-31T22:00:00Z"}]}

# fixtures/inventory_after.json — the shape that arrived overnight
{"records": [{"item_code": "NG-4821", "store_id": "S014", "qty_on_hand": 12, "last_counted": "2026-08-31T22:00:00Z", "uom": "EA"}]}
```

`sku_code` became `item_code`. A new `uom` field appeared. Nothing else changed. This is a realistic vendor change: small, undocumented, and enough to break a strict parser completely.

## Steps

### 1. Reproduce the failure from the alert (20 min)

Run last night's job against `inventory_after.json` and confirm it fails the same way the alert described. If your local reproduction does not match the production stack trace, you are debugging the wrong thing; go back and check.

### 2. Read the actual error, not the summary (15 min)

The alert says "job failed." The stack trace says something more specific: a `KeyError: 'sku_code'` or a Pydantic `ValidationError` naming the missing field. Write down the exact error and the exact field it names before doing anything else.

### 3. Diff the two fixtures programmatically (15 min)

```python
import json

before = set(json.load(open("fixtures/inventory_before.json"))["records"][0].keys())
after = set(json.load(open("fixtures/inventory_after.json"))["records"][0].keys())
print("removed:", before - after)
print("added:", after - before)
```

This turns "something changed" into a precise, written list: `sku_code` removed, `item_code` and `uom` added. Put this in your incident notes verbatim.

### 4. Patch the parser to accept both shapes (30 min)

Do not simply rename the field in your code, because any record still queued from before the change, or any store whose vendor instance has not yet rolled the update out, will use the old name. Accept both during a transition window, and log which shape each record arrived in so you know when it is safe to remove the old path.

```python
from pydantic import BaseModel, model_validator

class InventoryRecord(BaseModel):
    sku: str
    store_id: str
    qty_on_hand: int
    last_counted: str
    uom: str | None = None

    @model_validator(mode="before")
    @classmethod
    def accept_old_or_new_field_name(cls, data):
        if "sku_code" in data and "sku" not in data:
            data["sku"] = data.pop("sku_code")
        elif "item_code" in data and "sku" not in data:
            data["sku"] = data.pop("item_code")
        return data
```

### 5. Add a regression test pinning both shapes (20 min)

```python
def test_parses_old_field_name(fixture_before):
    records = parse_inventory(fixture_before)
    assert records[0].sku == "NG-4821"

def test_parses_new_field_name(fixture_after):
    records = parse_inventory(fixture_after)
    assert records[0].sku == "NG-4821"
    assert records[0].uom == "EA"
```

### 6. Add a schema-drift warning, not just a fix (30 min)

The point of this lab is not only fixing today's failure. It is making the next one visible before it pages anyone. Log a warning, without failing the job, whenever a record contains a field your parser does not recognise.

```python
KNOWN_FIELDS = {"sku_code", "item_code", "store_id", "qty_on_hand", "last_counted", "uom"}

def check_for_drift(raw_record, logger):
    unknown = set(raw_record.keys()) - KNOWN_FIELDS
    if unknown:
        logger.warning("schema_drift: unrecognised fields %s in record %s", unknown, raw_record.get("sku_code") or raw_record.get("item_code"))
```

This turns the next vendor change from a silent failure into a warning someone reads at a reasonable hour, well before it breaks anything.

### 7. Reprocess last night's failed run (15 min)

Re-run the ingestion job against the real `inventory_after.json` shape. Confirm the staging table has all 60 stores' worth of records, with no duplicates from the earlier failed attempt.

### 8. Redeploy and verify (15 min)

Deploy the patched parser, run the smoke test against a live pull if the vendor's feed is reachable, and confirm the morning report generates correctly for a re-run.

### 9. Write the customer-facing note (15 min)

One paragraph, no jargon: what broke, why, what you did, and what happens if it happens again. This becomes the worked example in [The incident write-up: a template and a worked example](/roles/forward-deployed-engineer/craft/incident-write-up-template).

## Definition of done

- [ ] The parser accepts both `sku_code` and `item_code` and normalises to one internal field.
- [ ] A record missing both names is rejected with a named, specific error, not silently dropped.
- [ ] Two regression tests pin the old and new payload shapes independently.
- [ ] A schema-drift warning fires on any unrecognised field, without failing the job.
- [ ] Last night's failed run has been safely reprocessed with no duplicate records in staging.
- [ ] A short customer-facing note states what happened, in plain language, without blaming the vendor by name in a way that would embarrass anyone in the room.

## How this could go wrong

**You hardcode the new field name.** The job passes today and fails again the moment a store whose vendor instance has not yet updated sends the old shape. Accept both, always, during any transition.

**You silently drop unparseable records.** A dropped record without a count and a log line is a shrinking dataset nobody notices until a store manager asks why their stock count looks wrong three weeks later.

**You fix it and skip the drift monitor.** The specific bug is patched, and the general failure mode, an FDE finding out about a vendor's breaking change from an angry ops team at 6 a.m., recurs at the next undocumented change.

**You reprocess without checking for duplicates.** Re-running a failed job against a table that already has partial data from the crashed attempt is a common way to double-count inventory. Check for an existing row before you insert, or truncate the specific night's partition first and confirm that is safe to do.

**You write the customer note too late, or too technical.** "KeyError: sku_code" means nothing to a store operations lead and reads as an excuse rather than an explanation. Say what broke in business terms, and say it before they ask.
