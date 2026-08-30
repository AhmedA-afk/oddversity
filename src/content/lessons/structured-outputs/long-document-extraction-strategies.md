---
title: "Strategies for Long Documents"
track: "structured-outputs"
status: live
summary: "Three ways to fit a document too long for one call into an extraction pipeline, and the boundary hazard all three have to manage."
duration: "6 min read"
---

A single call can only hold so much document before the model starts skimming instead of reading. Once you're past that point, how you split the work matters as much as the schema you're filling.

## What it is

Three patterns cover most long-document extraction:

- **Chunking with overlap** — cut the document into pieces small enough for reliable extraction, with each piece sharing a margin of text with its neighbor.
- **Map-reduce extraction** — extract a partial result from every chunk independently, then merge the partials into the one object your schema promised.
- **Windowed passes** — process chunks in order, carrying a small amount of state forward from one chunk to the next (a running balance, an "clause still open" flag), rather than treating every chunk as if it started fresh.

These aren't competing choices so much as layers: map-reduce is how you turn N chunks into one result, chunking-with-overlap is how you cut the chunks in the first place, and windowed passes are what you reach for when the reduce step needs more than "concatenate and dedupe."

## The mental model

The reason any of this is necessary is that a model reading chunk *k* has no idea what chunk *k-1* or *k+1* said unless you show it. Extraction that would be a single fact in a short document — "the effective date is March 1" — can straddle a chunk boundary in a long one, half of it in one chunk and half in the next. Overlap is a blunt but effective fix: make the margins between chunks wide enough that anything short enough to matter appears whole inside at least one chunk, even if it also appears (partially) in its neighbor.

## Why it works this way

Overlap alone would just produce duplicates — the same clause extracted once, complete, from the chunk it fits in, and once, truncated, from the neighboring chunk it partially bleeds into. That's why chunking is paired with a merge step: [Chunk, Extract, Merge](/learn/structured-outputs/chunk-and-merge-extraction) covers deduplication, but the short version is that a truncated fragment and a complete version of the same clause need to collapse into one entry, not survive as two.

Windowed passes exist for the cases overlap can't fix — cumulative fields. A running account balance, a page counter, an open-clause flag: these aren't things you can recover by widening the overlap window, because they depend on *everything before* the current chunk, not just the neighboring few paragraphs. A windowed pass feeds the model a small summary of relevant prior state alongside each new chunk, so it can say "balance after this chunk's transactions is X" instead of trying to re-derive X from scratch.

## A concrete example (shown)

A 30-page contract, chunked into three roughly 12-page windows with a 2-page overlap:

```
Chunk 1: pages  1–12
Chunk 2: pages 11–22
Chunk 3: pages 21–30
```

The core hazard: a "Limitation of Liability" clause that runs from the bottom of page 21 to the top of page 23 is fully contained in chunk 3 (pages 21–30) but only partially contained — cut off mid-sentence — in chunk 2 (pages 11–22, which ends at page 22). Both chunks will produce *something* for that clause; only one produces the whole thing, and the merge step has to know which. [Extracting Clauses from a 40-Page Contract](/learn/structured-outputs/contract-clause-extraction-example) walks this exact scenario end to end.

## Where it shows up

Contracts and policies (clause extraction), financial statements spanning many pages (transaction tables — see [Transactions from a Bank Statement](/learn/structured-outputs/bank-statement-transactions-example)), meeting transcripts, and any multi-page form set where a single logical record is printed across a page break.

## Watch out for

- **No overlap, or overlap smaller than your longest expected entity.** If a clause can run three pages and your overlap is one page, you've just moved the boundary problem rather than solved it — size overlap to the entity, not to a round token count.
- **Overlap that's too generous.** Wide overlap multiplies the number of chunks that see the same content, which multiplies both cost and the number of near-duplicate merge conflicts you have to resolve.
- **Windowed state drifting silently.** If the "state" you carry forward is a text summary rather than a validated structured value, small phrasing changes across chunks can quietly corrupt a running total — validate the carried state the same way you'd validate any other field.

## Where next

[Chunk, Extract, Merge](/learn/structured-outputs/chunk-and-merge-extraction) implements the map-reduce pattern end to end; [Extracting Clauses from a 40-Page Contract](/learn/structured-outputs/contract-clause-extraction-example) is the same technique on a real document.

**Related:** [Long-Document Structured Extraction](/learn/structured-outputs/long-document-structured-extraction), [Chunk, Extract, Merge](/learn/structured-outputs/chunk-and-merge-extraction), [Extracting Clauses from a 40-Page Contract](/learn/structured-outputs/contract-clause-extraction-example), [Extraction Is Schema-Filling](/learn/structured-outputs/extraction-as-a-structured-output-problem), [Nested Objects and Arrays in Output Schemas](/learn/structured-outputs/nested-and-array-schemas)
