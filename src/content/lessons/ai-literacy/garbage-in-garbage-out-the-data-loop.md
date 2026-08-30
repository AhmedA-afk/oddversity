---
title: "Garbage in, garbage out: the data-model-output loop"
track: "ai-literacy"
status: live
summary: "An intuition-first lesson using a chef/cookbook analogy to make the data-model-output loop felt rather than defined — walking a step-by-step mental simulation, correcting the commo."
duration: "9 min read"
---

Put the same chef, in the same kitchen, on two different nights, and you can get a Michelin-worthy plate on Monday and something inedible on Tuesday — same hands, same skill, nothing about the chef changed. What came through the door did: the cookbooks that shaped how they cook, and what you handed them to cook with tonight.

If you haven't seen the mechanical version of this loop yet — data shapes the model, the model shapes the output, your input steers which part of it you get — [start there](/learn/ai-literacy/data-model-output-loop) first. This page is about building the gut feel for it, so the idea sticks the next time you're tempted to blame "the AI" for something that was really the ingredients or the cookbook.

## One chef, two ways dinner goes wrong

A chef's training is their cookbook shelf: years of recipes, techniques, and taste memory, baked in long before you ever placed an order. An AI model's training data plays the same role — it's not consulted at serving time, it's already shaped the chef's instincts, what "good" tastes like to them, what a dish is even supposed to look like.

That shelf can go wrong on its own, with no help from you. A chef who only ever studied French cookbooks is still a genuinely skilled chef — but ask them for Sichuan mapo tofu and they'll confidently plate their best guess at it, built from French technique and French assumptions about spice and heat. Nothing about the request was ambiguous. The gap is entirely in what they were trained on. That's the training-data half of "garbage in, garbage out": a narrow or skewed cookbook shelf produces confidently narrow or skewed dishes, regardless of how the order was phrased.

The other half is what you hand over tonight. Give a five-cuisine, world-class chef a bag with three rotten ingredients and a shouted "just make something," and you'll get a mediocre or bad dish — not because the chef lacks skill, but because skill was never the constraint. This is the half people underrate: your prompt is not a suggestion the model politely works around, it's the actual material the dish gets made from.

## Walk one order through the kitchen

Here's the simulation, step by step, holding the chef (the model) completely constant so you can see the other two variables move on their own.

**Step 1 — you place a vague order.** You type: "Write me a professional email."

**Step 2 — the chef doesn't ask, they reach for the shelf.** There's no pause, no clarifying question unless you build one in. The model reaches into everything it saw during training that looked like "professional email" and pulls out the statistically most common shape: a certain greeting, a certain length, a certain hedge-everything tone.

**Step 3 — gaps get filled with the average, not with your intent.** The model doesn't know who you're emailing, why, or what your relationship is like. It doesn't leave those blank — it fills them with the most generic plausible answer, the way a chef told "some sauce" reaches for the house sauce instead of guessing what would actually suit your specific plate.

**Step 4 — the dish arrives.** Correctly formatted, grammatically fine, and generic enough to be almost useless for your actual situation.

**Step 5 — you change only the order, not the chef.** Same model, same training, better ingredients:

```text
Vague:    "Write me a professional email."

Specific: "Email to my manager, Priya, asking for two extra days on the
Peterson deadline. We get along well, so informal but respectful — and
give her a real reason, not just an apology."
```

The output jumps in quality with zero change to the chef's skill or cookbook shelf. That's the input half of the loop working exactly as it should.

Now run the same five steps with a training-data problem instead of a prompt problem. You ask for a quick illustration of "a nurse" or "a CEO" with no other detail. The model isn't consulting an opinion — it's doing step 2 and 3 again, reaching for whatever pattern was most statistically dominant across everything it read or saw. If that pattern skews toward one demographic, that's the default you get back, confidently, with no flag attached. A clear, specific prompt fixes step-4-vague-email problems. It does *not* automatically fix a skewed shelf — for that you have to name the thing you don't want defaulted, out loud, in the prompt. Two different failures, two different fixes, and the loop is why they get confused for each other.

## The intuition that gets this backwards

Here's the belief that trips people up:

> "The model is advanced enough that it should figure out what I meant, even if I'm vague — and push back if something in its training looks off."

This feels reasonable because we're used to skill compensating for sloppiness — a great cook can rescue a so-so recipe. But capability in a language model doesn't work that way. What a bigger, more capable model gives you is a more fluent, more convincing execution of whatever pattern it lands on. It does not give you a better guess at your unstated intent, and it does not give you a built-in skepticism about its own training data's blind spots.

So the corrected version: **skill amplifies execution, it doesn't correct bad input.** A more capable chef handed rotten ingredients doesn't refuse the plate on principle — they plate it beautifully, which is arguably worse, because now it *looks* trustworthy. This is the same mechanism covered in [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident): fluency and correctness are produced by different parts of the process, and nothing about a model being "smarter" closes that gap on its own. If anything, a highly capable model handed a vague or biased prompt is more dangerous than a weak one, because the polish makes the gaps harder to spot.

## Where the chef breaks down

Analogies earn their keep by showing you exactly where they stop working. Four places this one does:

**No tasting as they go.** A real chef samples the sauce and adjusts mid-cook. A base model writes the whole dish in one uninterrupted pass with no real check against reality partway through — no built-in moment where it stops and confirms the facts in paragraph two are still true by paragraph four. Some products bolt on a review step; the underlying loop doesn't have one by default.

**No memory between meals.** A chef who cooks for you every week starts remembering you don't like cilantro. A fresh conversation with a model usually starts with total amnesia about you — the "cookbook" is fixed, and unless a product explicitly saves details across sessions, tonight's chef has no idea you exist yet.

**The shelf is frozen.** A working chef keeps reading new food writing and picking up trends. A model's training data has a cutoff — it can't quietly restock its own shelf with what happened last week. See [where AI's knowledge comes from and where it stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops) for what that actually limits.

**No refusal.** A chef can smell bad prawns and say "I'm not serving this." A model very rarely does the equivalent — it will typically still plate something, finished and confident-looking, even when the ingredients you gave it (or the gaps in its own training) don't support a good answer. That gap between *looks finished* and *was actually good* is why you taste it yourself before it goes out to anyone else — see [the single most important skill: judging output](/learn/ai-literacy/the-single-most-important-skill-judging-output).

## Two levers, not one

Once the loop is a felt thing instead of a diagram, it splits cleanly into two skills worth building on purpose. One is shaping what you hand over — see [how to ask AI clearly](/learn/ai-literacy/how-to-ask-ai-clearly) and [prompting as delegating to an eager intern](/learn/ai-literacy/prompting-is-delegating-to-an-eager-intern) for how far a well-built order actually goes. The other is staying alert to what the shelf itself defaults to when you don't specify — see [where AI bias comes from](/learn/ai-literacy/where-ai-bias-comes-from) for how those defaults get baked in in the first place.

Neither one substitutes for the other. A perfect order can't fix a skewed shelf, and a world-class shelf can't fix a rotten or vague order. Next time an answer disappoints you, the useful question isn't "is this AI bad" — it's "which one broke tonight: the cookbook, or the order I gave?"

**Related:** [The data-model-output loop](/learn/ai-literacy/data-model-output-loop) · [How to ask AI clearly](/learn/ai-literacy/how-to-ask-ai-clearly) · [Where AI bias comes from](/learn/ai-literacy/where-ai-bias-comes-from) · [Spot bias in AI output: a worked example](/learn/ai-literacy/spot-bias-in-ai-output-worked-example) · [Why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) · [Where AI's knowledge comes from and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops)
