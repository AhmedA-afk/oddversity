---
title: "Templates: Separating the Stable Prompt From the Variable Input"
track: "prompt-engineering"
status: live
summary: "Framing a template as a fixed skeleton plus typed slots, and why hard-coding real values into a prompt quietly blocks reuse and versioning."
duration: "5 min read"
---

The first time you paste real data into the middle of a working prompt, you've turned a reusable template into a one-off. The second time you need the same prompt for different data, you'll wish you hadn't.

## What it is

[Prompt templates](/learn/prompt-engineering/prompt-templates-and-variables) establishes the core split: fixed instructions you test and version, and variables that change per call. This lesson pushes that split one step further — treat the variable part not as generic "stuff that changes" but as **typed slots**: each one has a name, an expected shape, and a bound. A slot is a small contract, not a blank.

## The mental model

Think of a template as a function signature: `summarize_reviews(product: str, reviews: list[str], max_words: int)`. The function body — the fixed prompt text — never changes between calls. The parameters are the slots, and like any function signature, they force you to answer questions up front that "just paste it in" lets you skip: what type is this, how long can it be, what happens if it's missing. A template that hasn't answered those questions isn't really a template yet, it's a string with holes in it.

## Why it works this way

Hard-coding a real value into a prompt breaks two things at once. It blocks **reuse**, because running the "template" against a different product now means editing the prompt text itself — every product ends up with its own copy of what was supposed to be one shared, tested asset. And it blocks **versioning**, because the fixed instructions are the thing you actually improve and test over time; once they're welded together with a specific batch of example data, an edit to the instructions and an edit to the data look identical in a diff, and you can no longer tell which one changed the output.

## A concrete example (shown)

A product-review summarizer, with its slots pulled out and typed:

```text
You are summarizing customer reviews for {product} for an internal
product dashboard.

Write a summary in {max_words} words or fewer covering the dominant
positive theme and the dominant negative theme, if any.

<reviews>
{reviews}
</reviews>
```

| Slot | Type | Notes |
|---|---|---|
| `{product}` | `str` | A short product name, not a description — document the expected length. |
| `{reviews}` | `list[str]` | Needs a documented join rule (one per line? numbered?), not just "paste them in." |
| `{max_words}` | `int` | A configuration knob, not user content — safe to hard-code per call, unlike the other two. |

If `{product}` were hard-coded as `"Acme Widget Pro"` and `{max_words}` as `40`, this stops being a template at all — it's last week's specific call, wearing template clothes. Running it for a different product means editing the prompt text, and now every product has its own drifting copy of instructions that were supposed to be one tested, shared asset.

## Where it shows up

Anywhere the same prompt shape runs across many rows of data: batch summarization jobs, per-ticket support drafts, per-product analytics blurbs, any pipeline where "the prompt" is really "the prompt, called a thousand times with different inputs." It's also the shape every [sectioned prompt](/learn/prompt-engineering/sectioning-a-prompt-into-blocks) eventually needs, since the context and examples blocks are usually where the real slots live.

## Watch out for

- **Making the instructions themselves a slot.** If you find yourself wanting `{extra_instruction}` injected into the middle of the fixed text for different callers, that's a sign you have two prompts wearing one template — split them, don't parameterize the part that's supposed to stay stable.
- **Undocumented slot shape.** `{input}` with no note on expected format, size, or encoding forces every caller to guess, and guesses are where broken calls come from.
- **Treating a free-text slot as safe to interpolate directly.** A slot like `{reviews}` can carry arbitrary user-submitted text, including text that looks like an instruction — see [escaping user content in templates](/learn/prompt-engineering/escaping-user-content-in-templates) for what naive interpolation costs you there.

## Where next

[Implementing a minimal prompt template engine](/learn/prompt-engineering/building-a-prompt-template-engine) builds the code that renders a template like this one and catches a missing slot before it reaches the model. [Escaping user content in templates](/learn/prompt-engineering/escaping-user-content-in-templates) covers filling the `{reviews}`-style slot safely. And [prompt versioning and reuse](/learn/prompt-engineering/prompt-versioning-and-reuse) picks up exactly where the versioning argument above leaves off.

**Related:** [Prompt Templates and Variables](/learn/prompt-engineering/prompt-templates-and-variables), [Building a Prompt Template Engine](/learn/prompt-engineering/building-a-prompt-template-engine), [Escaping User Content in Templates](/learn/prompt-engineering/escaping-user-content-in-templates), [Prompt Versioning and Reuse](/learn/prompt-engineering/prompt-versioning-and-reuse), [Delimiters and Formatting](/learn/prompt-engineering/delimiters-and-formatting)
