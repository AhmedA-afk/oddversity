---
title: "What an AI 'hallucination' really is"
track: "ai-literacy"
status: live
summary: "Intuition-track lesson demystifying AI hallucination via the confabulating-friend analogy, a step-by-step token-generation walkthrough, a red-flag checklist for names/dates/citatio."
duration: "3 min read"
---

## The friend who "remembers" the band

Picture a friend describing a wedding you both attended years ago. You ask, "What time did the band start playing?" They answer without a beat of hesitation: "Around 9:30, right after the toasts." Specific. Confident. Delivered in exactly the same tone they'd use to tell you the ceremony was at 2pm.

There was no band.

Psychologists have a name for what your friend just did: confabulation. It isn't lying — lying requires knowing the truth and choosing to say something else. It isn't a malfunction either — your friend's memory is working exactly the way memory works. Their brain had a shape to fill ("something happens at a wedding reception, receptions have music, music starts at some point") and it filled that shape with the most plausible specific it had on hand. The confidence in their voice tells you nothing about whether it's true. Confidence is just what recall sounds like, whether the memory is accurate or invented.

That's the whole idea of an AI "hallucination." It's a bad name — it suggests the system is seeing things, glitching, malfunctioning. What's actually happening is closer to your friend at the wedding: the same machinery that produces every correct, useful answer you've ever gotten also produces the wrong ones, using the exact same process, with the exact same confident delivery. Nothing breaks. Nothing trips an error flag. The model just fills a shape with the most plausible-sounding content it has, and sometimes that content is false.

## What's actually happening, one token at a time

Here's the mental simulation. Ask a model: "What year did [some smallish open-source project] hit version 2.0, and who led that release?"

The model doesn't look this up. There's no card in a filing cabinet labeled with that project's release history that it retrieves and reads back to you. Instead, as covered in [how language models produce text](/learn/ai-literacy/how-language-models-produce-text), it's predicting the next most probable token given everything written so far — your question, plus its own answer as it builds it word by word.

Now notice what your question does. It has a very well-learned *shape*: "[Year], led by [Name]." That shape appears constantly in training data, across thousands of unrelated release histories, changelogs, and blog posts. So even with zero specific knowledge of this particular project's version 2.0, the model can confidently produce something that fits the shape — a plausible year, a plausible-sounding name, formatted exactly the way a real answer would be formatted. The mechanism generating that guess is identical, token for token, to the mechanism that would generate the correct answer if the model had strong support for it. This is what it means to say the model is fundamentally a [pattern predictor, not a thinker](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking): at no point does it pause to check "do I actually know this, or am I just completing a familiar shape?" Both processes look identical from the inside, because there is no inside check.

## Why specifics are the danger zone

This is why hallucinations cluster so hard around names, dates, citations, quotes, statistics, and URLs — and it isn't random. It comes straight from the mechanism above.

Broad, general claims ("water boils at a lower temperature at high altitude," "the French Revolution began in the late 18th century") show up, restated in a thousand overlapping ways, across huge swaths of training data. All those restatements pull next-token prediction toward the same answer from many directions at once. There's convergence. The model lands on the truth almost as a side effect of how well-supported it is.

A specific fact has none of that support. The exact page number of a quote, the middle initial of a paper's third author, the precise wording of something someone said in an interview — these typically appear in few places, sometimes exactly one, sometimes nowhere verbatim. There's nothing pulling the tokens toward a specific correct value. But the model still has to produce *something*, because you asked a question shaped like it has an answer. So it produces a token sequence that's shaped correctly even when its content is invented:

- **Names and dates** — the sentence "In [year], [name] proposed..." is such a common pattern that a plausible year and a plausible-sounding name slot in easily, with nothing in the fluency of the sentence to distinguish a real value from a fabricated one.
- **Citations** — "Chen et al., 2021, *Journal of Applied Statistics*" is a shape the model has seen thousands of times, so it can generate one that's formatted flawlessly while describing a paper that doesn't exist.
- **Quotes** — training data is full of paraphrase and loose attribution, so exact wording is often reconstructed to sound like something a person or document would say, rather than reproduced character-for-character.
- **Statistics** — a fabricated 34% is typographically and grammatically identical to a real one. Nothing about the number's *shape* signals whether it was measured or invented.
- **URLs** — the model has learned what URLs on a given domain typically look like, not a live index of which paths actually exist, so it can hand you a link that's structurally perfect and dead on arrival.

