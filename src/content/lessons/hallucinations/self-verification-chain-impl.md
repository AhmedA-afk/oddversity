---
title: "Implementation: Self-Verification and Chain-of-Verification"
track: "hallucinations"
status: live
summary: "Build chain-of-verification: draft, generate independent check questions, answer them fresh, then revise against the mismatches."
duration: "8 min read"
---

[Self-Verification: Having the Model Check Its Own Work](/learn/hallucinations/self-verification-techniques) laid out critique-and-revise as one shape a second pass can take. Chain-of-verification is a more structured version of the same idea, and structure is what makes it catch things a looser "does this look right?" pass tends to miss.

## What we're building

A `ChainOfVerification` pipeline with four stages: draft an answer, generate independent verification questions from that draft, answer each question in a fresh context that never sees the draft, and revise the original answer against whatever mismatches turn up. The isolation in step three is the part that's easy to skip and does most of the work.

## Setup

Same pluggable `call_model(prompt)` stub as the rest of this module — swap in your SDK of choice. No external libraries needed.

## Build it

### Step 1: Draft the initial answer

```python
def draft_answer(question: str) -> str:
    prompt = f"Answer the following question with specific, concrete details:\n\n{question}"
    return call_model(prompt)

draft = draft_answer("Write two sentences about Marie Curie's scientific achievements.")
# draft: "Marie Curie was a pioneering physicist and chemist who discovered
# radium and polonium. She was awarded three Nobel Prizes for her work
# on radioactivity."
```

> **Why this step?** The draft is generated the normal way, under normal pressure to sound complete. That's deliberate — verification only means something if the draft wasn't written defensively.

### Step 2: Generate independent verification questions

```python
def generate_verification_questions(draft: str) -> list[str]:
    prompt = f"""Below is a draft answer. List 2-4 specific, standalone factual
claims in it as yes/no or short-answer questions that could be checked
independently. Output one question per line, no extra commentary.

Draft:
{draft}"""
    response = call_model(prompt)
    return [line.strip() for line in response.splitlines() if line.strip()]

questions = generate_verification_questions(draft)
# questions: ["Did Marie Curie discover radium and polonium?",
#             "How many Nobel Prizes did Marie Curie win?"]
```

> **Why this step?** Turning prose into discrete, checkable questions is what makes the next step possible — "does this paragraph sound right" isn't checkable, "how many Nobel Prizes did she win" is.

### Step 3: Answer each question independently — without the draft in context

```python
def answer_independently(question: str) -> str:
    # Deliberately does NOT include the draft anywhere in this prompt.
    prompt = f"Answer this question directly and factually: {question}"
    return call_model(prompt)

verification_answers = {q: answer_independently(q) for q in questions}
# {"Did Marie Curie discover radium and polonium?": "Yes, along with her
#    husband Pierre Curie.",
#  "How many Nobel Prizes did Marie Curie win?": "Two — Physics in 1903
#    and Chemistry in 1911."}
```

> **Why this step?** This is the step that actually matters, and it's the one that's easiest to get wrong. If the verification prompt includes the draft, the model tends to just re-confirm what it already wrote — the same anchoring effect that makes [leading questions](/learn/hallucinations/leading-prompt-fabrication) so effective at extracting false agreement. Answering fresh, with no memory of the draft, is what gives you a genuinely second opinion instead of an echo.

### Step 4: Revise against the mismatches

```python
def revise(draft: str, verification_answers: dict) -> str:
    qa_block = "\n".join(f"- {q}\n  Verified answer: {a}"
                          for q, a in verification_answers.items())
    prompt = f"""Original draft:
{draft}

Independent verification results:
{qa_block}

Rewrite the draft, correcting any claim that conflicts with a verification
result. Keep everything else unchanged."""
    return call_model(prompt)

final = revise(draft, verification_answers)
# final: "Marie Curie was a pioneering physicist and chemist who discovered
# radium and polonium, alongside her husband Pierre Curie. She was awarded
# two Nobel Prizes for her work — Physics in 1903 and Chemistry in 1911."
```

> **Why this step?** The revision call sees both sides of every mismatch explicitly, so it's correcting against evidence rather than guessing again. This is exactly where the pipeline catches the fabricated "three Nobel Prizes" claim from the draft — the independently-verified "two" directly contradicts it, and the rewrite fixes the specific error without touching the rest of the sentence.

## Run it

The full run: `draft_answer` → `generate_verification_questions` → `answer_independently` (per question) → `revise`. The example above shows a fabricated statistic — "three Nobel Prizes," a plausible-sounding but wrong number — getting caught because the independent verification pass, with no view of the draft, landed on the correct "two" from a completely fresh generation.

## Harden it

- **Force isolation, don't just ask for it.** Build the verification call as a genuinely separate request with no draft text in its prompt or conversation history — not a "please answer this fresh, ignoring what you wrote before" instruction inside the same context, which doesn't reliably work.
- **Make verification questions atomic.** "Is this paragraph accurate?" isn't checkable. "How many Nobel Prizes did Marie Curie win?" is. Push the question-generation prompt toward one fact per question.
- **Consider a majority vote per verification question.** Answering each verification question multiple times and taking the majority (the same logic as [self-consistency](/learn/hallucinations/self-consistency-detector-impl)) makes a single unlucky wrong verification answer less likely to poison the revision.
- **Don't let revision silently drop unresolved claims.** If a verification answer comes back genuinely uncertain rather than contradicting, flag that claim for review rather than guessing during the rewrite.

## Extend it

This pipeline catches errors the model can recognize once it re-derives them independently. It does not catch a case where the same wrong belief shows up in both the draft and the fresh verification pass — [Worked Example: When Self-Verification Rubber-Stamps a Lie](/learn/hallucinations/self-verification-when-it-fails) walks through exactly that failure and where the boundary sits. For claims that need checking against something outside the model entirely rather than a second internal pass, pair this pipeline with [Implementation: NLI Entailment as a Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl) against real source material.

**Related:** [Self-Verification: Having the Model Check Its Own Work](/learn/hallucinations/self-verification-techniques), [Worked Example: When Self-Verification Rubber-Stamps a Lie](/learn/hallucinations/self-verification-when-it-fails), [Implementation: A Self-Consistency Hallucination Detector](/learn/hallucinations/self-consistency-detector-impl), [Citations: Making Every Claim Traceable to a Source](/learn/hallucinations/citations-and-attribution)
