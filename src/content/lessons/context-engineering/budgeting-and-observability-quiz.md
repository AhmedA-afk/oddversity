---
title: "Budgeting and Observability Quiz"
track: "context-engineering"
status: live
summary: "Twelve questions on allocation strategies, the tradeoff curve, headroom, and reading a token ledger — with a reallocation scenario."
duration: "10 min read"
---

Twelve questions covering everything from this module: what a budget actually is, the cost/latency/quality curve, why headroom comes first, reading a token ledger, and one full scenario where you have to reallocate a budget yourself.

**1. What distinguishes an actual token budget from telling a model "please be concise"?**

A) It uses more polite phrasing in the system prompt
B) It's an explicit, enforced cap and allocation across segments, checked in code before the request goes out
C) It only ever applies to the model's reply, never the input
D) It's a documentation practice with no effect on the running system

<details><summary>Answer</summary>

**Correct: B.** A budget is enforceable because code checks it, not because the model was asked nicely.

- A: Phrasing doesn't constrain anything at runtime — see [What a Token Budget Actually Is](/learn/context-engineering/what-a-token-budget-is).
- B: Correct — enforcement in code is the entire distinction.
- C: A real budget covers every segment competing for the window, input included — see [What a Token Budget Actually Is](/learn/context-engineering/what-a-token-budget-is).
- D: A budget nobody enforces is exactly as reliable as asking for concision — see [What a Token Budget Actually Is](/learn/context-engineering/what-a-token-budget-is).

</details>

**2. Aria's 12,000-token budget needs retrieval to grow from 3,800 to 5,300 tokens for a fact-heavy question, and reply headroom must stay fixed. Where do those extra 1,500 tokens come from?**

A) Nowhere — they're simply added on top since the window still has some room
B) From the system prompt, since it's the least important segment
C) From another segment whose cap shrinks by the same amount — most sensibly, conversation history
D) From reducing tool definitions to zero for this call

<details><summary>Answer</summary>

**Correct: C.** The window is zero-sum — a slice can only grow if another shrinks.

- A: There's no "some room" that isn't already accounted for in the total — see [Budget as a Zero-Sum Pie](/learn/context-engineering/the-budget-allocation-mental-model).
- B: System prompt is small and fixed for a reason; shrinking it doesn't yield anywhere near 1,500 tokens and breaks its own purpose.
- C: Correct — history is the segment this specific reallocation is designed to shrink, per [Reallocating the Budget on the Fly](/learn/context-engineering/dynamic-budget-reallocation).
- D: Zeroing tool definitions disables tool calling — not a lever this reallocation should touch.

</details>

**3. On an illustrative cost/latency/quality curve where quality goes 61 → 78 → 81 → 74 at 2k, 8k, 32k, and 100k tokens while cost and latency keep climbing throughout, where's the sensible operating point?**

A) At 100,000 tokens, since more context is always the safer choice
B) At 2,000 tokens, to minimize cost regardless of quality
C) Somewhere between 8,000 and 32,000 tokens, where quality gains flatten before cost keeps rising
D) At the model's absolute maximum context window, whatever that is

<details><summary>Answer</summary>

**Correct: C.** That's the knee of the curve — the point past which more tokens cost more without buying more quality.

- A: 100k tokens is where quality actually *fell* in this example while cost kept climbing — the opposite of safe. See [The Cost, Latency, and Quality Curve](/learn/context-engineering/cost-latency-quality-tradeoff-curve).
- B: 2k tokens leaves real quality on the table (61 vs. 78+) — minimizing cost alone ignores the tradeoff.
- C: Correct — the knee, not the extremes.
- D: The maximum window is a ceiling, not a target operating point — see [The Cost, Latency, and Quality Curve](/learn/context-engineering/cost-latency-quality-tradeoff-curve).

</details>

**4. Why should reply headroom be reserved before any other segment is sized, instead of being whatever's left over?**

A) Because the reply is always the largest segment in the budget
B) Because output tokens are billed differently than input tokens
C) Because segments sized first will otherwise crowd out the reply exactly on the turns that need the longest, most complete answer
D) Because reply headroom doesn't count against the context window at all

<details><summary>Answer</summary>

**Correct: C.** Sizing everything else first means the reply gets squeezed hardest precisely when the other segments (retrieval, history) were biggest — usually the turns that most need a full answer.

