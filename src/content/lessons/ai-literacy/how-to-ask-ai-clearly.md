---
title: "How to ask AI for exactly what you want"
track: "ai-literacy"
status: live
summary: "A CONCEPT lesson for Oddversity's AI Literacy track establishing the four-lever anatomy of a good AI request — task, context, format, tone — anchored by the 'write about dogs' vs. "
duration: "9 min read"
---

Ask an AI to "write about dogs" and it will hand you back a pleasant, competent, completely forgettable paragraph — because that's all the request gave it to work with. Nothing in those three words told it who the writing was for, how long it should be, or what job it was supposed to do in the world. Fix that, and the same tool that produced filler can produce something you'd actually post on your building's noticeboard.

## What it is

A good AI request answers four questions, whether you spell them out or not:

- **Task** — what do you actually want produced or done? Not the topic ("dogs") but the deliverable ("a reminder note").
- **Context** — who is this for, and what's the situation? Anything the AI would need to know but can't see on its own.
- **Format** — what shape should the output take? Length, structure, medium — an email, a bullet list, three sentences, a table.
- **Tone** — what voice does it need, and are there hard rules about what must or must not appear?

Most people, most of the time, only ever specify the task. "Write about dogs." "Draft an email." "Give me a workout plan." The other three levers don't disappear when you leave them out — the AI just fills them in with a guess, and its guess is whatever is most statistically average across everything it's seen. That's why unspecified requests come back sounding like nobody in particular wrote them for no one in particular. You didn't get a bad answer; you got the correct answer to a much vaguer question than the one you meant to ask.

## The mental model

Picture every request as sitting inside a cloud of possible valid responses. "Write about dogs" could correctly be satisfied by a veterinary fact sheet, a children's story, a breed comparison chart, an angry rant about barking, or a noticeboard notice — all of them are "about dogs," and the model has no way to know which corner of that cloud you're standing in.

Each of the four levers is a cut through that cloud that throws away everything that doesn't match:

- **Task** cuts by *kind of document* — a note is not an essay is not a chart.
- **Context** cuts by *angle* — a note about a shared building is not a note about a dog park.
- **Format** cuts by *shape* — three sentences is not three paragraphs.
- **Tone** cuts by *voice* — friendly is not scolding, formal is not casual.

Specify all four and you've narrowed an almost infinite cloud down to a handful of outputs that would all satisfy you. That's the whole trick. It isn't about being polite to the AI or using magic phrasing — it's about giving it enough cuts through the possibility space that what's left over is close to what you actually pictured.

## Why it works this way

This falls directly out of [how language models produce text](/learn/ai-literacy/how-language-models-produce-text): the model generates its answer by predicting plausible continuations of exactly what's in front of it, and nothing else. It has no memory of your apartment building, no idea who your neighbors are, and no sense of how annoyed you are about the dog mess by the mailboxes — unless those specifics are sitting in the prompt. Left with a request that supplies none of that, it does the only sensible thing: it produces the most common, safest, most broadly-applicable version of "writing about dogs," because that's the [pattern](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking) most consistent with a request that carries no distinguishing signal.

That's also why adding detail helps in a very literal, mechanical sense rather than a polite one: every word of context, every format instruction, every tone cue becomes part of what the model is conditioning its prediction on. More relevant, specific input measurably narrows what counts as a likely next word. This is the same reason a search engine gives you better results for "48-hour repair window heating lease clause" than for "heating" — you're not being nicer to the system, you're removing the ambiguity that was forcing it to guess.

## A concrete example

Start with the bare request:

```text
Prompt: write about dogs
```

A typical response reads like this — accurate, generic, aimed at no one:

```text
Dogs are loyal companions that have been domesticated for
thousands of years. They come in many breeds, each with its
own temperament and needs. Regular exercise, proper training,
and routine veterinary care are essential to keeping a dog
happy and healthy...
```

