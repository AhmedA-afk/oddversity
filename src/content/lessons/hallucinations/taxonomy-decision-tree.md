---
title: "Cheatsheet: A Decision Tree for Classifying Any Hallucination"
track: "hallucinations"
status: live
summary: "A one-page flowchart from checkability to axis to surface mode, with the tell-tale signature for each named type in this module."
duration: "4 min read"
---

Pin this next to whatever tracks incoming failures. Every named hallucination type in this module is a leaf of the same three-question tree.

## Start here, then measure

Before branching: **log the full input the model saw alongside every output**, not just the output. Every branch below requires knowing what was in context — see [the worked example](/learn/hallucinations/same-output-two-failure-modes) for why the same wrong sentence classifies three different ways depending only on this. If you only have the output, stop and go get the input before you classify anything.

## The tree

**1. Is the disputed claim checkable using only the input the model was given (the prompt, retrieved context, tool results, conversation history)?**

- **Yes → intrinsic.** The contradiction is sitting right there; no outside knowledge needed to catch it.
- **No → extrinsic.** The claim adds something the input never addressed at all — confirming or denying it requires stepping outside the input.

Full treatment: [intrinsic vs. extrinsic hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination).

**2. Does the claim contradict the real world, or does it contradict (or overreach) the specific source it was supposed to represent?**

- **Contradicts the world → factual.** Check it against reality — a database, a live source, a domain-specific ground truth.
- **Contradicts/misrepresents the given source → faithfulness.** Check it against that source alone, regardless of whether it happens to also be true or false in the world.

Full treatment: [the master-axis lesson](/learn/hallucinations/factual-vs-faithfulness-distinction). Watch for the two edge cases that trip people up: a claim can be *factually right and unfaithful* (it matches reality but not the document), or *faithful and factually wrong* (it matches a document that was itself wrong) — and a perfectly faithful restatement of a bad source isn't a hallucination to fix in the model at all.

**3. Which surface mode does the specific claim belong to?**

Use the signature column below to jump straight to the type lesson.

## Signature lookup

| Mode | Tell-tale signature | Usual axis position |
|---|---|---|
| Citation | Format-valid author/year/journal/DOI or case reporter that doesn't resolve to a real document | Extrinsic, factual (open recall) |
| Code / package | Import or method name that's plausible but not in the real registry or installed API | Extrinsic, factual (checked against a real index, not a document) |
| Tool call — schema | Tool name or parameter not in the registered tool list actually provided in context | Intrinsic, faithfulness (the tool list is part of the input) |
| Tool call — value | Real tool, real parameter, a fabricated identifier value with no source in the conversation | Extrinsic (the value has no counterpart anywhere in the input) |
| Temporal | "Current," "latest," "this year," or a "who won" claim about something past the knowledge cutoff | Factual, usually with no source to be faithful to at all |
| Summarization | A claim in the summary you can't point to a source span for — addition, intensification, or entity conflation | Intrinsic or extrinsic, almost always faithfulness |
| Sycophancy | A correct answer reversed after pushback with no new evidence offered | Not really on either axis — the driver is social pressure, not a knowledge or grounding gap |

## Using it as triage

- **Default:** run the checkable/uncheckable split (question 1) first — it's the cheapest test and every other branch depends on it.
- If a case won't sit cleanly on the factual/faithfulness axis (no source was ever given), it's most likely temporal, code/package, or citation — the three modes that typically run against open parametric recall rather than a supplied document.
- If the transcript shows the model reversing a position after disagreement with no new evidence, stop walking the tree — check for sycophancy first, per [sycophancy as a mode](/learn/hallucinations/sycophancy-as-a-mode), since the fix is different from every other leaf here.
- Once you have a mode, the fix is implied, not chosen freely — see [misclassifying hallucination types](/learn/hallucinations/misclassifying-hallucination-types) for what goes wrong when a mode gets the wrong leaf's remedy applied to it.

**Related:** [The Master Axis: Factual vs. Faithfulness Hallucination](/learn/hallucinations/factual-vs-faithfulness-distinction), [Intrinsic vs. Extrinsic Hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination), [Worked Example: One Wrong Answer, Different Diagnoses](/learn/hallucinations/same-output-two-failure-modes), [Common Mistakes: Mislabeling the Type Leads to the Wrong Fix](/learn/hallucinations/misclassifying-hallucination-types), [Sycophancy: Fabrication Driven by Agreement](/learn/hallucinations/sycophancy-as-a-mode)
