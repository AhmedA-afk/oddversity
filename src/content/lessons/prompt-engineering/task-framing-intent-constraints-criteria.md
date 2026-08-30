---
title: "Task Framing: Intent, Constraints, Acceptance Criteria"
track: "prompt-engineering"
status: live
summary: "Turning a fuzzy request like 'write good release notes' into an intent, a set of constraints, and criteria a model can be held to."
duration: "5 min read"
---

"Write good release notes" is not a task. It's a wish, dressed up as one. Task framing turns wishes into three things a model — and later, an eval — can actually be held to: intent, constraints, and acceptance criteria.

## What it is

[Task framing](/learn/prompt-engineering/task-framing) already gives you a five-part brief — actor, input, action, constraint, acceptance — for scoping a feature before you write a line of prompt. This lesson narrows to three of those parts and treats them as a section you write directly *into* the prompt, not just a planning exercise that happens before it:

- **Intent** — the concrete goal, in context: who reads this, and what decision or action it needs to enable.
- **Constraints** — hard limits. Things that make the output unacceptable regardless of how well-written it otherwise is.
- **Acceptance criteria** — the checklist a reviewer, or an eval, applies to decide if the result should ship.

## The mental model

The triad answers three different questions, in order, and each one guards against a different failure:

No intent, and the model optimizes for some generic version of "good" — professional-sounding, safely vague, applicable to nothing in particular. No constraints, and the model wanders into things you specifically didn't want, because nothing said it couldn't. No acceptance criteria, and nobody — including you — can tell whether the output should ship or needs another pass; "good" stays a feeling instead of a check.

## Why it works this way

Models are extremely good at producing plausible-sounding output for underspecified asks. "Write good release notes" will produce something that reads like release notes — confident, well-formatted, plausible. Plausible is not the same as correct, and the model has no way to know which of many equally plausible interpretations you actually meant unless the triad supplies it. This is the same trap [prompt anti-patterns](/learn/prompt-engineering/prompt-anti-patterns) calls "vague asks dressed up as instructions" — the fix there and here is the same: replace the vague verb with a stated outcome.

## A concrete example (shown)

Vague version:

```text
Write good release notes for this update.
```

Framed version:

```text
Intent: release notes for engineering-literate customers deciding
whether to upgrade now or wait for the next cycle.

Constraints:
- Under 150 words.
- Every breaking change must appear on its own line, prefixed
  "BREAKING:".
- Plain, factual language only -- no superlative adjectives
  ("game-changing," "revolutionary," "seamless").

Acceptance criteria:
- Every breaking change from the source changelog appears as its
  own "BREAKING:" line.
- Word count is under 150.
- Zero superlative adjectives appear anywhere in the output.
- A reader who has never seen the changelog can decide upgrade-now
  vs. wait-a-cycle from this alone.
```

The vague version leaves "good" undefined, so a model has to guess whether that means punchy marketing copy, an exhaustive technical list, or something in between — and different reasonable guesses produce wildly different outputs. The framed version doesn't just constrain tone; the acceptance criteria give you (or an eval, per [acceptance criteria in prompts](/learn/prompt-engineering/acceptance-criteria-in-prompts)) something to actually check the output against once it comes back, instead of eyeballing whether it "feels" done.

Notice, too, that "no marketing language" is phrased as what to avoid, but the constraint is written as what to do instead — "plain, factual language only" — because a positive instruction is easier for a model to act on reliably than a bare negation; see [why "don't do X" backfires](/learn/prompt-engineering/negative-instructions-pitfall) for the mechanism.

## Where it shows up

Anywhere "quality" is contested inside a team — support reply tone, documentation style, code review comments — a framed triad written into the prompt gives everyone the same target instead of everyone privately judging output against their own idea of "good." It's also the section that makes a prompt gradeable, which is the whole premise behind [evaluating prompts before you ship them](/learn/prompt-engineering/prompt-evaluation-basics): you can't score against a rubric nobody wrote down.

## Watch out for

- **Constraints that are actually preferences.** If you wouldn't reject an output for violating it, it's not a constraint — keep hard limits separate from stylistic nice-to-haves, or the real constraints stop reading as urgent.
- **Acceptance criteria only the author can judge.** "Feels professional" isn't a criterion, it's a mood. [Acceptance criteria in prompts](/learn/prompt-engineering/acceptance-criteria-in-prompts) walks through rephrasing exactly this kind of goal into something checkable.
- **Blurring constraints into acceptance criteria.** A constraint disqualifies; acceptance criteria is the full scorecard. "No marketing language" is a constraint in spirit, but "zero superlative adjectives" is what actually lets you check it.

## Where next

See [acceptance criteria in prompts](/learn/prompt-engineering/acceptance-criteria-in-prompts) for phrasing criteria so they're machine-checkable, [sectioning a prompt into blocks](/learn/prompt-engineering/sectioning-a-prompt-into-blocks) for where this triad lives relative to context and examples, and the [fully structured support-reply prompt](/learn/prompt-engineering/structured-prompt-worked-example) for the triad inside a complete, working prompt.

**Related:** [Task Framing](/learn/prompt-engineering/task-framing), [Acceptance Criteria in Prompts](/learn/prompt-engineering/acceptance-criteria-in-prompts), [Why "Don't Do X" Backfires](/learn/prompt-engineering/negative-instructions-pitfall), [Prompt Anti-Patterns](/learn/prompt-engineering/prompt-anti-patterns), [Sectioning a Prompt into Blocks](/learn/prompt-engineering/sectioning-a-prompt-into-blocks)
