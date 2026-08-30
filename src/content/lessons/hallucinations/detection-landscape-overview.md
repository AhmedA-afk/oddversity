---
title: "The Detection Landscape: What We Can and Can't Observe"
track: "hallucinations"
status: live
summary: "Detection means estimating the odds of a hallucination from whatever signals you can actually observe — here's the full map."
duration: "7 min read"
---

Once a model has generated an answer, you have a narrower question than "is this true." You have "given only what I can observe about this output, how likely is it to be wrong." Every technique in this module is a different way of answering that narrower question.

## What it is

Detection is the practice of scoring or flagging an already-generated output as likely-hallucinated, without necessarily changing how it was produced. That's the dividing line from mitigation (Module 5): mitigation changes generation itself — better grounding, constrained decoding, sharper prompts — to make hallucination less likely in the first place. Detection accepts whatever came out and asks whether to trust it. You need both. A system that only prevents will still ship the failures prevention couldn't structurally rule out; a system that only detects is paying inference cost for output it then has to catch. [Deep Dive: Detect-Then-Regenerate vs. Prevent-at-Source](/learn/hallucinations/detecting-vs-preventing) works through exactly how those two halves fit together.

Formally, detection is trying to estimate P(hallucination | signals), where "signals" is whatever you can get your hands on for this particular output. That estimate then feeds two places downstream: [confidence and uncertainty scoring](/learn/hallucinations/confidence-and-uncertainty-signals) (Module 4), which turns a detection score into something a system can act on gracefully, and [production guardrails](/learn/hallucinations/guardrails-for-high-stakes-output) (Module 7), which decide what actually happens when the score crosses a line — retry, flag, block, escalate.

## The mental model

Every detection technique draws on one of four sources of signal, and the source you have access to constrains which techniques are even on the table:

| Signal source | What you observe | Techniques in this module | Access needed |
|---|---|---|---|
| Output text alone | the final response, nothing else | self-verification, LLM-as-judge | API access only |
| Multiple samples | N resamples of the same prompt | self-consistency, ChainPoll | API access, N× the calls |
| Model internals | logprobs, hidden states | token-level confidence signals | logprob or weight access |
| External references | retrieved docs, other models | NLI grounding, ensemble cross-check, retrieval-based fact check | a search index or other model APIs |

Notice what's missing from every row: none of them is "ground truth." There is no fifth row where you just check the output against reality directly — if you had that, you wouldn't need a detector, you'd just have the answer. Every technique in this module is a proxy that correlates with truth without being truth, which is exactly why [no ground-truth signal](/learn/hallucinations/no-ground-truth-signal) is worth reading before you trust any single one of these too far.

## Why it works this way

The four rows aren't arbitrary — they're the only things that actually exist at the boundary between you and a hosted model. You can look at what came out (row 1). You can ask again and see if it changes (row 2). If the provider exposes it, you can look at the numbers underneath the text (row 3). And you can go check something that isn't the model at all (row 4). [Black-Box vs. White-Box Detection](/learn/hallucinations/black-box-vs-white-box-detection) works through exactly which of these four a given deployment actually has open, because for most teams using a hosted frontier model, row 3 is partly or fully closed off, which pushes most real detection work toward rows 1, 2, and 4.

## A concrete example (shown)

Take one question — "Who won the 2018 Nobel Prize in Literature?" — and run it through all four lenses:

- **Output text alone:** the answer reads fluent and confident either way, right or wrong. Fluency tells you nothing here — see [why fluent text feels confident](/learn/hallucinations/why-fluent-text-feels-confident).
- **Multiple samples:** resample five times at nonzero temperature. A name the model actually has grounded tends to come back as "Olga Tokarczuk" every time, maybe worded differently. A guess tends to scatter across two or three different names.
- **Model internals:** if logprobs are exposed, the token for the surname carries a much lower probability when the model is guessing than when it's recalling something well-represented in training.
- **External references:** query a search index or an encyclopedia source and check whether "Olga Tokarczuk, 2018 Nobel Prize in Literature" is actually supported.

Four different lenses, four different costs, four different kinds of confidence — and only the fourth one checks against something outside the model.

## Where it shows up

Detection isn't the end of the pipeline, it's the middle. A detection score is only useful once something downstream reads it: [confidence signals](/learn/hallucinations/confidence-and-uncertainty-signals) turn a raw score into a calibrated estimate, and [escalation design](/learn/hallucinations/escalation-design-for-uncertain-answers) decides what happens when that estimate is too low to ship as-is. Every implementation lesson in this module — self-consistency, self-verification, ensemble cross-checking, LLM-as-judge, NLI grounding, retrieval-based checks — is producing a number or a label that's meant to plug into that chain, not stand alone as a verdict.

## Watch out for

- **Mistaking "I can observe this" for "this is sufficient."** Having access to a signal source doesn't mean it catches everything a hallucination could look like — each row in the table above has real blind spots, catalogued lesson by lesson.
- **Trusting one source in isolation.** A single black-box signal — say, resampling alone — can pass a confidently, consistently wrong answer with a clean bill of health. [Common Mistakes: When Detectors Give False Comfort](/learn/hallucinations/detection-false-comfort) walks through exactly how that happens.
- **Treating detection as certainty.** Every technique here outputs a probability or a score, not a proof. A green light means "less likely," not "verified."

## Where next

Start with [Black-Box vs. White-Box Detection](/learn/hallucinations/black-box-vs-white-box-detection) to figure out which rows of the table you actually have access to, then [Intuition: If It Keeps Changing Its Story, Distrust It](/learn/hallucinations/consistency-implies-reliability) to build the core mental model behind the resampling-based techniques. [Comparison: Choosing a Detection Method](/learn/hallucinations/detection-methods-compared) is the map back to this one once you've seen each technique up close.

**Related:** [Why Models Hallucinate](/learn/hallucinations/why-models-hallucinate), [No Ground-Truth Signal](/learn/hallucinations/no-ground-truth-signal), [Confidence Signals: What Model Certainty Actually Reflects](/learn/hallucinations/confidence-and-uncertainty-signals), [Black-Box vs. White-Box Detection](/learn/hallucinations/black-box-vs-white-box-detection), [Comparison: Choosing a Detection Method](/learn/hallucinations/detection-methods-compared)
