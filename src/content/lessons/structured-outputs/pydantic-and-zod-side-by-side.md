---
title: "Pydantic and Zod Side by Side"
track: "structured-outputs"
status: live
summary: "The same user-with-orders schema in Pydantic and Zod, lined up field by field, with the ergonomic gaps called out."
duration: "7 min read"
---

The two previous lessons built the same schema twice, once per stack. This one puts them next to each other and asks the question you actually have when you're moving between the two: which parts translate directly, and which parts have a trap in them.

## The setup

One schema, two languages: a `User` with an optional/nullable `email`, and a nested `orders` array of `Order` objects with a bounded `quantity` and `unit_price`. Same data, same constraints, written twice.

```python
# Pydantic
from pydantic import BaseModel, ConfigDict, Field

class Order(BaseModel):
    model_config = ConfigDict(extra="forbid")
    order_id: str
    item: str
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)

class User(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_id: str
    name: str
    email: str | None = None
    orders: list[Order]
```

```typescript
// Zod
import { z } from "zod";

const Order = z.object({
  order_id: z.string(),
  item: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
}).strict();

const User = z.object({
  user_id: z.string(),
  name: z.string(),
  email: z.string().nullable().optional(),
  orders: z.array(Order),
}).strict();
```

## Step by step

**Nesting.** `orders: list[Order]` and `orders: z.array(Order)` are a direct match — both recurse into the referenced schema, both generate a `$ref`-backed `items` block in the resulting JSON Schema. Nothing to trip on here.

> **Why this step?** Confirming the easy case first matters, because it means every difference below is a *real* ergonomic gap, not noise from picking a bad example.

**Closing the object.** Pydantic: `ConfigDict(extra="forbid")`. Zod: `.strict()`. Same job, opposite defaults underneath — Pydantic's un-configured default is to *ignore* extra keys (drop them silently on parse, schema stays open), Zod's un-configured default is to *strip* extra keys (also silent, also drops them, but through a different code path). Neither library refuses extra keys unless you ask.

> **Why this step?** This is the single most common bug when a team ports a schema from one stack to the other: someone translates every field faithfully and forgets that "closed by default" was never true in either library — see [The JSON Schema Subset That Matters](/learn/structured-outputs/json-schema-essentials-for-outputs).

**Bounded numbers.** Pydantic attaches the constraint to the field via `Field(gt=0)` / `Field(ge=0)` — metadata riding alongside the type. Zod chains it onto the type itself: `z.number().int().positive()`. Functionally identical in the emitted JSON Schema (`exclusiveMinimum: 0` either way), but notice the order dependency in Zod: `.int().positive()` and `.positive().int()` both work, but a constraint chained *before* a `.optional()` behaves differently than one chained after — Zod's fluent API executes left to right, so `.positive().optional()` and `.optional().positive()` are not typos of each other, they check different things in a different order.

> **Why this step?** This is the ergonomic gap that actually bites people: Pydantic's field constraints are declarative and order-independent; Zod's are a pipeline where order matters. Read a Zod chain the way you'd read a series of `.then()` calls, not a bag of options.

**Optional and nullable together.** Pydantic: `str | None = None` reads as one union type with a default. Zod: `.nullable().optional()` reads as two separate modifiers stacked. They land in the same place — the field may be absent *or* explicitly `null` — but Pydantic gets there by picking a type that includes `None`, while Zod gets there by composing two independent capabilities. This is worth internalizing on its own; see [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults) for the full four-way breakdown that both syntaxes are trying to express.

> **Why this step?** People coming from Zod to Pydantic often write `email: str = Field(default=None)` and think they've made the field nullable — but without `| None` in the type annotation, Pydantic will actually reject an explicit `null` at validation time even though the field has a default. The default and the nullability are two separate declarations in both libraries; Zod's syntax just makes that more visible.

## Where it breaks

Take the Pydantic version and add a field the Zod side doesn't have — say a `discount_code: str | None = None` — but forget to add `.strict()`'s equivalent guard in a hand-rolled Zod migration that used `.partial()` somewhere upstream. `.partial()` makes *every* field on an object optional in one call, which is convenient for PATCH-style update schemas and a landmine for extraction schemas: it silently turns `order_id`, `item`, and every other required field optional too, because it operates on the whole object, not the field you meant.

**The fix:** never reach for `.partial()` on an extraction schema. If you need a genuinely optional subset, mark those fields `.optional()` individually, or build the partial schema as a separate named type so it's obvious at the call site which contract you're validating against.

## Takeaways

- The mapping is close enough that a schema review in one language transfers to the other almost directly — treat that as licence to review once, not licence to skip translating carefully.
- Both libraries are open by default. Closing the object (`extra="forbid"` / `.strict()`) is a decision you make every time, at every nesting level, not a starting condition.
- Pydantic constraints are declarative metadata; Zod constraints are an ordered pipeline. The difference only bites when you chain modifiers, so read Zod chains left to right and don't assume commutativity.
- `.partial()` in Zod and any analogous "make everything optional" helper in Pydantic (there isn't a direct one, which is itself informative) are update-schema tools, not extraction-schema tools — reaching for them on the wrong side of that line quietly deletes your `required` list.

**Related:** [Pydantic Models for Extraction](/learn/structured-outputs/pydantic-models-for-extraction), [Zod Schemas for Extraction](/learn/structured-outputs/zod-schemas-for-extraction), [Pydantic and Zod: Deriving Schemas from Code](/learn/structured-outputs/pydantic-zod-schema-patterns), [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults)
