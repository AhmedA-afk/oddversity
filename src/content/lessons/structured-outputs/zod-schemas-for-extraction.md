---
title: "Zod Schemas for Extraction"
track: "structured-outputs"
status: live
summary: "Build the TypeScript equivalent of a user-with-orders extraction in Zod, and compare its error shape to Pydantic's."
duration: "7 min read"
---

Everything [Pydantic Models for Extraction](/learn/structured-outputs/pydantic-models-for-extraction) does on the Python side, Zod does on the TypeScript side — with the definition order flipped. Pydantic derives a schema from a class; Zod builds the schema first, and your static type comes out of it.

## What we're building

The same customer-with-orders shape from the Pydantic lesson, so the two are directly comparable: a `User` object with a nested array of `Order` objects, one optional/nullable field, and a fully closed shape.

## Setup

```bash
npm install zod
```

The examples below use Zod 3's API (`z.object`, `.strict()`, `z.infer`).

## Build it

### Step 1: Define the nested schema first

```typescript
import { z } from "zod";

const Order = z.object({
  order_id: z.string(),
  item: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
}).strict();
```

`.strict()` is Zod's version of `additionalProperties: false` — without it, a Zod object silently *strips* unrecognized keys during parsing rather than rejecting them, which is a different default failure mode than Pydantic's "ignore" but the same underlying gap: nothing tells you an extra key showed up. Set `.strict()` on every object in the tree, the same way you'd set `extra="forbid"` on every Pydantic model — see [The JSON Schema Subset That Matters](/learn/structured-outputs/json-schema-essentials-for-outputs).

### Step 2: Define the top-level schema

```typescript
const User = z.object({
  user_id: z.string(),
  name: z.string(),
  email: z.string().email().nullable().optional(),
  orders: z.array(Order),
}).strict();
```

`z.array(Order)` is the nested-array story here — same idea as Pydantic's `list[Order]`, just spelled differently. `email` chains `.nullable().optional()`, which is worth reading carefully: `.nullable()` allows an explicit `null`, `.optional()` allows the key to be absent entirely, and together they allow both — the TypeScript-side equivalent of Pydantic's `str | None = None`. [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults) walks through why you'd want one, the other, or both.

### Step 3: Get the static type with `z.infer`

```typescript
type User = z.infer<typeof User>;
// {
//   user_id: string;
//   name: string;
//   email?: string | null | undefined;
//   orders: { order_id: string; item: string; quantity: number; unit_price: number }[];
// }
```

This is Zod's core trade with Pydantic: Pydantic starts from a class and derives the schema; Zod starts from the schema and derives the type. Either way you get exactly one definition instead of a class and a schema that can quietly drift apart — see [Pydantic and Zod: Deriving Schemas from Code](/learn/structured-outputs/pydantic-zod-schema-patterns) for the general pattern.

### Step 4: Parse a response — `.parse` vs `.safeParse`

```typescript
const rawResponse = `{
  "user_id": "u_9284",
  "name": "Priya Shah",
  "email": null,
  "orders": [
    { "order_id": "o_1", "item": "Desk lamp", "quantity": 2, "unit_price": 24.5 },
    { "order_id": "o_2", "item": "Notebook", "quantity": 5, "unit_price": 3.0 }
  ]
}`;

const user = User.parse(JSON.parse(rawResponse));
console.log(user.orders[0].item); // "Desk lamp"
```

`.parse` throws a `ZodError` on failure — fine for a script where an invalid response should halt execution, wrong for a request-handling path where you want to inspect the failure and respond gracefully. `.safeParse` never throws:

```typescript
const result = User.safeParse(JSON.parse(rawResponse));

if (!result.success) {
  console.log(result.error.issues);
} else {
  const user = result.data; // fully typed, guaranteed valid
}
```

`result` is a discriminated union itself — `{ success: true, data: User }` or `{ success: false, error: ZodError }` — so TypeScript narrows `result.data` to be safely accessible only inside the `success` branch, no manual type assertion needed.

## Run it

Send the same malformed order that broke the Pydantic example — a negative quantity:

```typescript
const badResponse = `{
  "user_id": "u_9284",
  "name": "Priya Shah",
  "orders": [
    { "order_id": "o_1", "item": "Desk lamp", "quantity": -2, "unit_price": 24.5 }
  ]
}`;

const result = User.safeParse(JSON.parse(badResponse));
if (!result.success) {
  console.log(result.error.issues);
}
```

`result.error.issues` is an array of structured objects:

```typescript
[
  {
    code: "too_small",
    minimum: 0,
    type: "number",
    inclusive: false,
    exact: false,
    message: "Number must be greater than 0",
    path: ["orders", 0, "quantity"]
  }
]
```

Line this up against Pydantic's `e.errors()` from the previous lesson and the shapes are close enough to be the same idea in two dialects: `path`/`loc` gives the exact field, `code`/`type` names the failure class, `message`/`msg` is the human-readable text. If you're building a repair loop or a validation-error monitor that has to work across a Python service and a TypeScript one, this parallel structure is what makes one piece of routing logic portable across both — see [validation and auto-repair](/learn/structured-outputs/validation-and-auto-repair).

## Harden it

- **`.strict()` on every nested object**, not just the outer one — `Order` needs it independently of `User`.
- **Prefer `.safeParse` in any request path.** Reach for `.parse` only in scripts and tests where an uncaught throw is an acceptable failure mode.
- **Add `.describe("...")` to fields whose meaning isn't obvious from the name alone** — it flows into the generated JSON Schema as a `description`, the same inline-instruction effect covered in [Field Descriptions Are Inline Prompts](/learn/structured-outputs/field-descriptions-as-prompts).
- **Don't parse before you `JSON.parse`.** `User.parse` expects a JS object, not a raw string — a malformed-JSON response throws a `SyntaxError` from `JSON.parse`, not a `ZodError`, so wrap both in the same try/catch if you want one failure path.

## Extend it

From here, model a status-like field as `z.enum([...])` with an escape hatch ([A Status Enum with a Safe Fallback](/learn/structured-outputs/status-enum-worked-example)), or give `orders` genuinely different item shapes with `z.discriminatedUnion` ([An Event Stream as a Discriminated Union](/learn/structured-outputs/event-log-discriminated-union-example) walks the pattern in detail). For a direct comparison of every choice made in this lesson against its Pydantic counterpart, see [Pydantic and Zod Side by Side](/learn/structured-outputs/pydantic-and-zod-side-by-side).

**Related:** [Pydantic Models for Extraction](/learn/structured-outputs/pydantic-models-for-extraction), [The JSON Schema Subset That Matters](/learn/structured-outputs/json-schema-essentials-for-outputs), [Pydantic and Zod: Deriving Schemas from Code](/learn/structured-outputs/pydantic-zod-schema-patterns), [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults)
