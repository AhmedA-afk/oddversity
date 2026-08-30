---
title: "Quiz: asking AI well"
track: "ai-literacy"
status: live
summary: "A 6-question self-check quiz where learners diagnose which lever (task, context, format, or tone) is missing from a weak AI prompt, pick the fix that actually solves it, and get fu."
duration: "10 min read"
---

Every prompt below is broken for one specific, fixable reason. Before you look at the answer, decide which lever is missing — you'll start hearing that same gap in your own prompts.

> The four levers: **task** (the exact action you want), **context** (the background it needs to act on), **format** (the shape you want back), **tone** (the voice it should use). Most weak prompts are missing *one* of these, not all four — see [how to ask AI clearly](/learn/ai-literacy/how-to-ask-ai-clearly) for the full breakdown.

## 1. The generic marketing email

A founder types this into a chatbot: `Write a marketing email.` The result comes back polished, on-topic, and completely useless — generic praise for a nameless product aimed at nobody in particular.

Which lever is most responsible for that outcome?

- **A.** Task — the AI doesn't know what action to take
- **B.** Context — the AI doesn't know the product, the audience, or why this email is going out now
- **C.** Format — the AI doesn't know how long the email should be
- **D.** Tone — the AI doesn't know how formal to sound

<details><summary>Answer</summary>

**Correct: B.** The task is actually fine — "write an email, and make it a marketing one" is an unambiguous instruction. What's missing is everything the email needs to be *about*: what's being sold, to whom, and what's new. With no context, the model doesn't fail — it fills the vacuum with the most statistically average marketing email it can produce, which is exactly what came back. **A** is the tempting trap: the whole prompt *feels* vague, so it's easy to blame "task," but the deliverable and action are both specified. **C** is a real gap — length matters — but a perfectly-sized email about nothing is still nothing. **D** is also a real, smaller gap, but tone problems produce an email that sounds wrong, not one that's about the wrong (or no) product.

</details>

## 2. The meeting notes that never got pasted

Someone types: `Summarize my meeting notes into three action items.` No notes are attached or pasted anywhere in the conversation. What's the single fix that will do the most good here?

- **A.** Paste the actual meeting notes into the prompt, then ask for the three action items
- **B.** Rewrite as: "Summarize my meeting notes into three clear, prioritized action items."
- **C.** Rewrite as: "You are a helpful assistant. Please summarize my meeting notes into three action items."
- **D.** Rewrite as: "Summarize my meeting notes into three action items for my team."

<details><summary>Answer</summary>

**Correct: A.** This is the context lever taken to its most literal form: the model can't summarize notes it has never seen. No amount of polishing the instruction fixes a missing source — the AI will either invent plausible-sounding action items or (if it's well-behaved) just ask you for the notes, either way burning a turn. See [giving AI context and examples](/learn/ai-literacy/give-ai-context-and-examples). **B** is a real format improvement ("prioritized" adds useful structure) but it's solving a problem you don't have yet — there's still nothing to summarize. **C** is the classic cargo-culted prompt prefix: "you are a helpful assistant" adds words but no information the model didn't already have, and doesn't touch the actual gap. **D** adds a real audience detail, but like B, it's decorating an empty box.

</details>

## 3. The brand voice nobody can quite hit

A team's standing prompt is: `Write product descriptions in our brand voice — punchy, a little irreverent, no corporate speak.` Every result is close-ish but inconsistent: sometimes too stiff, sometimes trying too hard to be funny. What's the single most effective next move?

- **A.** Add more adjectives describing the voice: "witty, bold, confident, fun"
- **B.** Tell the AI to "really nail the tone this time, it's important"
- **C.** Paste 2-3 existing product descriptions that already nail the voice, and ask it to match that style
- **D.** Ask the AI to first define what "punchy and irreverent" means, then write the description

<details><summary>Answer</summary>

**Correct: C.** This is the case for showing instead of describing. "Punchy" and "irreverent" are labels — a real example carries word choice, sentence rhythm, and where the jokes land in a way no adjective list can. This is also a context move: you're handing over source material, just like question 2, except here the material *defines a style* rather than supplying facts. **A** feels like more specificity, but stacking adjectives ("witty, bold, confident, fun") actually adds ambiguity — each one is still a label the model has to interpret, and now there are four inconsistent labels instead of one. **B** adds urgency, not information; the model has nothing new to act on, it just gets told the stakes are higher. **D** sounds clever but wastes a step — the AI's generic definition of "punchy" isn't your brand's definition, so you've added a detour without grounding it in anything specific to you.

</details>

## 4. "Help me with my resume"

Someone pastes their resume and writes just that above it: `Help me with my resume.` Which rewrite actually fixes what's wrong with this prompt?

