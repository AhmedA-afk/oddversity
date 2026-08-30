---
title: "The Whole Game of Context Engineering"
track: "context-engineering"
status: live
summary: "One support agent, rebuilt nine times on the same failing conversation, shows where every technique in this track actually earns its place."
duration: "9 min read"
---

Every technique in this track exists to fix a specific way an agent's context goes wrong. The fastest way to see why any of them matter is to watch one small support agent get rebuilt, fix by fix, on the same real conversation — and to see the map before you see the details.

## The big picture

The agent is Aria, a support bot for a fictional SaaS product called Fernway. Its job: read a customer's message, pull whatever it needs from a 40-page knowledge base, a `get_account` tool, and a `get_invoice` tool, and answer correctly. The conversation that keeps breaking it: a customer asks, on turn six of a thread, "wait, so am I actually eligible for a refund on the annual plan or not?"

**v0 — the naive build.** Every turn, the code sends: a 200-token system prompt, the *entire* knowledge base pasted in as one block (roughly 18,000 tokens, illustrative), the full raw conversation history replayed from turn one, the raw JSON from both tools (called once each, but a retried request duplicated the invoice result), and finally the customer's actual question, tacked on at the very end. Total: comfortably under the model's 200k limit — plenty of "room." And it still gets the answer wrong: it quotes a refund window from a plan tier that isn't the customer's, because the one true sentence about annual-plan refunds is buried on page 22 of a wall of policy text, sandwiched between five turns of small talk. This is the whole lesson in miniature: [running out of window was never the failure mode](/learn/context-engineering/why-context-is-the-real-bottleneck) — dilution was.

**v1 — budget it.** Instead of "paste everything, see what fits," Aria's context gets explicit per-segment allocations: a fixed slice for system instructions, a capped slice for retrieved policy, a capped slice for history, a reserve for the model's own answer. See [Context Window Anatomy](/learn/context-engineering/context-window-anatomy) and [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies). This alone doesn't fix the wrong answer, but it makes the 18,000-token KB dump visible as the problem it is, instead of an invisible cost hiding inside "plenty of room."

**v2 — reorder it.** The refund policy sentence that mattered was in the middle of a huge block, and the customer's live question was at the very end after a full history replay — both are exactly the arrangement that makes models most likely to miss or under-weight the one line that matters. Aria's builder starts placing the most decision-relevant fact right before the question, not buried mid-payload. See [Context Ordering and Recency Effects](/learn/context-engineering/context-ordering-and-recency-effects) and [Lost in the Middle](/learn/context-engineering/lost-in-the-middle).

**v3 — stop stuffing, start retrieving.** The 18,000-token KB paste becomes a retrieval call: pull only the two or three passages that actually match "annual plan refund eligibility." See [Retrieval vs Context Stuffing](/learn/context-engineering/retrieval-vs-context-stuffing) and [Just-in-Time Context Loading](/learn/context-engineering/just-in-time-context-loading) — Aria fetches the account and invoice details only once it knows it needs them, not preemptively on every turn.

**v4 — dedupe the tool output.** That duplicated invoice JSON from the retried call was quietly costing tokens and, worse, making the model treat two copies of one fact as if they might be two different facts. A dedup pass on tool results before they enter the payload fixes it. See [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication).

**v5 — compact the history.** By turn six, the full replayed transcript is the single largest line item in the budget, and most of it is small talk. Turns older than a short window get collapsed into a running summary instead of replayed verbatim. See [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction) and [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization).

**v6 — give it memory that outlives the window.** The customer mentioned three tickets ago that they're on the annual plan and already got a partial credit once. That fact shouldn't have to survive by being re-read from a shrinking history window — it belongs in a durable record the agent looks up, not a fact hoping to avoid being summarized away. See [Conversation Memory and State](/learn/context-engineering/conversation-memory-and-state) and [Structured Memory Stores](/learn/context-engineering/structured-memory-stores).

**v7 — cache the stable part.** The system prompt and tool schemas are identical on every single call, yet v0 through v6 all re-sent and re-processed them from scratch every turn. Ordering the payload so that stable prefix comes first, unchanged, lets the provider cache it. See [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design).

