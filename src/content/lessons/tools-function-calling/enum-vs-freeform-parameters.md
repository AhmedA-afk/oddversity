---
title: "Enum vs. Free-Form Parameters"
track: "tools-function-calling"
status: live
summary: "Four ways to constrain a status-like parameter, compared on accuracy, forward compatibility, and how invalid values surface."
duration: "7 min read"
---

"Should this be an enum?" comes up on nearly every schema you write, and the answer isn't binary — there are at least four workable shapes for a constrained-but-not-fixed parameter, and picking the wrong one either breaks the moment your API adds a new value, or lets the model quietly invent values that don't exist.

## Strict enum

```json
"status": {
  "type": "string",
  "enum": ["pending", "shipped", "delivered", "cancelled", "refunded"],
  "description": "Filter to orders in this status."
}
```

**How it works:** the schema lists every valid value. The model picks from the list; nothing else is a legal choice as far as the schema communicates.

**When it wins:** the set is genuinely closed and stable — order statuses, days of the week, a fixed set of supported currencies. The model reliably matches user language ("shipped," "on its way," "sent") onto the correct enum member without you writing extra disambiguation, because enum membership itself is a strong signal.

**Failure mode:** the set isn't as closed as you thought. Someone adds a `"backordered"` status to the underlying system, the enum doesn't get updated, and now the model either forces a bad fit into an existing value or can't represent a real state at all. Enums lag their source of truth by construction — they're only as good as your process for keeping them in sync.

**Relative cost:** near zero at call time — it's the cheapest option to fill correctly. The cost shows up later, as an engineering-process cost: someone has to remember to update the schema when the underlying set changes.

## Free-form string

```json
"status": {
  "type": "string",
  "description": "Order status to filter by, e.g. 'shipped' or 'cancelled'."
}
```

**How it works:** no constraint at all. The model writes whatever string it thinks fits, guided only by the description's examples.

**When it wins:** the set is genuinely open or you don't control it — a `tag` field on user-created labels, a search `query`, a `city` name. Forcing these into an enum is either impossible (infinite set) or actively wrong (a city enum would need constant maintenance and still miss most cities).

**Failure mode:** for anything that *looks* like a closed set but is given as free text, the model introduces variance you didn't ask for — `"Shipped"`, `"SHIPPED"`, `"shipped "`, `"on the way"` all show up for the same underlying status, and your dispatcher has to normalize or reject each one after the fact instead of the model being constrained up front.

**Relative cost:** cheapest to write, most expensive to consume — every caller of the API downstream of this field needs its own normalization or fuzzy-matching layer.

## Validated string (documented pattern, unenforced)

```json
"promo_code": {
  "type": "string",
  "description": "Promo code, 6-10 uppercase letters and digits, e.g. SAVE2026. Do not invent one — only pass a code the user explicitly gave you."
}
```

**How it works:** still a plain string in the schema — `pattern` in JSON Schema is frequently ignored at generation time (see /learn/tools-function-calling/json-schema-for-tools-essentials), so the constraint lives entirely in the description's prose, and your code re-validates it after the call returns.

**When it wins:** values that follow a format but come from the user or an external source rather than a fixed list — promo codes, order numbers, email addresses. You can't enumerate them, but you can describe their shape precisely enough that the model either passes through a real one or declines to invent a plausible-looking fake.

**Failure mode:** the model occasionally still hallucinates a value that matches the *stated format* but isn't real — a syntactically valid but nonexistent promo code, because the description described the shape but the model still had to produce something and defaulted to pattern-matching rather than refusing. The explicit "do not invent one" sentence is what mitigates this, not the format description alone.

**Relative cost:** moderate — you're trading enum-maintenance cost for validation-code cost, and you still need the anti-hallucination sentence doing real work in the description.

## Hybrid: enum with an escape hatch

```json
"status": {
  "type": "string",
  "enum": ["pending", "shipped", "delivered", "cancelled", "refunded", "other"],
  "description": "Order status. Use 'other' if the user describes a status not in this list, and put their exact words in status_note."
},
"status_note": {
  "type": "string",
  "description": "Only used when status is 'other' — the user's own words for the status they're asking about."
}
```

**How it works:** the closed set stays an enum for the accuracy benefits, but adds an explicit `"other"` member paired with a free-text companion field, so a value outside the known set doesn't get force-fit into the wrong enum member.

**When it wins:** the set is *mostly* closed but you've been burned before by an enum silently dropping real states, or the set changes often enough that a gap between deploys is expected. This is the safety valve for teams that want enum accuracy without enum brittleness.

**Failure mode:** if `"other"` is easy to reach for, the model reaches for it more than intended — you've reintroduced some of free text's variance, just funneled through one enum member and a side field instead of the main one. It also adds a small amount of downstream complexity, since `"other"` now needs its own handling path.

**Relative cost:** highest of the four to design well — you're maintaining an enum *and* a free-text fallback path *and* the logic that reconciles them — but it fails the most gracefully of the four when the closed set turns out not to be closed.

## Decision table

| Situation | Choice | What it prevents |
|---|---|---|
| Set is closed and stable (order status, weekday, currency you support) | Strict enum | Value drift ("Shipped" vs "shipped") |
| Set is genuinely open (city, free-text query, user tag) | Free-form string | Impossible or actively-wrong enumeration |
| Value has a format but comes from outside your system (promo code, order ID) | Validated string + anti-hallucination sentence | The model treating a shape-hint as license to invent one |
| Set is mostly closed but has known or expected gaps | Enum + escape hatch | Silent mis-mapping when the enum falls behind reality |

## How to choose

Ask two questions in order. First: **do I control the full list of valid values, and will it stay small and stable?** If yes, use an enum — it's the cheapest option at call time and the accuracy gain is real. If no — the list is open, external, or you're not confident it's complete — don't force it into an enum just for the sake of constraint; that's how enums end up silently wrong.

Second, only if you said no to the first question: **does the value have a recognizable shape even though the set isn't closed?** If yes, use a validated string with the shape and an explicit anti-invention instruction in the description. If the value has no recognizable shape at all — it's genuinely open text — a plain free-form string is correct and adding constraint would only add false confidence.

Reach for the hybrid pattern only when you've already shipped a strict enum and watched it fall behind reality at least once. It's the right answer for a known recurring problem, not a default starting point — start with a plain enum for closed sets, per /learn/tools-function-calling/tool-schema-design-cheatsheet, and add the escape hatch when you have evidence you need it.

**Related:** /learn/tools-function-calling/parameter-design-patterns · /learn/tools-function-calling/json-schema-for-tools-essentials · /learn/tools-function-calling/schema-design-common-mistakes · /learn/tools-function-calling/tool-schema-design-cheatsheet · /learn/tools-function-calling/schema-versioning-strategies
