---
title: "Compaction and Memory Quiz"
track: "context-engineering"
status: live
summary: "Twelve questions on summarization tradeoffs, hierarchy, sliding windows, memory vs state, and store selection - with a verbatim-through-compaction scenario."
duration: "18 min read"
---

## Question 1: The arithmetic of running out

A support agent's average turn — including tool output — runs about 1,800 tokens. The team reserves 20,000 tokens of a 100,000-token window for the system prompt and tool schemas, leaving the rest for conversation history. Assuming turn size stays roughly constant, which statement is most accurate about when this agent needs a compaction strategy?

- **A.** It needs one immediately — 100,000 tokens is too small a window for a production agent.
- **B.** It needs one once conversations regularly exceed about 44 turns, since that's roughly when the 80,000-token history budget is used up.
- **C.** It doesn't need one as long as it uses a reasoning model, since reasoning models manage conversation history automatically.
- **D.** It needs one only for coding agents, not support agents, since support conversations don't accumulate tool output.

<details><summary>Answer</summary>

**Correct: B.** 80,000 divided by 1,800 is about 44.4 — so a session running past roughly 44 turns has exceeded its history budget. That's the whole mechanism from [why compaction is unavoidable](/learn/context-engineering/why-compaction-is-necessary): a fixed ceiling and a positive growth rate guarantee a specific turn number where the two meet, and it's exactly this kind of division, not a vague sense of "eventually."

**A** misdiagnoses the cause. The issue isn't that 100,000 tokens is "too small" in some absolute sense — any fixed window, however large, hits the same wall eventually. The question isn't window size, it's growth-versus-ceiling arithmetic, which applies regardless of how big the ceiling is.

**C** confuses a model's internal reasoning process with your application's job of managing the stored conversation array. A reasoning model deliberates before answering; nothing about that deliberation compacts, summarizes, or trims the message history your code sends it on the next call — that remains entirely your responsibility, the same stateless-model, stateful-agent split covered in [stateless model, stateful agent](/learn/context-engineering/stateless-model-stateful-agent).

**D** picks an irrelevant distinguishing feature. The growth mechanism is generic to any accumulating history — a long support thread with pasted logs and quoted prior replies accumulates tokens the same way a coding session's tool output does. "Has tool output" isn't what makes an agent need compaction; "has a conversation that keeps growing" is.

</details>

## Question 2: What the summary has to keep

A compaction pass needs to fold this exchange, from many turns back, into a summary: *"User: Ship only to US and Canada for now — do not enable EU shipping, we haven't cleared customs compliance there yet. Agent: Understood, US and Canada only."* Which resulting summary correctly preserves what must survive?

- **A.** "Shipping regions were discussed and a decision was reached."
- **B.** "Ship to US and Canada only; EU shipping is explicitly disabled pending customs compliance clearance."
- **C.** "The user asked about shipping and the agent responded appropriately."
- **D.** "International shipping was deferred to a future conversation."

<details><summary>Answer</summary>

**Correct: B.** It preserves the exact scope (US and Canada), the explicit prohibition (EU disabled), and the reason (customs compliance) — the three things [summarization for compaction](/learn/context-engineering/summarization-for-compaction-deep) names as non-negotiable: the decision, the constraint, and why it exists.

**A** is a faithful-sounding summary of *that a discussion happened*, not of *what it concluded* — the exact failure shown as "Summary B" in that lesson's worked example, where a real ruling gets flattened into vague prose that no longer blocks anything.

**C** is even thinner — it doesn't even establish what the shipping decision was, and "responded appropriately" is an evaluative gloss standing in for actual content the next turn would need.

**D** is actively misleading rather than just vague: "deferred" implies EU shipping is an open question to revisit casually, when the real fact is a standing prohibition tied to a compliance reason. An agent reading this version later might reasonably consider re-enabling EU shipping — exactly the outcome the original instruction was trying to prevent.

</details>

## Question 3: Why re-summarizing a summary goes wrong

A team's compaction system keeps one summary that grows over time; whenever it exceeds a size limit, they re-run the summarizer on the summary's own text to shrink it again. After many cycles across a very long session, a decision made in the first hour has become vague, even though it was captured accurately the first time it was summarized. What's the most direct fix?

