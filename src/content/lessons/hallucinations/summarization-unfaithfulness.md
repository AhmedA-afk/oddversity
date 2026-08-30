---
title: "Worked Example: When a Summary Betrays Its Source"
track: "hallucinations"
status: live
summary: "One summary sentence adds a causal claim, flips a hedge to a certainty, and merges two people into one — three distinct errors in one paragraph."
duration: "6 min read"
---

Most summarization hallucinations don't show up as one obvious lie. They show up as small, individually plausible edits stacked on top of a mostly-accurate paragraph — which is exactly what makes them slip past a reader who's skimming for tone rather than checking each claim.

## The setup

Source, a short internal update about a fictional company:

> Northwind Robotics reported Q2 revenue of $42M, up from $38M last quarter. The company said hiring "may slow in the back half of the year" as it focuses on efficiency. CFO Elena Torres and COO David Park both spoke on the earnings call about the results.

Summary produced by a model asked to condense it:

> Northwind Robotics' revenue grew because of aggressive cost cutting, and hiring will stop in the second half of the year, according to CFO David Torres.

Three things are wrong here, and they're wrong in three different ways.

## Step by step

**Error 1 — addition.** *"...grew because of aggressive cost cutting..."*

The source states two facts side by side — revenue rose, and the company is focusing on efficiency — but never claims one caused the other, and never mentions cost cutting specifically at all. The summary invents a causal mechanism that reads as a natural inference but has no basis in the text.

> **Why this matters:** this is a textbook extrinsic error — see [intrinsic vs. extrinsic hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination). You can't refute "because of cost cutting" by rereading the source; it simply isn't addressed. The compression step manufactured a causal claim the source never made, which is exactly the pressure described in [summarization hallucination](/learn/hallucinations/summarization-hallucination): a source rarely states its own causal story, so the model supplies one.

**Error 2 — intensification.** *"...hiring will stop..."*

The source hedges explicitly: hiring "*may* slow." The summary drops the hedge and the direction changes meaning — "may slow" allows for hiring to continue at a reduced pace; "will stop" asserts a full halt. This is checkable directly against the source (intrinsic), and it's a faithfulness failure regardless of what actually happens to hiring in the world.

> **Why this matters:** intensification is the quiet version of fabrication — no new fact was added, an existing one was just made more certain than the source supports. It's the easiest error type to miss on a skim, because every word in "hiring will stop" already appeared in some form in the original sentence.

**Error 3 — entity conflation.** *"...according to CFO David Torres."*

The source names two people: CFO Elena Torres and COO David Park. The summary merges their first and last names into a person who doesn't exist, and attributes the quote specifically to a CFO — collapsing two named, distinct roles into one.

> **Why this matters:** this is intrinsic (both real names are sitting right there in the source, so the conflation is checkable without any outside knowledge) and a faithfulness failure. It's also the kind of error a reader is least likely to catch, because "David Torres" sounds exactly as plausible as either real name — nothing about the fabricated name signals that it's a splice.

## Where it breaks — and the fix

All three errors are extrinsic-or-intrinsic faithfulness failures, not factual ones in the ordinary sense: nothing here requires knowing anything about the real world, because there's a source right there to check against. That's the general shape of summarization hallucination — see [the master-axis lesson](/learn/hallucinations/factual-vs-faithfulness-distinction) — and it's exactly why it slips past readers who evaluate a summary by asking "does this sound right" instead of "does the source actually say this." A summary that sounds right by construction — it's built from real names, a real number, a real topic — passes a plausibility check every time, because plausibility was never in question. Faithfulness was.

The fix is the same discipline as elsewhere in this module: check each claim against the source at the sentence level, not the paragraph level. For every factual sentence in the summary, ask whether you can point to the specific span in the source that supports it. "Grew" points to the $42M/$38M pair — supported. "Because of aggressive cost cutting" points to nothing — flag it. "Will stop" points to "may slow" — flag the intensification. "David Torres" points to two different names — flag the conflation. See [grounding with source documents](/learn/hallucinations/grounding-with-source-documents) for building this entailment check into a pipeline rather than doing it by eye.

## Takeaways

- Addition, intensification, and entity conflation are three different failure mechanisms that all produce the same symptom: a summary sentence that sounds exactly as confident as the true ones around it.
- None of these three require any world knowledge to catch — every one of them is checkable using nothing but the source paragraph, which is exactly why sentence-level entailment checking (not a fluency read) is the reliable defense.
- A summary earns trust by being faithful, not by being plausible. Plausibility is cheap; it's what a hallucination is made of.

**Related:** [Summarization Hallucination: Facts the Source Never Said](/learn/hallucinations/summarization-hallucination), [The Master Axis: Factual vs. Faithfulness Hallucination](/learn/hallucinations/factual-vs-faithfulness-distinction), [Intrinsic vs. Extrinsic Hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination), [Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents)
