---
title: "First-Principles Prompting Cheatsheet"
track: "prompt-engineering"
status: live
summary: "A one-page checklist of the defaults that make prompts specific, testable, and reproducible before you reach for anything fancier."
duration: "5 min read"
---

Pin this next to your editor. Every later technique in this course is a refinement of one of these six rules — none of them replace it.

## The six rules

| Rule | What it means | Start here, then measure |
|---|---|---|
| Be specific | Name audience, length, format, and what to omit — don't leave a dimension for the model to guess | Specify all four before your first test run, not after the first bad one |
| Show, don't just tell | A worked example fixes format and tone more reliably than a rule stated in prose | 1–3 examples for anything with a specific shape; 0 for genuinely simple, unambiguous asks |
| Separate instructions from data | Delimit the user's/document's content clearly so it can't be mistaken for your instructions | Wrap variable input in clear tags or headers, always |
| Lower temperature for determinism | Classification, extraction, and routing want one right shape; brainstorming wants many | Temperature 0–0.2 for structured tasks, 0.7+ for creative variety |
| Test on many inputs | One good output is one sample, not proof — include the ugly, ambiguous cases | At least a handful of deliberately varied inputs before you trust a prompt |
| Name the output format | State the exact shape you need; don't leave it to "however the model feels like answering" | JSON schema or explicit structure for anything a program will read |

## Quick decision rules

- **Vague verb in your draft** ("handle," "process," "deal with")? Replace it with the literal action and the literal output before doing anything else.
- **Prompt doing more than one job** (classify + reply + translate)? Split it into a pipeline — one prompt, one job, output feeding the next input.
- **Output needs to be parsed by code?** Name the exact schema and show one example of valid output. Don't rely on an instruction alone.
- **Same input giving different outputs across runs?** Check temperature before you touch the wording — see if it's a sampling problem, not a prompt problem.
- **Model "doesn't know" something it should?** Check whether the fact is actually in the prompt or in training data at all before rewriting anything — this may not be a prompt problem.
- **Impressed by one great output?** Don't ship it yet. Run it again, and run it on inputs you didn't hand-pick.

## Minimal specified-prompt skeleton

```text
[ROLE]   You are <role>, producing output for <audience/consumer>.
[TASK]   <exact action> on <exact input>.
[CONSTRAINTS] <hard limits: length, forbidden content, must-include facts>
[CONTEXT]     <facts the model needs and can't invent>
[EXAMPLES]    <1-3 input -> output pairs, if format or tone is non-obvious>
[FORMAT] Return only <exact shape>. No <things to exclude>.
[INPUT]  <the actual variable content, clearly delimited>
```

Every region here maps to one rule above — role and task cover specificity, examples cover show-don't-tell, the input region covers separating instructions from data, and format covers naming the output shape. See [the anatomy of a production prompt](/learn/prompt-engineering/anatomy-of-a-production-prompt) for the fully worked version of this skeleton.

## The two questions to ask before shipping anything

1. **"Which region of the prompt would prevent this specific failure if it happened?"** If you can't answer that in one sentence, the prompt isn't specified enough yet to debug, let alone ship. See [diagnosing why a prompt failed](/learn/prompt-engineering/reading-a-model-failure).
2. **"Have I run this on more than the input I wrote it against?"** If the answer is no, you have a demo, not a working prompt. See [reliability beats cleverness](/learn/prompt-engineering/reliability-over-clever-tricks).

## What this cheatsheet doesn't cover

This is the floor, not the ceiling. It doesn't cover few-shot example selection, chain-of-thought reasoning, role-prompting nuance, multi-step pipelines, structured-output contracts in depth, or evaluation methodology — those are their own modules, and each one assumes you already have these six defaults in place. If a technique from a later module isn't fixing your problem, come back here first and check whether one of these six is actually the gap.

**Related:** [The Anatomy of a Production Prompt](/learn/prompt-engineering/anatomy-of-a-production-prompt) · [Temperature for Prompt Engineers](/learn/prompt-engineering/temperature-and-determinism-for-prompters) · [The Five Mistakes Every Beginner Makes](/learn/prompt-engineering/beginner-prompting-mistakes) · [Prompt Evaluation Basics](/learn/prompt-engineering/prompt-evaluation-basics)
