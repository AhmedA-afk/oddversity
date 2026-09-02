---
title: "Schema Design Quiz"
track: "tools-function-calling"
status: live
summary: "Six questions on spotting ambiguity, enum-vs-string calls, mis-routing from vague descriptions, and backward-compatible field additions."
duration: "6 min read"
---

Six scenarios pulled from the patterns covered across this module. Work through the schema or situation before checking the answer.

## Question 1

You're reviewing this schema before it ships:

```json
{
  "name": "update_ticket",
  "description": "Updates a ticket.",
  "input_schema": {
    "type": "object",
    "properties": {
      "ticket": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "priority": { "type": "string" },
          "assignee": { "type": "string" }
        }
      }
    }
  }
}
```

What's the single biggest problem here?

A. `priority` should be a number, not a string
B. Nothing is required, and `id` is buried inside a nested `ticket` object instead of being a flat, required top-level field
C. `assignee` should be an array in case a ticket has multiple assignees
D. The tool name should be `update_tickets` (plural)

<details><summary>Answer</summary>

**Correct: B.** With nothing marked `required` and `id` nested a level deep, the model can produce a call that omits the one field this operation cannot function without — there's no schema-level signal that `id` is non-negotiable, and it's harder to fill correctly buried inside an object for no structural reason.

- A is a real question (enum vs. string is more likely correct than number for a priority level) but it's not the biggest problem — a well-typed `priority` still doesn't fix a missing `id`.
- B is correct — see /learn/tools-function-calling/parameter-design-patterns and /learn/tools-function-calling/schema-design-common-mistakes on nesting and dishonest `required`.
- C assumes a business rule not stated in the prompt — don't add structure speculatively without evidence multiple assignees are real.
- D is a style nit that doesn't affect correctness the way a missing required ID does.

</details>

## Question 2

A `priority` field takes one of exactly three values today — `low`, `medium`, `high` — and the team has no plans to add more. Which is the better choice?

A. Free-form string with a description listing the three values
B. `enum: ["low", "medium", "high"]`
C. An integer 1-3
D. A nested object `{"level": {"value": "high"}}`

<details><summary>Answer</summary>

**Correct: B.** The set is closed and stable — exactly the condition under which /learn/tools-function-calling/enum-vs-freeform-parameters recommends an enum. It gets the model to reliably produce one of the three exact strings instead of introducing casing or synonym variance.

- A works but invites drift (`"High"`, `"urgent"`) that an enum prevents outright — strictly worse when the set really is closed.
- C loses the readability of named levels for no benefit, and reintroduces the "does 1 mean low or high" ambiguity `enum` avoids entirely.
- D adds a pointless nesting level for a single flat value — see /learn/tools-function-calling/parameter-design-patterns.

</details>

## Question 3

Two tools are registered: `get_invoice` ("Retrieve an invoice.") and `list_invoices` ("Lists invoices."). A user asks: "What did I get billed for in March?" The model calls `get_invoice` with a guessed or empty ID and the call fails. What's the most likely root cause?

A. The model doesn't support tool calling reliably
B. Neither description states when to use it vs. the other, so the model can't tell that a date-range question needs `list_invoices`, not an ID lookup
C. `get_invoice`'s parameters are missing `required`
D. The tools should be merged into one

<details><summary>Answer</summary>

**Correct: B.** This is the exact failure pattern in /learn/tools-function-calling/good-vs-bad-tool-descriptions: two tools that overlap in plausibility, neither description mentioning the other or stating its trigger condition, so the model has no signal to route a date-range question toward the list/search tool instead of the ID lookup.

- A is not supported by the scenario — the model called *a* tool correctly formed, it just picked the wrong one.
- C might independently be a good fix but doesn't explain *why* the model reached for `get_invoice` in the first place — a required ID field would make the call fail differently, but wouldn't fix the routing.
- D is a bigger, unnecessary change — the fix is one sentence in each description, not a merge; see /learn/tools-function-calling/descriptions-are-prompts.

</details>

## Question 4

You need to add a `discount_code` field to an existing `place_order` tool that's already used by live agents. Which approach is backward-compatible?