- A: The reply isn't necessarily the largest segment; that's not why ordering matters.
- B: Output pricing is real but unrelated to why headroom must be reserved *first* in the allocation order.
- C: Correct — see [Budgeting Mistakes That Bite Later](/learn/context-engineering/budgeting-common-mistakes) and [Budget as a Zero-Sum Pie](/learn/context-engineering/the-budget-allocation-mental-model).
- D: Reply headroom absolutely counts against the window — that's exactly why it needs a reservation.

</details>

**5. In a per-turn ledger, `cached` tokens stay flat at 1,150 for three turns straight while `billed_in` nearly doubles each turn and `tokens_out` barely changes. What does this most likely indicate?**

A) The provider's caching feature is broken and should be disabled
B) Something is being resent in full every turn instead of referenced, which changes the prompt enough that nothing past the stable prefix is cachable
C) The model is ignoring all prior conversation turns
D) The ledger's math is wrong, since tokens_out should rise whenever billed_in does

<details><summary>Answer</summary>

**Correct: B.** A flat cache count next to climbing input tokens is the signature of content being duplicated into the prompt fresh each turn.

- A: The cache isn't broken — it's doing exactly what it should given a prompt that keeps changing past the prefix. See [A Per-Turn Token Ledger](/learn/context-engineering/token-accounting-per-turn-ledger).
- B: Correct — the classic runaway-resend pattern, fixed with [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication).
- C: Nothing in this data says the model is ignoring history — the tokens are present and billed, just not cached.
- D: Output length and input length are independent; there's no reason they must move together.

</details>

**6. A team budgets retrieval using "roughly 4 characters per token." After retrieved chunks became mostly code snippets, requests started failing over the real token cap despite still fitting the old character-based budget. What's the fix?**

A) Raise the assumed characters-per-token ratio to 5 and move on
B) Measure tokens directly with the actual tokenizer instead of approximating from character count
C) Truncate every chunk to a fixed character length regardless of its content
D) Switch to a model with a larger advertised context window

<details><summary>Answer</summary>

**Correct: B.** Character-to-token ratios shift with content type — code in particular breaks the "4 characters per token" heuristic.

- A: A different fixed ratio has the same flaw — it'll break again the next time content type shifts. See [Tokens Are Not Words](/learn/context-engineering/tokens-are-not-words).
- B: Correct — see [Budgeting Mistakes That Bite Later](/learn/context-engineering/budgeting-common-mistakes).
- C: Fixed character truncation doesn't fix the measurement problem, and risks cutting mid-structure.
- D: A bigger window doesn't fix a broken measurement — the same ratio error just fails later instead of never.

</details>

**7. A support agent's budget accounts for system prompt, retrieval, and history, but keeps running over cap after new tools get added over time. What's missing?**

A) A larger total context window
B) An explicit, measured cap for tool definitions as their own segment
C) A cap on how long the user's message can be
D) A policy against ever adding new tools

<details><summary>Answer</summary>

**Correct: B.** Tool schemas are sent on every call and need their own line item, not an assumption they're negligible.

- A: A bigger window doesn't fix an unbudgeted, unmeasured segment — it just delays the same problem.
- B: Correct — see [Context Window Anatomy](/learn/context-engineering/context-window-anatomy) and [Measuring What Fills the Window](/learn/context-engineering/measuring-what-fills-the-window).
- C: The user's message isn't the segment quietly growing here — tool definitions are.
- D: Freezing the toolset avoids the symptom without fixing the missing budget line; [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure) is the actual fix that still allows growth.

</details>

**8. A retrieved tool result gets trimmed by cutting at a fixed token count, landing partway through a JSON object. What's the likely downstream consequence?**

A) Nothing — models always detect truncated JSON and request more context automatically
B) A parser error, or the model "completing" the cut-off object with an invented, plausible-looking close
C) The request is automatically retried with a larger budget
D) The provider rejects the request before it's ever sent

<details><summary>Answer</summary>

**Correct: B.** Blind truncation doesn't respect structure, and the model has no way to know the object was cut rather than genuinely ending there.

- A: There's no such automatic detection — the model has to work with whatever text it's given.
- B: Correct — see [Budgeting Mistakes That Bite Later](/learn/context-engineering/budgeting-common-mistakes) and [Structured Context Injection](/learn/context-engineering/structured-context-injection).
- C: Nothing about a malformed JSON fragment triggers an automatic retry on its own.
- D: The request is well-formed at the API level even if the JSON *inside* one segment is broken — the provider has no reason to reject it.

</details>

**9. Under a fixed-cap allocation strategy, when retrieval returns more tokens than its cap allows, what typically gets dropped?**

A) The oldest turns in conversation history
B) The lowest-ranked retrieved chunks, regardless of what this specific query actually needed
C) The system prompt
D) The user's current message

