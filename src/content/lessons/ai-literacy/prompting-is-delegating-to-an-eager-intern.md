---
title: "Think of prompting as briefing an eager intern"
track: "ai-literacy"
status: live
summary: "Builds the core mental model for prompting: AI behaves like a brilliant, tireless intern who knows nothing about your specific situation and will never ask a clarifying question un."
duration: "8 min read"
---

Picture the most capable intern you've ever worked with: read everything, types at superhuman speed, never has a bad day, never pushes back on a Friday-afternoon request. Now picture that they started an hour ago, know nothing about your life or your project, and will never once say "wait, can you clarify?" unless you explicitly tell them to. That's the AI you're typing into.

## The eager intern

Hold two facts about this intern in your head at the same time, because most prompting mistakes come from forgetting one of them.

First: broadly capable. This intern has absorbed an enormous amount of general knowledge — how parties usually go, what a budget spreadsheet looks like, what makes an email sound professional. Ask it something generic and it'll produce something competent almost instantly.

Second: zero specific context, and eager to please. It doesn't know your daughter's name, your budget, your backyard, or your taste. And critically, it won't sit there and wait for you to fill that in. It's built to be helpful *now*, so if you leave a gap, it doesn't leave the gap open — it fills it with a plausible guess and keeps going, confidently, to a finished-looking result.

That combination — broad competence plus zero situational awareness plus an unwillingness to leave anything unanswered — is the whole reason [prompting](/learn/ai-literacy/how-to-ask-ai-clearly) is a skill and not just typing a question into a box.

## Run the simulation: "plan a birthday party"

Say this to the intern:

```text
Plan a birthday party.
```

Walk through what happens next, step by step, before you see the output. The intern needs to know: whose birthday, what age, how many guests, what budget, indoors or out, any dietary restrictions, what "planned" even means as a deliverable. You gave it none of that. It doesn't stop and ask. It picks the statistically safest guess for each blank — a mixed-age group, a moderate budget, a generic "fun and games" theme, a two-page outline with a schedule, a shopping list, a playlist.

What comes back will look complete. Headings, a timeline, bullet points, maybe a budget table. It reads like effort went into it, because in a sense it did — the intern really did plan *a* birthday party well. Just not yours. Now compare a second version of the same request:

```text
Plan a birthday party.
Context: my daughter turns 7 on September 12. Backyard party,
12 kids ages 6-8, budget $150 total, superhero theme, 2 hours
(3-5pm), one kid has a peanut allergy.
Done looks like: a numbered timeline for the 2 hours, a shopping
list with rough costs that stays inside the budget, and 3 simple
games that need no special equipment.
```

Run the same simulation. Now the intern has real anchors: it can size games to 6-to-8-year-olds instead of a vague "all ages," allocate the $150 across categories instead of guessing a budget, flag the peanut allergy on any snack it suggests, and shape the whole plan around a hard two-hour window because you told it what the finished thing needs to look like. The two briefs took you ten extra seconds to type. The outputs are not in the same universe.

Notice what still might be wrong, though: the intern doesn't know your yard has three concrete steps down to the patio, or that your daughter cried at the last piñata and never wants to see one again. No brief captures everything. That's not a reason to stop giving context — it's a reason to skim the result before you commit to it, the same instinct covered in [judging AI output](/learn/ai-literacy/the-single-most-important-skill-judging-output).

## Two blanks a vague brief always leaves

Every prompt has two jobs, and a vague one skips both:

1. **Context** — the facts about your specific situation that the intern has no way to know: the age, the budget, the allergy, the deadline.
2. **A definition of done** — what the finished thing should actually look like: a numbered timeline, a shopping list with costs, three games, nothing more.

Skip the first and the intern guesses the wrong situation. Skip the second and it guesses the wrong shape of answer — a two-paragraph vibe when you wanted a checklist, or a sprawling essay when you wanted three bullet points. Either way, it doesn't come back empty-handed to ask. It produces *something*, fully formed, and moves on. Getting specific about both is most of what [turning a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one) and [giving AI context and examples](/learn/ai-literacy/give-ai-context-and-examples) actually mean in practice — this is the intuition underneath both skills.

## The intuition you probably have, and why it's backwards

Here's the wrong mental model, and it's wrong because it's borrowed from real workplace experience: *"If I leave something important out, a good assistant will notice and ask me before doing real work — especially work that touches my money or my family."* That's how a decent human intern behaves. It is not how the AI behaves by default.

The corrected version: the AI treats an incomplete brief as a brief to complete, not a brief to interrupt. It will guess the budget, guess the guest count, guess the tone — and hand you a confident, polished answer that never flags which parts were guesses. Silence from the AI is not a signal that your prompt had everything it needed. This is also why a rushed, five-word prompt is more dangerous than it feels: you might expect thin input to produce a visibly thin, obviously-incomplete answer you'd catch immediately. Instead you often get something that *looks* just as authoritative as a well-briefed answer — see [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) for the mechanics behind that. Confidence is not evidence the gaps got filled correctly; it's just how the output always sounds.

If you actually want the questions, you have to ask for them:

```text
Before you plan anything, ask me whatever you need to know about
budget, guest list, and theme.
```

That one line flips the intern's default behavior from "guess and proceed" to "check first." It's a real technique, not a trick — use it any time the cost of a wrong guess is higher than the cost of one extra round trip.

## Before you hit send: a two-question check

Two questions, every time, before a request that matters:

- Does the intern actually have the facts specific to my situation — or am I relying on it to guess them?
- Have I said what "done" looks like — format, length, constraints — or am I leaving that to its judgment too?

If either answer is "it's guessing," you already know why the output might miss, before you've even read it.

## Where the analogy breaks

The intern picture earns its keep for the core lesson — supply context, define done, expect no pushback — but push it further and it snaps in a few places worth knowing about:

- **No accumulating memory.** A real intern who plans three parties for you starts inferring your taste on the third without being retold. Most AI conversations start from zero every time; nothing carries over unless you re-supply it or the tool has an explicit memory feature. Related: how a [context window](/learn/llm-foundations/context-window-mechanics) actually works.
- **No sense of stakes.** A human intern senses when something is high-stakes — the CEO's event, a client-facing email — and gets more careful unencouraged. The AI applies roughly the same effort to a joke request and a contract clause unless you tell it which one this is.
- **Correction doesn't generalize.** Fix a human intern's mistake on Monday and it often sticks through Friday. Correct the AI mid-conversation and that fix lives only in this conversation — the next fresh chat has forgotten it happened.
- **Speed carries no information.** A human intern who takes three days on a plan is signaling that real effort went in. The AI takes about the same few seconds whether your brief was excellent or terrible, so response time tells you nothing about output quality — you still have to check the work yourself, every time.
- **No ramp-up required.** This is where the analogy undersells the tool: a junior human needs months to reach "give them a vague brief and trust the result." A great brief to the AI can get you a strong result on the very first message of a brand-new conversation, no seniority required — just a specific ask.

The analogy is scaffolding, not a spec. Once "be specific, define done, expect no pushback" is a reflex, you don't need to picture an intern anymore — you just write the brief that way.

**Related:** [How to ask AI clearly](/learn/ai-literacy/how-to-ask-ai-clearly) · [Turn a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one) · [Give AI context and examples](/learn/ai-literacy/give-ai-context-and-examples) · [Prompt patterns for everyday tasks](/learn/ai-literacy/prompt-patterns-for-everyday-tasks) · [The everyday prompting cheatsheet](/learn/ai-literacy/everyday-prompting-cheatsheet)
