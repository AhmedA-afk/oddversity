---
title: "What AI can and can't do: the whole picture"
track: "ai-literacy"
status: live
summary: "A whole-track map that uses one running scenario — emailing a landlord about a broken heater — to walk through all seven AI literacy skills and show, at each step, what a beginner."
duration: "14 min read"
---

You type one sentence into an AI chatbot and get back a full paragraph in two seconds. That paragraph can save you twenty minutes — or quietly get you into a small mess. This whole track is about closing the gap between those two outcomes, and this page is the map of how.

## The big picture

Here's the scenario we'll use throughout this track: your apartment's heater has been dead for three days, it's cold, and you open an AI chatbot and type "write an email to my landlord about my broken heater." Two seconds later you have a full email, greeting and sign-off included. That one interaction touches every skill this track builds, in the order you'll actually use them. Walk through it once and the shape of the whole track — and why it's split the way it is — will make sense.

**Stage 1 — know what you're actually talking to.** The system that wrote your email isn't a person who knows your lease, your landlord, or your local tenant law. It's a model that learned, from enormous amounts of text, what a "polite request to a landlord about a repair" tends to look like — and it's reproducing that pattern, not reasoning about your situation the way a friend would. That distinction is the difference between using it well and trusting it blindly.

> **Right:** it correctly reproduces the shape people use for this kind of email — clear subject, polite but firm tone, a request for a timeline.
> **Wrong:** it can also confidently invent specifics — a lease clause number, a legal deadline for landlords to fix heat — that sound exactly as fluent as the true parts, because fluency and accuracy come from different places.

Start here: [what AI actually is](/learn/ai-literacy/what-ai-actually-is) and [why "pattern prediction" isn't the same as thinking](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking).

**Stage 2 — understand how the answer got built.** The model generated your email one word at a time, each word chosen because it was a likely continuation given the words before it and everything in its training data. It didn't look your lease up anywhere — it has no access to it unless you paste it in. That's also why it sounds so sure of itself: confident, grammatical phrasing is what the training data mostly looked like, whether the sentence is true or not.

```text
Model draft: "As stated in Section 4.2 of your lease, landlords
are required to restore heat within 24 hours of notice."
```

Nothing you told it mentioned a Section 4.2. It didn't retrieve that — it generated a *plausible-sounding* clause because emails like this often cite one. See [how language models produce text](/learn/ai-literacy/how-language-models-produce-text), [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident), and [why it's not a search engine](/learn/ai-literacy/ai-is-not-a-search-engine) even though it can sound like one.

**Stage 3 — ask for what you actually need.** The first draft was generic because the prompt was generic. You get a much more useful email by giving it the details only you have:

```text
Vague:    "write an email to my landlord about my broken heater"

Specific: "Write a polite but firm email to my landlord. The heater
has been out for 3 days, it's below 40°F at night, I already texted
on Monday with no reply. I want a repair date within 48 hours.
Don't invent any legal claims — just state the facts and the ask.
Keep it under 150 words."
```

Same tool, same two seconds, dramatically better output — because you delegated like you would to a competent intern who's never met your landlord and doesn't know your local law. Work through [how to ask AI clearly](/learn/ai-literacy/how-to-ask-ai-clearly), [giving it context and examples](/learn/ai-literacy/give-ai-context-and-examples), and [turning a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one).

**Stage 4 — verify before you act on it.** Even the better draft needs a read-through for one specific thing: any claim that isn't just tone or structure. A made-up lease section or an invented legal deadline is a hallucination — not a rare glitch, but an expected side effect of a system that generates plausible text rather than looked-up facts. Before you hit send, you check every date, every number, and every "as required by law" against something real — your actual lease, or your state's tenant-rights page.

This is the single skill that pays for every other one: [judging AI output](/learn/ai-literacy/the-single-most-important-skill-judging-output), [what a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is), and [how to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources).

**Stage 5 — decide if this was even the right job for AI.** Drafting the email — good fit. Tone, structure, getting past a blank page, all things AI is genuinely strong at. Determining your actual legal rights as a tenant — weak fit, unless you verify everything it says against a real source, because getting that wrong has real consequences and the model has no idea which state or city you live in unless you told it. The tool is the same; the stakes of being wrong are not. See [when AI helps and when it hurts](/learn/ai-literacy/when-ai-helps-and-when-it-hurts) and [should I use AI for this?](/learn/ai-literacy/should-i-use-ai-for-this-worked-decisions).

**Stage 6 — notice what you just handed over.** To write that email well, you may have pasted in your address, your landlord's name, details from your lease, maybe even your account number for rent payments. Where did that go? Some AI tools use what you type to improve future versions of the product unless you opt out; some keep transcripts indefinitely. None of that is disclosed to your landlord, obviously, but it's worth knowing before you paste something more sensitive than a heater complaint. See [what happens to what you type](/learn/ai-literacy/what-happens-to-what-you-type) and [what not to paste into AI](/learn/ai-literacy/what-not-to-paste-into-ai).

