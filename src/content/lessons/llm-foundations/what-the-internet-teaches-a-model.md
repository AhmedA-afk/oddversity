---
title: "What the Internet Actually Teaches a Model"
track: "llm-foundations"
status: live
summary: "No labels are needed because text supervises itself — and compressing enough of it forces in something that looks like world knowledge."
duration: "5 min read"
---

Imagine handing a diligent student every book, forum post, and code file ever written, and giving them exactly one game to play: cover the last word of every sentence, guess it, then check. No teacher, no grading on whether any of it is *true* — just "were you close." That single game, played across effectively everything, is [self-supervised learning](/learn/ai-foundations/self-supervised-learning): nobody manually labeled a single example, and yet the guesser comes out the other side knowing a startling amount.

## The analogy, run forward

The guesser isn't told "learn biology" or "learn Python." They're told, at every single spot in the stack, the same narrow instruction: predict what comes next. But getting good at that one instruction, across text this diverse, quietly forces in a lot more than it asks for.

## A mental simulation, step by step

Walk through what "getting better at the one game" requires, domain by domain:

- To predict the word after **"The mitochondria is the ___,"** the guesser does better by picking up biology-flavored associations — not because biology was the assignment, but because that association is what makes the guess land.
- To predict what follows **"def quicksort(arr):,"** they do better by internalizing code syntax and common idioms — indentation, recursion patterns, variable-naming habits.
- To predict what follows **"7 * 8 = ,"** they do better by picking up arithmetic-shaped patterns.
- To predict what follows a heated forum reply, they do better by picking up argument structure, sarcasm markers, and turn-taking.

None of these were the stated goal. The *only* objective at every step was "guess the next token" (see [Next-Token Prediction](/learn/llm-foundations/next-token-prediction)) — but achieving low loss on that one narrow objective, across a corpus this diverse, requires internalizing structure that looks a lot like knowledge, grammar, and reasoning, because that structure is what makes prediction cheaper and more confident. Grammar and style, factual associations, code idioms, arithmetic-shaped patterns, and a sense of dialogue structure are all things that *fall out* of pure prediction at scale, as side effects rather than targets. Each one remains a probabilistic pattern learned from data, not a verified fact — which is exactly why [hallucination](/learn/llm-foundations/why-llms-hallucinate) exists elsewhere in this pipeline as its own failure mode.

## The wrong intuition, corrected

The tempting wrong intuition is: "the model was *taught* facts and skills." It wasn't. Nobody wrote a training example labeled "learn arithmetic" or "learn to write Python" — those capabilities are a side effect of an objective that never mentions them, discovered only because they happen to reduce loss on the slice of the corpus where they matter.

A second wrong intuition follows close behind: "more internet text means more truth." The internet teaches misinformation, stylistic bias, and confident-sounding nonsense exactly as efficiently as it teaches anything true, if that content helps predict what comes next in its own context. Self-supervision means "no labels are needed" — it does not mean "the implicit labels are always correct." That's precisely why corpus construction is treated as a real engineering problem rather than "just scrape everything" — see [Inside the Pretraining Data Pipeline](/learn/llm-foundations/pretraining-data-pipeline) for how crawling, filtering, and mixture weighting shape which patterns actually dominate.

## When the analogy breaks

The "diligent student" picture implies a mind forming beliefs and checking them against the world. That's not what's happening. A next-token predictor has no channel into the world besides text statistics — no experiment to run, no experience to check a claim against. What you actually get is closer to an extremely well-fit compression function over text statistics, one that can produce grammatically flawless, confident-sounding output by recombining patterns from training data, with no separate mechanism verifying whether the recombination is true.

The analogy also implies a single, neutral read-through. In practice the same text is often seen multiple times, mixed with explicit domain-weighting decisions (upweighting code or reference text far above its natural share of the raw crawl), so "the book stack" isn't neutral — it's curated and reweighted, and that curation is a deliberate lever on what the model ends up good at, covered in [the data pipeline lesson](/learn/llm-foundations/pretraining-data-pipeline).

**Related:** [Self-Supervised Learning](/learn/ai-foundations/self-supervised-learning), [Next-Token Prediction](/learn/llm-foundations/next-token-prediction), [The Pretraining Objective and Its Loss](/learn/llm-foundations/the-pretraining-objective-and-loss), [Inside the Pretraining Data Pipeline](/learn/llm-foundations/pretraining-data-pipeline), [Why LLMs Hallucinate](/learn/llm-foundations/why-llms-hallucinate)
