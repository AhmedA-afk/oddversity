---
title: "Descriptions Are Prompt Engineering"
track: "tools-function-calling"
status: live
summary: "Deep dive: embedding examples, encoding preconditions, and steering disambiguation through schema wording alone — with the mechanism spelled out."
duration: "9 min read"
---

*This is the deferred-depth follow-up to /learn/tools-function-calling/writing-descriptions-models-follow-deep. If you haven't read that one, start there — this lesson assumes you already treat descriptions as instructions, and goes into the techniques that only matter once basic clarity is already in place.*

## The mechanism, precisely

A tool's `name`, `description`, and every parameter's `description` are concatenated into the model's context in whatever format the provider uses internally to represent tools — this happens before the model generates anything, on every turn where tools are available, whether or not a tool ends up being called. There is no separate "schema understanding" pass distinct from the model's general next-token reasoning; the schema text is read the same way system instructions and prior turns are read, attended to with the same mechanism, and it competes for the same limited attention budget as the rest of the context.

This has a specific, useful consequence: any prompting technique that works in a system prompt works in a description, because it's the same channel. Few-shot examples, explicit negative instructions, stated preconditions, priority language ("only if," "never," "prefer X over Y") — all of it transfers directly. The reason teams under-use this is that schema authoring tools and API references present the description field as a documentation string, so people write documentation instead of instruction. The fix is purely a framing shift, not a technical one.

## Technique 1: embedding a short example call

For tools whose argument shape is subtle — a nested structure, a format that's easy to get almost-right — stating the rule in prose is sometimes weaker than showing one concrete instance of it:

```json
{
  "name": "apply_discount",
  "description": "Apply a discount to the current cart. Example: to take 15% off, call with { \"discount_type\": \"percent\", \"value\": 15 } — value is the number 15, not 0.15, and not '15%'.",
  "input_schema": {
    "type": "object",
    "properties": {
      "discount_type": { "type": "string", "enum": ["percent", "flat"] },
      "value": { "type": "number", "description": "15 for 15%, or a flat dollar amount like 10.00." }
    },
    "required": ["discount_type", "value"]
  }
}
```

Without the worked example, `value` for a percent discount is genuinely ambiguous between `15`, `0.15`, and `"15%"` — all three are plausible readings of "15% off" and a model will produce all three across enough calls. The example collapses that ambiguity by showing the exact literal the field expects, which is a stronger signal than any adjective ("as a whole number," "not a fraction") because it's unambiguous by construction — there's no misreading a worked instance the way there can be a misreading of prose.

Use this sparingly. An example earns its token cost when the field's format has more than one plausible reading and a sentence hasn't resolved it in testing. Most fields don't need one — reach for it after you've observed the ambiguity, not preemptively on every parameter.

## Technique 2: encoding a precondition

Some tools are only valid to call in a certain conversational state — after another tool has already run, or after certain information has been confirmed. The schema has no native way to express "call order" the way a type system might, so the precondition has to live in the description as an instruction:

```json
{
  "name": "checkout_cart",
  "description": "Finalize and charge the user's cart. Only call this after get_cart has confirmed the cart is non-empty and after the user has explicitly confirmed they want to complete the purchase — never call this speculatively or to 'see what happens'. If you haven't called get_cart yet in this conversation, call it first."
}
```

This does two jobs at once: it states a call-order dependency (`get_cart` first) and a confirmation gate (explicit user confirmation), both of which are business logic that lives nowhere else the model can see. Without this, a model asked "what would checkout look like" will sometimes actually call `checkout_cart` rather than reasoning about it hypothetically, because nothing in the schema told it that calling this tool has an irreversible real-world effect that shouldn't be triggered by a hypothetical question. Precondition language is one of the few places where being blunt about consequences ("never call this speculatively") measurably changes behavior — see /learn/tools-function-calling/approval-gates-for-sensitive-tools for the execution-side complement to this description-side gate.

## Technique 3: steering disambiguation purely through wording

The strongest version of this technique doesn't add a new field or a new tool — it changes the routing behavior of an existing pair of tools by editing one sentence. Consider two tools that overlap in surface area: `update_user_profile` (name, email, preferences) and `update_user_address` (shipping address specifically). Both are plausible for "change my address":

**Before**, both descriptions independently describe what they do, with no reference to each other:

```
update_user_profile: "Update the user's profile information, including name, email, and preferences."
update_user_address: "Update the user's shipping address."
```

A model presented with "I moved, can you update my address" has a real chance of calling `update_user_profile` — "profile information" is broad enough to sound like it could include an address, and nothing in either description rules that reading out.

**After**, one sentence added to each, referencing the other tool by name:

```
update_user_profile: "Update the user's profile information: name, email, and preferences. Does not include shipping address — for that, use update_user_address."
update_user_address: "Update the user's shipping address specifically. For name, email, or preference changes, use update_user_profile instead."
```

Nothing else changed — same tool names, same parameters, same underlying implementation. The routing failure disappears because the ambiguity was never in the tools' actual capabilities, it was in the model's inability to tell from the text alone that "profile" excluded "address." This is the general form of the fix in /learn/tools-function-calling/good-vs-bad-tool-descriptions: a persistent wrong-tool problem is very often solvable by adding the one sentence that names the sibling and states the boundary, rather than by restructuring the schema or renaming anything.

## When this technique reaches its limit

Wording fixes routing problems caused by ambiguous language. It does not fix routing problems caused by genuine functional overlap — if `update_user_profile` and `update_user_address` actually both accept an address field, no sentence resolves that; you have a design problem, not a wording problem, and the fix is to remove the overlapping capability from one tool. Diagnose which case you're in by asking: if I described these two tools to a colleague who'd never seen the code, could *they* tell which one to use? If the answer is no even with a careful verbal explanation, wording won't save you — restructure instead, using the patterns in /learn/tools-function-calling/parameter-design-patterns and /learn/tools-function-calling/schema-design-common-mistakes.

It's also worth naming the cost side of this: every technique here adds tokens to a field that's sent on every single call where the tool is in scope. An example call, a precondition paragraph, and a disambiguation sentence are each a few dozen tokens, multiplied by every turn. That tradeoff — precision against context budget — is the subject of /learn/tools-function-calling/token-cost-of-schemas-deep, and it's the right next stop once you've applied these techniques and want to know what they cost you.

**Related:** /learn/tools-function-calling/writing-descriptions-models-follow-deep · /learn/tools-function-calling/good-vs-bad-tool-descriptions · /learn/tools-function-calling/token-cost-of-schemas-deep · /learn/tools-function-calling/approval-gates-for-sensitive-tools · /learn/tools-function-calling/common-tool-calling-failure-modes