A. Add `discount_code` as optional, not in `required`, with a description saying it's fine to omit
B. Add `discount_code` and put it in `required`
C. Rename the tool to `place_order_v2` and remove `place_order`
D. Add `discount_code` and rename `total` to `order_total` in the same release

<details><summary>Answer</summary>

**Correct: A.** A new optional field that in-flight agents simply never populate is the textbook additive change from /learn/tools-function-calling/schema-versioning-strategies — no existing call becomes invalid.

- B breaks every in-flight agent immediately, because their held schema doesn't include `discount_code` and their next call won't have it, yet your dispatcher would now require it.
- C is a valid *strategy* for a genuinely breaking change, but is unnecessary and disruptive for something as small as one new optional field.
- D bundles an unrelated breaking rename into the same release as a safe addition, which is worse than doing the addition alone — see /learn/tools-function-calling/versioning-a-schema-worked for what a rename does to an in-flight agent specifically.

</details>

## Question 5

A tool description reads: `"Sends a message. amount: the value. recipient: who."` What's the most accurate diagnosis?

A. It's concise, which is good for token cost
B. It documents field names but doesn't explain what "the value" or "who" actually mean in a usable, unambiguous way — it reads like a docstring stub, not an instruction
C. It's fine as long as the JSON Schema `type` fields are correct
D. The tool name is the real problem, not the description

<details><summary>Answer</summary>

**Correct: B.** This is the central point of /learn/tools-function-calling/writing-descriptions-models-follow-deep — a description has to actually explain meaning and constraints, not just restate the parameter name back at itself. "The value" tells the model nothing about units, currency, or format; "who" tells it nothing about whether an email, a username, or a phone number is expected.

- A confuses brevity with quality — this description is short because it says almost nothing, not because it's efficiently written. Compare to the trimmed-but-substantive descriptions in /learn/tools-function-calling/measuring-and-trimming-schema-tokens, which stay short while still stating format and defaults.
- C is false — correct types don't rescue a description that gives the model no way to know what value belongs in a correctly-typed field.
- D is a distraction from the actual problem shown in the prompt, which is entirely in the description text.

</details>

## Question 6 — token budget estimation

A registry has 8 tools. Six average about 90 tokens each as serialized JSON; two heavier tools (with several enum-valued parameters and longer descriptions) average about 220 tokens each. Roughly what's the registry's total schema token cost, and is that cost paid once per conversation or once per turn?

A. About 980 tokens, paid once per conversation
B. About 980 tokens, paid on every turn where the tools are available
C. About 1,760 tokens, paid once per conversation
D. About 90 tokens, paid on every turn (only the relevant tool is sent)

<details><summary>Answer</summary>

**Correct: B.** The arithmetic: 6 tools × 90 tokens = 540, plus 2 tools × 220 tokens = 440, for a total of 540 + 440 = 980 tokens. And per /learn/tools-function-calling/token-cost-of-schemas-deep, that full registry is resent as part of the payload on every turn where these tools are available to the model — not cached away after the first turn, and not filtered down to only the tool that ends up being relevant, because the model can't know which tool is relevant until it's read all of them.

- A has the right number but the wrong mechanism — schemas aren't a one-time cost paid at conversation start, they're part of the payload on every applicable turn, which is exactly why registry size compounds over a long conversation.
- C doubles the correct total (using something closer to a per-tool max instead of the stated average) and repeats A's "once per conversation" mistake on top of it.
- D describes a selective-sending behavior no standard tool-calling API performs automatically. (At true scale, something like this is approximated deliberately through retrieval — see /learn/tools-function-calling/tool-selection-at-scale — but that's an explicit architecture you build, not default behavior.)

The practical lesson beyond the arithmetic: work out your own registry's real number with a tokenizer per /learn/tools-function-calling/measuring-and-trimming-schema-tokens rather than estimating, and remember every token in that total is paid again on the next turn, and the one after that.

</details>

**Related:** /learn/tools-function-calling/schema-design-common-mistakes · /learn/tools-function-calling/tool-schema-design-cheatsheet · /learn/tools-function-calling/enum-vs-freeform-parameters · /learn/tools-function-calling/schema-versioning-strategies · /learn/tools-function-calling/token-cost-of-schemas-deep