- **A.** Increase the size limit so the summary is re-compressed less often.
- **B.** Restructure into layers, so each fact is compressed once on its way up to a coarser tier, instead of the same summary text being repeatedly re-compressed.
- **C.** Switch to a purely extractive summarizer so nothing is ever paraphrased.
- **D.** Discard the summary entirely and rely on a sliding window instead.

<details><summary>Answer</summary>

**Correct: B.** This is exactly the failure [hierarchical summarization](/learn/context-engineering/hierarchical-summarization-explained) is built to prevent: in a flat scheme, the same text gets compressed again every time it's re-summarized, and each pass sands off a bit more detail. A layered structure writes each fact once, at the point it moves up to the next tier, and never revisits it — so a decision from hour one degrades exactly once, not once per compaction cycle for the rest of the session.

**A** only reduces how often the compounding compression happens — it doesn't remove the mechanism. A long enough session on any fixed size limit eventually hits the same degradation; raising the limit just moves the failure point later.

**C** trades one failure for a different one. A purely extractive approach struggles with information spread across many turns — as covered in [summarization for compaction](/learn/context-engineering/summarization-for-compaction-deep), a decision refined across three separate turns doesn't extract cleanly as any single span, so extraction alone under-compresses or misses the synthesis a summary is supposed to provide.

**D** makes things strictly worse. A sliding window doesn't even keep a compressed record of what rolls out — it discards it outright, the failure covered in [sliding window context management](/learn/context-engineering/sliding-window-context-management-deep). Trading a degrading summary for total silent loss isn't a fix.

</details>

## Question 4: A summarize function that never caps its output

In a rolling summarizer built with `keep_last=6` and a `summarize_fn` that folds old turns into a running summary, what happens if `summarize_fn` is implemented to simply concatenate every folded turn's full text onto the existing summary, forever?

- **A.** Nothing changes functionally — the summary is smaller than the raw turns either way, so total context still shrinks.
- **B.** The running summary itself grows without bound as the session continues, moving the original unbounded-growth problem into the summary instead of solving it.
- **C.** This is actually the correct implementation, since it guarantees no information is ever lost.
- **D.** The summarizer throws an error once `keep_last` turns have accumulated.

<details><summary>Answer</summary>

**Correct: B.** [Building a rolling summarizer](/learn/context-engineering/building-a-rolling-summarizer) is explicit about this: `mock_summarize` deliberately caps its output to a fixed number of salient facts precisely to avoid this outcome. A `summarize_fn` that concatenates everything it's ever folded just relocates the growth curve from the raw-turn list into `running_summary` — the total context still grows linearly with conversation length, just under a different variable name.

**A** is true only at a single moment in time — right after one fold, the summary is smaller than what it replaced. It stops being true across the life of a long session, once dozens of folds have each appended onto an ever-growing string.

**C** sounds responsible but is exactly backwards. A fixed-size summarization output — the same discipline a real LLM call enforces with a max-output-tokens setting — is what makes compaction actually bound the context. "Keep everything, forever, inside the summary" isn't safety, it's deferring the original problem into a place that's harder to notice growing.

**D** invents a failure mode that isn't there. Nothing about unbounded concatenation raises an error — the danger is exactly that it fails silently, with token counts creeping upward with no loud signal that anything is wrong.

</details>

## Question 5: Fixing a forgotten constraint

At turn 1 of a long session, a user says: "Never suggest a paid plan — I'm only ever evaluating the free tier." By turn 30, using a plain 10-turn sliding window with no other mechanism, the agent recommends upgrading to a paid plan. What's the actual defect, and what fixes it?

- **A.** The model's reasoning failed to recall a fact it should have inferred; the fix is a prompt that asks it to "remember user preferences."
- **B.** Turn 1 rolled out of the 10-turn window at turn 11 and is no longer present anywhere in context; the fix is a persistent head that pins standing constraints outside the window's rotation.
- **C.** The window size is fine; the real fix is switching to a model with a bigger context window so more turns fit.
- **D.** This is expected behavior and not fixable — sliding windows are fundamentally incompatible with long-lived constraints.

<details><summary>Answer</summary>

**Correct: B.** By turn 30, turn 1 has been outside the 10-turn window for nineteen turns. There is no token stating the constraint anywhere in what the model receives — this is the concrete failure walked through in [sliding window context management](/learn/context-engineering/sliding-window-context-management-deep), and the fix built there is a small, persistent head that captures standing constraints as they're about to roll out and keeps them outside the window's FIFO rotation entirely.

