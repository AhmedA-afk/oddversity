---
title: "Quiz: what AI is and isn't"
track: "ai-literacy"
status: live
summary: "A six-question scenario quiz that checks whether your mental model of AI survives contact with a confident-sounding wrong answer, a citation that doesn't exist, and two tools."
duration: "10 min read"
---

You can define "AI" perfectly and still get burned by it in practice, because the failure modes aren't about vocabulary — they're about intuitions that feel right and aren't. This quiz is six scenarios, not six definitions. Read each one the way you'd hit it in the wild, pick an answer, then check the reasoning even if you got it right — the distractors are the actual misconceptions people carry around.

## Question 1 — What's happening when it answers

You ask a chatbot a question and it responds instantly with a fluent, well-organized paragraph. What is it actually doing to produce that text?

- A. Searching a database for the most relevant matching document, then paraphrasing it
- B. Predicting the most statistically likely next word, one token at a time, based on patterns learned during training
- C. Reasoning through the logic of your question the way a person would, then writing down the conclusion
- D. Generating a draft answer, then running it through a separate fact-checking step before showing it to you

<details><summary>Answer</summary>

**Correct: B.** A language model generates text one token at a time, each one chosen because it's a statistically likely continuation given everything before it — including your question and its own output so far. There's no separate "figure out the answer" phase and "write it down" phase; the writing *is* the computing. That's the whole mechanism, and it's worth sitting with, because it explains almost every quirk on this page. See [how language models produce text](/learn/ai-literacy/how-language-models-produce-text).

**A** describes a search engine or a narrow retrieval tool, not a plain language model. A model isn't looking anything up at answer time by default — it has no database to consult, just weights shaped by training. Confusing the two is exactly the trap covered in [AI is not a search engine](/learn/ai-literacy/ai-is-not-a-search-engine).

**C** is the most natural-feeling wrong answer, because the output *reads* like reasoning. But there's no hidden step where the model works out the logic and then transcribes it — the "reasoning" you see is generated the same token-by-token way as everything else. It often lands somewhere correct, and sometimes it doesn't, and there's no internal checkpoint that tells you which.

**D** describes a feature some products bolt on top (a verification pass, a retrieval step, a second model checking the first) — but it's not inherent to how a language model works, and you can't assume it's happening unless the product tells you so.

</details>

## Question 2 — A citation that sounds completely real

An AI gives you an answer and backs it up with a specific citation — author name, journal, year. It sounds exactly like a real reference. What does that specificity and confidence tell you about whether the study actually exists?

- A. Almost nothing on its own — a model generates a plausible-looking citation the same way it generates any other confident sentence, whether or not that source exists
- B. It's reliable, because models are specifically trained never to state a false citation
- C. It's probably real — fabricating something that detailed would be unusual behavior
- D. You can trust it as long as the study sounds plausible for that field

<details><summary>Answer</summary>

**Correct: A.** A citation is just more text to predict. The model isn't retrieving a record from a bibliography database and copying it faithfully — it's generating a sequence of words shaped like a citation, because citations shaped like that appeared constantly in training. Real details (a plausible author, a real-sounding journal, a year in the right range) can surround a study that was never published, or that says something different from what's claimed. Confidence and specificity are properties of the *writing*, not evidence about the *world*. This is the core mechanism behind [what a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is).

**B** assumes there's a built-in guardrail against fabrication. There isn't one that reliably catches this — nothing in how the model generates text distinguishes "a citation I'm sure is real" from "a citation shaped like the ones I've seen." Training can reduce how often this happens, but it doesn't turn confident-sounding output into verified output.

**C** gets the logic backwards. Fabricating something *specific* isn't unusual for a model at all — specificity is just detail, and generating detailed, plausible-sounding text is precisely what these systems are good at. Vague answers and precise-but-wrong answers come from the same process.

