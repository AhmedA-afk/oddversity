---
title: "Diagnosing Why a Prompt Failed"
track: "prompt-engineering"
status: live
summary: "Three failing outputs, three diagnoses — trace each one back to the exact prompt region that should have prevented it."
duration: "7 min read"
---

Staring at a bad output and adding another paragraph of instructions is the most common way to make a prompt worse. Diagnosing it first is slower for thirty seconds and faster for the rest of the project.

## The setup

Take the customer-email-drafting prompt from [the anatomy of a production prompt](/learn/prompt-engineering/anatomy-of-a-production-prompt), with its seven labeled regions: role, task, constraints, context, examples, output format, and input slot. Here are three real outputs it produced, each broken in a different way. The habit to build for all three is the same question, asked in order: *which region of the prompt would have prevented this, and did that region actually say what I thought it said?*

## Step by step

**Failure A — wrong format.**

```text
Output: "Category: Billing"
Required: {"label": "billing"}
```

Trace it: the output-format region said "return only this JSON object" — but the example region never showed one. A rule stated once in prose, with no matching demonstration, is exactly the gap [why examples beat instructions sometimes](/learn/prompt-engineering/why-examples-beat-instructions-sometimes) predicts. The fix is to put an actual worked example of the exact JSON shape into the examples region, or force the opening structure directly by [prefilling the assistant's turn](/learn/prompt-engineering/prefilling-the-assistant-turn) with `{"label": "`.

> **Why this diagnosis?** The instruction wasn't missing — it was under-demonstrated. Adding a second sentence of prose ("Remember, JSON only!") to the same region that already stated the rule once rarely fixes this; showing the shape does.

**Failure B — hallucinated detail.**

```text
Output: "I've gone ahead and processed your refund of $45.00, which should
appear on your statement in 3-5 business days."
Actual context: no refund was mentioned, approved, or calculated anywhere
in the ticket or the CONTEXT region.
```

Trace it: this isn't a formatting problem, and no amount of instruction-tuning fixes it, because the model isn't disobeying a rule — it's filling a gap with a plausible-sounding invention. Two things are true at once here. First, the constraints region needs an explicit rule it was missing: "only state facts present in CONTEXT; never state that an action (refund, credit, cancellation) has been taken unless CONTEXT confirms it." Second, and more fundamentally, if the actual refund status genuinely isn't available anywhere in the prompt, no instruction fixes that — this is [what prompting cannot fix](/learn/prompt-engineering/what-prompting-cannot-fix) territory, and the real fix is making sure the true refund status is retrieved into CONTEXT before the draft is generated at all.

> **Why this diagnosis?** "Ignored the rule" and "was never given the fact" produce identical-looking output, but they have completely different fixes — one is a constraints-region patch, the other requires data the prompt doesn't currently carry.

**Failure C — ignored constraint.**

```text
Output: a 310-word reply
Constraint: "Keep the reply under 150 words."
```

Trace it: the constraint exists and is unambiguous, so this isn't a missing-rule problem the way Failure A was. What's more likely is that the constraint sits far from the point where generation actually happens, and by the time the model is several sentences into drafting a warm, thorough-sounding reply, the length limit stated once near the top has less pull on the next token than the pattern of "keep writing a helpful paragraph" does. This is an [instruction position and recency](/learn/prompt-engineering/instruction-position-and-recency) problem: restating the limit immediately before the output format region, right next to where generation begins, usually recovers it. A second, complementary fix is to add a self-check instruction ("before finalizing, count the words and cut if over 150") rather than relying on the limit to hold unassisted for 150+ tokens of generation.

> **Why this diagnosis?** The rule wasn't absent or under-demonstrated — it was just too far, in token terms, from the moment it needed to bind. Moving it, not rewording it, is the fix.

## Where it breaks (and the fix)

This diagnostic habit has one real trap: sometimes the "fix" you apply and the disappearance of the bad output are coincidental, not causal. If Failure C's 310-word reply happened at a non-zero temperature, rerunning the *original* prompt a few more times might also produce a compliant 140-word reply purely by chance — see [prompting is not deterministic programming](/learn/prompt-engineering/prompting-is-not-deterministic-programming). If you patch the prompt and it looks fixed after one rerun, you don't actually know whether your patch worked or whether you just got a different sample from the same distribution. The fix for this meta-problem is to test any patch across several reruns and, ideally, several similar inputs — not just the one input that failed — before crediting the patch with anything.

## Takeaways

- Ask "which region would have prevented this" before touching the wording — it turns a vague "make it better" into a specific, testable edit.
- A missing rule, an under-demonstrated rule, a rule that's true but too far from generation, and a fact the model was never given all look like the same kind of "wrong output" on the surface, but each has a different fix.
- Some failures aren't prompt-fixable at all — recognize that case early rather than iterating wording against a data or tooling gap.
- Never trust a single rerun as confirmation that a fix worked; the fix and the fluke look identical from one sample.

**Related:** [The Anatomy of a Production Prompt](/learn/prompt-engineering/anatomy-of-a-production-prompt) · [What Prompting Cannot Fix](/learn/prompt-engineering/what-prompting-cannot-fix) · [instruction position and recency](/learn/prompt-engineering/instruction-position-and-recency) · [prefilling the assistant's turn](/learn/prompt-engineering/prefilling-the-assistant-turn)
