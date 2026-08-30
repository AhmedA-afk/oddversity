---
title: "When 'Making Things Up' Is Actually the Goal"
track: "hallucinations"
status: live
summary: "The same generative mechanism that fabricates a citation invents a product name on request - the problem is the task's contract, not the behavior."
duration: "5 min read"
---

Ask a model to invent a name for a cold-brew coffee startup and it happily produces "Undertow Coffee Co." Nobody calls that a hallucination - it's exactly what was asked for. Ask the same model for the maximum daily dosage of a medication and get an equally confident, equally invented number, and someone could get hurt. Same mechanism, same fluency, wildly different consequences. The behavior didn't change; what the task demanded of it did.

## What it is

Every prompt carries an implicit **factuality contract**: an expectation, stated or not, of how much the output needs to correspond to real, verifiable facts versus how much it's allowed - or even supposed to - be pure invention. Brainstorming, fiction, naming, and hypothesis generation sit at the "invention wanted" end of that contract. Dosage lookups, legal citations, and financial figures sit at the "zero tolerance for invention" end. Most real tasks land somewhere in between - summarizing a document wants fidelity to the source, but doesn't require hedged, tentative phrasing.

## The mental model

Picture a dial from "pure invention wanted" to "invention is catastrophic." Product naming, marketing copy, fictional character bios, and "give me five possible causes to investigate" all sit near the invented end - the value of the output *is* that it's new, plausible, and not simply a lookup. A dosage guideline, a legal citation, a account balance, or an API's actual method signature sit at the opposite end, where "plausible-sounding but wrong" is worse than no answer at all. The model itself doesn't know where on this dial a given prompt sits - that has to be decided and enforced by whoever designs the system around it.

## Why it works this way

The model has exactly one generative mechanism: produce the most plausible continuation given everything so far. What changes across the dial isn't the mechanism, it's what you should *do* with the output afterward - accept it as-is for a creative task, or gate it behind grounding and verification for a factual one. The "hallucination problem" isn't a defect in the generation mechanism; it's a mismatch between what a task's contract demands and what got done to enforce that contract. The exact process that invents a fake DOI in [anatomy-of-a-hallucination](/learn/hallucinations/anatomy-of-a-hallucination), pointed at "invent me a plausible-sounding journal name for a satirical academic paper," produces precisely the intended value.

## A concrete example

```text
Task: marketing taglines
Prompt: "Give me 3 taglines for a cold-brew coffee startup."
Output: "Slow steeped. Fast kick." / "Cold-brewed for the long haul."
  / "Undertow Coffee - deep, dark, done right."
Contract: invention is the entire point. No verification needed
  beyond taste and, separately, trademark screening.

Task: dosage lookup
Prompt: "What's the max daily dose of [medication] for a 10kg child?"
Output: a specific, confident-sounding number
Contract: zero tolerance for invention. A wrong number is a safety
  incident, not a stylistic miss - this must be grounded in an
  actual verified reference, every time, with no exceptions.
```

Structurally these are the same kind of output - a fluent, specific completion. Only the contract tells you which one needs a pipeline of grounding and verification behind it and which one doesn't need any at all.

## Where it shows up

Creative writing tools, product- and company-naming assistants, "brainstorm five possible root causes" prompts in a debugging or research assistant, and synthetic data generation for training all deliberately sit at the invention end of the dial - they're using generation as generation, not as a stand-in for retrieval.

## Watch out for

- **Not stating the contract explicitly, so it drifts.** A tagline generator that quietly gets reused to draft compliance-facing copy inherits none of the verification a factual task needs, because nobody re-declared the contract when the use case changed.
- **Conflating "creative" with "no constraints at all."** Even a fictional biography has some contract - it shouldn't fabricate details about a real, named living person, for instance. "Invention wanted" isn't the same as "anything goes."
- **Assuming the model can tell you which regime it's in.** It can't - there's no internal signal it can consult to know whether this particular prompt wants grounded caution or free invention (see [no-ground-truth-signal](/learn/hallucinations/no-ground-truth-signal)). The contract has to be set and enforced by the system around the model, through prompting, task design, and routing - not inferred by the model itself.

## Where next

Knowing where a task sits on this dial is the first filter for deciding how much of the rest of this track's machinery you actually need - a brainstorming feature needs almost none of it; a dosage lookup needs nearly all of it.

**Related:** [Hallucination Risk Factors](/learn/hallucinations/hallucination-risk-factors), [The Model Cannot Feel the Boundary of Its Knowledge](/learn/hallucinations/no-ground-truth-signal), [Mitigation by Task Type](/learn/hallucinations/mitigation-by-task-type), [Is Hallucination Fixable in Principle?](/learn/hallucinations/is-hallucination-fixable)