Nothing is wrong with it. Nothing is useful about it either. Now apply the four levers:

```text
Prompt: Write a friendly 3-sentence note for my apartment
building's noticeboard reminding neighbors to clean up after
their dogs.
```

- **Task**: write a noticeboard note, not an essay
- **Context**: an apartment building, neighbors, a shared-space problem
- **Format**: exactly three sentences, posted physically
- **Tone**: friendly, not scolding

A response that actually fits:

```text
Hi neighbors! A quick reminder to please clean up after your
dogs when walking them around the property — it keeps the
grounds nice for everyone, including the dogs. Bags are
available by the side entrance if you ever run out. Thanks
for helping keep our building pleasant!
```

Notice what changed the output wasn't a better AI or a cleverer phrase — it was four pieces of information that only you had, handed over instead of assumed. You could keep going: add context ("this has been an issue near the mailboxes specifically"), tighten format ("make it fit on a small printed card"), or shift tone ("more direct, this is the third reminder"). Each added lever narrows the result a little further toward what you actually needed.

## Where it shows up

The same four-lever move works on almost any request, in any domain:

| Situation | Vague ask | Request built from the four levers |
|---|---|---|
| Email to a landlord | "write an email about the heating" | "Write a polite but firm email to my landlord — the heat has been out 3 days and my lease has a 48-hour repair clause. 4-5 sentences, asking for a specific repair date." |
| Asking for code | "write a function" | "Write a Python function that takes a list of prices and returns the average rounded to 2 decimals. This is for a beginner script, so keep it short with a comment on each line." |
| Job search | "write a cover letter" | "Write a 3-paragraph cover letter for a marketing coordinator role at a small nonprofit, based on my resume. Friendly but professional, no cliches like 'team player.'" |
| Meal planning | "give me a meal plan" | "Give me a 5-day vegetarian dinner plan for one person, meals under 30 minutes, as a bullet list, with a short grocery list at the end." |

In every row, the vague version and the specific version are asking for the same *topic*. Only one of them tells the AI enough to produce something you'd actually use without rewriting it yourself.

## Watch out for

**Context without a task.** It's easy to paste three paragraphs of backstory about a messy situation and end with "thoughts?" You've given rich context and no task — the AI has to guess whether you want a summary, a drafted reply, advice, or just validation, and it usually lands on a bit of all four, none of it precisely. If you're giving substantial context, close with one plain sentence naming the deliverable.

**Tone as a substitute for accuracy.** Asking for a "confident, authoritative" tone doesn't make the underlying facts more correct — it only makes a wrong answer sound more convincing. Tone controls voice, not truth; those are separate problems, and the second one is why [AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) even when it's guessing. Set tone for how it should sound, and verify substance separately.

**Turning every message into a brief.** The four levers are a checklist for when a request is failing, unfamiliar, or matters — not a ritual for "fix this typo" or "shorter, please" mid-conversation, where the context is already sitting right there in the thread. Over-specifying a trivial follow-up costs you time without improving anything.

## Where next

This lesson is the frame the rest of the module hangs on. [Turn a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one) walks through rewriting real bad prompts lever by lever, and [give AI context and examples](/learn/ai-literacy/give-ai-context-and-examples) goes deep on the single highest-leverage lever — because a well-chosen example often does more work than a paragraph of instructions. If your requests still come back close but not quite right, how to ask AI clearly is the next layer of precision on top of this one.

**Related:** [Turn a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one) · [Give AI context and examples](/learn/ai-literacy/give-ai-context-and-examples) · How to ask AI clearly · [Prompt patterns for everyday tasks](/learn/ai-literacy/prompt-patterns-for-everyday-tasks) · [Everyday prompting cheatsheet](/learn/ai-literacy/everyday-prompting-cheatsheet) · [Prompting is delegating to an eager intern](/learn/ai-literacy/prompting-is-delegating-to-an-eager-intern)
