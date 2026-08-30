---
title: "Quiz: how AI produces answers"
track: "ai-literacy"
status: live
summary: "A 6-question scenario quiz testing whether learners can apply — not just recite — the three core ideas of the module: AI predicts plausible text rather than looking up truth, its k."
duration: "10 min read"
---

These six questions aren't trivia about definitions — they're the exact judgment calls you'll face the next time you open a chat window. Try to answer each one in your head before you expand the explanation; the reasoning matters more than the letter you picked.

## Question 1

You ask an AI chatbot about a product that came out yesterday, and it gives you a detailed, specific answer — feature names, a price, a comparison to last year's model. Should you trust it?

- **A.** Yes — if it has that much specific detail, it must have found real information about the product.
- **B.** No — the amount of detail doesn't tell you anything about accuracy; check whether the tool actually has live access to today's web, and verify the specifics either way.
- **C.** No — AI can never say anything about events after its training cutoff, so this answer has to be entirely invented.
- **D.** Yes, but only trust the price — prices are simple facts that models rarely get wrong.

<details><summary>Answer</summary>

**Correct: B.** Specificity is not evidence of grounding. A predictive model can generate plausible, detailed-sounding content for a product it has zero real information about — it's filling the gap with what similar product launches usually look like, a close cousin of the confabulation covered in [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident). Whether to trust this particular answer depends entirely on a fact about the *tool*, not the answer: did it actually run a live search, or is it a base model working from a fixed training snapshot? See [where AI knowledge comes from and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops). If it's the latter and the product shipped after that cutoff, treat the whole answer as unverified until you check a real source.

**A** is the trap the whole scenario is built around: we assume detail equals knowledge because that's usually true of people, but a language model can produce convincing, specific-sounding detail with no underlying information at all — that's what fluent pattern completion looks like. **C** overcorrects. Some AI products genuinely are wired to live search or browsing tools and can pull real current information — the point isn't "impossible," it's "you can't tell from the answer alone; you have to know what the tool is actually connected to," which is exactly the distinction in [AI is not a search engine](/learn/ai-literacy/ai-is-not-a-search-engine). **D** is arbitrary — a price is actually one of the *easiest* specific numbers to fabricate convincingly, since it just has to fall in a plausible range; isolating it as the one trustworthy detail has no basis.

</details>

## Question 2

An AI gives you an answer to a factual question. It's well-organized, confidently worded, and reads better than most human writing on the topic. What does that tell you about whether it's correct?

- **A.** It's very likely correct — a model that writes that well has clearly learned the topic deeply.
- **B.** It depends on the length — longer, more detailed answers are more reliable.
- **C.** Nothing on its own — polish and correctness come from different parts of the process, so a good-sounding answer still needs verification like any other claim.
- **D.** It's very likely wrong — AI tends to overcompensate for what it doesn't know with confident-sounding language.

<details><summary>Answer</summary>

**Correct: C.** Fluency and accuracy are two separate outputs of the same generation process, not causally linked. The model is trained to produce natural, coherent, well-structured language — full stop. Whether the *content* of that language is correct depends on something else: whether the training data and the prompt actually supported the right answer. As [AI as pattern prediction, not thinking](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking) lays out, there's no internal "am I sure" dial that makes the writing rougher when the model is on shaky ground — a wrong guess gets the same polished delivery as a well-supported fact.

**A** is the most natural mistake to make, because with people, polished communication often does correlate with real expertise. It doesn't transfer to a system whose fluency is a trained, uniform default rather than a byproduct of understanding — see [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) for why the tone never wavers even when the substance should. **D** swaps one unfounded rule for another — treating confidence as a *negative* signal is just as wrong as treating it as a positive one; tone is a style choice baked into training, not a tell about truth in either direction. **B** just restates the same error with a different metric — more words generated the same way isn't more verification, and a long wrong answer can simply be padding around a lack of real grounding.

</details>

## Question 3

