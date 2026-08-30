---
title: "Foundations Quiz"
track: "context-engineering"
status: live
summary: "Twelve questions on window anatomy, tokenization, the prompting boundary, message roles, and the stateless-model insight."
duration: "9 min read"
---

Twelve questions covering this module. Two are scenarios — a budget-cutting decision and a rewrite-the-prompt-vs-restructure-the-context call — and those are the ones worth slowing down for.

## 1. A "200k context window" advertised by a provider mostly means what, in practice?

A. 200k tokens of usable space for your task's own content, guaranteed
B. A shared budget that the system prompt, tool definitions, history, retrieved context, and the output reserve all draw from before your task gets any of it
C. The maximum number of words the model can understand in one conversation
D. The number of turns a conversation can have before it must end

<details><summary>Answer</summary>

**Correct: B.** As covered in [Context Window Anatomy](/learn/context-engineering/context-window-anatomy), the advertised total is a ceiling shared by several competing categories, not a dedicated allowance for your task's content alone.

- A is wrong: system prompt, tools, and history all draw from the same total before your actual content does.
- B is correct.
- C is wrong: the unit is tokens, not words, and the two aren't interchangeable — see question 5.
- D is wrong: there's no fixed turn limit; the constraint is total tokens, not turn count.

</details>

## 2. Which claim about the "~4 characters per token" rule of thumb is accurate?

A. It's a safe upper bound for any input, including URLs and JSON
B. It holds reasonably well for plain English prose, but URLs, minified JSON, and CJK text commonly use more tokens per character than it predicts
C. It's exact for every tokenizer and every language
D. It only applies to code, never to prose

<details><summary>Answer</summary>

**Correct: B.** [Tokens Are Not Words](/learn/context-engineering/tokens-are-not-words) walks through exactly this: the rule is a rough English-prose average, and URLs, dense punctuation-heavy formats, and non-space-delimited scripts like CJK all tend to cost more tokens per character than it predicts, not fewer.

- A is wrong: it's optimistic in exactly the wrong direction for those cases — a budget sized against it would overflow, not stay safely under.
- B is correct.
- C is wrong: tokenization is vocabulary- and tokenizer-specific; there's no universal exact ratio.
- D is backwards: the rule of thumb is meant for prose specifically, and breaks down on code and other structured text.

</details>

## 3. A support agent gives a wrong answer because the one relevant policy sentence is buried in the middle of an 18,000-token pasted document. Which fix is a context engineering fix rather than a prompting fix?

A. Add "please read carefully" to the system prompt
B. Retrieve and pass only the relevant passage instead of the full document, and place it near the question
C. Increase the temperature so the model considers more possibilities
D. Rephrase the user's question to be more polite

<details><summary>Answer</summary>

**Correct: B.** This is the exact contrast worked through in [Where Prompting Ends and Context Engineering Begins](/learn/context-engineering/the-context-engineering-vs-prompting-line): the defect is in what's in the payload and where, not in how the instruction is worded, so the fix has to change the payload.

- A is a wording change to the instruction — it doesn't reduce what the model has to compete against to find the right fact.
- B is correct.
- C affects sampling randomness, not what content is present or how findable it is.
- D changes politeness, not the substance of what's in context — no bearing on the actual defect.

</details>

## 4. The same fact — "annual plans have no cancellation fee" — is placed in a system prompt in one version of an agent and in a prior assistant turn in another. What's the key behavioral difference?

A. There is no difference; all roles are treated identically
B. The system-prompt version is sent on every call and benefits from caching; the assistant-turn version only persists if history retains that turn, and if it were ever stated wrong there, it becomes sticky precedent that's hard to dislodge
C. Only the assistant-turn version is ever seen by the model
D. Only the system-prompt version can ever be wrong

<details><summary>Answer</summary>

**Correct: B.** [System, User, Assistant, Tool: Roles as Structure](/learn/context-engineering/message-roles-and-structure) covers exactly this contrast — role changes persistence, caching behavior, and how much authority the content carries.

- A is wrong: the whole lesson is that role changes real behavior, not just labeling.
- B is correct.
- C is wrong: both versions are visible to the model whenever they're part of the sent request.
- D is wrong: content in any role can be wrong; the roles differ in persistence and stickiness, not in some immunity to error.

</details>

## 5. What actually happens between two separate calls to a model within the same "conversation"?