**v8 — hand off, don't forward everything.** When the question is genuinely a billing edge case, Aria escalates to a specialist billing agent — and sends it a compact, purpose-built payload (customer, plan, the one disputed fact) instead of the entire nine-turn transcript. See [Context Handoff Between Agents](/learn/context-engineering/context-handoff-between-agents).

**v9 — measure it, don't guess.** None of v1 through v8 is provably better without instrumenting what's actually in the window on real traffic and testing whether each change moved the needle. See [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting) and [Context Window Testing and Eval](/learn/context-engineering/context-window-testing-and-eval).

By v9, Aria's payload on turn six is a fraction of v0's size, costs less, answers correctly, and — critically — degrades gracefully as conversations get longer instead of accumulating cruft turn after turn. That resistance to accumulation is worth naming directly: unmanaged growth is what [context rot](/learn/context-engineering/context-rot) looks like in the wild, and it's the failure mode every fix above is quietly defending against.

## What trips people up

| Idea | Confusion | Where to learn it |
|---|---|---|
| "We have a 200k window, we're fine" | Confusing headroom with quality — v0 fit easily and was still wrong | [Why Context Is the Real Bottleneck](/learn/context-engineering/why-context-is-the-real-bottleneck) |
| "Just paste the whole doc, the model will find the part it needs" | Assuming retrieval-by-attention is as reliable as retrieval-by-search | [Retrieval vs Context Stuffing](/learn/context-engineering/retrieval-vs-context-stuffing) |
| "The conversation remembers what we discussed" | The model has no memory between calls — your code reconstructs everything, every turn | [The Stateless Model Behind the Stateful Agent](/learn/context-engineering/stateless-model-stateful-agent) |
| "Tool results are just data, not really 'context'" | Tool JSON counts against the same budget as everything else and can dominate it | [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication) |
| "It worked in the demo" | A three-turn demo never shows what turn twenty looks like without compaction or memory | [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction) |

## A reading path

1. Finish this module — it's the vocabulary everything below assumes: [Why Context Is the Real Bottleneck](/learn/context-engineering/why-context-is-the-real-bottleneck), [Context Window Anatomy](/learn/context-engineering/context-window-anatomy), [The Context Engineering Vocabulary](/learn/context-engineering/context-engineering-vocabulary).
2. Budgeting and observability — turning v1 and v9 into a repeatable habit, not a one-off: [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies), [what-a-token-budget-is](/learn/context-engineering/what-a-token-budget-is).
3. Selection and ordering — the discipline behind v2: [Lost in the Middle](/learn/context-engineering/lost-in-the-middle), [lost-in-the-middle-explained](/learn/context-engineering/lost-in-the-middle-explained).
4. Retrieval and JIT loading — v3 in full: [stuffing-vs-retrieval-decision](/learn/context-engineering/stuffing-vs-retrieval-decision), [just-in-time-context-loading-pattern](/learn/context-engineering/just-in-time-context-loading-pattern).
5. Compaction and memory — v5 and v6: [why-compaction-is-necessary](/learn/context-engineering/why-compaction-is-necessary), [memory-vs-state-distinction](/learn/context-engineering/memory-vs-state-distinction).
6. Failure modes and testing — what v9 is guarding against: [context-rot-explained](/learn/context-engineering/context-rot-explained).
7. Tools and caching — v4 and v7: [prompt-caching-mechanics](/learn/context-engineering/prompt-caching-mechanics).
8. Multi-agent and the capstone — v8, and building one of these end to end: [multi-agent-context-problem](/learn/context-engineering/multi-agent-context-problem), [build-a-budgeted-context-managed-agent](/learn/context-engineering/build-a-budgeted-context-managed-agent).

**Related:** [Why Context Is the Real Bottleneck](/learn/context-engineering/why-context-is-the-real-bottleneck) · [Context Window Anatomy](/learn/context-engineering/context-window-anatomy) · [Context Engineering Vocabulary](/learn/context-engineering/context-engineering-vocabulary) · [Dissecting a Live Context Payload](/learn/context-engineering/dissecting-a-live-context-payload)
