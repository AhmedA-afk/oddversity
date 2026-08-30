---
title: "Field Design Decision Table"
track: "structured-outputs"
status: live
summary: "A one-page lookup: given a value's nature, which field construct to reach for in Pydantic and Zod, and where to start."
duration: "5 min read"
---

Use this when you're staring at a field and not sure which of the tools from this module actually applies. Each row names the value's nature, the default construct in both stacks, and a note on when to deviate.

## The decision table

| Value's nature | Pydantic | Zod | Note |
|---|---|---|---|
| Categorical, small fixed set | `Literal["a", "b", "c"]` | `z.enum(["a", "b", "c"])` | **Start here, then measure.** Add an `"other"` value if the input distribution has edge cases — see [A Status Enum with a Safe Fallback](/learn/structured-outputs/status-enum-worked-example). |
| One of several genuinely different shapes | `Annotated[Union[...], Field(discriminator="type")]` | `z.discriminatedUnion("type", [...])` | Needs a shared literal tag field on every variant. Never a plain `Union`/`z.union`. |
| May be absent, and absence just means "skip it" | `field: T \| None = None` | `field: z.T().optional()` | Only when omission itself carries no meaning worth capturing. |
| Always present, but value may be legitimately unknown | `field: T \| None` (no default) | `field: z.T().nullable()` | Forces an explicit `null` instead of letting the model choose to omit the key. |
| Should fall back to a specific value when absent | `field: T = default_value` | `field: z.T().default(default_value)` | Only use when the default and "the model didn't say" are safe to treat identically. |
| Must always carry real information, no escape valve | `field: T` (no default, non-optional type) | `field: z.T()` | Every missing case here is a validation failure, by design — don't soften it with a default. |
| Bounded number (range known) | `Field(ge=0, le=100)` | `z.number().min(0).max(100)` | Catches typos and unit errors, not semantic wrongness within range. |
| Fixed-shape string, not enumerable | `Field(pattern=r"^...$")` | `z.string().regex(/.../)` | Prefer an enum instead if the actual value set is small and known. |
| Repeating multi-field record | `list[Item]` (Item is its own model) | `z.array(Item)` | Never parallel arrays — see [Modeling Nested Objects and Arrays](/learn/structured-outputs/designing-nested-and-array-fields). |
| Fixed, non-repeating group of related fields | nested `BaseModel` | nested `z.object({...})` | Promote to its own named type once it passes two or three fields. |
| Free-form or unpredictable extra data | named optional fields, not `dict[str, Any]` | named optional fields, not `z.any()` | An open catch-all validates nothing — see [Schema-Shape Antipatterns](/learn/structured-outputs/schema-shape-antipatterns). |

## Closing the object — do this regardless of row

Every object in the schema, at every nesting level, needs to be closed explicitly — neither library does it by default:

```python
model_config = ConfigDict(extra="forbid")   # Pydantic, per model
```
```typescript
.strict()                                   // Zod, per object
```

**Start here, then measure:** close every object by default, and only loosen a specific one if you've found a real case (an evolving upstream API, a genuinely unpredictable integration) where extra keys need to pass through. See [The JSON Schema Subset That Matters](/learn/structured-outputs/json-schema-essentials-for-outputs).

## The four-way presence check

Before finalizing any field, confirm which of these four you actually meant — they are independent, not synonyms:

1. **Optional** — key may be absent.
2. **Nullable** — key present, value may be `null`.
3. **Defaulted** — absence resolves to a specific value automatically.
4. **Required, no escape valve** — must always carry real data.

Full treatment: [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults). Common ways this goes wrong in practice: [The Optional-vs-Nullable Bugs](/learn/structured-outputs/optional-vs-nullable-mistakes).

## Quick snippets

**Enum with fallback (Pydantic):**
```python
status: Literal["open", "pending", "resolved", "closed", "other"]
status_detail: str | None = None
```

**Enum with fallback (Zod):**
```typescript
status: z.enum(["open", "pending", "resolved", "closed", "other"]),
status_detail: z.string().nullable().optional(),
```

**Discriminated union (Pydantic):**
```python
Event = Annotated[Union[ClickEvent, PurchaseEvent, ErrorEvent], Field(discriminator="type")]
```

**Discriminated union (Zod):**
```typescript
const Event = z.discriminatedUnion("type", [ClickEvent, PurchaseEvent, ErrorEvent]);
```

**Bounded number:**
```python
quantity: int = Field(gt=0)
```
```typescript
quantity: z.number().int().positive()
```

## When to reach past this table

This table covers single-field decisions. For whether a whole *structure* should be nested or flat, see [Modeling Nested Objects and Arrays](/learn/structured-outputs/designing-nested-and-array-fields). For whether a field's description is doing real work or just adding tokens, see [Field Descriptions Are Inline Prompts](/learn/structured-outputs/field-descriptions-as-prompts). For the antipatterns to check a finished schema against before shipping it, see [Schema-Shape Antipatterns](/learn/structured-outputs/schema-shape-antipatterns).

**Related:** [Optional, Nullable, Default, Missing](/learn/structured-outputs/optional-nullable-and-defaults), [Enums, Literals, and Bounded Fields](/learn/structured-outputs/enums-and-constrained-value-fields), [Discriminated Unions for Heterogeneous Items](/learn/structured-outputs/discriminated-unions-for-variants), [Pydantic and Zod Side by Side](/learn/structured-outputs/pydantic-and-zod-side-by-side)
