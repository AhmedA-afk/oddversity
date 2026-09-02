---
title: "Designing a Schema From a Fuzzy Requirement"
track: "tools-function-calling"
status: live
summary: "Walk create_calendar_event through three drafts to see how field choices, required sets, and defaults change what the model produces."
duration: "8 min read"
---

"Let the agent create calendar events" is a product sentence, not a schema. Turning it into `create_calendar_event` means making a dozen small decisions — and most of the bad schemas in production came from someone making all of them in one pass instead of iterating.

## What we're building

A `create_calendar_event` tool an agent can call when a user asks to schedule something. We'll take it through three drafts, each fixing a concrete failure the previous draft produced.

## Draft 1: the literal translation

The first instinct is to mirror the calendar API's own object shape:

```json
{
  "name": "create_calendar_event",
  "description": "Creates a calendar event.",
  "input_schema": {
    "type": "object",
    "properties": {
      "event": {
        "type": "object",
        "properties": {
          "summary": { "type": "string" },
          "start": {
            "type": "object",
            "properties": {
              "dateTime": { "type": "string" },
              "timeZone": { "type": "string" }
            }
          },
          "end": {
            "type": "object",
            "properties": {
              "dateTime": { "type": "string" },
              "timeZone": { "type": "string" }
            }
          },
          "attendees": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "email": { "type": "string" }
              }
            }
          }
        }
      }
    }
  }
}
```

This is what you'd get by copying the Google Calendar API's event resource almost verbatim. It's a reasonable *API* shape and a poor *tool* shape. Three problems show up fast:

1. **Nothing is required.** The model can call this with an empty `event` object and it validates fine against the schema — the failure only appears downstream when the calendar API rejects it.
2. **Two levels of nesting for no reason.** The model has to build `event.start.dateTime` from a sentence like "tomorrow at 3pm" — every extra level of nesting is a place the model can put a field one level too shallow or too deep.
3. **`attendees` is a list of objects with one field each.** `[{"email": "a@x.com"}]` when `["a@x.com"]` says the same thing with less structure to get wrong.

Run "schedule a sync with Jordan tomorrow at 3pm for 30 minutes" through this and you'll often get a call missing `end`, or `attendees: [{}]` because the model wasn't sure whether to guess Jordan's email.

## Draft 2: flatten and require

```json
{
  "name": "create_calendar_event",
  "description": "Create a calendar event on the user's primary calendar. Use this when the user asks to schedule, book, or add something to their calendar with a specific date and time.",
  "input_schema": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "Short event title, e.g. 'Sync with Jordan'."
      },
      "start_time": {
        "type": "string",
        "description": "ISO 8601 datetime with timezone offset, e.g. 2026-09-02T15:00:00-07:00."
      },
      "duration_minutes": {
        "type": "integer",
        "description": "Length of the event in minutes."
      },
      "attendee_emails": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Email addresses of people to invite, if any."
      }
    },
    "required": ["title", "start_time", "duration_minutes"]
  }
}
```

Better on every axis that mattered:

- **Flat.** No nesting past one array of strings. The model fills `start_time` directly instead of assembling a nested object.
- **`required` matches what the calendar API actually needs to create something valid** — a title, a start, a duration. `attendee_emails` is optional because most events don't have attendees, and marking it required would force the model to invent an empty array every time.
- **Time is represented as a single ISO datetime plus a duration**, not a start/end pair. This removes an entire class of error where the model computes `end` incorrectly, or produces an `end` before `start`. Duration is a single number; an end timestamp is two numbers that have to agree.

> **Why duration instead of end time?** Because "30 minutes" and "for an hour" are what users actually say. Asking the model to convert that into an absolute end timestamp is an unnecessary arithmetic step it can get wrong (timezone-crossing midnight, DST boundaries). Let your code compute `end = start + duration` deterministically instead of asking the model to compute it in natural language.

The `attendee_emails` problem is still latent, though: if the user says "invite Jordan" without giving an email, the model has to either guess, omit, or hallucinate an address. Draft 2 doesn't resolve that — it just no longer *forces* an empty attendee object into existence.

## Draft 3: defaults, disambiguation, and the attendee gap

```json
{
  "name": "create_calendar_event",
  "description": "Create a calendar event on the user's primary calendar. Use this when the user asks to schedule, book, reschedule to a new event, or add something to their calendar with a specific date and time. Do not use this to check availability — that's check_calendar_availability.",
  "input_schema": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "Short event title, e.g. 'Sync with Jordan'."
      },
      "start_time": {
        "type": "string",
        "description": "ISO 8601 datetime with timezone offset. If the user gives a relative time ('tomorrow at 3pm'), resolve it against the current date before calling."
      },
      "duration_minutes": {
        "type": "integer",
        "description": "Length of the event in minutes. If the user doesn't say, use 30."
      },
      "attendee_emails": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Email addresses of people to invite. Only include an address you were explicitly given or that appears in prior conversation — never guess an email from a first name alone."
      }
    },
    "required": ["title", "start_time"]
  }
}
```

Three changes, each fixing a specific observed failure:

- **The description now disambiguates from a neighboring tool** (`check_calendar_availability`). Without that sentence, "am I free tomorrow at 3?" was occasionally routed to `create_calendar_event` because the model matched on "calendar" and "3pm" rather than intent.
- **`duration_minutes` moved out of `required` with a documented default ("use 30").** The model was refusing to call the tool at all on inputs like "schedule a quick sync with Jordan" because it had no duration to put in a required field — it would ask the user a clarifying question instead of just defaulting sensibly. Moving the default into the description, and out of `required`, let the model proceed.
- **`attendee_emails` gets an explicit anti-hallucination instruction.** This is the fix for the gap Draft 2 left open: instead of leaving the model to decide whether "invite Jordan" is enough to populate the field, the description tells it the rule directly — no email, no entry, even if a name was given.

## Takeaways

- Start from the API's shape, then deliberately flatten it — don't skip the ugly first draft, because seeing where the nesting is *does* tell you which fields belong together.
- `required` should track what's needed for the underlying call to succeed, not what would be nice to have. Fields where a sensible default exists belong in the description as a default, not in `required`.
- Every drop from three drafts to the next was driven by a specific bad tool call you can picture the model producing — that's the right way to iterate: run real phrasings through the schema, watch what breaks, fix precisely that.

**Related:** /learn/tools-function-calling/designing-a-tool-schema · /learn/tools-function-calling/json-schema-for-tools-essentials · /learn/tools-function-calling/parameter-design-patterns · /learn/tools-function-calling/writing-descriptions-models-follow-deep · /learn/tools-function-calling/enum-vs-freeform-parameters