**A** misdiagnoses a missing-input problem as a reasoning problem. Nothing was recalled incorrectly — the relevant text was never sent to the model on this turn at all. A better prompt can't make the model attend to tokens it never received.

**C** is the "bigger window solves it" trap named directly in [why compaction is necessary](/learn/context-engineering/why-compaction-is-necessary) and this lesson's deep-dive: a bigger window only postpones the turn at which turn 1 rolls out, it doesn't stop it from eventually happening in any long enough session.

**D** overcorrects. Plain sliding windows are incompatible with long-lived constraints — the window-plus-head hybrid is not a plain sliding window, and it handles exactly this case by design.

</details>

## Question 6: Scratchpad vs a lossy summary

An agent debugging a flaky test logs each ruled-out hypothesis to an external scratchpad file, separate from the conversation. A compaction pass then folds the last 20 turns into a summary that only says "several fixes were attempted without success." Asked to try something new, what should the agent do, and why?

- **A.** Propose a fix it already tried, since the summary no longer specifies which ones failed.
- **B.** Read the scratchpad, which still holds an exact list of ruled-out hypotheses because compaction never touched it, and avoid repeating any of them.
- **C.** Ask the user to repeat which fixes were already tried, since that information is unrecoverable.
- **D.** Ignore the scratchpad, since it isn't part of the conversation the model sees.

<details><summary>Answer</summary>

**Correct: B.** This is the exact scenario [scratchpad and working-memory patterns](/learn/context-engineering/scratchpad-working-memory-patterns) builds toward: the scratchpad lives outside the message array, so a compaction pass that operates only on that array has no effect on it. Reading it back deliberately at the point it's needed recovers the full, undamaged list.

**A** reproduces the regression the scratchpad exists to prevent — trusting only the vague conversational summary, when a complete record sits one read away, throws away the entire benefit of having built the scratchpad.

**C** treats recoverable information as lost. Asking the user to repeat something already logged is exactly the "repeated question" cost from [what to remember, what to forget](/learn/context-engineering/what-to-remember-vs-forget) — avoidable here because a store with the answer already exists.

**D** gets the design backwards. Being outside the conversation array is precisely *why* the scratchpad survives compaction — it isn't a reason to ignore it, it's the mechanism that makes it useful. The agent is expected to read it deliberately, on demand, not have it auto-injected into every turn.

</details>

## Question 7: What carries into a new session

A booking agent collects `{destination, date, seat, payment_step}` while a user is mid-booking, and separately notes `{preferred_seat: "aisle"}`. The user abandons the booking at the payment step. Two weeks later they start booking an unrelated trip. What should carry into the new session?

- **A.** Both the abandoned booking's details and the seat preference, so the agent can offer to resume where they left off.
- **B.** Only the seat preference — the abandoned booking's details are task-scoped state and should be discarded with the task.
- **C.** Neither — a new booking should always start from a completely blank slate.
- **D.** Only the abandoned booking's details, since resuming an incomplete task is more useful than a minor seat preference.

<details><summary>Answer</summary>

**Correct: B.** This is the worked example in [memory vs state](/learn/context-engineering/memory-vs-state-distinction): `destination`, `date`, and `payment_step` are scoped entirely to the abandoned booking and go stale the moment it's abandoned — carrying them forward into an unrelated trip would be actively wrong, not just unnecessary. `preferred_seat` is the one fact that's true independent of any single booking's outcome, which is exactly what makes it a memory candidate rather than task state.

**A** is the anti-pattern the lesson names directly — resurrecting a stale, task-scoped booking as though the user might want to "resume" it, when the new trip has nothing to resume.

**C** overcorrects. Durable, low-sensitivity preferences are exactly the kind of fact meant to persist and make the experience better on a later visit — discarding everything indiscriminately is the "amnesiac assistant" failure from the other direction.

**D** inverts which value is durable. The booking's fields are the ones tied to a single task's fate; the seat preference is the one that survives it.

</details>

## Question 8: Superseding a stale fact

A user tells a coding assistant "I'm on Python 3.9" in one session, then a month later mentions in an unrelated session "we migrated, I'm on 3.11 now." The memory store's write path marks the old fact `status: superseded` rather than deleting it, and the read path filters to the latest non-superseded fact. In a brand-new session today, what should the assistant reference, and why does marking-superseded-rather-than-deleting matter?

