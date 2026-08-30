---
title: "Pass Pointers, Not Payloads"
track: "context-engineering"
status: live
summary: "Pass an ID the model can dereference instead of inlining the megabyte it points to — the habit every handoff and tool result depends on."
duration: "6 min read"
---

The single most avoidable way to blow a context budget is passing the actual content around when a short reference to it would have done the same job.

## The analogy

A pointer in a programming language doesn't hold a value — it holds an address, a small fixed-size thing that says "the real data lives over there." Passing a pointer between functions is cheap regardless of how large the underlying data is: a function that receives a pointer to a 500-megabyte array pays the cost of one machine word, not 500 megabytes, and only pays the larger cost if and when it actually dereferences the pointer to read what's behind it.

Passing by value does the opposite: it copies the actual data at the moment of the call, whether or not the receiving function ever looks at more than the first byte of it.

Context engineering has the exact same fork, and it shows up constantly in agent design. A plan step, a tool result, or a handoff between two agents can either carry the *thing itself* — the full report, the whole file, the entire search result set — or it can carry a *reference to where the thing lives* — an ID, a path, a URL — that whatever receives it can dereference only if and when it actually needs the content.

## Walk it through, step by step

Say a planning agent produces a three-step plan after running an analysis that generates a 40,000-token report.

**Pass-by-value version:** step 2 of the plan reads: *"Using the following report, draft an executive summary: [full 40,000-token report pasted inline]."* Every downstream agent, every retry of step 2, and the plan object itself now carries that report's full weight. If step 2 fails and gets retried, the report gets reprocessed in full again. If a third agent later needs to check something in step 2's reasoning, the report is duplicated a second time in *its* context too.

**Pass-by-pointer version:** step 2 reads: *"Using the report at `artifact://report/3`, draft an executive summary."* The plan itself stays a few dozen tokens regardless of how large the report is. The agent executing step 2 dereferences the pointer — fetches `artifact://report/3` — only at the moment it actually needs the content, and only once. A retry re-fetches the same small pointer and gets the same content back; nothing about the plan's own size changed because the report grew.

**Now scale it up.** Imagine five plan steps, three of which reference the same report, one of which references a different large dataset, and one of which references nothing external at all. Pass-by-value would inline three copies of the same 40,000-token report across three steps — 120,000 tokens of pure duplication before a single new idea is added. Pass-by-pointer keeps all five steps small; the report exists once, wherever it actually lives, and gets dereferenced independently by whichever step needs it, exactly the number of times it's needed.

## The wrong intuition, corrected

The tempting wrong belief is: *inlining the content is safer, because then nothing can go missing.* It feels more robust to hand over the actual data rather than a reference that depends on the referenced thing still being retrievable later. But this trades a rare failure (a dangling reference, a store that's unavailable) for a certain, recurring cost (every inline copy paid in full, every single time, whether or not it's used) — and the certain cost is usually far larger in aggregate than the rare one. The right fix for a dangling-reference risk is making the reference store reliable, not abandoning references altogether.

The second wrong belief: *a pointer is just a shorter way of saying the same thing, so it doesn't change behavior.* It changes behavior a lot — it changes *when* the cost gets paid. Pass-by-value pays the token cost of the full content at construction time, unconditionally. Pass-by-pointer defers that cost to the moment of actual use, and skips it entirely for a path that never dereferences the pointer at all — the retry that fails before reaching step 2, the agent that never needed the dataset after all. That deferral is the entire benefit, not an incidental side effect.

## When the analogy breaks

A machine pointer dereferences instantly and for free, in the same address space, with no possibility of the address meaning something different by the time you read it. A context pointer — `artifact://report/3`, a file path, a ticket ID — dereferences through a fetch, which costs a round-trip and can fail: the artifact was deleted, the path moved, permissions changed. Unlike a memory pointer, staleness is a real risk worth designing for — a pointer that resolves to a *different* version of the content than the one the plan was reasoned about against is worse than an inline copy, because it looks correct while being wrong. Any system built on this pattern needs either immutable references (an artifact ID that always resolves to the exact same content) or an explicit versioning scheme, so that dereferencing later gets you what the plan actually reasoned about.

This is also the exact mechanism [Context Handoff Between Agents](/learn/context-engineering/context-handoff-between-agents) depends on: a handoff that passes pointers instead of full payloads is what keeps a multi-agent pipeline's total context cost from multiplying by the number of agents in the chain. And it's the same discipline [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern) builds an entire loading strategy around — a pointer is only useful if something on the receiving end knows how, and when, to dereference it.

**Related:** [Context Handoff Between Agents](/learn/context-engineering/context-handoff-between-agents) · [The Just-in-Time Loading Pattern](/learn/context-engineering/just-in-time-context-loading-pattern) · [Just-in-Time Context Loading](/learn/context-engineering/just-in-time-context-loading) · [Building a Just-in-Time Loader](/learn/context-engineering/building-a-jit-loader) · [Handoff Payload Design](/learn/context-engineering/handoff-payload-design)
