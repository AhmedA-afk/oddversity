---
title: "Quiz: Roles, System Prompts, and Steering"
track: "prompt-engineering"
status: live
summary: "Ten questions on system vs user placement, what a role does and doesn't change, prefill vs format, and rewriting negatives into positives."
duration: "9 min read"
---

Ten questions pulling from every lesson in this module — where an instruction should live, what a persona actually moves, when a prefill beats a polite request, and how to reframe a negative rule. Answer before you check.

### Question 1

You want a support bot to always respond in under 80 words, no matter how long the conversation runs. Where should that rule live for the best chance of holding by turn twenty?

A. In the first user message only
B. In the system prompt, resent every call
C. In the assistant's prefilled opening line
D. It doesn't matter — the model reads the whole transcript either way

<details><summary>Answer</summary>

**Correct: B.** The system prompt is resent, unchanged, on every single call, so the rule stays equally present and equally "fresh" on turn 20 as on turn 1. A one-time entry in the user turn doesn't get that treatment — see [System vs User Messages: Who Sets the Rules](/learn/prompt-engineering/system-vs-user-message-roles).

- A is wrong because a rule stated once in a user turn has nothing resending or reinforcing it — by turn 20 it's buried behind nineteen more turns of newer content.
- C is wrong because a prefill only fixes the literal opening tokens of a single reply — it can't sustain a standing word-count rule across the rest of that answer, let alone future turns.
- D is wrong because the model reading the "whole transcript" doesn't mean every part of it is weighted or reinforced equally — recency and resend behavior both matter, which is this whole question's point.

</details>

### Question 2

A team adds "You are a Pulitzer-winning journalist" to a prompt that summarizes internal meeting notes, hoping for more accurate summaries. What's the most likely actual effect?

A. Summaries become measurably more factually accurate
B. The model gains access to journalism-specific training data it didn't have before
C. Wording and structure shift toward a journalistic register; factual accuracy is unaffected
D. Response length is forced to match a newspaper article

<details><summary>Answer</summary>

**Correct: C.** A role reliably shifts vocabulary, tone, and format conventions — it doesn't add facts or raise accuracy on its own. See [What Role Prompting Actually Changes](/learn/prompt-engineering/what-role-prompting-changes).

- A is wrong because a persona label doesn't change what the model actually knows or how carefully it verifies a claim — a credential framing has been shown, on a checkable task, to leave the same mistakes in place.
- B is wrong because a role prompt is conditioning text, not a data-access mechanism — it can't grant the model information it didn't already have from training.
- D is wrong because nothing about naming a role pins an exact output length; that would require an explicit length or format instruction, a separate lever entirely.

</details>

### Question 3

Which of these role clauses is most likely to produce a measurable, repeatable change in output — not just a different vibe?

A. "You are the world's greatest expert in this field."
B. "You are meticulous and brilliant."
C. "You are writing for a reader with no background in this topic — define every technical term the first time you use it."
D. "You are an incredibly skilled professional."

<details><summary>Answer</summary>

**Correct: C.** This clause names a concrete audience and a concrete behavior (define terms on first use) — something you can check the output against directly.

- A is a superlative credential with no behavioral content — nothing about "the world's greatest expert" specifies what to actually do differently on this task.
- B is the same pattern as A: flattering adjectives, no audience, no format, no scope — this is exactly the failure this module calls persona theater.
- D is another version of the same superlative-with-no-content pattern as A and B.

</details>

### Question 4

You're calling an API that supports seeding the assistant's turn, and you need a response that starts with a JSON object and nothing else. What's the more reliable way to guarantee no preamble text?

A. Add "Do not include any preamble" to the instructions
B. Prefill the assistant's turn with an opening `{`
C. Ask the question twice, in case the first attempt has a preamble
D. Lower the temperature to 0

<details><summary>Answer</summary>

