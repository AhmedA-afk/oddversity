---
title: "A Prompt Is a Set of Constraints on Likely Continuations"
track: "prompt-engineering"
status: live
summary: "Every word you add to a prompt narrows the space of plausible continuations, like tightening a funnel."
duration: "6 min read"
---

Here's the one image worth keeping: a prompt is a funnel, and every word you add tightens it.

## The analogy

Picture the model's space of possible outputs as an enormous cone. At the wide mouth of the cone sit almost all the things it's capable of producing — poems, code, refusals, essays, single words, silence. Every token you place in your prompt is a hand tightening the funnel a little, shrinking the range of outputs that still make sense as "what plausibly comes next." A finished prompt isn't a message that gets read and interpreted; it's a sequence of narrowings, applied one after another, that leaves a much smaller opening at the far end.

## Walk it through, step by step

Start with one word:

```text
Write
```

The funnel is enormous here. Poem, story, code, email, essay, grocery list — all of it fits through "Write."

```text
Write a story
```

Narrower. Poems and code just fell out of the plausible set. Still huge: any genre, any length, any tone.

```text
Write a story about a dog
```

Narrower again. Subject matter is fixed now, but length, audience, and tone are wide open — this could become a novel or a haiku.

```text
Write a 3-sentence story about a dog who finds a key, for a children's picture
book, in a whimsical tone.
```

The funnel is now tight enough that most of what comes out the other end will look similar to most of what else could come out. Length, subject, audience, and tone are all pinned. That's not a coincidence — each clause did exactly one job of elimination.

Now run the same simulation on a task instead of a story, using the ticket classifier from [the whole-game walkthrough](/learn/prompt-engineering/pe-whole-game-ticket-classifier). "Classify this ticket" narrows the funnel from "any text" to "some kind of categorization," but it's still wide enough to let through a full sentence, a hedge, or three different formats across three runs. Naming the exact label set, the output shape, and the tie-break rules for ambiguous cases keeps tightening the same funnel until only one shape of answer fits through it.

## The wrong intuition, corrected

The common wrong belief is: *more instructions narrow everything, in every dimension, proportionally.* It feels like adding detail is a general-purpose dial you turn up for "more control." It isn't. Each constraint narrows only the dimension it addresses. Telling the model to "be concise" narrows length; it does nothing to narrow output format, tone, or which of two ambiguous categories a ticket belongs to. A prompt that's very specific about tone and completely silent about format will reliably nail the tone and still flip-flop on format — because that dimension of the funnel was never touched.

The second wrong belief this corrects: *vague is the safe default.* It feels polite or low-risk to leave things open — "just use your judgment." But an open funnel doesn't produce a safe average output; it produces whatever the statistically dominant pattern for that kind of text happens to be, which may have nothing to do with what you actually need. Specificity isn't a constraint on the model's freedom for its own sake — it's what makes the output predictable enough to rely on. See [in-context learning](/learn/llm-foundations/in-context-learning) for the mechanism that lets a handful of well-chosen examples narrow a dimension that instructions alone struggle to pin down, like exact formatting or tone.

## When the analogy breaks

A funnel implies narrower is always better, and that's wrong for at least two cases. First, some tasks genuinely want breadth: ask for five different taglines and you want the funnel loose enough to produce five distinct outputs, not one option repeated five times with cosmetic changes. Over-constraining a brainstorming prompt is a real failure mode, not a safe default — compare how [zero-shot vs. few-shot](/learn/prompt-engineering/zero-shot-vs-few-shot) framing changes depending on whether you want variety or convergence.

Second, the funnel metaphor implies a single, smoothly narrowing cone, but conflicting instructions don't narrow cleanly — they can carve the funnel into two disconnected openings instead of one small one. "Be extremely concise" and "cover every edge case in detail" don't average into "moderately detailed"; they create an unstable prompt that could resolve either way depending on which instruction the model weights more heavily on a given run. A funnel that's actually two funnels isn't narrow, it's just unpredictable — which is exactly the failure mode the next lesson names directly.

## Where next

[Prompting Is Not Programming: Living With Nondeterminism](/learn/prompt-engineering/prompting-is-not-deterministic-programming) picks up from that last point — even a well-narrowed funnel still involves sampling, so identical inputs won't always produce byte-identical outputs.

**Related:** [Why Prompting Works](/learn/prompt-engineering/why-prompts-steer-next-token-prediction) · [Zero-Shot vs. Few-Shot](/learn/prompt-engineering/zero-shot-vs-few-shot) · [Reliability Beats Cleverness](/learn/prompt-engineering/reliability-over-clever-tricks) · [in-context learning](/learn/llm-foundations/in-context-learning)