**D** describes exactly the wrong test. "Plausible for the field" is a property of good fiction too. The only way to know if a study exists is to go find it — see [how to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources).

</details>

## Question 3 — Four tools, four different kinds of "AI"

Match each everyday tool to the kind of system behind it:

1. A spam filter sorting mail into inbox or junk
2. A chatbot you type plain-English questions to
3. A streaming service's "recommended for you" row
4. A tool that turns a text description into a picture

- A. 1 → classifier, 2 → language model, 3 → recommendation engine, 4 → image-generation model
- B. 1 → recommendation engine, 2 → language model, 3 → classifier, 4 → image-generation model
- C. 1 → classifier, 2 → image-generation model, 3 → recommendation engine, 4 → language model
- D. All four are the same underlying kind of system — a general-purpose "AI" applied to different data

<details><summary>Answer</summary>

**Correct: A.** These are four genuinely different jobs. A spam filter is a classifier: it sorts a fixed set of inputs into fixed categories (spam / not spam) it was trained to recognize. A chatbot is a language model generating text token by token, as in Question 1. A recommendation row ranks a catalog by predicted similarity to things you've already engaged with — no language generation involved. A text-to-image tool is a generative model too, but built and trained on image-caption pairs, producing pixels rather than words. "AI" is an umbrella term covering all of these — the right move is picking the tool built for your job, not assuming one does the others' work. See [types of AI you meet every day](/learn/ai-literacy/types-of-ai-you-meet-every-day) and [choose the right AI system](/learn/ai-literacy/choose-the-right-ai-system).

**B** swaps the classifier and the recommender — an easy mix-up, since both quietly sort things based on your data. But a classifier assigns a fixed label from a fixed set (spam or not), while a recommender ranks an open catalog by predicted preference. Different goal, different failure modes.

**C** swaps the two generative systems — treating "generative" as one technology. A chatbot generates language from a model trained on text; a text-to-image tool generates pixels from a model trained on images and captions. They share a family resemblance (both produce new content rather than a label) but nothing else about how they work.

**D** is the myth this whole module is built to break. There's no single general-purpose "AI" running underneath everything — these are different architectures trained on different data for different objectives, wearing the same one-word label.

</details>

## Question 4 — Confident, wrong, and step-by-step

A model gets a multi-step arithmetic problem wrong, but its written explanation of "how it solved it" reads as a clean, logical, step-by-step walkthrough. What does that tell you?

- A. It reasoned correctly and just made a careless slip at the final step, the way a person double-checking their own work might
- B. The explanation is generated the same way the rest of the answer is — as plausible-sounding text — so a clean walkthrough doesn't guarantee the underlying computation actually happened correctly at every step
- C. The model clearly wasn't trained on enough math problems
- D. This kind of mistake means the tool is broken and shouldn't be trusted for anything

<details><summary>Answer</summary>

**Correct: B.** A model doesn't run its arithmetic in one place and write its explanation in another — the "steps" you're reading are generated the same token-by-token way as the final number. A fluent, well-organized walkthrough is evidence that the model is good at producing text that *looks like* correct reasoning; it isn't independent evidence that the computation behind it was actually right. That gap is exactly why math and precise figures need a separate check, not just a re-read. See [ai vs human thinking, compared](/learn/ai-literacy/ai-vs-human-thinking-compared) and [when AI gets numbers and math wrong](/learn/ai-literacy/when-ai-gets-numbers-and-math-wrong).

**A** is the tempting one, because it's how human error usually shows up — a sound process with one slip near the end. A model doesn't have a separate "compute" module it can slip in independently of the explanation it writes, so you can't assume the process was sound just because the writeup reads that way.

**C** isn't wrong that more relevant training data tends to reduce this kind of error on average — but it doesn't explain *this* instance, and it wrongly suggests the fix is "train it more" rather than "verify this output before you use it."

