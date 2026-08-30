---
title: "Cheatsheet: everyday prompting"
track: "ai-literacy"
status: live
summary: "A one-page printable reference for everyday AI prompting: the four levers that shape any request, five copy-paste starter templates, three fixes for bad answers, and phrases that r."
duration: "6 min read"
---

Print this one. Every prompting problem you'll hit day to day traces back to one of four missing pieces — this page is the fast lookup for all four, plus the fixes when the first answer isn't good enough.

## The four levers

Every request to an AI system is built from four things. Leave one out and the model guesses — that's where most bad answers come from, not from the model being "dumb."

| Lever | Question it answers | If you don't specify it |
|---|---|---|
| **Task** | What do you actually want done? | It guesses your intent from wording — fine for common requests, wrong for ambiguous ones |
| **Context** | What does it need to know that it can't already know? | Nothing about your specifics — your audience, your constraints, your prior attempts |
| **Format** | What shape should the answer come in? | A medium-length hedged paragraph — the model's default is rarely your default |
| **Tone** | Who is this for, and how should it sound? | Generic helpful-assistant voice, which reads as bland in almost any real context |

**Start here, then measure:** name the task in one clear sentence, give 2-3 lines of context, state the format you want, and only add tone if the default voice doesn't fit. Add more of each lever only if the output misses — don't front-load everything "just in case," since a wall of instructions is as hard to satisfy as a vague one. This is the same breakdown covered in more depth in [how to ask AI clearly](/learn/ai-literacy/how-to-ask-ai-clearly) and [giving AI context and examples](/learn/ai-literacy/give-ai-context-and-examples).

## Five starter templates

Copy, fill the brackets, send. These cover most everyday requests.

**1. Rewrite or edit something you already wrote**
```text
Rewrite this [email / paragraph / message] to be [shorter / more formal / friendlier].
Keep the facts and the ask exactly the same. Don't add anything I didn't say.

[paste your text]
```

**2. Get a decision made easier, not made for you**
```text
I'm trying to decide: [your situation in one sentence].
Give me three options, each with the main upside and the main downside.
Don't tell me which one to pick — I'll decide.
```

**3. Understand something unfamiliar**
```text
Explain [topic] to me. I already know [what you know], I don't know [what you don't].
Use a real-world analogy, then one concrete example. Keep it under 200 words.
```

**4. Draft something from a blank page**
```text
Draft a [message / post / description] for [audience].
Purpose: [what it needs to accomplish].
Must include: [non-negotiable facts or details].
Tone: [e.g. direct and warm, not salesy].
```

**5. Summarize or pull facts out of a long document**
```text
Summarize the text below in [3 bullets / 100 words].
Only use information that's actually in the text — if something's missing, say so
instead of filling it in.

[paste the text]
```

Notice the pattern: task first, context second, format and tone stated explicitly rather than implied. That's the same shape as the request patterns in [prompt patterns for everyday tasks](/learn/ai-literacy/prompt-patterns-for-everyday-tasks) — these five are just the ones worth memorizing.

## If the answer is bad, try this

Don't just hit regenerate and hope. Diagnose which lever failed, then fix that one.

> **1. It's vague, generic, or "could be about anything."**
> That's a context failure, not a task failure. Add one real example of what good looks like, or one sentence of the specific situation. "Write me a follow-up email" gets you filler; "write a follow-up email to a client who went quiet after a proposal, keep it low-pressure" gets you something usable.

> **2. It's confidently wrong on a fact, number, or quote.**
> Don't argue with it — verify outside the chat. Ask it to show its reasoning or cite where a claim came from, then check that source yourself. This is a known failure mode, not bad luck — see [what a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) and the [verification checklist](/learn/ai-literacy/the-verification-checklist) for how to check fast.

> **3. The content is right but the shape is wrong** (too long, too formal, wrong structure).
> That's a format or tone miss — say so directly instead of rewriting the whole request. "Same content, but half the length" or "same answer, less formal" is a one-line fix that keeps everything that was already working.

## Phrases that reliably earn their keep

Small additions, consistently good return. Drop these into any prompt.

- **"Ask me questions before you start."** Turns a guess into a conversation — use it whenever the task has more than one reasonable interpretation.
- **"Give me three options."** Stops you from anchoring on the model's first idea as if it were the only one.
- **"Keep it under 100 words."** (or any number) — a hard constraint forces prioritization; without one, length defaults to "medium-ish and hedgy."
- **"Use only the information I gave you."** Cuts down on invented details when you're summarizing or extracting from a specific source.
- **"Show your reasoning."** Makes errors visible before you act on them — especially worth it for anything involving [numbers or math](/learn/ai-literacy/when-ai-gets-numbers-and-math-wrong).
- **"What would make this wrong?"** A cheap self-check — ask it after you get an answer, not instead of your own judgment.

None of these are magic words — they work because each one removes a specific ambiguity the model would otherwise have to guess at. That's also why [judging the output](/learn/ai-literacy/the-single-most-important-skill-judging-output) still matters even after you've used every phrase on this page: a well-shaped prompt makes verification easier, it doesn't replace it.

**Related:** [How to ask AI clearly](/learn/ai-literacy/how-to-ask-ai-clearly) · [Turn a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one) · [Give AI context and examples](/learn/ai-literacy/give-ai-context-and-examples) · [Prompt patterns for everyday tasks](/learn/ai-literacy/prompt-patterns-for-everyday-tasks) · [The single most important skill: judging output](/learn/ai-literacy/the-single-most-important-skill-judging-output) · [Prompting quiz](/learn/ai-literacy/prompting-quiz)
