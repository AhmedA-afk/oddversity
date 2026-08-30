---
title: "Portability: Surviving a Model Swap"
track: "prompt-engineering"
status: live
summary: "A checklist for what breaks on a model swap - delimiters, verbosity, reasoning defaults - run against one real prompt."
duration: "7 min read"
---

A prompt that still returns a response after a model swap isn't the same as a prompt that still works. The failure mode is silent, and that's exactly what makes it worth checking for on purpose.

## What it is

[Prompt Portability: Writing Prompts That Survive a Model Swap](/learn/prompt-engineering/prompt-portability-across-models) covers the core discipline - write for the outcome, not the mechanism; separate a shared core from a thin per-provider adapter; re-test rather than assume. This lesson gives you the mental model for *why* each specific thing breaks, plus a literal checklist to run before you flip the switch.

## The mental model

Think of a prompt as source code and the model as the runtime interpreting it. Two "compliant" interpreters can still diverge on anything the prompt left undefined - and undefined is exactly where model-specific behavior lives. Just like porting C code across compilers, what breaks isn't the part that follows the plain instruction; it's the part that quietly relied on one particular runtime's unwritten habits.

## Why it works this way

Three categories of undefined behavior account for most portability breakage:

**Format quirks and delimiter preferences.** A model attends more strongly to structural cues it saw heavily during its own training and tuning - XML-style tags for one family, Markdown headers for another, a project's homegrown `### SECTION ###` convention for neither. See [XML Tags vs. Markdown](/learn/prompt-engineering/xml-tags-vs-markdown) for how to hedge that bet. A delimiter that one model was fine-tuned to treat as structurally special has no guaranteed meaning to a different model - it just reads as ordinary text, and the structure you were relying on to separate "instructions" from "content" quietly disappears.

**Reasoning defaults.** Models differ in whether they reason before answering by default, whether that process is exposed, and how much of it happens without being asked. A prompt written against a model that needed an explicit "think step by step" to reason at all might get that reasoning for free on a model with native extended thinking - harmless redundancy - or a prompt that relied on a model's *default* verbosity of reasoning might get noticeably less of it on a model that reasons more tersely unless an explicit thinking budget says otherwise. See [Extended Thinking and Reasoning Effort](/learn/prompt-engineering/extended-thinking-and-reasoning-effort) and [Extended Thinking Budgets](/learn/prompt-engineering/extended-thinking-budgets) for controlling this directly instead of hoping the wording does it.

**Verbosity and output-format calibration.** An instruction tuned against one model's chattiness produces a different absolute output on a terser model, and a magic string used for parsing ("prefix your answer with ANSWER:") depends on a model reliably never adding trailing commentary - an assumption that holds for some models and not others.

## A concrete example

Take a prompt tuned for one model and run the checklist against it before swapping:

```
### CONTEXT ###
{context}
### QUESTION ###
{question}

Think through this carefully step by step, then give your
final answer prefixed with "ANSWER:".
```

- [ ] **Delimiters:** `### ... ###` is a homegrown convention, not a broadly-recognized structural marker on every model family. *Recalibrate* to Markdown headers or the target model's documented tag convention.
- [ ] **Reasoning defaults:** the explicit "think step by step" instruction may be redundant with - or actively fight - a target model's native thinking parameter. *Recalibrate* by moving reasoning control to the API parameter where the target supports one, keeping the inline instruction only as a fallback.
- [ ] **Output parsing:** the `"ANSWER:"` prefix depends on the model never adding trailing text after it. *Recalibrate* to a structured-output contract (see [Structured Output](/learn/prompt-engineering/structured-output)) so parsing doesn't depend on a magic string holding across models.
- [ ] **Verbosity:** no explicit length constraint is given, so absolute output length will drift with each model's default chattiness. *Recalibrate* by adding an explicit constraint rather than relying on a shared sense of "reasonably brief."
- [ ] **Few-shot ordering:** if the prompt includes examples, their order and label distribution can bias a new model differently than it biased the old one - see [Example Count and Ordering](/learn/prompt-engineering/example-count-and-ordering) and [Label Bias and the Majority Label](/learn/prompt-engineering/label-bias-and-majority-label). *Recalibrate* by re-testing order, not assuming it transfers.

Running through a checklist like this before a swap turns "we'll find out when someone complains" into a deliberate, reviewable pass over the prompt - the same discipline [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow) applies to any other change.

## Where it shows up

Swapping a cheaper or faster model into a routing tier, upgrading within the same model family to a new version, or moving a prototype off one provider entirely - anywhere the prompt text stays fixed but the thing interpreting it changes underneath it.

## Watch out for

- **Treating "still returns valid output" as "still works."** Silent quality drift, not an error, is the dangerous case - the response looks fine to skim and is quietly worse on exactly the inputs the original wording was written to handle.
- **Porting the prompt without porting the eval set alongside it.** A fresh vibe check on the new model tells you almost nothing; you need the *same* `cases.jsonl` from [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset) run against the new model, scored the same way, so the comparison is apples to apples.
- **Over-rotating and stripping every model-specific lever "to be safe."** Full portability isn't actually the goal - a prompt that refuses to use a target model's native thinking-budget control or structured-output mode is leaving real capability on the table for the sake of a purity that was never required.

## Where next

[Before/After: Porting a Prompt to a New Model](/learn/prompt-engineering/porting-a-prompt-worked) runs this exact checklist against a real prompt end to end, with the pass-rate recovery measured at each step - the concrete version of the abstract checklist above.

**Related:** [Prompt Portability: Writing Prompts That Survive a Model Swap](/learn/prompt-engineering/prompt-portability-across-models), [Before/After: Porting a Prompt to a New Model](/learn/prompt-engineering/porting-a-prompt-worked), [Extended Thinking and Reasoning Effort](/learn/prompt-engineering/extended-thinking-and-reasoning-effort), [Structured Output](/learn/prompt-engineering/structured-output), [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset)