**D** overcorrects. One arithmetic slip doesn't mean the tool is useless — it means arithmetic and precise numbers are a category where you check the work, the same way you'd check a junior colleague's spreadsheet rather than fire them over one formula error.

</details>

## Question 5 — Does it remember you next week?

You chat with an AI assistant for twenty minutes, and it correctly recalls something you mentioned ten minutes earlier. Next week, in a brand-new conversation, does it remember you?

- A. Yes — the conversation gets folded into the model's weights as you go, so it has genuinely learned about you
- B. No, by default — what looked like memory was the entire conversation transcript being resent as input text with each new message; a fresh conversation starts with none of that unless a product's separate memory feature saved it
- C. It depends on how advanced the specific model is — a more capable model would remember on its own
- D. Yes — it builds a private profile of everyone it talks to during its ongoing pretraining

<details><summary>Answer</summary>

**Correct: B.** A model's weights are fixed once training finishes — a normal conversation doesn't retrain it in real time. What felt like memory inside the conversation was the whole transcript being replayed as input alongside your newest message; that's why it can recall something from ten minutes ago and nothing at all from last week's separate conversation. Any cross-session memory you've seen in a specific product is a distinct feature layered on top, not something the base model does by nature. See [the data → model → output loop](/learn/ai-literacy/data-model-output-loop).

**A** is a very common and understandable myth, because the in-conversation recall genuinely feels like learning. But training and chatting are separate processes — weights don't update from a live conversation, so nothing about talking to it changes what the model knows going forward.

**C** misplaces the mechanism. Raw capability isn't what determines this — even the most capable models don't retain anything between separate conversations unless the product is explicitly engineered with a memory feature.

**D** describes something that doesn't happen at chat time. Pretraining runs on a fixed dataset assembled in advance, before you ever start typing — your live conversation isn't folded into that process, and there's no per-user profile being built from it. See [where AI knowledge comes from — and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops).

</details>

## Question 6 — Two tools, two different answers

You ask two different AI chatbots the same factual question and get two different answers. What's the most accurate takeaway?

- A. One of them is definitely broken or badly trained
- B. This is expected — each system generates its most likely-sounding response from its own training data and process, so disagreement alone doesn't tell you which (if either) is correct; you still have to verify
- C. AI companies deliberately tune answers to differ so their product feels distinct from competitors
- D. Whichever one answers with more confidence and detail is the more trustworthy one

<details><summary>Answer</summary>

**Correct: B.** Different training data, different model sizes and architectures, and some randomness in how text gets generated are all, individually, enough to produce different phrasing — or a genuinely different fact. Disagreement between two models is data about how different they are, not a verdict on which one is right. Treat it as a prompt to check the actual source, not as evidence for either side. See [uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification).

**A** assumes disagreement always has a broken party on one side. It doesn't — two independently built systems can each be working exactly as designed and still land on different phrasing, different emphasis, or different facts.

**C** reaches for a deliberate explanation where a much simpler one covers it: these are genuinely different systems, and there's no need for a differentiation strategy to explain why they don't converge on identical text.

**D** is the trap the whole module points at. Confidence and detail are generated the same way the rest of the answer is — they're a writing style, not a signal of accuracy. See [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident).

</details>

If more than one of these caught you out, that's not a knowledge gap — it's the actual shape of the problem. The fix isn't memorizing more facts about AI; it's building the habit of checking outputs the way [the verification checklist](/learn/ai-literacy/the-verification-checklist) lays out, every time the stakes are higher than "draft I'll edit anyway."

**Related:** [What AI actually is](/learn/ai-literacy/what-ai-actually-is) · [AI as pattern prediction, not thinking](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking) · [Common myths about AI, debunked](/learn/ai-literacy/common-myths-about-ai-debunked) · [Catch a hallucination: a worked example](/learn/ai-literacy/catch-a-hallucination-worked-example) · [What AI can and can't do — overview](/learn/ai-literacy/what-ai-can-and-cant-do-overview)