**Stage 7 — know what this cost you.** A one-off email like this costs nothing on a free tier. But "free" and "paid" tools differ in more than price — capability, context length, how long your history sticks around — and it's worth knowing that trade-off before you're relying on AI for something bigger than one email. See [what using AI actually costs](/learn/ai-literacy/what-using-ai-actually-costs) and [is AI worth it for this task?](/learn/ai-literacy/is-ai-worth-it-for-this-task).

Those seven stages aren't seven separate tools you pick up one at a time — they're one pipeline, and a weak link anywhere in it shows up in the final email. Skip stage 1 and you over-trust the tone. Skip stage 4 and a fabricated legal claim goes out under your name. Skip stage 6 and your lease details sit in a company's logs indefinitely. The rest of this track is each of those seven stages, taught deep enough that you stop having to think about them consciously.

## What trips people up

Almost every bad AI experience beginners report traces back to one of these confusions. Here's the map from the confusion to the page that clears it up.

| Idea | Common confusion | Where to learn it |
|---|---|---|
| Fluency vs. accuracy | "It sounded so sure, so it must be right" | [Why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) |
| What the model has access to | "It looked my lease up" — it didn't, unless you pasted it | [AI is not a search engine](/learn/ai-literacy/ai-is-not-a-search-engine) |
| Hallucinations | Treating a fabricated detail as a rare bug instead of an expected failure mode | [What a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) |
| Prompting | Hunting for "magic words" instead of just giving context an intern would need | [Prompting is delegating to an eager intern](/learn/ai-literacy/prompting-is-delegating-to-an-eager-intern) |
| Verification | Asking the same AI "are you sure?" and counting that as a check | [How to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources) |
| Choosing a tool | Assuming every AI product is interchangeable for every task | [Matching the AI tool to the job](/learn/ai-literacy/matching-the-ai-tool-to-the-job) |
| Data privacy | Assuming what you type disappears after the chat ends | [What happens to what you type](/learn/ai-literacy/what-happens-to-what-you-type) |
| Bias | Thinking "bias" only means hot-button political topics, missing quieter skew in everyday answers | [Where AI bias comes from](/learn/ai-literacy/where-ai-bias-comes-from) |
| Free vs. paid | Assuming a subscription just removes a wait timer and nothing else changes | [Free vs. paid AI: what you get](/learn/ai-literacy/free-vs-paid-ai-what-you-get) |
| Calibration | Swinging between "it's magic, trust everything" and "it got one thing wrong, ignore it forever" | [Expecting too much or too little](/learn/ai-literacy/expecting-too-much-or-too-little) |

## A reading path

If you read nothing else in this track, read these eight pages in this order — it's the same seven-stage pipeline from the heater email, plus the capstone that makes it automatic:

1. [What AI actually is](/learn/ai-literacy/what-ai-actually-is) — the mental model everything else depends on.
2. [How language models produce text](/learn/ai-literacy/how-language-models-produce-text) — why it's confident, and why it isn't a search engine.
3. [How to ask AI clearly](/learn/ai-literacy/how-to-ask-ai-clearly) — the single highest-leverage skill for better output today.
4. [The single most important skill: judging output](/learn/ai-literacy/the-single-most-important-skill-judging-output) — catching what stage 3 didn't fix.
5. [When AI helps and when it hurts](/learn/ai-literacy/when-ai-helps-and-when-it-hurts) — deciding if this was the right tool for this job at all.
6. [What happens to what you type](/learn/ai-literacy/what-happens-to-what-you-type) — knowing what you're handing over before you hit enter.
7. [What using AI actually costs](/learn/ai-literacy/what-using-ai-actually-costs) — the trade-offs behind "free."
8. [Run a real task end-to-end with verification](/learn/ai-literacy/run-a-real-task-end-to-end-with-verification) — the capstone, where you do all seven at once on a task of your own.

By the end of that path, the goal isn't that you've memorized facts about AI. It's that the next time any AI hands you a confident paragraph — about a landlord, a medical question, a line of code, anything — you'll know exactly which parts to trust, which to check, and how. That's the whole promise of this track: you finish able to judge any AI answer, not just this one.

**Related:** [Common myths about AI, debunked](/learn/ai-literacy/common-myths-about-ai-debunked) · [Types of AI you meet every day](/learn/ai-literacy/types-of-ai-you-meet-every-day) · [The AI literacy master cheatsheet](/learn/ai-literacy/ai-literacy-master-cheatsheet)
