---
title: "Refactoring a Fragile Schema"
track: "structured-outputs"
status: live
summary: "Walk a genuinely fragile extraction schema through four fixes and see the before/after difference on the same batch of inputs."
duration: "9 min read"
---

Most schema-reliability advice is abstract until you watch one schema actually fail and then stop failing. This lesson does that with a single scenario, end to end.

## The setup

You're extracting structured records from customer feedback emails for a triage queue. Here's the schema a first pass produced — it validates fine against any JSON Schema linter, and it's fragile in three separate ways at once:

```json
{
  "type": "object",
  "properties": {
    "feedback": {
      "type": "object",
      "properties": {
        "classification": {
          "type": "object",
          "properties": {
            "type": { "type": "string" },
            "details": { "type": "object", "additionalProperties": true }
          }
        }
      }
    }
  }
}
```

Three problems, stacked: `feedback.classification.type` is three levels deep for one string value (**deep nesting**), `details` accepts any keys with any values (**a free-form dict**), and `type` has no enum or description telling the model what values are legal (**an ambiguous field**). Given "The app crashed twice today and support never replied to my ticket," this schema could just as easily come back with `type: "bug"`, `type: "complaint"`, or `type: "Bug/Support Issue"` — all "valid," all different, and nothing downstream can safely switch on any of them.

## Step by step

### Step 1 — Flatten the nesting

```json
{
  "type": "object",
  "properties": {
    "category": { "type": "string" },
    "details": { "type": "object", "additionalProperties": true }
  }
}
```

`feedback.classification.type` becomes `category`, sitting directly on the root object.

> **Why this step?** Every level of nesting is a place the model can close a bracket one token early or nest a value one level off. There's no information in `feedback` or `classification` as wrapper objects — they don't group anything that isn't already grouped by being in the same schema. Removing them removes pure risk with no loss of meaning. See [Nested Objects and Arrays in Output Schemas](/learn/structured-outputs/nested-and-array-schemas) on when nesting *does* carry real meaning worth the risk — this wasn't one of those cases.

### Step 2 — Replace the free-form dict with named fields

```json
{
  "type": "object",
  "properties": {
    "category": { "type": "string" },
    "mentions_outage": { "type": "boolean" },
    "mentions_billing": { "type": "boolean" },
    "response_time_complaint": { "type": "boolean" }
  }
}
```

> **Why this step?** `additionalProperties: true` means the model decides, per call, what keys even exist — one record might have `{"severity": "high"}`, another `{"urgency_level": 3}` for the same underlying fact, and your consumer code has no fixed contract to parse against. Naming the specific signals you actually need turns "whatever the model felt like reporting" into a closed, predictable shape. This is the "closed over open" property from [Four Properties of a Reliable Schema](/learn/structured-outputs/what-makes-a-schema-reliable).

### Step 3 — Disambiguate the enum and order evidence first

```json
{
  "type": "object",
  "properties": {
    "evidence": {
      "type": "string",
      "description": "Quote or closely paraphrase the specific words that justify the category below."
    },
    "category": {
      "type": "string",
      "enum": ["bug_report", "billing_issue", "support_responsiveness", "feature_request", "general_praise"],
      "description": "The single primary subject. If the email raises more than one, pick the one that would determine which team handles it first."
    },
    "mentions_outage": { "type": "boolean" },
    "mentions_billing": { "type": "boolean" },
    "response_time_complaint": { "type": "boolean" }
  },
  "required": ["evidence", "category", "mentions_outage", "mentions_billing", "response_time_complaint"]
}
```

> **Why this step?** `type: "string"` with no enum meant the model was free to invent categories, and did — plural forms, synonyms, and compound labels all showed up. A closed enum makes every output comparable. Putting `evidence` before `category` also matters: the model writes down what it noticed *before* it commits to a label, so the label conditions on stated evidence instead of a snap read. That's the mechanism [Make the Right Answer the Easy Path](/learn/structured-outputs/shape-the-easy-path-intuition) walks through, and [Evidence Before Label](/learn/structured-outputs/reasoning-field-ordering-example) measures it directly on a classification task.

### Step 4 — Give every field an absence path

The booleans already default cleanly to `false` when nothing supports them, but `category` still has no way to express "genuinely none of these fit" — so add one:

```json
{
  "category": {
    "type": "string",
    "enum": ["bug_report", "billing_issue", "support_responsiveness", "feature_request", "general_praise", "unclear"],
    "description": "Use 'unclear' only if the email doesn't fit any other category — don't force a fit."
  }
}
```

> **Why this step?** A closed enum with no escape value forces a wrong answer on every input that doesn't cleanly fit — and feedback emails routinely don't. `unclear` gives the model an honest option instead of a coerced guess. [Letting the Model Say 'I Don't Know'](/learn/structured-outputs/representing-uncertainty-in-schemas) covers this pattern generally.

## The payoff, on a batch

Here's a small, hand-checked illustration of the kind of gap this produces — not a published benchmark, just the arithmetic you'd do yourself on your own sample before shipping either version. Say you ran both schemas over the same 20 sample emails and manually checked each output for a category that (a) validated and (b) matched what a human triager would actually pick:

| | Correct + consistent | Rate |
|---|---|---|
| Original schema | 11 / 20 | 11 ÷ 20 = 55% |
| Refactored schema | 19 / 20 | 19 ÷ 20 = 95% |

The gap on the original wasn't random — nearly every miss was either a synonym-drift category (`"Bug"` vs `"bug_report"` vs `"Technical Issue"`, none of which your triage router could switch on) or a forced category on an email that was really just praise with an offhand complaint buried in it. Both failure classes are exactly what steps 3 and 4 target. Run this same check on your own sample before trusting either number — see [Building a Gold Dataset](/learn/structured-outputs/building-a-gold-dataset) for doing this properly instead of by hand.

## Where it breaks (+fix)

The refactored schema still assumes one category per email. It breaks on: *"App keeps crashing AND I was double-billed for last month."* Two genuine categories, one enum slot — the model has to pick, and whichever it drops is silently lost. The fix isn't a bigger enum, it's admitting the real shape: add a `secondary_category` (same enum, nullable) rather than trying to cram both signals into one field, or move to an array of category objects if emails routinely raise three or more issues. Which is right depends on how often multi-issue emails actually show up in your data — check before you add the complexity. [Discriminated Unions for Variants](/learn/structured-outputs/discriminated-unions-in-schemas) is the next step up if categories start needing genuinely different follow-up fields per type (a `billing_issue` needing an `invoice_id`, a `bug_report` needing a `steps_to_reproduce`).

## Takeaways

- Nesting, open dicts, and ambiguous enums usually show up together, not one at a time — fix them as a batch, not a queue of separate tickets.
- Every fix in this lesson removed a way to be *technically valid and still wrong*; none of them added a rule the model had to remember, they added a constraint the decoder enforces.
- Measure before and after on the same inputs. "Feels more reliable" and "is more reliable" are different claims, and the second one costs you twenty minutes of manual checking to actually know.

**Related:** [Four Properties of a Reliable Schema](/learn/structured-outputs/what-makes-a-schema-reliable), [Make the Right Answer the Easy Path](/learn/structured-outputs/shape-the-easy-path-intuition), [Evidence Before Label](/learn/structured-outputs/reasoning-field-ordering-example), [Schema Shape Antipatterns](/learn/structured-outputs/schema-shape-antipatterns)
