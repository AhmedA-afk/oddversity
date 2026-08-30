---
title: "Before/After: Untangling a Wall-of-Text Prompt"
track: "prompt-engineering"
status: live
summary: "A real run-on prompt where a buried constraint gets ignored, refactored into sections until the model actually honors it."
duration: "6 min read"
---

Wall-of-text prompts don't fail because the words are wrong. They fail because a constraint that mattered gets buried on line four of a paragraph that also contains the task, an example, and the document itself — and nothing in the text tells the model that line four is load-bearing.

## The setup

A marketing team wants a model to turn an internal changelog into a short customer-facing announcement. Here's the actual prompt someone wrote, unedited:

```text
We're announcing a new pricing update and I need you to write a short
customer-facing blurb about it, keep it upbeat and under 80 words, this
is going out in the newsletter so it needs to sound exciting not
corporate, also last time we did one of these it mentioned the exact
discount number and legal wasn't happy about that so this time don't
state the exact discount percentage anywhere, just say something like
"a limited-time discount" instead, here's an example of the tone we
want from last quarter: "Big news! We just made Pro plans even more
accessible -- check out the new pricing today." and here's the
changelog to work from: Starting Monday, all annual Pro plans get a
25% discount at checkout, automatically applied, no code needed, this
is part of our push to convert more monthly users to annual billing
before the Q3 renewal cycle closes, so please emphasize urgency and
make it feel like a limited window.
```

That's the whole prompt — task, tone guidance, a hard constraint, an example, and the source document, all run together as one paragraph. The constraint that actually matters to legal — never state the exact discount percentage — is one clause in the middle of a sentence about a different topic entirely (why the constraint exists), sandwiched between tone instructions and an example.

## Step by step

### Step 1: Run it as written and see what breaks

Fed this prompt as-is, a plausible completion reads:

> "Big news! Starting Monday, all annual Pro plans get 25% off at checkout — automatically applied, no code needed. Lock in your discount before the window closes!"

The exact number the prompt explicitly said not to state made it straight into the output. Not because the model can't follow instructions — it followed the tone, the length, and the urgency perfectly. It's because "don't state the exact discount" was one clause inside a run-on sentence about *why* the constraint exists, competing for attention with the tone request, the example, and the changelog all in the same breath.

> **Why this step?** Before refactoring anything, you need to see the actual failure, not just assume the prompt is "messy." Here the specific failure is a buried constraint losing a competition for attention — that diagnosis is what tells you where to put effort in the rewrite.

### Step 2: Separate the four jobs

Pull the paragraph apart into what it's actually doing: an instruction (write a blurb, this length, this tone), a constraint (no exact percentage), an example (the tone reference), and the source document (the changelog). This is the same split as [sectioning a prompt into blocks](/learn/prompt-engineering/sectioning-a-prompt-into-blocks) — instructions, context, examples, and the real input, each given its own space instead of sharing one sentence.

> **Why this step?** You can't fix "the constraint got lost" by writing it more forcefully in the same paragraph. You fix it by giving it a location of its own, so it isn't relying on the model correctly parsing a sentence that's also doing two other jobs.

### Step 3: Give the constraint its own delimited section

```text
<instructions>
Write a short customer-facing announcement about the pricing update
below, for the newsletter. Upbeat, exciting, not corporate. Under 80
words. Emphasize urgency — this is a limited-time window.
</instructions>

<constraints>
Do not state the exact discount percentage anywhere in the output.
Refer to it only as "a limited-time discount." (Legal requirement —
a past announcement stated the exact number and caused a compliance
issue.)
</constraints>

<tone_example>
"Big news! We just made Pro plans even more accessible -- check out
the new pricing today."
</tone_example>

<changelog>
Starting Monday, all annual Pro plans get a 25% discount at checkout,
automatically applied, no code needed. Part of the push to convert
monthly users to annual billing before the Q3 renewal cycle closes.
</changelog>
```

> **Why this step?** The constraint now sits in its own labeled block, physically separated from the changelog that contains the actual number it's supposed to suppress. That separation matters specifically because the number the model must *not* say is sitting right there in the same prompt, in the source material — the closer that number is, structurally, to a section that isn't marked "off-limits," the easier it is for the model to just relay it.

### Step 4: Run the rewritten version

> "Big news! Pro plans just got more accessible — annual billing now comes with a limited-time discount, automatically applied at checkout. Lock in your rate before the window closes!"

Same tone, same length, same urgency. The exact percentage is gone, because "do not state the exact discount percentage" is no longer one clause fighting for space — it's the entire content of its own section, positioned right next to the changelog it constrains.

## Where it breaks (and the fix)

The rewritten version can still fail if the constraints block is dropped to the bottom of a much longer prompt with several other sections after it — position still matters, which is exactly what [instruction position and recency](/learn/prompt-engineering/instruction-position-and-recency) covers. The fix there isn't more sectioning, it's ordering: put constraints that must never be violated close to the instructions, not buried after several unrelated blocks. It's also worth stating the constraint as something [checkable](/learn/prompt-engineering/acceptance-criteria-in-prompts) — "output contains no digit followed by a percent sign" is a rule an eval can verify automatically, rather than something a human has to reread the blurb to confirm.

## Takeaways

- A buried constraint doesn't fail because the model ignores instructions — it fails because the constraint was never structurally distinguished from the sentence around it.
- The fix is not stronger wording. It's a section of its own, placed near the content it constrains.
- Once a constraint has its own block, it's also easier to turn into something an eval can check without a human rereading every output — see [before/after: a vague summary prompt](/learn/prompt-engineering/before-after-vague-summary-prompt) for the same pattern applied to a different failure.

**Related:** [Sectioning a Prompt into Blocks](/learn/prompt-engineering/sectioning-a-prompt-into-blocks), [Before/After: A Vague Summary Prompt](/learn/prompt-engineering/before-after-vague-summary-prompt), [Reading a Model Failure](/learn/prompt-engineering/reading-a-model-failure), [Instruction Position and Recency](/learn/prompt-engineering/instruction-position-and-recency), [Acceptance Criteria in Prompts](/learn/prompt-engineering/acceptance-criteria-in-prompts)
