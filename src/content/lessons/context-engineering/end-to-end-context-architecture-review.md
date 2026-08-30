---
title: "Reviewing a Full Context Architecture"
track: "context-engineering"
status: live
summary: "Auditing a complete multi-agent RAG system's context decisions end to end, catching three bugs before they ship."
duration: "9 min read"
---

A multi-agent system can have every individual agent well-built and still ship with a context bug that only shows up under a specific load pattern or edge case — because context bugs live in the seams between good decisions, not inside any one of them. This is a full audit of one such system, category by category, against a fixed rubric, rather than reading the pipeline top to bottom and hoping something jumps out.

## The system under review

Four agents, orchestrated: an **intake agent** classifies an incoming support ticket; a **retrieval agent** pulls relevant docs from a knowledge base; a **drafting agent** writes a reply; a **review agent** checks the draft against tone and policy before it's sent. Each handoff between them uses the structured payload from [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design). On paper, this is a reasonable architecture. The review below is what it takes to find out whether it actually is one.

The rubric is the earlier modules' cheatsheets, applied in a fixed order: budgeting, selection and ordering, retrieval versus stuffing, compaction, caching, then handoff shape specifically — the same categories the [Context Engineering Master Cheatsheet](/learn/context-engineering/context-engineering-master-cheatsheet) organizes into a build-order checklist.

## Budget: check every agent's line items

Every agent should have explicit caps per segment, set before traffic, not discovered from it. Intake and drafting pass this check — both have stated caps on history and retrieved content. The retrieval agent doesn't: its only limit on returned chunks is a similarity threshold, with no ceiling on count or total tokens.

**Bug #1 (latent).** An unusually broad query returns forty matching chunks instead of the usual five to eight. Nothing in the retrieval agent enforces a cap, so all forty get forwarded to the drafting agent, which now receives a context several times its designed size — right as it's trying to write a reply, the one step in the pipeline where headroom matters most. This doesn't show up in normal testing, because normal tickets don't trigger a forty-chunk match; it shows up the first time a customer asks a broad, cross-cutting question. **Fix:** enforce a hard top-k and a token ceiling on the retrieval agent's output — a threshold-only filter is not a budget.

## Selection and ordering: check where the important thing sits

The highest-relevance material should sit where attention is strongest — near the start or the end of context, not buried in the middle, per [Lost in the Middle](/learn/context-engineering/lost-in-the-middle). The retrieval agent currently sorts its returned chunks by document ID, for readability in logs, not by relevance score.

**Bug #2 (latent).** For a policy-sensitive ticket, the single most relevant snippet — an exact refund policy clause — happens to sort into the middle of the chunk list because of its document ID, while two loosely related chunks bookend it. The drafting agent is statistically more likely to weight the bookend chunks over the buried one, not because it's a worse model, but because that's the documented shape of the lost-in-the-middle effect. **Fix:** sort by relevance score, not an incidental key, and put the top-scoring chunks near the front.

## Retrieval vs. stuffing: check this isn't skipped

The knowledge base should be queried selectively per ticket, not stuffed in wholesale "to be safe." This system passes: the retrieval agent runs a real per-ticket query rather than attaching the full policy manual to every drafting call, in line with [Retrieval vs. Context Stuffing](/learn/context-engineering/retrieval-vs-context-stuffing). It's still worth checking on every system, even when it turns out fine here, because it's the single most expensive mistake to make silently.

## Compaction: check what a compacted view is allowed to lose

Compaction should preserve decision-relevant fact, and it should never be applied uniformly across agents with different jobs. Long ticket threads here get compacted by a rolling summarizer before reaching the drafting agent, which is reasonable. But the same compacted summary — not the original messages — also reaches the **review agent**, whose entire job is to catch policy or tone problems before the reply goes out.

**Bug #3 (latent).** The review agent is checking a paraphrase of what the customer said and what the draft promises, not the verbatim text of either. A summary that rephrases "you promised a refund by Friday in your last email" into "customer expects a refund soon" has already erased the one fact — a specific date, a specific commitment — that the review agent most needs to catch if the draft doesn't address it. The review agent can pass a draft that looks fine against the summary and still miss that it contradicts something the customer actually wrote. **Fix:** compaction is a per-agent decision, not a global one. An agent whose job is verification against original content needs the verbatim snippet carried alongside the summary, even if every other downstream agent is fine working from the compacted version.

## Caching: check the prefix stays stable

Static content — system instructions, tool schemas — should sit in a stable prefix so repeated calls hit the cache, per [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design). Intake and drafting are fine here. The review agent's system prompt opens with a timestamp inserted for logging purposes, ahead of the actual instructions — which invalidates the cached prefix on every single call, regardless of whether anything else about the request changed. Not one of the three headline bugs, since it costs money and latency rather than correctness, but worth fixing in the same pass: move the timestamp to metadata outside the cached prefix, not the first line of the prompt.

## Handoff: the fix for bug #3 is actually a handoff fix

The clean way to resolve bug #3 isn't to stop compacting — it's to change what the handoff to the review agent carries. Using the payload shape from [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design), the drafting-to-review handoff should include the verbatim customer message as a pointer or inline field — `artifacts: [{"kind": "message", "ref": "ticket #4471, msg 3", "note": "verbatim, needed for policy check"}]` — alongside the compacted thread summary, rather than assuming the summary is a sufficient substitute for every downstream reader. What a handoff drops has to be judged against what the *receiver* specifically needs, and two different receivers — drafting versus review — can need two different things from the same upstream conversation.

## The three bugs, together

None of these three bugs is dramatic on its own, and none would fail a demo built on typical tickets. That's exactly the profile of a latent context bug: each one is a decision that looked reasonable in isolation — compact long threads, sort chunks predictably, let retrieval return what it finds — and only breaks under a specific, not-yet-encountered input. Auditing category by category against a fixed rubric, rather than reading the pipeline top to bottom hoping something looks off, is what surfaces them before a real ticket does.

*This is the deep-dive version of a review pass — treat it as the model for auditing your own multi-agent system: work the same six categories, in this order, before you ship.*

**Related:** [Context Engineering Master Cheatsheet](/learn/context-engineering/context-engineering-master-cheatsheet), [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design), [Lost in the Middle](/learn/context-engineering/lost-in-the-middle), [Retrieval vs. Context Stuffing](/learn/context-engineering/retrieval-vs-context-stuffing), [Cache-Aware Context Design](/learn/context-engineering/cache-aware-context-design)
