---
title: "Worked Example: Routing by Uncertainty Score"
track: "hallucinations"
status: live
summary: "Route a batch of support questions into answer, cite-required, or escalate lanes using thresholds pulled from measured calibration."
duration: "6 min read"
---

Abstention doesn't have to be binary — answer or refuse. Most production systems benefit from a middle lane. This walks one batch of support questions through a three-way router built entirely from this module's measurements.

## The setup

A support bot has eight incoming questions, each already scored with two signals from earlier in this module: semantic entropy (from [Implementation: Semantic Entropy with Meaning Clustering](/learn/hallucinations/semantic-entropy-clustering-impl)) and min-token logprob confidence (from [Implementation: Deriving Confidence from Token Logprobs](/learn/hallucinations/token-logprob-confidence-impl)). The goal: route each question into one of three lanes — **answer directly**, **answer with citation required**, or **escalate to a human** — using thresholds derived from measured calibration, not intuition.

## Step by step

### Step 1: Score the batch

| # | Question (shorthand) | Semantic entropy (bits) | Min-token logprob confidence |
|---|---|---|---|
| 1 | "What's your refund window?" | 0.0 | 0.95 |
| 2 | "Do you support SSO with Okta?" | 0.1 | 0.91 |
| 3 | "What's the API rate limit on the free tier?" | 0.3 | 0.72 |
| 4 | "Can I export data in Parquet format?" | 0.4 | 0.68 |
| 5 | "Is feature X compatible with our legacy plan from 2019?" | 0.6 | 0.55 |
| 6 | "What's the exact SLA penalty percentage for a 3-hour outage?" | 0.8 | 0.40 |
| 7 | "Does this integrate with [an internal, undocumented tool]?" | 1.4 | 0.22 |
| 8 | "What's the precedent for a refund on a discontinued add-on from 2021?" | 0.68 | 0.61 |

> **Why this step?** Scoring the whole batch at once, rather than one question at a time, is what lets you set a threshold against a real distribution instead of reacting to a single anecdote.

### Step 2: Pull thresholds from measured calibration

Running [Implementation: Measuring and Plotting Calibration](/learn/hallucinations/measuring-plotting-calibration-impl) against a labeled sample of past support questions, binned by semantic entropy, gave this reliability picture (illustrative, consistent with this module's earlier worked numbers — not a real measured dataset):

| Entropy bin | Empirical accuracy |
|---|---|
| < 0.3 bits | ~92% |
| 0.3–0.7 bits | ~78% |
| > 0.7 bits | ~48% |

That maps directly onto lane boundaries: below 0.3 bits, accuracy is high enough to answer directly; between 0.3 and 0.7, accuracy is good but not good enough to skip a citation; above 0.7, accuracy drops enough that a human should look at it.

> **Why this step?** A threshold not backed by a measured accuracy-per-bin is a guess wearing a percent sign — see [Common Mistakes: Confidence Antipatterns](/learn/hallucinations/confidence-antipatterns) for exactly this failure.

### Step 3: Apply the thresholds

| # | Entropy | Lane |
|---|---|---|
| 1 | 0.0 | Answer directly |
| 2 | 0.1 | Answer directly |
| 3 | 0.3 | Answer with citation |
| 4 | 0.4 | Answer with citation |
| 5 | 0.6 | Answer with citation |
| 6 | 0.8 | Escalate |
| 7 | 1.4 | Escalate |
| 8 | 0.68 | Answer with citation (just inside the boundary) |

### Step 4: Handle the borderline case explicitly

Question 8 sits at 0.68 bits — just under the 0.7 cutoff, in the "answer with citation" lane — but its min-token logprob confidence (0.61) is on the low side for that lane compared to its neighbors (questions 3 and 4 sit at 0.72 and 0.68). Rather than trusting a single score sitting a hair inside a boundary, check the second signal: because the two signals roughly agree here (both moderate, neither screaming "confident" nor "certainly wrong"), the citation-required lane holds. Had min-token confidence instead come in at, say, 0.25 — sharply disagreeing with the entropy-based call — that disagreement itself would be the trigger to escalate rather than trust either number alone.

> **Why this step?** A score sitting right at a threshold boundary is exactly where measurement noise matters most — a second, independent signal is cheap insurance against a razor-thin, possibly wrong call.

## Where it breaks (and the fix)

**Break:** the entropy bins above were measured on general product-FAQ questions. Question 6 (an SLA-penalty number) and question 7 (an undocumented internal integration) are a different question *type* — specific numeric commitments and system-specific technical questions — where the base rate of ambiguity, and the model's training coverage, may not match the FAQ distribution the thresholds were measured on. **Fix:** don't assume one calibration curve transfers across question categories; remeasure per category, or at minimum flag category mismatches for periodic re-validation, exactly as [Common Mistakes: Confidence Antipatterns](/learn/hallucinations/confidence-antipatterns) warns against.

**Break:** routing on a single scalar when the two signals actively disagree (as sketched in Step 4) risks averaging away real information. **Fix:** treat signal disagreement as its own escalation trigger — route conservatively (toward citation or escalation, never toward direct-answer) whenever independent signals point in different directions, rather than blending them into one number that hides the conflict.

## Takeaways

- Lane boundaries came from a measured accuracy-per-bin, not a round number picked by feel.
- Three lanes — not a binary answer/refuse — captures the realistic middle ground where an answer is probably right but still worth grounding in a citation.
- A single scalar signal is a starting point; a second, independent signal earns its cost specifically at the boundaries, where it matters most.
- This routing logic is the seed of the fuller, production-grade version built with real infrastructure in [Confidence-Gated Escalation](/learn/hallucinations/confidence-gated-escalation-impl) — the numbers here came from this module's own measurement tools, which is exactly the dependency that later module expects to already be in place.

**Related:** [Implementation: Semantic Entropy with Meaning Clustering](/learn/hallucinations/semantic-entropy-clustering-impl), [Abstention as a First-Class Behavior](/learn/hallucinations/abstention-as-a-skill), [Escalation Design: Handing Off to a Human When Confidence Drops](/learn/hallucinations/escalation-design-for-uncertain-answers), [Common Mistakes: Confidence Antipatterns](/learn/hallucinations/confidence-antipatterns), [Implementation: Measuring and Plotting Calibration](/learn/hallucinations/measuring-plotting-calibration-impl)
