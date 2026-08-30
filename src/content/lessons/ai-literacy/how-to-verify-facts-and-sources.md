---
title: "How to verify facts and sources"
track: "ai-literacy"
status: live
summary: "A repeatable four-step method for verifying AI claims — separate claims from framing, find independent primary sources, and use a stakes-based rule for how hard to check."
duration: "9 min read"
---

An AI can tell you a court date, a drug interaction, or a tax rule in the exact same confident tone whether it's right or making it up. Verification is the habit that tells you which one just happened — and to work, it has to happen somewhere other than back inside the same conversation.

## What it is

Verifying an AI's output isn't a vague feeling of "does this sound right." It's a repeatable process, and it runs in a fixed order:

1. **Separate the claim from the framing.** Every AI answer blends two things: factual assertions ("the filing deadline is April 15," "this function takes three arguments," "this drug interacts with grapefruit") and framing — the confident narration wrapped around them ("obviously," "this is a critical risk," "as most experts agree"). You verify the claims. The framing is opinion and tone; there's nothing underneath it to check against a record.

2. **Decide which claims are actually checkable.** Dates, numbers, quotes, "the law requires X," "the API returns Y" — these point at something real you can go look up. Predictions, rankings of "best," and judgment calls dressed up as facts don't — there's no record to check them against, only reasoning to weigh. Pull out the checkable claims and rank them by how much rides on each one being right.

3. **Find a source independent of the AI.** This is the step people skip, usually by asking the same chat window "are you sure?" instead. That doesn't count — more on why below.

4. **Prefer the primary source over a summary of it.** A news article about a study isn't the study. A forum post about a library function isn't that library's own documentation. Every layer between you and the original is a chance for someone else's error or spin to get baked in before you ever see it — the same problem you're trying to solve for the AI, just one hop further back. When the primary source is a click or two away — the statute itself, the company's own policy page, the official docs — go there instead of a description of it.

Two habits make steps 3 and 4 fast enough to actually do every time:

- **Ask the AI to cite, then verify the citation yourself.** "What's your source for that?" costs one message. The verification only happens when you actually open what it names and confirm it says what was claimed — a citation that exists but says something slightly different, or doesn't exist at all, is a real and common outcome.
- **Cross-check with a second AI, or a different question.** Open an unrelated AI system and ask the same thing cold, with no context from the first conversation. Or, in the same system, ask a question that only has a consistent answer if the original claim is true — not "are you sure?" but something adjacent that tests it from a different angle.

**How hard to verify depends on the stakes** — matching your effort to what's actually riding on being wrong is part of the method, not an afterthought:

| Stakes | What's at risk | How hard to verify |
|---|---|---|
| Low | Trivia, brainstorming, a first draft only you'll see | Skim for plausibility; verify only if something feels specific and load-bearing |
| Medium | A report, a post, advice to a friend, a work decision | Verify every checkable claim that's load-bearing against one independent primary source |
| High | Money, health, legal standing, safety, anything published under your name or affecting someone else | Verify every checkable claim against a primary source, cross-check independently, and never rely on the AI's own reassurance about itself |

## The mental model

Picture the AI as a very well-read colleague answering from memory in a hallway conversation — not a librarian pulling the original file. They've absorbed an enormous amount, and most of what they say back is a fair reconstruction of it. But it's reconstruction, not retrieval: they're generating the words that are statistically likely to follow your question, the way [language models produce text](/learn/ai-literacy/how-language-models-produce-text) in general, not looking anything up in a stored, checked record. A well-read colleague can misremember a date or conflate two similar cases, and they'll say it in exactly the same confident hallway tone as the thing they got right — because in that conversation, confidence was never tied to whether they actually checked.

Verification is you walking down the hall to the actual filing cabinet. It is not asking the colleague to repeat themselves, louder, a second time.

## Why it works this way

This maps directly onto how the model produces answers, not just a quirk of etiquette. A model is [predicting the next most likely token](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking), not running a background fact-check against a database before it speaks — and its sense of its own certainty is generated the same way as everything else, which is why a model's stated confidence [doesn't reliably track whether it's actually right](/learn/ai-literacy/uncertainty-and-verification).

