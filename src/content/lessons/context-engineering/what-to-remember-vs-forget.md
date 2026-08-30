---
title: "What to Remember, What to Forget"
track: "context-engineering"
status: live
summary: "A memory write policy is a filter applied once, at write time - not a search problem you can defer and solve later with a bigger index."
duration: "6 min read"
---

Two people leave the same meeting. One took notes: three decisions, two action items, one open question, half a page. The other recorded the whole thing and has ninety minutes of audio. A month later, someone asks "what did we decide about the vendor?" The note-taker answers in five seconds. The recorder technically has the answer somewhere in ninety minutes of audio — but finding it costs more than not having recorded at all would have. That's the entire judgment call behind a memory write policy.

## The analogy

A good note-taker isn't transcribing — they're filtering, live, as the meeting happens. A decision gets written down. A joke doesn't. A tangent about someone's commute doesn't. A number that matters gets written down with enough context to still make sense next week ("deadline moved to March, per finance" — not just "March"). The note-taker is making dozens of small in/out judgments per meeting, and the value of the resulting page comes almost entirely from what got left out, not just what got kept.

A transcript recorder makes none of those judgments. It captures everything, faithfully, and defers every filtering decision to whoever reads it later — which sounds safer ("nothing is lost!") but actually just moves the same work to a worse moment: after the fact, without the meeting's live context for what mattered, searching a much larger haystack under time pressure.

## Walking it through

Picture the meeting itself. Early on, someone says: "the deadline is looking like February." Twenty minutes later, after more discussion: "actually, let's push it to March — gives QA more room." Then someone says: "let's grab lunch after this."

The note-taker's live filter: "February" gets written down as the current deadline. Twenty minutes later, "March" replaces it — the note-taker crosses out February and writes March, because a competent note-taker knows a revision supersedes what it revises. "Let's grab lunch" never makes it onto the page at all. The final note says, cleanly: *deadline: March*.

The recorder's transcript has both "February" and "March," in that order, exactly as spoken, along with the lunch comment. A month later, someone searching the transcript for "deadline" gets two contradictory hits and has to reconstruct, from context and timestamps, which one is current — the identical synthesis work the note-taker already did, live, for free, at the moment it was cheapest to do.

## The wrong intuition to correct

The tempting belief is: recording everything is strictly safer, because you can always search it later and nothing is ever truly lost. This undersells the actual cost in two ways. First, it's not just slower — a query against an unfiltered store returns *whatever's* semantically or lexically close, which means a genuinely current fact now has to compete at read time against outdated near-duplicates that were never retired. That's retrieval noise, and it degrades quality on every future read, not just the occasional one where staleness happens to matter. Second, "nothing is lost" implies safety, but a stale fact retrieved with the same confidence as a fresh one isn't a safety net — it's a hazard, the same failure covered in [memory across sessions](/learn/context-engineering/cross-session-memory-architecture): a confidently wrong fact is worse than an honestly absent one, because nothing signals to the reader (or the model) that it needs double-checking.

The correct model: a write policy is a filter you apply once, at write time, when you have the most context about what actually mattered. Every fact you let through that filter is a small ongoing promise — that you'll notice when it's superseded, retire it when it goes stale, and not let it silently accumulate alongside contradictory versions of itself. Recording everything looks like avoiding that promise. It actually just breaks the promise by default, for every fact, all at once.

## When the analogy breaks

A human note-taker makes their filtering judgment once, synchronously, with full social context for what was actually a decision versus a throwaway remark — and can ask "wait, was that a real commitment?" in the room if unsure. A machine memory-write pass has none of that. It runs after the fact, usually with no chance to clarify, and it can fail in ways a present, attentive human rarely does: missing a decision because it was phrased indirectly, or over-promoting a passing remark because it happened to read as decision-shaped. That's why an automated write policy needs an explicit rule set rather than trusted judgment — the survival categories from [summarization for compaction](/learn/context-engineering/summarization-for-compaction-deep) (decisions, constraints, open threads) as the "write this down" list, plus the confidence threshold from [memory across sessions](/learn/context-engineering/cross-session-memory-architecture) before an *inferred* pattern (not an explicit statement) gets promoted to a durable fact at all. When a machine write pass is genuinely uncertain whether something clears the bar, the safer default is flagging it for confirmation rather than silently guessing in either direction — silently keeping everything reproduces the recorder's problem, and silently dropping anything ambiguous risks losing a real decision the same way [compaction can drop the thing that mattered](/learn/context-engineering/compaction-that-drops-key-facts).

The analogy also assumes a fixed, short time horizon — a meeting's notes matter for as long as the project they're about, and then quietly stop mattering. Cross-session memory doesn't get that natural expiry for free: a preference or decision captured six months ago can still be sitting in the store, read back with full confidence, long after it's stopped being true. Meeting notes rarely need a staleness policy because the meeting itself ages out of relevance; a durable memory store has to build that aging in on purpose, which is exactly the expiry and correction machinery [memory across sessions](/learn/context-engineering/cross-session-memory-architecture) covers and this analogy, on its own, doesn't capture.

**Related:** [Memory Across Sessions](/learn/context-engineering/cross-session-memory-architecture), [Memory vs State](/learn/context-engineering/memory-vs-state-distinction), [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction-deep), [When Compaction Drops the Thing That Mattered](/learn/context-engineering/compaction-that-drops-key-facts)
