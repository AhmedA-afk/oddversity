---
title: "An Event Stream as a Discriminated Union"
track: "structured-outputs"
status: live
summary: "A click-purchase-error event log built as a tagged union in Pydantic and Zod, plus an untagged version caught mis-parsing silently."
duration: "8 min read"
---

An analytics event stream is the clearest real-world case for a discriminated union: every event shares a timestamp, almost nothing else, and treating them as one flat shape either loses information or fills the schema with fields that are meaningless for most events.

## The setup

Three event types feeding one `events` array: `click` (an element was interacted with), `purchase` (a transaction completed), and `error` (something failed). Each carries a `type` tag plus fields specific to that event, and nothing else. The goal is a schema where a `purchase` event is structurally required to carry `amount_cents`, a `click` event is structurally required to carry `element_id`, and neither can accidentally satisfy the other's shape.

## Step by step

**Step 1 — define the three variants in Pydantic, tagged with `Literal`.**

```python
from typing import Literal, Union, Annotated
from pydantic import BaseModel, ConfigDict, Field

class ClickEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["click"]
    element_id: str
    timestamp: str

class PurchaseEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["purchase"]
    sku: str
    amount_cents: int = Field(ge=0)
    timestamp: str

class ErrorEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["error"]
    code: str
    message: str
    timestamp: str
```

> **Why this step?** `Literal["click"]` isn't just documentation — it's a one-value type that only accepts the exact string `"click"`. That's what lets Pydantic use `type` as a real discriminator instead of just another string field to check after the fact.

**Step 2 — wire the three variants into a discriminated union.**

```python
Event = Annotated[
    Union[ClickEvent, PurchaseEvent, ErrorEvent],
    Field(discriminator="type"),
]

class EventLog(BaseModel):
    model_config = ConfigDict(extra="forbid")
    events: list[Event]
```

> **Why this step?** `Field(discriminator="type")` tells Pydantic to dispatch on the `type` value *before* attempting full validation against any branch — it looks up the matching model by tag directly, rather than trying `ClickEvent`, then `PurchaseEvent`, then `ErrorEvent` in sequence and hoping exactly one fits.

**Step 3 — the same three variants in Zod, using `z.discriminatedUnion`.**

```typescript
import { z } from "zod";

const ClickEvent = z.object({
  type: z.literal("click"),
  element_id: z.string(),
  timestamp: z.string(),
}).strict();

const PurchaseEvent = z.object({
  type: z.literal("purchase"),
  sku: z.string(),
  amount_cents: z.number().int().nonnegative(),
  timestamp: z.string(),
}).strict();

const ErrorEvent = z.object({
  type: z.literal("error"),
  code: z.string(),
  message: z.string(),
  timestamp: z.string(),
}).strict();

const Event = z.discriminatedUnion("type", [ClickEvent, PurchaseEvent, ErrorEvent]);

const EventLog = z.object({
  events: z.array(Event),
}).strict();
```

> **Why this step?** `z.discriminatedUnion("type", [...])` is doing exactly what `Field(discriminator="type")` does on the Pydantic side — Zod reads `type` first and validates only against the matching schema, instead of Zod's plain `z.union([...])`, which tries every listed schema in order until one succeeds.

**Step 4 — parse a mixed list.**

```python
raw = '''
{
  "events": [
    { "type": "click", "element_id": "btn-checkout", "timestamp": "2026-08-29T10:02:11Z" },
    { "type": "purchase", "sku": "SKU-118", "amount_cents": 4200, "timestamp": "2026-08-29T10:02:47Z" },
    { "type": "error", "code": "E_TIMEOUT", "message": "Payment gateway timed out", "timestamp": "2026-08-29T10:03:01Z" }
  ]
}
'''

log = EventLog.model_validate_json(raw)
for e in log.events:
    print(type(e).__name__, e.type)
# ClickEvent click
# PurchaseEvent purchase
# ErrorEvent error
```

> **Why this step?** Each item comes back as its own concrete class — `e` in the loop above is genuinely a `PurchaseEvent` with an `amount_cents` attribute for the second entry, not a generic dict you'd need an `if`/`elif` chain on `type` to safely access. The discriminator did the dispatching once, at parse time, instead of your code re-doing it every time it reads an event.

## Where it breaks (+ fix)

**The break — an untagged union with an accidentally optional field.** Suppose, trying to save schema space, someone builds this without tags and without `.strict()`, and makes `element_id` optional on `ClickEvent` because a handful of older click events genuinely lack it:

```typescript
const ClickEventLoose = z.object({
  type: z.string(),
  element_id: z.string().optional(),
  timestamp: z.string(),
});

const EventLoose = z.union([ClickEventLoose, PurchaseEvent, ErrorEvent]);
```

`z.union` (unlike `z.discriminatedUnion`) tries each schema in the order given and returns the first success. Feed it a real `ErrorEvent`:

```json
{ "type": "error", "code": "E_TIMEOUT", "message": "Payment gateway timed out", "timestamp": "2026-08-29T10:03:01Z" }
```

Without `.strict()`, `ClickEventLoose` doesn't reject unrecognized keys — it just ignores `code` and `message`. Its only required fields are `type` (any string — the loose version typed it as `z.string()`, not a literal) and `timestamp`, both of which this object has. **This error event validates successfully as a `ClickEventLoose`, with `element_id` silently absent, and `code`/`message` silently dropped on the floor.** Nothing throws. The parsed result is a `ClickEvent`-shaped object where a real error occurred and no part of your code will ever see `code` or `message` again.

**The fix:** the `type` field must be a literal per variant (`z.literal("click")`, not `z.string()`), every variant must be `.strict()` so extra fields are rejected rather than dropped, and the union itself must be built with `z.discriminatedUnion` (or Pydantic's `Field(discriminator=...)`) so the tag is checked before any attempt at a full-shape match — not `z.union`/a plain `Union` tried in first-match order.

## Takeaways

- A discriminated union is only as safe as three things holding together: a literal (not string) tag on every variant, closed objects (`.strict()` / `extra="forbid"`) so stray fields can't be silently absorbed, and a library construct that dispatches on the tag rather than trying branches by shape.
- Drop any one of those three and you get a schema that still looks tagged in the code but behaves like an untagged union at parse time — the failure is invisible until you go looking for it, because nothing errors.
- Both Pydantic and Zod's native discriminated-union support does all three correctly by construction; the break shown above only happens when someone reaches for the generic `Union`/`z.union` instead.

**Related:** [Discriminated Unions for Heterogeneous Items](/learn/structured-outputs/discriminated-unions-for-variants), [Discriminated Unions: One Field Deciding the Shape of the Rest](/learn/structured-outputs/discriminated-unions-in-schemas), [Pydantic Models for Extraction](/learn/structured-outputs/pydantic-models-for-extraction), [Zod Schemas for Extraction](/learn/structured-outputs/zod-schemas-for-extraction)
