---
title: "Chain-of-Density: Iterative Summary Refinement"
track: "prompt-engineering"
status: live
summary: "The deferred rigor on chain-of-density — why the fixed-length constraint forces compression, and what it costs."
duration: "8 min read"
---

*This is the optional-depth pass. [Chain-of-Density: Iteratively Tightening a Draft](/learn/prompt-engineering/chain-of-density-summarization) already covers the loop and a worked example — read that first if you haven't. This page derives why the mechanism works, treats the loop as the two-stage pipeline it actually is, and prices out what each round costs you.*

## The mechanism, derived

Fix a summary length at `L` words. Define entity density at round `i` as `d_i = |E_i| / L`, where `E_i` is the set of specific entities (names, numbers, dates, claims) the summary at round `i` actually contains.

A single-shot request for "a dense summary" gives the model no value for `d_i` to compare against — it just writes at whatever density its training distribution defaults to for the word "summary," which skews toward safe, generic phrasing. Chain-of-density fixes that by making `d_i` a property of an artifact the model can inspect: at each round, it's shown its own previous draft and asked what's missing from *that specific text*, then told to rewrite at the same `L`.

The fixed `L` is what does the work. If length could grow, "add these entities" would just get appended and density would stay flat while length climbed. Held at a constant `L`, every new entity has to displace something — a generic clause, a redundant modifier, a full sentence collapsed into an appositive. That displacement is a real compression operation, not a formatting trick, which is why the syntax visibly changes over rounds: dense text leans on appositives and parenthetical fragments because full independent clauses cost too many words per fact.

## The loop is a two-stage pipeline, run in place

Look at what each round actually asks for, and it splits into two jobs with different grading criteria — the exact signal covered in [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt):

1. **Identify** — read the current draft against the source and name entities that are present in the source but missing from the draft. This is a diagnostic, extraction-shaped task: right or wrong, checkable against the source text.
2. **Rewrite** — fuse the named entities into a new draft at the same `L`. This is a generation-shaped task: judged on fluency and faithfulness, not on whether a specific fact was found.

A well-built identify step also enforces a few checks before an entity is allowed forward: it should be *faithful* (actually stated in the source, not inferred), *specific* (a number, name, or date — not a restated topic), *novel* (not already in the current draft), and *fusible* (addable within the remaining word budget without deleting something equally load-bearing). Skip these checks and the loop degrades fast — round 2 "adds" an entity that's a paraphrase of something round 1 already said, and density stops climbing while the summary still gets reshuffled for no gain.

This identify-then-rewrite shape is the same structural move as a [validate-and-repair loop](/learn/prompt-engineering/validation-and-repair-loop): diagnose what's wrong or missing in one pass, fix it in a second, and cap the number of rounds so the process terminates instead of drifting. Chain-of-density is that pattern applied to information coverage instead of schema conformance.

## Three passes on one article

Source:

```text
The city council voted 6-2 on Tuesday to approve a $40 million light-rail
extension connecting downtown to the airport, with construction set to
begin in January 2027 and the first trains running by late 2029. Mayor
Elena Cruz called it "the most significant transit investment in a
generation," while two council members cited cost overruns on a previous
project as grounds for their no votes. The extension will add four new
stations and is expected to serve roughly 18,000 riders daily once
complete, according to the city's transit authority.
```

Fixed length: ~25 words every round.

**Round 0 (generic):** "A city approved funding for a new light-rail extension to the airport, with construction beginning soon and expected to serve many daily riders once finished."

*Identify (round 1):* missing — `$40 million`, `6-2 vote`, `January 2027`.

**Round 1:** "The city council voted 6-2 to approve a $40 million light-rail extension to the airport, with construction starting January 2027 and serving many riders once finished."

*Identify (round 2):* missing — `four new stations`, `18,000 riders daily`, `late 2029`.

**Round 2:** "A 6-2 council vote approved a $40 million airport light-rail extension adding four stations, breaking ground January 2027, serving 18,000 riders daily by late 2029."

Three rounds, same ~25-word budget, and round 2 carries six concrete facts against round 0's zero. Notice what round 2 had to drop to make room: "the city council" became an implicit "council vote," and "serving many riders once finished" became the exact number and date. That's the displacement the fixed length forces — nothing was added without something else being compressed or cut.

## The costs, precisely

Every round re-sends the source article plus the running draft, because the identify step needs the source to check faithfulness. For a source of roughly 800 tokens and instruction overhead of roughly 150 tokens, one round costs about 950 input tokens; five rounds cost roughly `5 x 950 = 4,750` input tokens against the source, plus the growing chain of prior drafts if you keep them in context. A single-shot summary call costs the ~950-token pass once. That's a real, arithmetic difference — call it on the order of 5x (or a bit more) the input tokens of one pass for a five-round chain — not a vague "it's more expensive," and it's the number to weigh against how much the density actually matters for your use case.

The compression step also carries a specific faithfulness risk that's easy to miss: because the model is under pressure to both shorten and add, it can quietly drop a hedge or qualifier ("roughly," "according to the transit authority") to save words, which changes the claim's certainty without technically inventing an entity. That's a different failure than fabricating a fact outright, and a plain fact-check against the source won't always catch it — you have to specifically check that qualifiers survived compression, not just that named entities did.

## When density beats a single pass

Reach for the loop when the output itself has a hard length ceiling and needs to carry maximum information inside it — a push notification, a headline subhead, a one-line search result snippet, an abstract capped at a journal's word limit. In those cases a single-shot "be concise" call reliably underperforms because the model has no target to compress against; chain-of-density gives it one.

Skip it for ordinary summaries with no fixed-length constraint, or for high-volume pipelines where a 5x-plus token cost per summary doesn't pay for itself — a single well-prompted pass with an explicit entity list requested up front gets most of the density gain at a fraction of the cost, and is the better default until you've measured that the extra rounds are earning their keep (see [Pipeline vs. Single Call: Cost, Latency, Reliability](/learn/prompt-engineering/pipeline-vs-single-call-tradeoffs) for that comparison in general).

**Related:** [Chain-of-Density: Iteratively Tightening a Draft](/learn/prompt-engineering/chain-of-density-summarization), [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt), [Building a Validate-and-Repair Loop](/learn/prompt-engineering/validation-and-repair-loop), [Pipeline vs. Single Call: Cost, Latency, Reliability](/learn/prompt-engineering/pipeline-vs-single-call-tradeoffs)
