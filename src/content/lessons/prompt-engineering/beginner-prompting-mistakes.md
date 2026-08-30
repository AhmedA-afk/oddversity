---
title: "The Five Mistakes Every Beginner Makes"
track: "prompt-engineering"
status: live
summary: "Politeness padding, vague verbs, doing too much at once, no output format, and trusting one lucky run — with a fix for each."
duration: "6 min read"
---

These five show up in almost every first prompt anyone writes, across every task, and every one of them has a one-line fix.

### The mistake: politeness padding

**Why it's wrong.** "Could you please kindly help me by..." adds tokens that condition the model toward a certain register without adding any actual constraint on the output. It doesn't make the model try harder — there's no effort dial being turned by courtesy — and it can even pull the tone of the response toward matching your own excessive formality when you wanted something plain.

**Symptom.** Wordy, over-formal, hedging output, and no measurable improvement in correctness compared to a terser version of the same request.

**Fix.** Say the instruction directly. Save courtesy for the surfaces where a human reads your words — a prompt isn't one of them.

```text
Before: "Could you please kindly help me by summarizing the following text
if it's not too much trouble?"
After:  "Summarize the text below in 3 bullets."
```

### The mistake: vague verbs

**Why it's wrong.** Words like "handle," "process," or "deal with" name a vague category of action without naming the actual transformation or its output. Faced with "handle this ticket," the model has to guess whether you want a classification, a reply, an escalation, or a summary — and it will guess differently depending on subtle context, or differently across models entirely.

**Symptom.** Wildly different behavior run to run or model to model on what looks like the same instruction, because the instruction never specified which action was actually wanted.

**Fix.** Replace the vague verb with the exact action and the exact output.

```text
Before: "Handle this support ticket."
After:  "Classify this support ticket into exactly one of: billing,
technical, account. Return only the label."
```

### The mistake: asking for too much in one shot

**Why it's wrong.** Stacking several sub-tasks into one instruction — classify this, then draft a reply, then translate it — multiplies the number of ways the response can go wrong, and when it does go wrong, you can't tell which sub-task failed without picking the output apart by hand. Formatting from one sub-task also tends to bleed into another when they're not separated.

**Symptom.** One part of the response is done well, another is dropped entirely or done sloppily, and it's unclear from the output alone which instruction was ignored.

**Fix.** Split it into a pipeline of single-purpose prompts, each with its own clear input and output, rather than one prompt doing three jobs.

```text
Before: "Classify this ticket, draft a reply, and translate the reply to
Spanish."
After:  Prompt 1 classifies the ticket. Prompt 2 (given the classification)
drafts a reply. Prompt 3 (given the reply) translates it. Each step's
output becomes the next step's input.
```

### The mistake: no output format

**Why it's wrong.** Most of the text a model was trained on is prose, so when you don't specify a shape, prose is the default it falls back to. That's fine for a chat interface and a disaster for anything downstream expecting to parse the response programmatically.

**Symptom.** The response is sometimes a clean JSON object, sometimes a sentence explaining the answer, sometimes a bulleted list — three different shapes for what was meant to be the same kind of request, and a parser that breaks on at least one of them.

**Fix.** Name the exact format you need and, ideally, show one example of it.

```text
Before: "Extract the order number and amount."
After:  "Extract the order number and amount as JSON: {\"order_number\":
str, \"amount\": str}. Return only the JSON object, nothing else."
```

### The mistake: trusting a single lucky run

**Why it's wrong.** One output is one sample from a distribution of possible outputs, not proof that the prompt reliably behaves that way — see [prompting is not deterministic programming](/learn/prompt-engineering/prompting-is-not-deterministic-programming). A prompt that looked great on the one input you tried can still fail on the next ninety-nine, especially at the edge cases you didn't happen to pick.

**Symptom.** A prompt that "worked" in testing breaks in production the first time it meets a genuinely ambiguous or unusual input — exactly the pattern in [the whole-game walkthrough](/learn/prompt-engineering/pe-whole-game-ticket-classifier), where four easy tickets passed on the first try while six harder ones exposed real gaps.

**Fix.** Test on a small, deliberately varied batch of inputs — including the ugly, ambiguous ones — before trusting a prompt, and rerun a few times per input if temperature is above 0. See [reliability beats cleverness](/learn/prompt-engineering/reliability-over-clever-tricks) and [prompt evaluation basics](/learn/prompt-engineering/prompt-evaluation-basics) for how to make this a repeatable habit instead of a one-off gut check.

## Pre-flight checklist

- [ ] Cut politeness padding — say the instruction directly.
- [ ] Replace vague verbs ("handle," "process") with the exact action and output.
- [ ] Split multi-step requests into a pipeline instead of one prompt doing everything.
- [ ] Name the exact output format, and show an example of it if the format matters.
- [ ] Test on more than one input — including the awkward ones — before trusting the result.

**Related:** [Prompting Is Not Programming](/learn/prompt-engineering/prompting-is-not-deterministic-programming) · [Reliability Beats Cleverness](/learn/prompt-engineering/reliability-over-clever-tricks) · [Structured Output](/learn/prompt-engineering/structured-output) · [The Whole Game: One Task From Vague Ask to Reliable Prompt](/learn/prompt-engineering/pe-whole-game-ticket-classifier)
