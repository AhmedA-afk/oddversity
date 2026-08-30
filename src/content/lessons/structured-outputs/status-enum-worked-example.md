---
title: "A Status Enum with a Safe Fallback"
track: "structured-outputs"
status: live
summary: "A ticket-status enum with and without an explicit other value, and what the model does when the real answer fits neither."
duration: "6 min read"
---

Four clean status values look like they cover every case — until a real ticket comes in that isn't quite any of them, and the schema has to decide what happens next.

## The setup

A support ticket status, modeled as an enum: `open`, `pending`, `resolved`, `closed`. The extraction task: read a ticket thread and report its current status. Most threads map cleanly onto one of the four. This one doesn't — the ticket was merged into a different ticket, and the original thread was never explicitly closed, resolved, or left pending; it just stopped being the active one.

```json
{
  "type": "object",
  "properties": {
    "ticket_id": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["open", "pending", "resolved", "closed"]
    }
  },
  "required": ["ticket_id", "status"],
  "additionalProperties": false
}
```

## Step by step

**Step 1 — run the merged-ticket thread through the four-value schema.** The model has to pick one of exactly four strings; there is no fifth option to reach for.

```json
{ "ticket_id": "T-5521", "status": "closed" }
```

> **Why this step?** This is the force-fit in action. "Closed" is the closest of the four available labels — the ticket is no longer active — but it's not true. A closed ticket in this system means resolved-and-done; a merged ticket means something structurally different (its history moved elsewhere, no resolution was reached under this ID). Nothing in the output signals that a judgment call happened here. It reads exactly like every other genuinely-closed ticket in the dataset.

**Step 2 — add an explicit escape hatch to the enum.**

```json
{
  "status": {
    "type": "string",
    "enum": ["open", "pending", "resolved", "closed", "other"],
    "description": "Use 'other' when the ticket's state doesn't match any listed status, e.g. merged, duplicate, or reassigned."
  },
  "status_detail": {
    "type": ["string", "null"],
    "description": "Required when status is 'other': a short free-text note on the actual state."
  }
}
```

> **Why this step?** `other` alone tells you a mismatch happened, but by itself it throws away the actual information — you'd know something didn't fit without knowing what. Pairing it with a nullable free-text `status_detail` gives the model somewhere to put the specific fact ("merged into T-5518") instead of forcing it into a lossy binary of fits/doesn't-fit. This is the same pairing pattern as an uncertain value plus a reason field — see [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults).

**Step 3 — run the same thread through the extended schema.**

```json
{
  "ticket_id": "T-5521",
  "status": "other",
  "status_detail": "Merged into T-5518; no independent resolution."
}
```

> **Why this step?** Now the output is honest instead of confidently wrong, and it's still structured — `status: "other"` is a value your code can branch on (route to a human, or to a merge-reconciliation step) exactly as cleanly as it branches on `"closed"`. The free-text detail is there for a human to read, not for code to parse, which is fine — it's not pretending to be more structured than it is.

## Where it breaks (+ fix)

**The break:** an enum with a fallback but no paired detail field still loses information, just less of it — you'd know a ticket didn't fit but not why, which is only marginally more useful than not knowing a mismatch happened at all if a human has to go re-read the source thread anyway to find out what actually occurred.

**The fix:** always pair an `other`/`unknown` enum value with a free-text field that becomes meaningful exactly when the enum value is the fallback — required-if-other rather than always-required, since it would just be empty noise on the normal cases.

**The break, other direction:** an enum where *every* value has become "other" in practice — because the four original categories were drawn too narrowly for the actual input distribution — is a sign the enum itself needs redesigning, not that the fallback is failing. If more than a small fraction of real cases land on `other`, that's feedback about the category list, not a validation problem.

**The fix:** treat a high `other` rate as a schema review trigger. Look at what's landing there and consider promoting a common pattern (like "merged") into its own first-class enum value.

## Takeaways

- An enum with no escape hatch doesn't prevent the out-of-range case from happening — it just prevents the model from telling you it happened. The ticket still gets mislabeled; you've only lost the signal.
- Pair `other`/`unknown` with a nullable detail field so the fallback carries information instead of just flagging a gap.
- Track how often the fallback fires. It's a live signal about whether your category list actually matches your input distribution, not just an escape valve to set once and forget.

**Related:** [Enums, Literals, and Bounded Fields](/learn/structured-outputs/enums-and-constrained-value-fields), [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults), [Enums: Locking a Field to a Fixed Set of Values](/learn/structured-outputs/enums-and-constrained-fields), [The Optional-vs-Nullable Bugs](/learn/structured-outputs/optional-vs-nullable-mistakes)