You ask an AI the same question in two separate conversations and get two different answers. What's the most accurate explanation?

- **A.** The AI is broken or buggy — a well-functioning system should return one fixed answer for the same question every time.
- **B.** The AI generates its response by predicting likely next words each time, often with some randomness built in, so more than one plausible continuation can win.
- **C.** The AI secretly remembers your first conversation and deliberately changed its answer.
- **D.** Only one of the two answers can be a genuine "prediction" — the other must be a hallucination.

<details><summary>Answer</summary>

**Correct: B.** An LLM doesn't retrieve one stored, canonical answer from a database — it generates text token by token from a probability distribution over likely next words, as [how language models produce text](/learn/ai-literacy/how-language-models-produce-text) and [watch AI predict the next word](/learn/ai-literacy/watch-ai-predict-the-next-word) walk through directly. Depending on how the tool samples from that distribution, the highest-probability word doesn't always get picked deterministically — so a second run can take a slightly different path, especially on open-ended questions where several phrasings are roughly equally likely. Two different answers isn't malfunction; it's what a generator (rather than a lookup table) does by design.

**A** assumes the system works like a search index returning the same stored page every time — that's the search-engine mental model, and it's the wrong model here; see [AI is not a search engine](/learn/ai-literacy/ai-is-not-a-search-engine). Built-in variation isn't the same as broken. **C** invents a mechanism that usually isn't there — most chat sessions don't carry memory between separate conversations by default, and even where memory exists, this scenario is just ordinary generation variance, not an evolving opinion. **D** sets up a false distinction: both answers were produced by the exact same predictive process. One might turn out to be more accurate than the other, but "which one was really predicted" isn't a meaningful question — they both were.

</details>

## Question 4

You ask an AI chatbot who currently holds a fast-changing role — say, a company's CEO — and it gives you a name and sounds completely sure. What should you actually check first?

- **A.** Whether the AI has a "confidence score" attached to the answer, since that number would tell you if it's current.
- **B.** Whether the name sounds like a real person, since a fabricated name usually sounds obviously fake.
- **C.** Nothing — if it names a specific real-sounding person, it must have checked, since AI wouldn't invent an entire name.
- **D.** Whether the tool has any live retrieval or browsing enabled — if not, treat the answer as reflecting its training cutoff, not today.

<details><summary>Answer</summary>

**Correct: D.** This is the practical move that actually resolves the question: figure out whether you're talking to a base model bounded by a training snapshot or a search/tool-augmented assistant, because that changes whether "current" is even something the system can access. If it's cutoff-bound, the honest read of the answer is "this was accurate as of training," not "this is true today" — that's the whole idea in [where AI knowledge comes from and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops), paired with the tool-capability check from [AI is not a search engine](/learn/ai-literacy/ai-is-not-a-search-engine).

**A** invents a safety net that doesn't exist in ordinary use — mainstream chat tools don't surface a real, checkable per-answer confidence number, and even where internal uncertainty estimates exist, they're not a substitute for knowing whether the model has current data at all. **B** filters nothing: an out-of-date answer here is usually a real, entirely plausible name — often the actual former office-holder — not gibberish, so "does it sound real" won't catch the error. **C** is the core trap of this whole module: specific, named, confident output is *exactly* what an out-of-date pattern-completion produces. "It wouldn't invent a whole name" is false — that's precisely the failure mode to expect.

</details>

## Question 5

You ask an AI to find you a source for a claim, and it gives you a link with a title, author, and date. You click it and the page doesn't exist. What does this tell you about how that citation was produced?

- **A.** It's a rare glitch specific to that one link — regenerate and the next citation will be reliable.
- **B.** It most likely generated a citation that *looks like* the sources it was trained on, without actually retrieving or checking a real page — unless the tool explicitly ran a live search.
- **C.** The AI definitely browsed the web, and the page must have been taken down since then.
- **D.** AI only fabricates citations for obscure topics, so citations for well-known topics can be trusted without checking.

