---
title: "Five Ways Beginners Blow the Window"
track: "context-engineering"
status: live
summary: "Dumping whole files, stale history, duplicated chunks, unbounded tool output, and buried instructions — five patterns, one fix each."
duration: "6 min read"
---

These five show up in almost every first real agent build, across every task, and every one of them has a symptom specific enough to spot before it ships.

### The mistake: dumping whole files or documents "to be safe"

**Why it's wrong.** Pasting an entire document when the task only needs one section feels safer than filtering — nothing gets missed. But every irrelevant token in that dump still competes for attention against the part that actually matters, and past a point the noise makes the model less likely to weight the right passage correctly, not just more expensive to run. See [Why Context Is the Real Bottleneck](/learn/context-engineering/why-context-is-the-real-bottleneck).

**Symptom.** The model answers using the wrong section of a long document, or blends two unrelated sections together, even though the correct passage was technically present somewhere in the payload.

**Fix.** Retrieve the specific passage the task needs instead of pasting the whole source — see [Retrieval vs Context Stuffing](/learn/context-engineering/retrieval-vs-context-stuffing), covered in full in the retrieval module of this track.

### The mistake: carrying stale history forever

**Why it's wrong.** Every naive multi-turn implementation replays the full conversation on every call, because [the model itself retains nothing between calls](/learn/context-engineering/stateless-model-stateful-agent). Without a deliberate cutoff, a resolved sub-topic from turn three is still sitting in the payload at turn thirty, taking up space and diluting attention on content that no longer matters.

**Symptom.** Response quality or relevance quietly degrades as a conversation gets longer, even though nothing about the current question changed — a hallmark of accumulated, unmanaged history rather than any single bad turn.

**Fix.** Compact or drop resolved sub-threads instead of replaying everything verbatim forever — see [Summarization for Compaction](/learn/context-engineering/summarization-for-compaction), covered in the compaction and memory module.

### The mistake: duplicated retrieved chunks

**Why it's wrong.** Retrieval pipelines with overlapping chunk boundaries, or a retry that re-runs a fetch without checking whether the result already exists in the payload, both produce the same failure: the identical or near-identical passage appears twice. This costs tokens for zero new information, and can make the model treat one fact as if it were two independently-corroborated ones.

**Symptom.** The same sentence or fact appears twice in what's sent to the model, usually traceable to overlapping chunk windows in a retrieval step or an un-deduplicated retry.

**Fix.** Deduplicate retrieved and fetched content before it enters the payload, by content hash or near-duplicate check — see [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication), covered in the tools and caching module.

### The mistake: unbounded tool output

**Why it's wrong.** A tool call can return far more than the task needs — a full API response with forty fields when three matter, a whole file when one function is relevant — and nothing about calling a tool naturally caps what comes back. Left unchecked, this is often the single largest, least-audited segment in the entire payload, as shown concretely in [Dissecting a Live Context Payload](/learn/context-engineering/dissecting-a-live-context-payload).

**Symptom.** One tool call's raw result dwarfs every other segment in the request when you actually measure it — frequently the first surprise anyone finds the first time they run a real token breakdown.

**Fix.** Filter or project tool output down to what the task needs before it enters context, and cap how much of it — expand on demand rather than by default. See [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure), covered in the retrieval and JIT-loading module.

### The mistake: instructions buried mid-window

**Why it's wrong.** An instruction placed in the middle of a long payload — sandwiched between retrieved documents and history — has to compete for attention the same way any other content does, and models are measurably less reliable at picking up and applying content from the middle of a long context than content near the start or the end. See [Lost in the Middle](/learn/context-engineering/lost-in-the-middle).

**Symptom.** A clear, unambiguous instruction gets partially followed or dropped entirely, even though it's present, word for word, somewhere in the request — the instruction wasn't ignored, it was outcompeted by its position.

**Fix.** Place load-bearing instructions at the very start or, especially, right before the current question at the end — not floating in the middle of a large block. See [Context Ordering and Recency Effects](/learn/context-engineering/context-ordering-and-recency-effects), covered in the selection and ordering module.

## Pre-flight checklist

- [ ] Retrieved the relevant passage instead of pasting the whole source document.
- [ ] Compacted or dropped resolved sub-threads instead of replaying full history forever.
- [ ] Deduplicated retrieved chunks and tool results before they entered the payload.
- [ ] Filtered tool output down to what the task actually needs, not the whole raw response.
- [ ] Placed the load-bearing instruction at the start or right before the current question — not buried mid-payload.

**Related:** [Why Context Is the Real Bottleneck](/learn/context-engineering/why-context-is-the-real-bottleneck) · [Dissecting a Live Context Payload](/learn/context-engineering/dissecting-a-live-context-payload) · [Lost in the Middle](/learn/context-engineering/lost-in-the-middle) · [The Whole Game of Context Engineering](/learn/context-engineering/the-whole-game-of-context-engineering)