A. The model retains an internal memory of the prior call automatically
B. Nothing persists on the model's side; the application resends the entire history, and anything not resent is effectively gone
C. The provider automatically remembers everything unless you explicitly tell it to forget
D. Only the system prompt persists automatically; everything else must be resent

<details><summary>Answer</summary>

**Correct: B.** [The Stateless Model Behind the Stateful Agent](/learn/context-engineering/stateless-model-stateful-agent) derives this directly: each call is an independent computation over whatever tokens are present in that request, and the "conversation" is an illusion your code reconstructs by resending history.

- A is wrong: there's no model-internal memory that survives between separate calls.
- B is correct.
- C is wrong: nothing is remembered by default; every fact you want to persist has to be explicitly resent or otherwise stored and reintroduced.
- D is wrong: the system prompt isn't special-cased for persistence either — it's just typically stable content the application chooses to resend unchanged every time.

</details>

## 6. What is the KV cache, precisely?

A. A form of long-term memory the model builds up across many conversations
B. A provider-side reuse of attention key/value tensors for a repeated prefix — a compute optimization, not a way the model retains information it wasn't given this call
C. A database where the model stores facts users have told it
D. A cache of previous users' conversations, shared across sessions

<details><summary>Answer</summary>

**Correct: B.** As precisely stated in [The Stateless Model Behind the Stateful Agent](/learn/context-engineering/stateless-model-stateful-agent), the KV cache reuses computed representations for identical prefixes to save compute — the tokens still have to be present in the request; nothing is being remembered on the model's behalf.

- A is wrong: it has nothing to do with cross-conversation memory; it's scoped to prefix reuse within near-identical requests.
- B is correct.
- C is wrong: it's not a fact store at all — it's a tensor-reuse optimization.
- D is wrong and would also be a serious privacy issue; the KV cache is not a mechanism for sharing content across separate users' sessions.

</details>

## 7. You break down an 80,000-token payload and find: 48% conversation history (mixed — some resolved, some live, plus one durable fact), 37.5% a tool result that was fetched twice due to a retry, and the rest small fixed segments. What's the correct move on the duplicated tool result?

A. Leave it — duplication is harmless as long as it fits in the budget
B. Remove the duplicate copy entirely; it's a pure win since it carries zero additional information over the original
C. Summarize both copies into a shorter paragraph
D. Move both copies into the system prompt so they get cached

<details><summary>Answer</summary>

**Correct: B.** [Reading a Context Budget](/learn/context-engineering/reading-a-context-budget-pie) makes exactly this distinction: unlike the mixed history slice, which genuinely needs different treatment for different pieces, a clean duplicate has no judgment call attached — removing it loses nothing.

- A is wrong: it still costs tokens and dilutes the payload for zero benefit; "fits in the budget" isn't the same question as "helps the answer," per [Why Context Is the Real Bottleneck](/learn/context-engineering/why-context-is-the-real-bottleneck).
- B is correct.
- C is unnecessary work for a duplicate — summarizing implies there's unique content worth condensing, and there isn't; deletion is simpler and loses nothing.
- D solves nothing: caching reduces recompute cost for a stable prefix, but the duplicate is still sent and still dilutes the payload every time.

</details>

## 8. In the same 80,000-token payload, the conversation-history slice contains a resolved unrelated sub-thread, one durable fact (the customer's account tier), and the live recent sub-thread. What's the correct treatment, respectively?

A. Keep all three exactly as they are — history should never be touched
B. Delete all of history to save tokens, including the live sub-thread
C. Summarize or drop the resolved sub-thread, externalize the durable fact into a memory store, and keep the live sub-thread close to verbatim
D. Move the entire history slice into the system prompt

<details><summary>Answer</summary>

**Correct: C.** This is the three-fixes-for-one-slice point from [Reading a Context Budget](/learn/context-engineering/reading-a-context-budget-pie): different pieces of one slice can need different treatment, and treating the slice as one blob leads to either keeping too much or cutting something load-bearing.

- A wastes budget on a resolved sub-thread that adds no value to the current question.
- B is wrong: the live sub-thread is exactly what the current question needs — deleting it would break the answer.
- C is correct.
- D doesn't fix anything: moving variable, per-conversation content into the system prompt breaks the assumption that the system prompt is stable, and defeats caching for no benefit.

</details>

## 9. What does the desk-and-filing-cabinet analogy for the context window get wrong if taken too literally?

