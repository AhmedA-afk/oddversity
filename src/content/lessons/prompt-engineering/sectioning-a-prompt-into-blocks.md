---
title: "Sectioning: Instructions, Context, Examples, Output"
track: "prompt-engineering"
status: live
summary: "Turning the four-block prompt shape into a default habit you reach for every time, not a rescue tactic for a prompt that's already failing."
duration: "5 min read"
---

Every prompt you write is quietly doing four different jobs, whether or not you've organized it that way. Sectioning just makes those four jobs visible — to you, to a teammate, and to the model.

## What it is

[Instructions, context, and examples](/learn/prompt-engineering/instructions-context-examples) are three of the four jobs a working prompt does; the fourth is the output contract that tells the model — and whatever code reads its reply — what a valid answer looks like. Sectioning is the practice of always giving each of those four jobs its own labeled, delimited block, in the same order, whether the prompt is two sentences or two pages: **instructions**, **context**, **examples**, **output**.

The habit part matters more than the technique. Anyone can add sections to a prompt that's visibly broken. The payoff shows up when you do it by default, on the prompt that works fine today — because six months from now, someone (possibly you) needs to change one thing without accidentally touching the other three.

## The mental model

Treat a prompt like a form with four labeled fields you fill in every time, using the same delimiters, in the same order. Some fields might be short — a one-line context block, or an output section that just says "reply in plain text" — but they're still there, still labeled, still in their usual spot. You're not writing a fresh essay each time; you're filling in a form whose shape doesn't change even when the content does.

That consistency is what makes a prompt library maintainable. If instructions always live in one place and context always lives in another, a reviewer scanning ten prompts can find "what does this actually ask the model to do" in the same spot every time, instead of re-reading each prompt end to end to find the ask buried somewhere in the middle.

## Why it works this way

The model reads your prompt as one linear stream of tokens. It has no innate concept of "this part is the rule and this part is the data" — it infers that from position, phrasing, and structural markers like the [delimiters](/learn/prompt-engineering/delimiters-and-formatting) or [XML tags](/learn/prompt-engineering/xml-tags-vs-markdown) you choose. When instructions always show up fenced the same way, in the same place, the model gets a consistent, learnable pattern for "this is the ask" instead of having to re-derive it from scratch on every prompt.

The same structure also creates handles for testing and revision, as the instructions-context-examples framing puts it: you can change the examples block to fix a formatting quirk without touching the instructions that define the task, and a test suite can vary one block while holding the others fixed to isolate what actually changed the output.

## A concrete example (shown)

Here's an email-triage prompt with all four blocks present:

```text
<instructions>
Read the email below and decide how to triage it.
Assign exactly one label: "urgent", "routine", or "spam".
Then write a one-sentence reason for the label.
</instructions>

<context>
This inbox belongs to a small SaaS company's support team.
"Urgent" means the customer reports a broken paid feature or a billing failure.
"Routine" means a question, feature request, or minor bug.
"Spam" means unsolicited marketing, not a real support request.
</context>

<examples>
<example>
<email>Your app just charged me twice for the same month!</email>
<label>urgent</label>
<reason>Duplicate billing charge affecting a paying customer.</reason>
</example>
<example>
<email>Any plans to add dark mode?</email>
<label>routine</label>
<reason>Feature request, not blocking current use.</reason>
</example>
</examples>

<output_format>
Return JSON: {"label": string, "reason": string}
No text outside the JSON object.
</output_format>

<email>
I can't export my report and my renewal is due tomorrow -- please help ASAP.
</email>
```

What belongs where, and what commonly gets misfiled:

- **Instructions** are the verb: what decision or transformation to perform. The most common mistake is letting policy details creep in here — "urgent means a broken paid feature or billing failure" is a fact about the business, not an instruction, and it belongs in context. Once policy and instructions blur together, changing the definition of "urgent" means editing the same paragraph that defines the task itself.
- **Context** is the stable background the instruction depends on — definitions, policy excerpts, account state. The reverse mistake also happens: someone pastes the live email being triaged into the context block "for background," which leaves two candidate inputs in the prompt and forces the model to guess which one is the actual thing to act on. The real input stays outside every labeled block, at the end.
- **Examples** demonstrate the mapping from input to output — they are not a backdoor for extra rules. If an edge-case caveat only shows up inside one example's reasoning text, it only generalizes if the model happens to notice the pattern; see [few-shot prompting](/learn/prompt-engineering/few-shot-prompting) on how easily models copy incidental features of examples instead of the rule you meant to teach.
- **Output** is the contract a downstream parser depends on. It's the block most often skipped for "obviously short" answers — and the one whose absence causes the strangest bugs, because the model will happily add a friendly sentence before the JSON unless told not to. It's also worth putting last: instructions near the end of a prompt get read right before generation starts, which is exactly where you want a format constraint to sit — see [instruction position and recency](/learn/prompt-engineering/instruction-position-and-recency) for why.

## Where it shows up

Sectioning earns its keep anywhere the same prompt runs against many different inputs: support triage, extraction pipelines, anything with a [structured output](/learn/prompt-engineering/structured-output) contract, and any prompt you're turning into a reusable [template](/learn/prompt-engineering/prompt-templates-and-variable-slots) with variable slots. The four-block shape is also what a fully worked example like the [support-reply prompt](/learn/prompt-engineering/structured-prompt-worked-example) later in this module builds from directly.

## Watch out for

- **Context creep into instructions.** If your instructions block keeps growing every time the business rules change, that's a sign policy content is living in the wrong section.
- **Skipping the output block because the answer feels obvious.** It's the cheapest section to write and the one whose absence breaks the most parsers downstream.
- **Letting block order drift between environments.** A dev version with output first and a prod version with output last makes prompts hard to diff and hides real changes inside cosmetic ones.

## Where next

For how to actually choose the delimiter syntax for these blocks, see [XML vs. Markdown vs. JSON](/learn/prompt-engineering/xml-markdown-json-formatting-tradeoffs). For how to write an instructions block that's actually testable, see [task framing](/learn/prompt-engineering/task-framing-intent-constraints-criteria). For a full prompt already assembled this way, see [anatomy of a production prompt](/learn/prompt-engineering/anatomy-of-a-production-prompt).

**Related:** [Instructions, Context, Examples](/learn/prompt-engineering/instructions-context-examples), [Delimiters: Fencing Off Instructions from Content](/learn/prompt-engineering/delimiters-and-formatting), [XML vs. Markdown vs. JSON](/learn/prompt-engineering/xml-markdown-json-formatting-tradeoffs), [Task Framing: Intent, Constraints, Acceptance Criteria](/learn/prompt-engineering/task-framing-intent-constraints-criteria), [Anatomy of a Production Prompt](/learn/prompt-engineering/anatomy-of-a-production-prompt)