- **A.** "Help me with my resume, it's really important, I need this job."
- **B.** "Act as a professional resume writer and help me with my resume."
- **C.** "Please help me improve my resume so it sounds better."
- **D.** "Rewrite the bullet points under 'Experience' to lead with quantified impact, keep each under 20 words, in a confident but not boastful tone."

<details><summary>Answer</summary>

**Correct: D.** "Help me" isn't a task — it's a request for the AI to guess what kind of help you want: a rewrite? A critique? A shorter version? A cover letter to go with it? D replaces that guess with a specific action (rewrite the Experience bullets), a format constraint (lead with impact, under 20 words), and a tone (confident, not boastful) — three levers moving together on purpose. See [turning a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one). **A** adds emotional stakes but no instruction the model can act on — urgency doesn't tell it what to do differently. **B** is a persona prefix that feels like specificity but isn't: "act as a resume writer" doesn't say what task that resume writer should perform any more than "help me" did. **C** just restates the original vagueness in different words — "sounds better" is a feeling, not a task.

</details>

## 5. The landlord message that reads like a lawsuit

Prompt: `Draft a message to my landlord about the broken heater.` The AI drafts something factually fine — it mentions the heater, asks for a repair — but reads stiff, cold, and faintly like a legal notice. Which lever's absence caused *this specific* problem?

- **A.** Tone — the prompt never said how the message should come across
- **B.** Task — the prompt didn't say what the message should accomplish
- **C.** Context — the prompt didn't mention how long the heater's been broken or any earlier attempts to reach the landlord
- **D.** Format — the prompt didn't specify email vs. text vs. letter

<details><summary>Answer</summary>

**Correct: A.** Left unspecified, models tend to default toward a neutral-to-formal register, and a request framed around a "broken heater" and "the landlord" nudges that default toward something that reads like a formal complaint. That's a tone symptom, not a facts or structure symptom — fix it by naming the register you want ("firm but friendly, not a legal threat"). **B** is tempting but the task is actually clear: draft a message, about the heater, to the landlord. **C** would make the message more persuasive and specific, and it's a real gap worth closing — but even with those details added, an unset tone still produces a cold, detailed complaint rather than a warm one. **D** affects length and structure (a text is shorter than a letter) but not warmth — you can just as easily get a stiff, lawsuit-sounding text message as a stiff email.

</details>

## 6. When the checklist becomes the problem

A colleague starts applying the four-lever check to everything, including asking: `What's the capital of France?` They "improve" it to: "Task: tell me a fact. Context: I'm curious about European geography. Format: one sentence. Tone: casual. What's the capital of France?"

What's the most accurate read of this rewrite?

- **A.** Good habit — always specify all four levers for consistency
- **B.** Wrong, because "task" should never be stated explicitly, only implied
- **C.** Correct, because more detail always produces a better answer
- **D.** Overkill — the original question already had one unambiguous interpretation and one correct answer, so there was no gap to close

<details><summary>Answer</summary>

**Correct: D.** The four-lever check is a diagnostic for closing a *real* ambiguity — it's not a template to run on every message. "What's the capital of France?" has exactly one reasonable reading and one correct answer; there's no task, context, format, or tone gap for the extra scaffolding to fix, so it just adds typing and tokens for the same answer you'd have gotten anyway. **A** sounds disciplined but is actually cargo-culting a checklist — the skill this whole module is teaching is judging *whether and which* lever is missing, not mechanically stacking all four every time. **B** invents a rule that doesn't exist; stating the task explicitly is fine, it's just unnecessary when the task was already obvious. **C** is a common and costly myth — extra instructions have a real cost in time and (for paid tools) usage, see [what using AI actually costs](/learn/ai-literacy/what-using-ai-actually-costs) — and padding an already-clear prompt doesn't make a factual answer more correct.

</details>

## Where this leaves you

Notice the pattern across all six: the fix is never "add more words." It's naming the *one* thing the AI actually lacked — a fact it didn't have, an example it needed to see, a register it defaulted away from — and leaving the rest alone. That's the whole skill. For quick reference while you practice, keep [the everyday prompting cheatsheet](/learn/ai-literacy/everyday-prompting-cheatsheet) nearby, and look at [prompt patterns for everyday tasks](/learn/ai-literacy/prompt-patterns-for-everyday-tasks) for reusable shapes that bake task, format, and tone in from the start.

**Related:** [How to ask AI clearly](/learn/ai-literacy/how-to-ask-ai-clearly) · [Turn a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one) · [Give AI context and examples](/learn/ai-literacy/give-ai-context-and-examples) · [Prompt patterns for everyday tasks](/learn/ai-literacy/prompt-patterns-for-everyday-tasks) · [Everyday prompting cheatsheet](/learn/ai-literacy/everyday-prompting-cheatsheet)