- **A.** 3.9, since that was the first and most explicitly stated fact.
- **B.** 3.11, because the read path filters to the latest non-superseded entry; keeping the old entry (rather than deleting it) preserves an audit trail without letting it interfere with retrieval.
- **C.** It should ask the user again, since two conflicting facts exist in the store and neither can be trusted.
- **D.** Both versions, mentioning that compatibility should be checked for either, to be safe.

<details><summary>Answer</summary>

**Correct: B.** [Memory across sessions](/learn/context-engineering/cross-session-memory-architecture) builds exactly this write/read pair: a correction supersedes the earlier value rather than sitting beside it as an equally-weighted alternative, and the read path's filter (`status != "superseded"`) resolves to 3.11 deterministically. Keeping the 3.9 row instead of deleting it means you can still trace, later, what the assistant believed and when it changed — without that stale row ever winning a read.

**A** treats "stated first" as the tiebreaker, when a later explicit correction should always take precedence over an earlier stated fact — that's the entire point of the supersede step in the write path.

**C** ignores that the system already resolved the conflict correctly. Re-asking the user discards work the read-path filter already did, and reproduces the "repeated question" cost from a different angle — costing the user's time to work around a problem that isn't actually present.

**D** hedges in a way that surfaces an ambiguity the versioning design specifically exists to remove — mentioning both versions makes the assistant look like it doesn't know something it does, in fact, know.

</details>

## Question 9: Routing three query types

A team needs their agent's memory to answer: (1) "What's this user's preferred contact method?" (2) "Has this user, in any past session, expressed frustration with slow page loads, however they phrased it?" (3) "Which of this user's projects rely on the same third-party API as their most recently opened one?" Which store pairing is correct?

- **A.** (1) key-value, (2) vector, (3) knowledge graph.
- **B.** (1) knowledge graph, (2) key-value, (3) vector.
- **C.** All three should use one vector store, since it can handle any free-text or structured query with the right prompt.
- **D.** (1) vector, (2) knowledge graph, (3) key-value.

<details><summary>Answer</summary>

**Correct: A.** This is the exact routing exercise in [structured memory stores compared](/learn/context-engineering/structured-memory-stores-compared): query 1 is an exact-key lookup (key-value), query 2 needs to match a sentiment expressed in unknown, varied phrasing (vector, for fuzzy semantic recall), and query 3 is a multi-hop relationship traversal (knowledge graph) that neither a key lookup nor a similarity search can express.

**B** swaps every pairing away from its fit — a single settable value doesn't need graph traversal, and "however they phrased it" is precisely the case an exact-key store can't handle.

**C** repeats the lesson's opening warning: a vector store answers "find things like this" well, but has no native mechanism for "how does X relate to Y" — similarity between embeddings isn't the same as a relationship, so query 3 specifically breaks this approach regardless of prompting.

**D** also mismatches every entry: query 1 needs no fuzzy matching, query 2 needs no graph traversal, and query 3 — a relational question — can't be expressed as a single key-value lookup.

</details>

## Question 10: Two failure directions in a write policy

Two designs for a support agent's memory-write policy: Design A writes every message the user sends to a searchable store, unfiltered. Design B writes only messages that pass an explicit "decision, constraint, or preference" filter. Six months in, which failure is Design A more likely to produce, and which is Design B more likely to produce if its filter is too strict?

- **A.** Design A: repeated questions from the agent. Design B: retrieval noise.
- **B.** Design A: retrieval noise from irrelevant or contradictory entries crowding out real facts. Design B: repeated questions, because a real preference got filtered out and never written.
- **C.** Both designs produce identical failures, since total data volume is the only thing that matters.
- **D.** Design A has no failure mode, since more stored data can only help; Design B is strictly worse by definition.

<details><summary>Answer</summary>

**Correct: B.** This is the two-sided cost named directly in [what to remember, what to forget](/learn/context-engineering/what-to-remember-vs-forget): recording everything, unfiltered, means every future retrieval competes against noise and stale near-duplicates — the "transcript recorder" failure. An overly strict filter on the other side means real preferences never get written at all, so the agent re-asks things a good policy would have captured the first time — the "amnesiac" failure from the opposite direction.

**A** swaps the two directions — unfiltered storage costs you at read time (noise), not by causing fewer answers to exist; an overly strict filter is what causes information to never be written and later get re-asked.

**C** ignores that *what* gets written and how cleanly it's filtered determines which specific failure shows up — volume alone doesn't distinguish a noisy store from a starved one.

