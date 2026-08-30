---
title: "Normalizing Sources Before Merge"
track: "context-engineering"
status: live
summary: "Map three differently-shaped account APIs into one canonical schema so merge and conflict-detection have something to compare."
duration: "7 min read"
---

Three systems can describe the exact same customer account and never once produce a value that string-matches another, simply because they disagree on field names, date formats, and units. Merge or dedup logic run directly against that raw disagreement won't just fail to catch conflicts — it can't even recognize two representations of the same fact as related. This walks the fix for one concrete case.

## The setup

A support agent needs a single view of customer `1029`'s subscription, and calls three systems that each return their own idea of the same underlying facts:

```json
// Source A - CRM REST API
{"custId": "C-1029", "planName": "Pro", "seatsUsed": 8, "renewsOn": "2026-09-14"}
```

```json
// Source B - Billing service
{"customer_id": "1029", "plan": "PRO_MONTHLY", "active_seats": 8,
 "next_invoice_date": "09/14/2026", "mrr_cents": 24000}
```

```text
// Source C - Legacy ticket system (free-text note, no schema at all)
"Acct 1029 -- Pro plan, 8 seats active, renews mid-Sept. Note: customer
emailed asking about downgrading to 5 seats."
```

Same customer, same underlying facts in two of the three cases, and yet: `custId` vs. `customer_id` vs. an unlabeled account number in prose; `"Pro"` vs. `"PRO_MONTHLY"`; an ISO date vs. `MM/DD/YYYY` vs. "mid-Sept"; cents vs. no monetary figure at all. Nothing here is ready to compare, let alone merge.

## Step by step

### Step 1: Define the canonical schema

```python
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class AccountSnapshot:
    customer_id: str
    plan: str
    seats: Optional[int] = None
    renews_on: Optional[str] = None   # ISO 8601 date, or None if unknown
    mrr_usd: Optional[float] = None
    notes: list[str] = field(default_factory=list)
    source: str = ""
```

> **Why this step?** The canonical schema is the contract every source maps into. Once it exists, the merge and conflict-detection logic downstream only ever has to understand one shape — three sources or thirty, the comparison code doesn't change.

### Step 2: Write one normalizer per source

```python
from datetime import datetime

def normalize_crm(raw: dict) -> AccountSnapshot:
    return AccountSnapshot(
        customer_id=raw["custId"].split("-")[-1],
        plan=raw["planName"],
        seats=raw["seatsUsed"],
        renews_on=raw["renewsOn"],           # already ISO 8601
        source="crm",
    )

def normalize_billing(raw: dict) -> AccountSnapshot:
    renews = datetime.strptime(raw["next_invoice_date"], "%m/%d/%Y").date().isoformat()
    return AccountSnapshot(
        customer_id=raw["customer_id"],
        plan=raw["plan"].split("_")[0].title(),   # "PRO_MONTHLY" -> "Pro"
        seats=raw["active_seats"],
        renews_on=renews,
        mrr_usd=raw["mrr_cents"] / 100,
        source="billing",
    )

def normalize_ticket_note(raw_text: str, customer_id: str) -> AccountSnapshot:
    # No structured fields exist here - extract what's confidently readable
    # and leave the rest missing rather than guessing at it.
    return AccountSnapshot(
        customer_id=customer_id,
        plan="Pro",
        seats=8,
        renews_on=None,      # "mid-Sept" is not a date - don't fabricate one
        notes=["customer emailed asking about downgrading to 5 seats"],
        source="ticket-system",
    )
```

> **Why this step?** Unit and format mismatches get resolved exactly once, here, instead of leaking into the merged block or being left for the model to reconcile at inference time. Just as important: a missing value stays `None`, never a guess. `renews_on=None` for the ticket note is correct — "mid-Sept" doesn't specify a day, and turning it into a fabricated `2026-09-15` would make a low-confidence source look exactly as precise as the CRM's exact date, with no way to tell the difference later.

### Step 3: Merge the normalized snapshots, flagging disagreement instead of hiding it

```python
def merge_snapshots(snapshots: list[AccountSnapshot]) -> str:
    lines = ["| Field | Value | Source |", "|---|---|---|"]
    resolved: dict[str, tuple] = {}
    for snap in snapshots:
        for f in ("plan", "seats", "renews_on", "mrr_usd"):
            val = getattr(snap, f)
            if val is None:
                continue
            if f not in resolved:
                resolved[f] = (val, snap.source)
            elif resolved[f][0] != val:
                lines.append(f"| {f} (conflict) | {resolved[f][0]} vs {val} "
                             f"| {resolved[f][1]} vs {snap.source} |")
    for f, (val, src) in resolved.items():
        lines.append(f"| {f} | {val} | {src} |")
    for snap in snapshots:
        for note in snap.notes:
            lines.append(f"| note | {note} | {snap.source} |")
    return "\n".join(lines)
```

> **Why this step?** This is where normalization meets the resolution logic covered in [Merging Context From Many Sources](/learn/context-engineering/merging-multi-source-context) — every value carries its source, and a genuine disagreement produces an explicit conflict row instead of one value silently overwriting another.

### Step 4: The merged block the model actually reads

```
| Field | Value | Source |
|---|---|---|
| plan | Pro | crm |
| seats | 8 | crm |
| renews_on | 2026-09-14 | crm |
| mrr_usd | 240.0 | billing |
| note | customer emailed asking about downgrading to 5 seats | ticket-system |
```

All three sources agree wherever they're comparable, so no conflict rows appear — the model reads one clean table instead of three payloads in three different shapes and formats, and every value is still traceable to where it came from.

## Where it breaks (+fix)

**A genuine conflict, not just a formatting difference.** Suppose the billing system hasn't synced yet and reports `active_seats: 6` while the CRM says `8`. With the normalizers above, that surfaces correctly as:

```
| seats (conflict) | 8 vs 6 | crm vs billing |
```

instead of one value quietly winning. Deciding *which* value to trust — recency, source authority, or a specific rule for this domain — is the resolution step covered in [Merging Context From Many Sources](/learn/context-engineering/merging-multi-source-context); normalization's job stops at making the conflict visible in the first place. Without it, `"8"` and `6` (or `"PRO_MONTHLY"` against `"Pro"` for a genuinely matching plan) would never even be compared as the same field, and the conflict would be invisible rather than resolved.

**A source normalizer itself fails.** If `billing`'s response is missing `next_invoice_date` and `normalize_billing` throws on the `strptime` call, don't let one bad source take down the whole merge:

```python
def safe_normalize(fn, raw, source_name):
    try:
        return fn(raw)
    except Exception:
        return AccountSnapshot(customer_id="", plan="", source=f"{source_name} (unavailable)")
```

A merged block with one source flagged unavailable is far more useful than a crashed tool call and no data at all.

## Takeaways

Normalize before you compare, merge, or deduplicate — never after. Treat "missing" and "wrong" as distinct states; coercing an absent value into a guess destroys the very signal that would tell you to distrust it. And attribute every value to its source through the normalization step itself, so that whatever merge logic runs next has the provenance it needs to label conflicts instead of erasing them.

**Related:** [Merging Context From Many Sources](/learn/context-engineering/merging-multi-source-context) · [Merging Context from Multiple Tools Without Contradictions](/learn/context-engineering/multi-source-context-merging) · [Structured Context Injection](/learn/context-engineering/structured-context-injection) · [Deduping Overlapping Tool Results](/learn/context-engineering/deduping-overlapping-tool-results)