A. It correctly implies the model tidies its own desk with judgment, the way a person would
B. It implies a full desk is fine as long as things still fit, and it doesn't capture that every token you carry costs money and latency on every call, unlike physical paper
C. It correctly implies there's no cost to a full context window as long as the hard limit isn't hit
D. It's accurate in every respect and has no breaking point

<details><summary>Answer</summary>

**Correct: B.** [The Window as Working Memory](/learn/context-engineering/context-window-as-working-memory) states this explicitly: nothing tidies the window automatically, and unlike a physical desk, every token carried costs money and latency regardless of whether the window is "full."

- A is backwards: the lesson explicitly notes the model has no built-in instinct to triage its own context — all tidying has to be engineered by you.
- B is correct.
- C is wrong: dilution costs quality well before the hard token limit is reached — see [Context Rot](/learn/context-engineering/context-rot).
- D is wrong: analogies are useful precisely because they have identifiable breaking points, and this one has at least two.

</details>

## 10. Why shouldn't you use a generic tokenizer library like tiktoken to count tokens for a Claude request?

A. It's not runnable in Python
B. Token counts are model-specific; tiktoken is built for a different model family and can meaningfully undercount or overcount relative to Claude's actual tokenizer
C. There's no way to count tokens for any model programmatically
D. It only works for images, not text

<details><summary>Answer</summary>

**Correct: B.** [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice) is explicit about this: token counts depend on the specific tokenizer a model family uses, and a count from the wrong tokenizer is simply wrong for the model you're actually budgeting against — use the real counting endpoint for the model you're targeting.

- A is false; it's a perfectly runnable library, just for the wrong tokenizer.
- B is correct.
- C is false — a per-model token-counting endpoint is exactly the tool built for this.
- D is false and irrelevant; tokenization here concerns text, not images.

</details>

## 11. An agent's system prompt clearly states a 100-word length limit, but it's positioned at the very top of a long payload, before a large retrieved-document block and full history. Responses consistently run past 250 words. What's the most likely explanation?

A. The model is incapable of counting words at all, and no fix exists
B. The instruction is true and present, but its position relative to where generation actually begins reduces how much it influences the output — restating it near the end, right before the question, is more reliable
C. The document block must be deleted entirely before any instruction can work
D. Raising the temperature will make the model more likely to respect the limit

<details><summary>Answer</summary>

**Correct: B.** This is the buried-instruction pattern from [Five Ways Beginners Blow the Window](/learn/context-engineering/beginner-context-mistakes) and the ordering effects covered in [Context Ordering and Recency Effects](/learn/context-engineering/context-ordering-and-recency-effects) — a true instruction can still lose influence to whatever content is closest to where the model starts generating.

- A overstates the limitation; positioning, not raw capability, is the more likely cause here.
- B is correct.
- C is a bigger intervention than needed — repositioning or restating the instruction is the targeted fix; the document itself may still be needed.
- D is backwards: temperature affects sampling randomness, not adherence to a stated constraint.

</details>

## 12. Which statement best captures the core stance this module ends on?

A. Context should include everything potentially relevant, since a bigger window makes this free
B. Context is a curated payload with a lifecycle — what's included, how it's ordered, and what survives each turn are all deliberate engineering decisions, not a byproduct of "whatever fits"
C. Prompt wording is the only lever that matters once a model is chosen
D. Context engineering is only relevant once a project already has performance problems

<details><summary>Answer</summary>

**Correct: B.** This is the closing stance of [The Whole Game of Context Engineering](/learn/context-engineering/the-whole-game-of-context-engineering): every version of Aria improved not by writing cleverer instructions, but by deliberately deciding what belonged in the window and how it evolved over time.

- A is the exact mistake this module argues against — a bigger window changes the ceiling, not the need for discipline, per [Why Context Is the Real Bottleneck](/learn/context-engineering/why-context-is-the-real-bottleneck).
- B is correct.
- C ignores everything this module covers about payload composition, ordering, and lifecycle mattering independently of wording.
- D is backwards: the mistakes in [Five Ways Beginners Blow the Window](/learn/context-engineering/beginner-context-mistakes) show problems compounding quietly from the very first turn, well before anyone notices a performance issue.

</details>

**Related:** [The Whole Game of Context Engineering](/learn/context-engineering/the-whole-game-of-context-engineering) · [Context Window Anatomy](/learn/context-engineering/context-window-anatomy) · [Context Engineering Vocabulary](/learn/context-engineering/context-engineering-vocabulary) · [Reading a Context Budget](/learn/context-engineering/reading-a-context-budget-pie)
