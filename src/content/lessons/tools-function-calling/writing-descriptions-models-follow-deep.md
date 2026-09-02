---
title: "Writing Descriptions Models Actually Follow"
track: "tools-function-calling"
status: live
summary: "The description field is an instruction the model obeys at inference time, not documentation a human reads later — write it that way."
duration: "7 min read"
---

Most teams write tool descriptions the way they'd write a docstring: a one-line summary, maybe a param list, done. Then they're confused when the model calls the wrong tool or leaves out a field the description technically mentioned. The description isn't documentation. It's a prompt, evaluated fresh on every single call.

## What it is

A tool description is text injected directly into the model's context, right next to the conversation, every time the model considers calling a tool. It is read and acted on the same way a system prompt instruction is — the model doesn't distinguish "this is metadata about a function" from "this is a directive." If you write `"searches orders"`, the model has three words to decide, out of possibly dozens of tools, whether this is the one to call and what arguments belong in it. If you write four sentences covering what an order is, when to prefer this tool over a similar one, and what each parameter means, the model has that much more to work with — and it uses it.

This reframing matters because it changes what "good" looks like. A docstring is judged on completeness for a human reader who can also read the source code if confused. A tool description is judged on whether it produces the right *behavior* from a model that can only see the description — never the implementation.

## The mental model

Write every description to answer three questions, in order, because that's the order the model needs them in:

1. **What does this tool do?** One sentence, concrete, no jargon the model wasn't trained on.
2. **When should I call it — and, just as important, when should I not?** This is the part vague descriptions skip entirely, and it's the single highest-leverage sentence you can add when two tools are easy to confuse.
3. **What do the arguments mean and what are their constraints?** Per-parameter, not just at the tool level — see /learn/tools-function-calling/json-schema-for-tools-essentials for where these constraints physically live in the schema.

A useful test: if you deleted the tool's name and only showed the model the description, could it still tell what the tool does and when to reach for it? If the description leans on the name to carry meaning ("Get order. Gets an order."), it's not doing its job.

## Why it works this way

Tool descriptions sit in the same context window as everything else the model is reasoning over, and the model allocates attention to them the way it allocates attention to any other instruction — proportional to how directly relevant and specific the text is to the decision at hand, not to whether the text is labeled "description" versus "user message." This is exactly why /learn/prompt-engineering/what-prompt-engineering-is techniques — being explicit, giving examples, stating negatives ("don't use this for X") — transfer directly to schema authoring. A tool description is a prompt that happens to live inside a schema field instead of a chat turn.

The practical consequence: vagueness costs you twice. It costs you when the model has to choose *which* tool to call among several plausible candidates, and it costs you again when the model has chosen correctly but has to guess what values belong in each argument. Precision pays down both costs with the same sentence, because "when to use it" and "what the arguments mean" are usually the same information viewed from two angles — a tool that's precisely scoped to "search orders by customer email or date range, when you don't already have an order ID" tells the model both when to call it and roughly what shape the arguments should take.

## A concrete example

A vague version:

```json
{
  "name": "search_orders",
  "description": "Searches orders.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "status": { "type": "string" }
    }
  }
}
```

The instructed version:

```json
{
  "name": "search_orders",
  "description": "Search the customer's order history by keyword, date range, or status. Use this when the user doesn't already know a specific order ID — for example 'my orders from last week' or 'did my headphones ship yet'. If the user gives you an exact order number, call get_order_by_id instead; it's faster and returns more detail.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Free-text search over item names and order notes. Omit to return all orders in the date range."
      },
      "status": {
        "type": "string",
        "enum": ["pending", "shipped", "delivered", "cancelled", "refunded"],
        "description": "Filter to orders in this status. Omit to include all statuses."
      }
    }
  }
}
```

The second version does real work: it names the sibling tool and the exact condition for preferring one over the other, it gives the model example phrasings to pattern-match against, and it tells the model what happens when a field is left out (`query` omitted → all orders in range, not an error). None of that is decoration — each sentence heads off a specific wrong call the vague version would produce. /learn/tools-function-calling/good-vs-bad-tool-descriptions runs this exact pair against the same query and shows the divergence in the model's actual tool choice and arguments.

## Where it shows up

Every schema you write has this decision embedded in it, but it matters most in two places: when two tools are genuinely similar (search vs. get-by-id, create vs. update, send vs. draft), and when a parameter's valid values or format aren't obvious from its name alone. /learn/tools-function-calling/descriptions-are-prompts goes further into advanced techniques — embedding an example call in the description text, encoding preconditions like "only call this after get_cart" — for cases where a sentence of plain instruction isn't quite enough.

## Watch out for

- **Describing the implementation instead of the behavior.** "Queries the orders table" tells the model nothing about when a human would want this called. Describe the *user-facing* effect.
- **Burying the disambiguating sentence at the end, or leaving it out.** If two tools are confusable, the "use this instead of X when Y" sentence is the most important one in the description — write it first, not as an afterthought.
- **Assuming a name is self-explanatory.** `fetch_data` and `get_records` are not descriptions. If the name needs a description to make sense, that's fine — write it as if the name weren't there at all.

## Where next

Once the wording is right, the same instinct — description as instruction — extends to steering disambiguation between near-duplicate tools and encoding call-order preconditions; that's /learn/tools-function-calling/descriptions-are-prompts. For the parameter shapes those descriptions attach to, see /learn/tools-function-calling/parameter-design-patterns.

**Related:** /learn/tools-function-calling/writing-tool-descriptions-models-follow · /learn/tools-function-calling/good-vs-bad-tool-descriptions · /learn/tools-function-calling/descriptions-are-prompts · /learn/prompt-engineering/what-prompt-engineering-is · /learn/tools-function-calling/json-schema-for-tools-essentials
