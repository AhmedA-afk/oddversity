---
title: "Merging Context From Many Sources"
track: "context-engineering"
status: live
summary: "The mechanics of reconciling overlapping, conflicting, and differently-shaped tool results into one block the model can trust."
duration: "8 min read"
---

[Merging Context From Multiple Tools Without Contradictions](/learn/context-engineering/multi-source-context-merging) lays out why merging is harder than single-source retrieval and sketches dedupe-then-rank-then-attribute as the fix. This is the deferred rigor underneath that: exactly how to resolve a conflict once you've found one, and what the precise tradeoffs are between the ways you could do it. Treat it as optional depth on top of that overview.

## Merging is a decision problem, not a formatting problem

It's tempting to treat "combine three tool results into one context block" as a text-assembly task — concatenate, maybe deduplicate, done. But the moment two sources describe the same fact differently, assembly stops being enough. Something has to decide what the model is told is true, and that decision has real consequences: get it wrong silently, and the model answers confidently from the wrong source with no way for anyone downstream to notice.

There are exactly three things a merge step can do when sources disagree, and each has a precise cost:

1. **Pick one source and discard the other.** Cheapest at request time, but destroys information — if the disagreement itself is the interesting fact (a pricing bug, a sync failure, a fraud signal), it's now invisible.
2. **Average or blend the values.** Almost always wrong for anything but genuinely continuous, commensurable quantities. Averaging two *categorical* or *discrete* facts — "14 days" and "30 days," "in stock" and "backordered" — doesn't produce a value in between that's true of either source; it produces a third, fabricated answer nobody actually reported.
3. **Surface both, labeled, with an explicit resolution rule.** Costs a few extra tokens per conflict. Preserves the information, gives the model (and anyone debugging later) the ability to tell what happened, and lets the resolution rule be revisited without re-fetching anything.

Option 3 is the right default. The rest of this lesson is about doing it precisely.

## Worked case: two sources disagree on a fact

A support agent calls a live inventory API and a nightly-cached warehouse report for the same SKU, in the same turn:

```
live-api   (fetched 3s ago):    units_available = 42
warehouse-report (cached, generated 14h ago): units_available = 60
```

These are not near-duplicates to be deduplicated away — see [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication-deep) for that distinct problem — they're the same field, genuinely reporting different values. The merge step needs a rule, decided ahead of time, not improvised per query: **live, directly-queried data outranks a cached report whenever both are present**, because the report is a snapshot that can be stale by definition, while the API call reflects the current state.

Applying that rule doesn't mean discarding the losing value — it means labeling the resolution:

```
[live-api, fetched 3s ago]: units_available = 42
[warehouse-report, generated 14h ago]: units_available = 60
Resolution: prefer live-api (fresher, direct query) unless the user is
specifically asking about the report itself.
```

The model now has everything a human analyst would have wanted: both numbers, both provenances, and an explicit tie-break — not a guess about which of two plausible answers to trust, and not a silently vanished data point that might matter if the user's actual question turns out to be "why do these two systems disagree."

## Building the source hierarchy ahead of time

The rule in the example above — "live outranks cached" — only works because it was decided as a general policy before any specific query needed it. That's the key discipline: a source hierarchy is a per-domain decision made in code, not a per-query judgment call made by the model at inference time. Typical shapes a hierarchy takes:

- **Recency-based**: freshest wins, when all sources measure the same underlying live state (inventory, account balance, system status).
- **Authority-based**: a signed contract outranks a support macro; a primary system of record outranks a downstream cache or a manually maintained spreadsheet, regardless of which was fetched more recently.
- **Specificity-based**: a record scoped to this exact customer outranks a general policy document, even if the policy document is more authoritative in the abstract.

Pick the axis that actually matches why your sources diverge. Recency-based resolution on two systems that disagree for authority reasons (one is simply wrong, not stale) will confidently prefer whichever one happens to have been touched most recently — which is precisely backwards.

## Handling differently-shaped sources before any of this works

Everything above assumes the two sources are already comparable — same field name, same unit, same format. In practice they usually aren't: one API calls it `units_available`, another calls it `stock_qty`; one reports cents, another reports dollars; one uses ISO dates, another uses `MM/DD/YYYY`. Conflict detection can't even run until this is fixed, because `"$240.00"` and `24000` never compare equal no matter how you write the comparison — the merge step will treat them as two different, unrelated facts instead of recognizing them as the same fact in different clothes. [Normalizing Sources Before Merge](/learn/context-engineering/normalizing-tool-schemas-for-merge) works through this mapping step in full, with code, using exactly this kind of mismatched-schema case.

## The precise tradeoffs

- **Labeling every value with source and timestamp costs tokens.** For a merge with many fields and few actual disagreements, this can feel like overhead. It's worth it anyway, because you don't know *in advance* which field will disagree — cutting provenance to save tokens on the 95% of fields that never conflict removes your only signal on the 5% that do.
- **A hard precedence rule is cheap and deterministic, but wrong when precedence is genuinely context-dependent.** "Live beats cached" fails the moment the live endpoint is the one that's broken and the cached report is actually correct. Build an escape hatch — a way to flag "sources disagree by more than X and precedence didn't resolve it cleanly" so genuinely ambiguous cases get surfaced rather than confidently mis-resolved.
- **Silent-drop is only defensible when the losing source is provably wrong, not just lower-priority.** If a cache is simply out of date and you can prove it (a version number, a stale timestamp far outside a normal refresh window), dropping it costs nothing. If it's merely *lower priority* — it could still be right — keep it labeled rather than deleting it.

## Merge in the pipeline, not the prompt

Asking the model itself to "reconcile any contradictions you notice" in an unlabeled blob pushes a data-engineering decision into inference, where it's slower, non-deterministic, and unauditable — you can't check afterward *why* the model believed 42 instead of 60. Do the ranking, normalization, and conflict-labeling in code, before the request goes out, exactly as [structured context injection](/learn/context-engineering/structured-context-injection) recommends more generally for anything the model needs to use rather than merely read.

**Related:** [Merging Context from Multiple Tools Without Contradictions](/learn/context-engineering/multi-source-context-merging) · [Normalizing Sources Before Merge](/learn/context-engineering/normalizing-tool-schemas-for-merge) · [Tool Output Deduplication](/learn/context-engineering/tool-output-deduplication-deep) · [Structured Context Injection](/learn/context-engineering/structured-context-injection) · [Relevance Filtering](/learn/context-engineering/relevance-filtering)