**D** restates the exact wrong intuition the lesson corrects: "more recorded is strictly safer" ignores that an unfiltered store degrades every future read by making a genuine fact compete against noise — a real, ongoing cost, not a neutral one.

</details>

## Question 11: Confirmed writes, still "forgotten"

A team ships a memory feature: users can say "remember X" and it's confirmed saved to the database. Weeks later, several users report the assistant "forgot" things it had explicitly confirmed remembering. An audit shows every fact is present and correct in the database. What's the most likely root cause?

- **A.** The database has a bug silently corrupting a fraction of writes.
- **B.** The write path works, but nothing in a new session's context-assembly step actually queries the store and injects the fact back in — a write-only memory system.
- **C.** The facts are stored correctly but have expired due to an overly aggressive TTL.
- **D.** The model is hallucinating that it forgot things it actually still knows.

<details><summary>Answer</summary>

**Correct: B.** This is the mistake named directly in [when compaction drops the thing that mattered](/learn/context-engineering/compaction-that-drops-key-facts) and the round-trip test built in [memory across sessions](/learn/context-engineering/cross-session-memory-architecture): a successful write and a successful future recall are two separate guarantees, and teams commonly build and test only the first. If nothing at session start queries the store for relevant facts, a perfectly-written fact never re-enters context — which looks exactly like forgetting from the user's side.

**A** is directly contradicted by the audit: "every fact is present and correct in the database" already rules out write-side corruption.

**C** is also contradicted by the given evidence — an expired fact wouldn't be "present and correct," it would be gone or flagged as expired, and the scenario states the data is intact.

**D** reverses the mechanism. The model isn't hallucinating a lapse in some internal memory it has — it genuinely has no access to a fact that was simply never retrieved into its context this session. There's nothing to hallucinate about; the fact was never presented to it at all.

</details>

## Question 12: What has to survive this exact compaction

A compaction pass is about to fold this exchange: *"Agent tried three formatting approaches for the report before the user approved one. User: 'Use approach 2, and going forward, always cap reports at 500 words — legal review needs them short.' Agent: confirmed."* Which single piece is most critical to preserve near-verbatim rather than leave to a paraphrased gist, and why?

- **A.** The fact that the agent tried three formatting approaches, since it shows the agent's work.
- **B.** The 500-word cap and its reason ("legal review needs them short"), since it's a standing constraint that will govern every future report, not just this one.
- **C.** The exact wording "confirmed," since tone matters more than content in a compaction summary.
- **D.** Nothing needs to survive verbatim here — a short gist like "formatting was discussed" is sufficient.

<details><summary>Answer</summary>

**Correct: B.** The word cap and its reason are exactly the "decision plus rationale, stated as a standing constraint" category from [summarization for compaction](/learn/context-engineering/summarization-for-compaction-deep) and the extraction discipline shown at real scale in [compacting a 200-step agent run](/learn/context-engineering/compacting-a-long-agent-run) — a fact that will keep mattering on every future turn, not just the one it was stated in, is precisely what a "must survive" list exists to protect.

**A** picks a resolved process detail that's safe to compress hard — once approach 2 was chosen, the path taken to get there (three attempts) stops mattering to any future turn. This is the kind of thing a summary is *supposed* to shrink away.

**C** confuses tone with content. A one-word confirmation carries no information a future turn needs to act correctly — preserving its exact phrasing adds nothing that a paraphrase would lose.

**D** is the exact mistake cataloged in [when compaction drops the thing that mattered](/learn/context-engineering/compaction-that-drops-key-facts): "formatting was discussed" drops both the specific rule (500 words) and its binding reason, and any report generated afterward without that constraint in view is a direct, attributable regression traceable straight back to this one lossy summary.

</details>

**Related:** [Why Compaction Is Unavoidable](/learn/context-engineering/why-compaction-is-necessary), [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction-deep), [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization-explained), [Sliding Window Context Management](/learn/context-engineering/sliding-window-context-management-deep), [Memory vs State](/learn/context-engineering/memory-vs-state-distinction), [Memory Across Sessions](/learn/context-engineering/cross-session-memory-architecture), [Structured Memory Stores](/learn/context-engineering/structured-memory-stores-compared), [Memory and Compaction Cheatsheet](/learn/context-engineering/memory-and-compaction-cheatsheet)