**Correct: B.** A prefill removes the decision entirely — there's no continuation of `{` that reads as a preamble sentence, since that sentence wouldn't start with a brace. See [Prefilling: Starting the Assistant's Answer for It](/learn/prompt-engineering/prefilling-the-assistant-turn).

- A is a reasonable instruction to include alongside a prefill, but on its own it's a request the model can still decline to fully honor — it changes a probability, not a guarantee.
- C doesn't address the mechanism at all; it just retries around the same unreliable process and wastes a call.
- D makes sampling deterministic, but it doesn't change *what* the single most likely token is — if a preamble happens to be the top candidate, temperature 0 makes that preamble more consistent to reproduce, not less likely to appear.

</details>

### Question 5

A prompt says: "Don't mention that we're out of stock on the blue version." What's the most likely failure mode this specific phrasing invites?

A. The model will refuse to discuss the product at all
B. The model may still reference availability indirectly ("the blue one isn't currently available") because the topic is already primed by naming it
C. The model will always comply perfectly, since the instruction is explicit
D. The model will bring up a completely unrelated product instead

<details><summary>Answer</summary>

**Correct: B.** Naming "out of stock on the blue version" puts that exact concept in context regardless of the word "don't" in front of it — the topic is primed, and an improvised way of referencing it can still leak through. See [Why 'Don't Do X' Often Backfires](/learn/prompt-engineering/negative-instructions-problem).

- A overcorrects — total avoidance isn't the mechanism this lesson describes; the described failure is a leak, not a shutdown.
- C is wrong because the entire premise of this lesson is that negative instructions are less reliable than they look on paper, not more.
- D has no basis in the mechanism — nothing about naming a forbidden concept predicts the model switching to an unrelated topic.

</details>

### Question 6

Which is the best positive rewrite of "Don't recommend our competitors' products"?

A. "Never say a competitor's name under any circumstance."
B. "Only discuss and recommend our own product's features and options."
C. "If asked about competitors, apologize and change the subject."
D. "Try not to bring up other companies unless necessary."

<details><summary>Answer</summary>

**Correct: B.** This states a positive scope target the model can aim at directly, rather than an absence to maintain.

- A is still a negative — a stronger one, even — and inherits the exact same priming problem the original rule had.
- C gives the model a script for refusing, but no positive target for what to actually talk about instead; it's the bare-refusal version of the same underlying gap.
- D is vague ("unless necessary") and still framed around avoidance rather than a clear, positive scope.

</details>

### Question 7

A chatbot is told at the start of a conversation to always mask credit card numbers to the last 4 digits. By turn 12, in response to a user's direct request, it reads back more digits than it should. What's the most likely explanation?

A. The system prompt was deleted partway through the conversation
B. The rule's proportional share of the total context shrank as the transcript grew, and nothing recent reinforced it
C. The model's weights were updated mid-conversation
D. Masking rules only apply for the first 5 turns by design

<details><summary>Answer</summary>

**Correct: B.** The rule stays byte-for-byte present in the resent system prompt, but its share of the total context — and its positional distance from the current turn — both work against it as the transcript grows. See [Managing State Across a Multi-Turn Conversation](/learn/prompt-engineering/multi-turn-prompt-state).

- A is wrong because a harness resends the system prompt on every call; nothing in the scenario suggests it was removed.
- C is wrong because weights never change mid-conversation — that's a training-time event, entirely separate from anything that happens during a live session.
- D describes a rule that doesn't exist; it's a plausible-sounding technical excuse invented to test whether you're pattern-matching on "sounds right" instead of the actual mechanism.

</details>

### Question 8

A prompt reliably gets the right tone and stays on-topic, but the exact three-field structure of the answer (title / author / reason) comes out differently formatted almost every run. Which lever most directly fixes this?

A. Add a more impressive role description
B. An explicit format instruction (or a couple of worked examples) specifying the literal template
C. Lower the temperature to reduce randomness
D. Move the instructions from the system prompt to the user prompt

<details><summary>Answer</summary>

**Correct: B.** Tone and topic are already handled — the missing piece is the literal syntax, which is exactly what an explicit format instruction (or, if there's a genuine ambiguity, a worked example) pins down that a role never specifies.

- A is wrong because the scenario states tone and topic already work — piling on more role language doesn't add syntax-level precision a persona was never built to provide.
- C is wrong because temperature affects sampling variance in word choice, not which structural template the model defaults to using.
- D is wrong because moving instructions to the user prompt makes them less durable across turns, not more precise about output shape — an unrelated axis entirely.

</details>

### Question 9

A system prompt says both "Always cite a source for factual claims" and "Keep every answer to 2 sentences." A claim needs a source that won't fit in 2 sentences. What has the team most likely failed to do?

A. Add a third rule prohibiting sources entirely
B. State an explicit priority between the two conflicting rules
C. Delete both rules and rely on default behavior
D. Increase the sentence limit to compensate

<details><summary>Answer</summary>

**Correct: B.** Two genuinely conflicting rules need an explicit, stated resolution — which one wins, and under what condition — rather than being left for the model to guess at case by case.

- A throws out a legitimately useful rule instead of resolving the actual conflict between the two.
- C removes all the guidance rather than fixing the one place it collides, leaving the model with nothing to go on at all.
- D treats the symptom of this one collision without addressing that undetected conflicts between other rules will keep recurring as the prompt grows — it's also not guaranteed to actually prevent future citation-length collisions.

</details>

### Question 10

A support bot occasionally opens its replies with "Certainly! I'd be happy to help with that." before the actual answer, even though the system prompt already says "Do not include filler openers." What's the most direct fix, given that the instruction is already being ignored some of the time?

A. Repeat the same instruction three times in the system prompt for emphasis
B. Prefill the assistant's turn with the first token of the real answer, skipping the opener entirely
C. Switch the instruction from the system prompt to the user prompt
D. Add a new rule: "Don't say 'Certainly'"

<details><summary>Answer</summary>

**Correct: B.** A prefill removes the opener from the space of reachable continuations altogether, rather than repeating an instruction that's already competing — and losing sometimes — against the model's habitual pattern.

- A doesn't change the underlying competition between the instruction and the habit it's trying to suppress; repetition is still just another ask, not a structural fix.
- C is a strict downgrade — the instruction was already visible in the system prompt without preventing the issue, and moving it to the user prompt makes it *less* durable across turns, not more effective.
- D bans one specific word while leaving the underlying pattern — an opener of some kind — completely intact; the model can still leak "Sure!" or "Of course!" instead, exactly the priming trap this module covers for negative instructions.

</details>

**Related:** [System vs User Messages: Who Sets the Rules](/learn/prompt-engineering/system-vs-user-message-roles), [What Role Prompting Actually Changes](/learn/prompt-engineering/what-role-prompting-changes), [Persona Theater: Roles That Change Nothing](/learn/prompt-engineering/persona-theater-that-does-nothing), [Prefilling: Starting the Assistant's Answer for It](/learn/prompt-engineering/prefilling-the-assistant-turn), [Why 'Don't Do X' Often Backfires](/learn/prompt-engineering/negative-instructions-problem), [Managing State Across a Multi-Turn Conversation](/learn/prompt-engineering/multi-turn-prompt-state)