That's exactly why "are you sure?" is weak evidence. You're re-running the same weights, trained on the same data, with the same blind spots, against the same question. There are only two things that can happen: it repeats the original claim with identical confidence — which tells you nothing you didn't already know, since confidence was never the problem — or it changes its answer because models are tuned to be agreeable under pushback, not because it found new information. Neither outcome is verification. Nothing external got consulted either time.

Independent sources work for the opposite reason: errors are usually not independent. If a wrong figure is widely repeated across the training data — a stale statistic that keeps getting copied, a popular but inaccurate claim — a second AI trained on similar data can make the identical mistake, and a summary written by someone who read the same popular version won't catch it either. This is also why an AI's [knowledge has a stopping point](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops) and why it [sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) regardless of which side of that stopping point a claim falls on. A primary source breaks the chain because it's where the number originated — it can't have copied the error, since every other copy traces back to it.

## A concrete example

You ask an AI: "What's the current U.S. federal minimum wage, and when did it last change?"

It answers:

> $7.25 per hour, unchanged since it was last raised on July 24, 2009. Given how much the cost of living has increased since then, many workers argue it's no longer a livable wage.

Run the method:

- **Claim vs. framing.** Two checkable claims: the dollar figure and the 2009 date. The line about cost of living and "no longer livable" is framing — a judgment you can weigh once the facts underneath it are confirmed, not something a record can settle.
- **Checkable and worth it.** Both claims are concrete, and if you're about to put this number in something real — a report, an argument, a budget — it's worth the ninety seconds to check.
- **Ask for the citation.** You ask: "What's your source for that?" It says: "The U.S. Department of Labor."
- **Verify it yourself, at the primary source.** You go to the Department of Labor's own wage page — not a news article summarizing it — and confirm the figure and date match.
- **Skip the "are you sure" trap.** Asking the same chat "are you sure?" would just generate another confident sentence from the same source material. Instead, you either put the same question to a second, independent AI system cold, or ask your original AI something it can only get right by actually knowing the fact rather than pattern-matching your question — "What was the minimum wage immediately before the 2009 change, and by how much did it rise?" A model that's solid on the headline number but shaky on the adjacent fact is a signal to slow down.

## Where it shows up

- Putting a stat, date, or figure into something you'll publish or send — a report, a post, an email to your boss
- A health or medication question before you act on it
- A legal or tax claim ("do I need to file this," "does my lease require 30 days' notice") before you rely on it
- Checking that an AI-suggested code function or API actually exists and takes the arguments claimed — the number-specific version of this is covered in [when AI gets numbers and math wrong](/learn/ai-literacy/when-ai-gets-numbers-and-math-wrong)
- A news recap or "here's what happened" summary, where the framing is often doing more work than the facts
- Reviewing a document a colleague drafted with AI help, before it goes out under either of your names

## Watch out for

- **The "are you sure?" trap.** Pressing the same model harder feels like diligence but queries the same weights a second time. It either reasserts the claim with identical unearned confidence, or flips to agree with your pushback — neither is new evidence.
- **A citation that isn't actually independent.** An AI's source can be real-sounding and still fail you: a real publication that doesn't say what's claimed, a URL that 404s, or a source that's itself just repeating the same error everyone else copied. This is a close cousin of [what a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) — verifying means opening the citation and reading the actual sentence, not just confirming it exists.
- **Verifying the wrong things at the wrong depth.** Triple-checking trivia while accepting a claim about your finances or health because it was stated fluently is exactly backwards. Match your effort to what's riding on being wrong — not to how confident the answer sounded.

## Where next

Practice the full method end to end in [fact-check an AI answer, step by step](/learn/ai-literacy/fact-check-an-ai-answer-step-by-step), then see how the tactics shift by task in [verification tactics by task type](/learn/ai-literacy/verification-tactics-by-task-type). Keep [the verification checklist](/learn/ai-literacy/the-verification-checklist) handy for real use, and test what stuck with the [judging and verifying quiz](/learn/ai-literacy/judging-and-verifying-quiz).

**Related:** [Catch a hallucination, worked example](/learn/ai-literacy/catch-a-hallucination-worked-example) · [Why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) · [The single most important skill: judging output](/learn/ai-literacy/the-single-most-important-skill-judging-output) · [The verification checklist](/learn/ai-literacy/the-verification-checklist)