<details><summary>Answer</summary>

**Correct: B.** Fixed caps trim within the segment that's over budget, by rank — they don't reach into other segments.

- A: History isn't touched by a fixed retrieval cap — that reallocation is a priority-based move, not a fixed-cap one.
- B: Correct — see [Fixed, Proportional, and Priority Budgets](/learn/context-engineering/budgeting-strategies-compared) and [Setting Per-Segment Budgets](/learn/context-engineering/setting-per-segment-budgets).
- C: System prompt is a separate, fixed segment untouched by retrieval overflow.
- D: The current user message isn't part of the retrieval segment being trimmed.

</details>

**10. What's the main risk specific to priority-based (dynamic) budget reallocation that fixed or proportional caps don't share?**

A) It can't be used with a larger context window
B) It uses more total tokens than fixed caps for the same conversation
C) A misclassified query causes the wrong segment to be shrunk — a confident-looking decision that's simply wrong
D) It requires no engineering effort to build

<details><summary>Answer</summary>

**Correct: C.** Priority-based allocation depends on a classifier being right; when it's wrong, it looks deliberate rather than obviously broken.

- A: Priority-based allocation works with any window size — that's not its distinguishing risk.
- B: Reallocation shifts tokens between segments within the same total; it doesn't inherently use more.
- C: Correct — see [Reallocating the Budget on the Fly](/learn/context-engineering/dynamic-budget-reallocation) and [Fixed, Proportional, and Priority Budgets](/learn/context-engineering/budgeting-strategies-compared).
- D: It's the highest-engineering-cost strategy of the four compared, not the lowest.

</details>

**11. An agent's history grows roughly 205 tokens per turn against a 4,500-token cap with no compaction wired in. Around which turn does it hit the hard cap, and what fixes it?**

A) Turn 10; the fix is lowering the system prompt's cap
B) Turn 22; the fix is triggering compaction well before the cap — for example, at ~85% of it
C) It never hits the cap, because history always stays small on its own
D) Turn 50; the fix is switching to a different model provider

<details><summary>Answer</summary>

**Correct: B.** `4,500 / 205 ≈ 21.95`, rounding up to turn 22 — and the fix is triggering compaction on a percentage of the cap, well before that turn arrives.

- A: The system prompt is unrelated to history's growth — lowering it doesn't address the actual cap being approached.
- B: Correct — see [Budgeting for a Conversation That Grows](/learn/context-engineering/budgeting-for-multi-turn-growth) and [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction).
- C: Unmanaged history grows every turn by construction in this scenario — it doesn't self-limit.
- D: Turn 50 is well past where the unmanaged cap is actually breached, and a provider switch doesn't address the missing compaction trigger.

</details>

**12. Aria's default split is system 700, tools 1,000, reply 2,000 (all fixed), retrieval 3,800, history 4,500 — a 12,000-token total. A cheap classifier flags an incoming question as fact-heavy, and the reallocation policy shifts 1,500 tokens from history to retrieval. What are the new caps, and what must stay untouched?**

A) Retrieval 5,300 / History 3,000; system, tools, and reply headroom stay fixed
B) Retrieval 3,800 / History 4,500; nothing changes, since totals must stay identical
C) Retrieval 6,800 / History 4,500; tool definitions should shrink to make room instead
D) Retrieval 5,300 / History 4,500; the total budget grows by 1,500 tokens to absorb the shift

<details><summary>Answer</summary>

**Correct: A.** 3,800 + 1,500 = 5,300 for retrieval; 4,500 − 1,500 = 3,000 for history; the fixed segments — including reply headroom — are exactly the ones a reallocation policy should never touch.

- A: Correct — see [Reallocating the Budget on the Fly](/learn/context-engineering/dynamic-budget-reallocation).
- B: This describes not reallocating at all, which contradicts the scenario.
- C: The arithmetic is wrong (3,800 + 1,500 is 5,300, not 6,800), and tool definitions were never the intended source of the shift.
- D: The total budget is fixed — see [Budget as a Zero-Sum Pie](/learn/context-engineering/the-budget-allocation-mental-model); growing it isn't reallocation, it's a different decision entirely.

</details>

**Related:** [What a Token Budget Actually Is](/learn/context-engineering/what-a-token-budget-is), [Fixed, Proportional, and Priority Budgets](/learn/context-engineering/budgeting-strategies-compared), [Token Budget Cheatsheet](/learn/context-engineering/token-budget-cheatsheet), [Budgeting Mistakes That Bite Later](/learn/context-engineering/budgeting-common-mistakes)