<details><summary>Answer</summary>

**Correct: B.** A dead, invented-looking citation is one of the clearest tells you'll get that you're dealing with a predictor of "text shaped like a citation" rather than a system that actually opened a document. A plain language model has no built-in mechanism to go look something up — it produces the most plausible-sounding author/title/date string because that's the pattern real citations follow in its training data, not because it fetched anything. That's the exact distinction in [AI is not a search engine](/learn/ai-literacy/ai-is-not-a-search-engine): unless the product visibly performed a search or tool call, assume no retrieval happened, and even then, verify the result. This particular failure — a confident, well-formed, entirely fabricated detail — is worth reading up on further in [what a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is).

**A** misreads the mechanism — regenerating just reruns the same generate-something-plausible process; it might land on a real source by chance, or invent a different fake one, but nothing about the underlying method improved. **C** assumes retrieval happened and reaches for an unlikely explanation (quiet deletion) instead of the much simpler one: the source was never real. The burden is on you to independently search for the title, not to explain away the dead link. **D** is false — models produce confident, specific-sounding fake citations for extremely well-known topics too, sometimes inventing a paper or article that "should" exist given how much has been written on the subject but simply doesn't. Fame of topic is not a safeguard.

</details>

## Question 6

You ask an AI a piece of trivia that a lot of people commonly get wrong, in the same wrong way — and it repeats that popular wrong answer with total confidence. What does this reveal about where AI answers actually come from?

- **A.** The model is deliberately choosing the popular answer over the correct one because it's optimizing for what users want to hear.
- **B.** This basically never happens with well-known trivia — well-known facts are always well represented and correct in training data.
- **C.** The model draws on patterns across huge amounts of training text, so a widely repeated wrong belief can be reproduced just as confidently as a true fact.
- **D.** This proves the model runs an internal fact-check against a reference database, and that database is simply out of date.

<details><summary>Answer</summary>

**Correct: C.** The model has no separate "truth channel" sitting apart from the patterns it absorbed from text — that's the core of [garbage in, garbage out: the data loop](/learn/ai-literacy/garbage-in-garbage-out-the-data-loop) and the [data → model → output loop](/learn/ai-literacy/data-model-output-loop). From the model's point of view, a misconception that's been written down thousands of times looks statistically just like a fact that's been written down thousands of times. It isn't distinguishing "popular" from "true" as separate categories, because nothing in how it was trained draws that line for it.

**A** implies a deliberate, goal-directed choice weighing popularity against correctness — that's not what's happening mechanically. The model isn't overriding a "true" answer it secretly has; it's producing the statistically dominant continuation, full stop, exactly as described in [AI as pattern prediction, not thinking](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking). **B** gets the correlation backwards — being widely known and widely written about is exactly the condition that lets a *myth* about that topic get well represented too, not a guarantee against it. **D** describes a fact-checking architecture that a plain chat model doesn't have. There's no live lookup against a reference database at generation time to go "stale" — the wrongness is a property of the training-data pattern, not an outdated record, which is the same search-engine misconception showing up again in a different costume.

</details>

## Where that leaves you

Notice that every explanation above traces back to the same three moves: ask what the model is actually doing when it generates text (predicting, not recalling), ask when its knowledge stops (a fixed snapshot, not "now" by default), and ask whether this particular tool is connected to anything live (a search engine is not the same machine as a language model, even when they sit in the same chat window). Those three checks cover almost every "wait, should I trust this?" moment you'll hit day to day. The next skill to build on top of them is turning "I'm suspicious" into an actual verification habit — that's where [uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification) picks up.

**Related:** [AI as pattern prediction, not thinking](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking) · [Why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) · [Where AI knowledge comes from and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops) · [AI is not a search engine](/learn/ai-literacy/ai-is-not-a-search-engine) · [How language models produce text](/learn/ai-literacy/how-language-models-produce-text) · [Uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification)
