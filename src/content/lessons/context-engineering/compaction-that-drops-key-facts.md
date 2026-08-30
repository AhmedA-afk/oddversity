---
title: "When Compaction Drops the Thing That Mattered"
track: "context-engineering"
status: live
summary: "Five ways a compaction or memory system quietly loses the one fact that mattered, and the guard that catches each one before a user does."
duration: "8 min read"
---

Every mistake in this lesson produces a system that looks like it's working. The summary reads fine. The window slides smoothly. The memory store accepts the write without complaint. The failure only shows up later, as a regression nobody connects back to a compaction pass that ran turns ago — which is exactly what makes these worth cataloging.

### The mistake: summarizing without a must-survive list

An abstractive summarizer told to "summarize the conversation concisely" optimizes for exactly that — the shortest faithful-sounding gist — with no signal that one sentence buried in turn 4 was a binding constraint and the rest was small talk.

**Why it's wrong:** compression and importance are different axes. A summarizer minimizing length has no reason to spend extra words preserving "use Postgres, not Mongo — we need transactional guarantees" over "the team discussed database options," because both are equally faithful summaries of *that the discussion happened*. Only one of them preserves what the discussion concluded.

**Symptom:** the agent proposes or does something that directly contradicts an earlier explicit instruction, several turns after that instruction rolled out of the raw window and got folded into vague prose — the exact regression walked through in [summarization for compaction](/learn/context-engineering/summarization-for-compaction-deep).

**Fix:** give the summarization prompt an explicit must-survive checklist — decisions and their rationale, stated constraints, open threads — and treat those as near-verbatim extracted facts appended to the summary, not prose left to a paraphrase. The `DECISION:` tagging pattern in [building a rolling summarizer](/learn/context-engineering/building-a-rolling-summarizer) is the concrete version of this discipline.

### The mistake: a pure sliding window with no persistent head

A plain FIFO window evicts turn 1 exactly as unceremoniously as it would evict small talk, because a FIFO has no concept of importance at all — only age.

**Why it's wrong:** eviction-by-age treats "how long ago was this said" as the only variable, when the variable that actually matters is "does this still apply." A standing instruction stated once at the start of a session is exactly the kind of thing that's old by turn count and still fully in effect.

**Symptom:** a user restates the same standing instruction more than once in a single long session, because it keeps "wearing off" past a certain turn count — the failure walked through concretely in [sliding window context management](/learn/context-engineering/sliding-window-context-management-deep).

**Fix:** pin standing constraints into a persistent head that sits outside the window's rotation, updated as turns roll out but never itself evicted — the `WindowWithHead` pattern built in that same lesson.

### The mistake: memory writes that never get read back

A team builds the write side of cross-session memory — extraction, promotion, storage — ships it, and calls the memory system done, without building or testing the retrieval path that's supposed to surface a fact in a *later, different* session.

**Why it's wrong:** a write and a successful future recall are two separate guarantees. Confirming a row landed in the database confirms the write path works. It says nothing about whether any later session's context-assembly step actually queries for that fact, with a query shape that matches how it was stored.

**Symptom:** a user explicitly says "remember that I prefer X," the fact is demonstrably sitting in the store, and the assistant asks the identical question again next session — because nothing at session start calls a lookup for it, or the lookup key doesn't match how the fact was written.

**Fix:** test the round trip, not just the write. Write a fact in a simulated session A, start a fresh simulated session B, and assert the fact is actually present in session B's assembled context — the re-entry verification described in [memory across sessions](/learn/context-engineering/cross-session-memory-architecture). "Wrote successfully" and "will be recalled" are different claims and need different tests.

### The mistake: flattening a summary instead of layering it

A long-running session keeps folding new turns into one growing summary, and every time that summary itself gets too big, it's re-summarized — the whole thing, again, from its own already-compressed text.

**Why it's wrong:** each re-summarization pass is a fresh compression of text that's already been compressed once. A fact that survived the first pass intact has no special protection against being smoothed away on the second or third pass — repeated compression compounds loss precisely because nothing marks "already condensed, be careful with this" versus "still raw, safe to compress harder."

**Symptom:** a decision from very early in a very long session — one that was captured correctly the first time it was summarized — has become vague or vanished several compaction cycles later, even though nothing about that specific fact changed.

**Fix:** move to a layered structure once a session is long enough to need more than one compaction pass — [hierarchical summarization](/learn/context-engineering/hierarchical-summarization-explained)'s rule that each fact gets compressed exactly once, on its way up to the next layer, rather than being re-flattened into a single shrinking blob every time the conversation grows.

### The mistake: compacting across an incomplete tool-call pair

Many chat APIs require a tool-call block to be immediately followed by its matching tool-result block. A compaction pass that folds the call into a summary while its result stays in the raw window — or the reverse — produces a transcript that's structurally broken, not just lossy.

**Why it's wrong:** compaction boundaries are usually chosen by turn count or token count, neither of which knows anything about pairing constraints inside a turn. A boundary drawn between a tool call and its result isn't a smaller version of the conversation, it's an invalid one.

**Symptom:** an intermittent API validation error that shows up right around when compaction fires, or — worse, because it fails silently — a case where the model, faced with a dangling call and no visible result, states a plausible-sounding result it never actually received.

**Fix:** only ever cut a compaction boundary between complete turns — a full call-and-result pair, never inside one — the same rule flagged in the hardening notes of [building a rolling summarizer](/learn/context-engineering/building-a-rolling-summarizer).

## Pre-flight checklist

- [ ] The summarization prompt has an explicit must-survive list — decisions and rationale, constraints, open threads — not just an instruction to "summarize concisely."
- [ ] Any sliding window has a persistent head (or equivalent) so standing constraints outlive their eviction from the raw window.
- [ ] A written memory fact has a verified round trip: written in one simulated session, confirmed present in a later, separate session's assembled context.
- [ ] Long sessions use layered summarization once more than one compaction pass is likely, instead of repeatedly re-flattening a single growing summary.
- [ ] Compaction boundaries fall only between complete turns, never inside a tool-call/tool-result pair.
- [ ] A decision-preservation test exists in CI: seed a known constraint early, force enough compaction cycles to guarantee it would have rolled off unprotected, and assert it's still recoverable from context.

**Related:** [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction-deep), [Sliding Window Context Management](/learn/context-engineering/sliding-window-context-management-deep), [Hierarchical Summarization](/learn/context-engineering/hierarchical-summarization-explained), [Memory Across Sessions](/learn/context-engineering/cross-session-memory-architecture), [Building a Rolling Summarizer](/learn/context-engineering/building-a-rolling-summarizer)