Recency compounds this: ask about anything near or after the edge of what the model was trained on, and you're asking it to fill a shape it has almost no material for at all — see [where AI knowledge comes from and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops).

> The tell is not hesitation. A hallucinated citation is delivered in exactly the same tone as a verified one — because [confident-sounding output](/learn/ai-literacy/why-ai-sounds-so-confident) is a property of fluent language, not a report on how well-grounded the underlying fact is.

## Your red-flag list

Treat each of these as an automatic due-diligence trigger, regardless of how well-written or authoritative the surrounding sentence sounds:

- A specific number attached to a claim — a date, a percentage, a price, a version number
- A named source: "according to [study / report / article]"
- A direct quote in quotation marks, attributed to a real person or document
- A URL, file path, or citation
- The name of a person, product, or paper you don't already independently know
- Anything about events at or after the model's knowledge cutoff
- A function name, parameter, or API detail that "sounds right" but you haven't run
- Legal, medical, or financial specifics — case names, dosages, tax thresholds, statute numbers

The safe zone is broad, well-established knowledge stated in general terms. The danger zone starts exactly where the answer gets specific — which, unhelpfully, is usually the part you actually needed.

## The wrong intuition — and the fix

The wrong intuition goes like this: hallucination is a distinguishable malfunction, something the model occasionally "slips into," and a confident, detailed, well-formatted answer is therefore *less* likely to be hallucinated — because surely a broken system would sound broken.

The correct intuition inverts that. There is no separate hallucination mode. It's not "normal generation" versus "malfunctioning generation" — there's exactly one generation process, running identically every time, and it lands on something false whenever the specific target was rare, ambiguous, or absent from what the model learned from. Detail and fluency are a byproduct of the model being good at language. They are not a byproduct of the model having checked its facts, because there is no fact-checking step and no internal confidence meter being honestly reported to you through hedging or tone. A model that is 100% certain and a model that is fabricating from nothing can produce sentences that are stylistically indistinguishable.

## Where the analogy breaks

The confabulating friend is a useful entry point, not a perfect model. It breaks in a few specific, useful ways:

**Provenance.** Your friend's false memory is usually a distortion of something real — a different wedding, a different band, a detail borrowed from a different night. It has a causal history. An AI hallucination can come from nowhere at all: pure pattern-completion with zero underlying instance anywhere in training data, not a distortion of a real thing but a construction with no real thing behind it.

**Stability.** A human's false memory tends to stick — ask again next month and they'll likely repeat the same wrong detail, because it's now consolidated as "their memory." An AI's fabrication is often unstable: ask the same question again and you may get a *different* invented year or a different invented name, because nothing is being consulted from storage — each answer is a fresh act of generation. (If the system is set to fully deterministic output, it may repeat itself, but that's a decoding setting, not a sign of a stored belief.)

**Pressure-testing.** Push a confabulating person hard enough — "are you sure? think again" — and they sometimes touch a real, if faint, uncertainty signal and walk it back, because there's an actual memory trace underneath, however unreliable. Push an AI the same way and it consults nothing. It generates another plausible response, which might correct the error, might restate it more firmly, or might invent a new one — and none of those outcomes tells you whether anything was actually verified in between.

**No separate state at all.** For a person, confabulation is a distinguishable condition — tired, pressured, papering over a gap. For the model, it isn't a distinguishable state; it's the same process that produced every true statement in the same conversation. That's the idea worth keeping: don't go looking for the moment the response "switches into" hallucination mode. There isn't one to find. Treat every specific as unverified by default, and use [uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification) and [catch a hallucination: worked example](/learn/ai-literacy/catch-a-hallucination-worked-example) to check efficiently, rather than trying to hear it in the tone.

**Related:** [uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification) · [how to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources) · [the verification checklist](/learn/ai-literacy/the-verification-checklist) · [catch a hallucination: worked example](/learn/ai-literacy/catch-a-hallucination-worked-example) · [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident)
