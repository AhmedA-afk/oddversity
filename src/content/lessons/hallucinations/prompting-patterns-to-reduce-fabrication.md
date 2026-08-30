---
title: "Prompting Patterns That Lower Hallucination"
track: "hallucinations"
status: live
summary: "Four cheap prompt patterns that measurably change what a model does with uncertainty, evidence, and false premises."
duration: "7 min read"
---

Prompting is the cheapest lever in this module to apply and the easiest to overrate. It costs nothing but a few sentences of instruction, changes real behavior, and is genuinely limited by what the underlying model can do at all — a distinction this lesson keeps coming back to.

## What it is

Four patterns, each targeting a specific decision point where models default toward fabrication instead of honesty:

1. **Grant explicit permission to say unknown.**
2. **Ask the model to quote evidence before concluding.**
3. **Separate "what the source says" from "what I infer."**
4. **Reject false premises explicitly, rather than answering around them.**

None of these are exotic. What makes them work is specificity — a vague version of each pattern is close to useless, and the difference between vague and specific is the entire lesson.

## Permission to say unknown

Models are trained on data where confident answers are overwhelmingly more common than "I don't know" — see [training objective rewards guessing](/learn/hallucinations/training-objective-rewards-guessing) for why that shapes default behavior. A bare instruction like "be honest if you're not sure" rarely overrides that default, because it doesn't say what "not sure enough" means or what to output instead.

A specific version does both:

```text
If you cannot find the answer in the provided context, respond
exactly with: "I don't have enough information to answer that."
Do not guess, estimate, or use general knowledge to fill the gap.
```

This names the exact output string and explicitly forbids the fallback behavior (using general knowledge) that produces most fabrications. [Teaching a model to say "I don't know"](/learn/hallucinations/teaching-models-to-say-i-dont-know) and [abstention as a skill](/learn/hallucinations/abstention-as-a-skill) go deeper on why the specific wording matters this much.

## Quote before you conclude

Asking a model to produce its conclusion first and its evidence second lets it rationalize backward — state a plausible answer, then reach for anything nearby that sounds supportive. Reversing the order changes the constraint:

```text
First, quote the exact sentence from the context that's most relevant
to the question. Then, and only using that quote, state your answer.
```

Forcing the quote first means an unsupported answer has nowhere to hide — if no sentence actually addresses the question, the quoting step surfaces that immediately, before the model has committed to an answer it now has to defend. This is a cheap, prompt-level version of the entailment discipline in [the citation verification loop](/learn/hallucinations/citation-verification-loop), applied before generation instead of after.

## Separate what the source says from what you infer

Models blend retrieved fact and their own reasoning into one undifferentiated paragraph by default, which is exactly the over-extrapolation failure from [why RAG still hallucinates](/learn/hallucinations/why-rag-still-hallucinates). Making the model label the seam catches it:

```text
Structure your answer in two parts:
STATED: only claims directly supported by the provided documents.
INFERRED: your own reasoning that goes beyond what's directly stated,
clearly marked as inference, not fact.
```

This doesn't stop the model from inferring — sometimes inference is exactly what's wanted — but it stops inference from being *silently* presented with the same confidence as a sourced fact. A reader can now tell which half of the answer to double-check.

## Reject false premises explicitly

A leading question smuggles in an assumption: "What caused the 30% drop in Q3 revenue?" asked when revenue didn't actually drop invites the model to answer the embedded premise rather than question it — the exact mechanism in [adversarial and leading prompts](/learn/hallucinations/adversarial-and-leading-prompts) and [leading-prompt fabrication](/learn/hallucinations/leading-prompt-fabrication). The fix is an instruction that makes premise-checking an explicit first step, not something left to the model's judgment under pressure to be helpful:

```text
Before answering, check whether the question's premise is actually
true according to the provided data. If the premise is false or
unsupported, say so explicitly instead of answering as if it were true.
```

### Before and after

**Leading question:** "Why did the enterprise plan's SSO feature fail last month?" — asked when no such failure occurred.

**Without the pattern:** "The SSO integration likely failed due to a misconfigured identity provider or an expired certificate" — a fluent, specific, entirely fabricated incident report for an event that never happened.

**With the pattern:** "I don't see any record of an SSO failure last month in the provided data. Can you confirm the timeframe or point me to the specific incident you're referring to?" — the false premise gets caught and returned to the user instead of confidently elaborated on.

## What prompting can and can't fix

Every pattern here changes the model's *policy* — what it does when facing ambiguity or a leading question — not its *knowledge* or its underlying *calibration*. A model that is fundamentally overconfident due to how it was trained will still be overconfident in the cases these prompts don't explicitly cover, and a strong enough adversarial framing can still override a prompted instruction. [Calibration versus prompting](/learn/hallucinations/calibration-training-vs-prompting) draws this line precisely: prompting is fast, free, and model-agnostic, but it's a policy patch on top of a fixed underlying model, not a fix to the model's actual uncertainty. Where prompting alone isn't holding, that's the signal to add grounding, constraint, or (for anything worth the investment) actual calibration training.

## Where next

[System prompt grounding recipes](/learn/hallucinations/system-prompt-grounding-recipes) packages these patterns into three complete, copy-adaptable system-prompt blocks. [Mitigation antipatterns](/learn/hallucinations/mitigation-antipatterns) covers the specific way "just tell it not to hallucinate" fails when the instruction stays vague instead of specific like the ones above.

**Related:** [Teaching a Model to Say "I Don't Know"](/learn/hallucinations/teaching-models-to-say-i-dont-know), [Adversarial and Leading Prompts](/learn/hallucinations/adversarial-and-leading-prompts), [Calibration versus Prompting](/learn/hallucinations/calibration-training-vs-prompting), [Abstention as a Skill](/learn/hallucinations/abstention-as-a-skill)
