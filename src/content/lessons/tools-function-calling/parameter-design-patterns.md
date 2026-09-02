---
title: "Parameter Design Patterns"
track: "tools-function-calling"
status: live
summary: "Flat structures, enums over free text, honest required sets, and documented defaults — the patterns that make parameters easy for a model to fill correctly."
duration: "7 min read"
---

Two schemas can describe the exact same API call and produce wildly different fill rates from the model. The difference is almost never the API — it's whether the parameters are shaped the way a model naturally produces JSON, or shaped the way your backend happens to store data.

## What it is

Four patterns cover most of what separates an easy-to-fill schema from a hard one:

1. **Flat over nested.** Every extra level of object nesting is a place the model can put a field at the wrong depth, or forget a level entirely.
2. **Enums over free text for closed sets.** If there are five valid values and you know all five, say so — don't make the model guess a string that has to match exactly.
3. **Explicit, honest `required`.** Required means "the call fails without this," not "this is usually present." Optional fields the model tends to skip anyway aren't a schema problem — they're a description problem.
4. **Defaults documented in prose, not left implicit.** If a field has a sensible default, say what it is in the description. An undocumented default means the model either always fills the field (wasting effort and risking a wrong guess) or sometimes omits it and gets inconsistent behavior downstream.

## Illustrated on `book_flight`

**Anti-pattern — nested, no enums, dishonest required:**

```json
{
  "name": "book_flight",
  "input_schema": {
    "type": "object",
    "properties": {
      "trip": {
        "type": "object",
        "properties": {
          "origin": {
            "type": "object",
            "properties": { "airport_code": { "type": "string" } }
          },
          "destination": {
            "type": "object",
            "properties": { "airport_code": { "type": "string" } }
          },
          "cabin_class": { "type": "string" }
        }
      },
      "passenger_count": { "type": "integer" }
    },
    "required": ["trip", "passenger_count"]
  }
}
```

Every problem in one place: `trip.origin.airport_code` is three levels deep for a single string; `cabin_class` is a free string when the airline only sells four cabins; `passenger_count` is required but `trip` — an object with no required sub-fields of its own — technically validates even when empty, so `required: ["trip", "passenger_count"]` gives false confidence that origin and destination are guaranteed present.

**Applying the patterns:**

```json
{
  "name": "book_flight",
  "description": "Book a flight for the user. Requires an origin, destination, and departure date.",
  "input_schema": {
    "type": "object",
    "properties": {
      "origin_airport_code": {
        "type": "string",
        "description": "3-letter IATA airport code for departure, e.g. SFO."
      },
      "destination_airport_code": {
        "type": "string",
        "description": "3-letter IATA airport code for arrival, e.g. JFK."
      },
      "departure_date": {
        "type": "string",
        "description": "Departure date, YYYY-MM-DD."
      },
      "cabin_class": {
        "type": "string",
        "enum": ["economy", "premium_economy", "business", "first"],
        "description": "Defaults to economy if the user doesn't specify."
      },
      "passenger_count": {
        "type": "integer",
        "description": "Number of passengers. Defaults to 1."
      }
    },
    "required": ["origin_airport_code", "destination_airport_code", "departure_date"]
  }
}
```

Flat: five sibling properties, zero nesting. Enum: `cabin_class` can't drift into `"Business Class"` or `"biz"`. Honest required: exactly the three fields the booking can't proceed without — a flight needs an origin, destination, and date; it does not strictly need a passenger count or cabin class to be *attempted*, since both have sane defaults. Documented defaults: `cabin_class` and `passenger_count` tell the model what happens if it says nothing, so it doesn't have to guess whether omitting them is safe.

## When nesting is unavoidable

Not every parameter set flattens cleanly. `book_flight` with multiple passengers, each needing their own name and seat preference, genuinely needs an array of objects:

```json
"passengers": {
  "type": "array",
  "description": "One entry per passenger. If the user only gives a count, generate that many entries with type 'adult' and no name.",
  "items": {
    "type": "object",
    "properties": {
      "full_name": { "type": "string" },
      "passenger_type": {
        "type": "string",
        "enum": ["adult", "child", "infant"]
      }
    }
  }
}
```

This is legitimate nesting — the data really is a list of records, not a single record wearing extra layers. The rule isn't "never nest," it's "nest only when the underlying data is actually plural or actually composite." A `location` that's really just a city string doesn't need to become `{city: {name: string}}`; a list of passengers genuinely is a list of records and should look like one.

A one-level array of flat objects is almost always fine. Two levels of nesting inside that — an array of objects that themselves contain nested objects — is where model reliability visibly drops; if you're tempted to go there, look for a way to hoist the inner object's fields up a level, or split into a follow-up tool call instead.

## Decision table

| Situation | Pattern |
|---|---|
| A field is really one flat value someone would type in one box | Keep it flat, sibling-level property |
| A field has a small, known, stable set of valid values | `enum` |
| A field has an open-ended or frequently-changing set of values | Free string with description — see /learn/tools-function-calling/enum-vs-freeform-parameters |
| The API call fails without this field | `required` |
| The API call succeeds without this field, using a fallback | Optional, with the fallback stated in the description |
| The data is genuinely a list of records (passengers, attendees, line items) | Array of flat objects — one level of nesting, no deeper |

## Where next

For the enum decision specifically, /learn/tools-function-calling/enum-vs-freeform-parameters goes deeper on the tradeoff and gives a concrete rule of thumb. For turning these patterns into finished prose, see /learn/tools-function-calling/writing-descriptions-models-follow-deep — a well-flattened schema still needs good descriptions to be filled correctly.

**Related:** /learn/tools-function-calling/json-schema-for-tools-essentials · /learn/tools-function-calling/enum-vs-freeform-parameters · /learn/tools-function-calling/designing-a-tool-schema-walkthrough · /learn/tools-function-calling/schema-design-common-mistakes · /learn/tools-function-calling/writing-descriptions-models-follow-deep
