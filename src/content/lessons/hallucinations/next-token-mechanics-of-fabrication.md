---
title: "How Next-Token Prediction Produces Fabrication"
track: "hallucinations"
status: live
summary: "A token-by-token trace of how sampling from a probability distribution turns thin training signal into fluent wrong answers."
duration: "6 min read"
---

"The capital of Australia is" almost always continues with a real place name. Most people's first guess for that completion is "Sydney" - and, notably, so is a poorly-calibrated language model's. Sydney is Australia's largest and most internationally famous city; Canberra is the actual capital, deliberately built as a compromise and far less discussed. Watching a model get this wrong is a clean window into the actual mechanism behind fabrication.

## What it is

A language model does not store facts as retrievable records. At every position in a sequence, it computes a probability distribution over its entire vocabulary - "given everything so far, what token comes next" - and samples (or greedily picks) from that distribution, one token at a time. See [next-token prediction](/learn/llm-foundations/next-token-prediction) for the full mechanics. Fabrication isn't a separate failure process bolted onto this - it's what this exact process produces whenever the distribution's high-probability mass doesn't line up with the true fact.

## The mental model

Think of the model's vocabulary at each step as a ranked list with a probability attached to every candidate token, and the model rolling a weighted die over that list. The list is shaped entirely by co-occurrence patterns in training text - which words tended to follow which other words - not by a verified fact table. When training text overwhelmingly pairs a phrase with a particular completion, that completion gets most of the probability mass, whether or not it's the correct one for the specific question being asked.

## Why it works this way

The training objective is to predict the next token in real human text, which is a proxy for "produce text that reads like text a person would write" - not "produce text that corresponds to true facts about the world." Those two targets agree constantly, because most human-written text about well-known things is accurate. They come apart precisely where surface plausibility and truth diverge, and "the capital of Australia" is a textbook case of that divergence: Sydney appears near "Australia" and near "capital city of [country]"-shaped sentences far more often than Canberra does, simply because Sydney is discussed more, even though most of those mentions never actually claim Sydney is the capital.

## A concrete example

Here's an illustrative (not measured, not from any real model or logs) shape of what the distribution over next tokens might look like at that position, to make the mechanism concrete:

```text
prompt: "The capital of Australia is"

illustrative next-token distribution:
  " Sydney"     0.41   <- wrong, but co-occurs heavily with "Australia" + "capital"-shaped text
  " Canberra"   0.33   <- correct, but discussed far less often
  " Melbourne"  0.09
  " a"          0.06   <- e.g., continues into "a city of roughly..."
  " ..."        0.11   <- remaining long tail
```

Sample from this distribution (or take the argmax) and you get a fluent, grammatically perfect, confidently-stated wrong answer close to half the time - not because the model "forgot" Canberra, but because the token-level competition was never a fact lookup to begin with. It was always a popularity contest over plausible continuations, and on this particular question the wrong answer wins that contest more often than the right one. Widen the gap in obscurity - ask about the capital of a far less-discussed country, or a person's job title instead of a country's capital - and this effect gets worse, because the correct token has even less training signal competing for its share of the mass. That's the same mechanism [hallucination risk factors](/learn/hallucinations/hallucination-risk-factors) is describing from the outside.

## Where it shows up

This mechanism is the root of essentially every hallucination in this track, not just factual trivia. A fabricated citation ([citation-hallucination](/learn/hallucinations/citation-hallucination)) is the model sampling a plausible author-name-and-year sequence because that shape of text is common, not because a specific paper's metadata was retrieved. An invented API method ([code-hallucination-and-package-slop](/learn/hallucinations/code-hallucination-and-package-slop)) is the model completing a method call with the most plausible-looking name for that library's naming conventions, whether or not that method exists.

## Watch out for

- **Don't assume higher model confidence-sounding language means a sharper distribution.** The model's *tone* is generated the same way as everything else - "confidently" and "correctly" are independent properties of the sampled text, not linked signals (more on this in [why fluent text feels confident](/learn/hallucinations/why-fluent-text-feels-confident)).
- **Don't assume greedy decoding (temperature 0) fixes this.** Greedy decoding removes *sampling* randomness, not the shape of the distribution - if the wrong token has the highest probability, greedy decoding picks it every single time, deterministically.
- **Don't treat this as a lookup failure you can patch with more parameters alone.** Scale shifts the training-signal balance for a great many facts, but it doesn't change the fundamental setup: probability mass over strings, not a verified-truth channel.

## Where next

This explains the mechanism of *how* fabrication is produced token by token. The next lesson explains *why the training process doesn't push back against it* - [why the training objective rewards guessing over abstention](/learn/hallucinations/training-objective-rewards-guessing) - and later modules build the machinery (grounding, uncertainty estimation, abstention) that works with this mechanism instead of hoping it self-corrects.

**Related:** [Next-Token Prediction](/learn/llm-foundations/next-token-prediction), [A Fluent Guess With No 'I'm Unsure' Signal](/learn/hallucinations/hallucination-as-confident-guessing), [Hallucination Risk Factors](/learn/hallucinations/hallucination-risk-factors), [Parametric vs. Contextual Knowledge](/learn/hallucinations/parametric-vs-contextual-knowledge)
