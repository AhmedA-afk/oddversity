---
title: "Intuition: A Fluent Guess With No 'I'm Unsure' Signal"
track: "hallucinations"
status: live
summary: "The core intuition for the whole track: the model always answers, and nothing in its output marks the parts it invented."
duration: "5 min read"
---

Picture a student sitting an exam where every question must be answered - blanks score zero, wrong answers score zero, and there's no partial credit for "I don't know." The student who knows the material writes a clean, confident paragraph. The student who's never seen the topic before also writes a clean, confident paragraph, because a fluent-sounding guess is the only strategy that ever pays off. From the outside, reading the two answers cold, you cannot tell which is which. That's the situation an LLM is in on every single token it produces.

## The analogy, walked through

Imagine the exam question is "Explain the main cause of the 1907 banking panic in Portugal." The prepared student recalls real facts and writes them out. The unprepared student has never heard of this specific event, but they've read plenty about banking panics in general - runs on deposits, overextended credit, a triggering rumor. They assemble those familiar pieces into a paragraph that reads exactly like an answer someone with real knowledge would give: specific-sounding, structured, confident. Not because they're trying to deceive the grader, but because "assemble the most plausible-sounding answer from what I know about answers-like-this" is the only move available when a real answer requires a blank.

Now run the same simulation on a language model. Ask it something in a similarly thin part of its training data. At each step it is doing exactly one thing: computing a probability distribution over the next token given everything so far, and sampling from it (see [next-token prediction mechanics](/learn/hallucinations/next-token-mechanics-of-fabrication)). There is no separate step where it checks "do I actually know this, or am I pattern-matching from adjacent facts?" The token that completes a real memorized fact and the token that completes a plausible-sounding fabrication are produced by the identical mechanism, scored by the identical fluency, and delivered in the identical tone. The model isn't choosing to sound confident about the fabricated part - confidence-sounding language is simply what the whole distribution has been shaped to produce, on true statements and invented ones alike.

## The wrong intuition, and the fix

The natural but wrong intuition is: "the model secretly knows it's guessing, the way a bluffing student does, and is choosing not to tell me." That model of the situation assumes there's a hidden truth-detector inside the system that gets overridden by some competing incentive to look good. There isn't one to override. [There is no internal "known/unknown" flag the model can read off before it starts generating](/learn/hallucinations/no-ground-truth-signal) - not a suppressed one, an absent one. The uniform fluency isn't the model hiding uncertainty; it's what generation looks like when uncertainty was never represented as a separate quantity in the first place. This is also why simply asking the model "are you sure?" doesn't reveal much - that question triggers another round of the same generation process, not an introspective lookup (see [confidence and uncertainty signals](/learn/hallucinations/confidence-and-uncertainty-signals) for what actually does carry signal).

It helps to also notice why the training process pushes toward guessing rather than hedging by default - that's not incidental to the analogy, it's the same "no credit for a blank" scoring rule showing up in how these models are actually trained, covered in full in [why the training objective rewards guessing over abstention](/learn/hallucinations/training-objective-rewards-guessing).

## Where the analogy breaks

Humans have a real experience the analogy borrows without earning: tip-of-the-tongue uncertainty. When a person is bluffing, there's usually some trace - a hedge word, a slower cadence, a vague noun where a specific one should be - because part of them tracks the gap between what they know solidly and what they're improvising. That tracking is metacognition, and it's exactly what a language model doesn't have. The model isn't suppressing a hedge; there's no hedge signal generated anywhere to suppress. So don't read the analogy as "the model is a nervous bluffer who's good at hiding it." Read it as: the mechanism that produces confident true answers and the mechanism that produces confident false ones are the same mechanism, with no third channel monitoring the difference. The analogy also breaks the other direction: for a student, guessing on an exam is usually undesirable. For a language model asked to brainstorm names or write fiction, the "guess with full confidence" behavior is exactly the desired output - a case covered in [when making things up is the goal](/learn/hallucinations/when-hallucination-is-desirable).

**Related:** [How Next-Token Prediction Produces Fabrication](/learn/hallucinations/next-token-mechanics-of-fabrication), [The Model Cannot Feel the Boundary of Its Knowledge](/learn/hallucinations/no-ground-truth-signal), [Why the Training Objective Rewards Guessing Over Abstention](/learn/hallucinations/training-objective-rewards-guessing)
