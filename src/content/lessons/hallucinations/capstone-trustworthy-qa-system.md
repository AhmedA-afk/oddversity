---
title: "Capstone: Build a Reliability-Hardened QA System"
track: "hallucinations"
status: live
summary: "Integrate risk scoring, grounding, guardrails, detection, and confidence-gated escalation into one QA system and measure its own hallucination rate."
duration: "9 min read"
---

Every lesson in this track has handed you one piece: a detector, a grounding pattern, a guard, a router. This is the assignment where those pieces stop being separate techniques and become one system you can point at a question and trust — or watch honestly fail.

There's no numbered walkthrough here. You've built every component already across this track; this page is the spec you build against, the way a ticket from a product manager would read.

## The brief

Build a document-grounded QA system over a real corpus of your choosing. The system must: score the risk of each incoming question, retrieve and ground its answer in the corpus, generate with citations that are actually verified against the retrieved text, detect its own uncertainty via resampling, gate the answer through a calibrated confidence threshold to either ship, ship-with-citations, or escalate — and then, separately, report its own hallucination rate on a golden evaluation set, before and after you added the reliability layer.

That last part is the piece that makes this a capstone and not a demo: you're not just building the system, you're proving with numbers that it's more trustworthy than the bare model call it's wrapped around.

## Acceptance criteria

- [ ] A risk-scoring step classifies every incoming question into at least two tiers (e.g. low/high), and the downstream detection intensity actually differs between tiers — not just a label that's computed and ignored
- [ ] Every answer is grounded in retrieved corpus content; when retrieval returns nothing relevant, the system escalates rather than answering from the model's general knowledge
- [ ] Every factual claim in a shipped answer carries a citation, and a claim-level check confirms the citation genuinely supports the claim (not just present, but correct) — reusing the guard pattern from [Implementation: Input and Output Guardrails](/learn/hallucinations/input-output-guardrail-impl)
- [ ] A semantic-entropy-style detector (resample N times, cluster by meaning) produces an uncertainty score per answer, per [Semantic Entropy](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification)
- [ ] A confidence gate combines the uncertainty score and guard result into a ship / ship-with-citations / escalate decision, with thresholds derived from a calibration run against your golden set — not guessed constants
- [ ] A golden evaluation set of at least 20-30 question/answer pairs exists, including a deliberate subset of unanswerable or out-of-scope questions the system should escalate rather than answer
- [ ] An eval report shows the system's hallucination rate (or a proxy: unsupported-claim rate on the golden set) **with the reliability layer on versus off** — the same generator, gated and ungated, so the delta is attributable to the layer you built, not a different model
- [ ] A short reliability writeup states the calibration threshold you chose, why, and what tradeoff it represents (per [Escalation and Human-in-the-Loop Design](/learn/hallucinations/escalation-human-in-the-loop))
- [ ] The whole pipeline runs end to end from a single command or script, reproducibly

If you can't check every box, ship what's true and mark the rest as a known gap in your writeup — an honest gap list is itself evidence you understand what "reliability-hardened" actually requires.

## Suggested stack

Don't spend a week hunting for the perfect corpus — pick something real, moderately sized, and stable:

- **Corpus**: documentation for a library or product you already know, a domain FAQ, or a small set of policy/reference documents — enough real structure to have genuine gaps for your escalation path to catch.
- **Retrieval**: whatever you built in the RAG track — an embedded vector store is plenty at this scale; see [Grounding with Source Documents](/learn/hallucinations/grounding-with-source-documents) for the mechanics if you're building this piece fresh.
- **Detection**: N=3-5 resamples for semantic entropy is enough to demonstrate the technique without burning your budget — see the cost arithmetic in [Latency, Cost, and Reliability Tradeoffs](/learn/hallucinations/latency-cost-reliability-tradeoffs).
- **Guardrails**: reuse the input/output guard functions from [Implementation: Input and Output Guardrails](/learn/hallucinations/input-output-guardrail-impl) directly rather than rebuilding them.
- **Eval**: a plain script over your golden set, scoring supported/unsupported claims and escalation correctness — no framework required.

## Milestones

Each milestone is a demonstrable capability, not a step in a tutorial. Do the eval milestone early, not last — building every feature first and measuring at the end is the most common way this project stalls.

1. **A bare, ungrounded baseline exists and its hallucination rate is measured first.** Before adding any reliability machinery, run your golden set through a plain generation call and score it. This is the "before" number your final report compares against.
2. **Grounding and citation verification work together.** The system retrieves, generates with citations, and a guard confirms each citation actually supports its claim — not just present, but correct.
3. **The detector produces a real uncertainty score, and it discriminates.** Run it on a question you know the corpus answers well and one you know it doesn't cover — the scores should meaningfully differ. If they don't, the detector isn't earning its cost yet.
4. **The confidence gate makes a real ship/cite/escalate decision, calibrated.** Run your golden set through the gate at a few candidate thresholds, plot the accuracy/coverage tradeoff, and pick one deliberately — this is where [confidence-gated escalation](/learn/hallucinations/confidence-gated-escalation-impl) becomes your own numbers instead of an example.
5. **The "after" eval report exists and the delta is real.** Same golden set, same generator, reliability layer on vs. off. If the hallucination-rate proxy didn't improve, that's a real result — report it and explain why, rather than tuning the eval until it looks good.
6. **Someone else can run it.** A stranger clones your repo, runs one setup command, and gets a working pipeline against your corpus without asking you anything.

## What good looks like

The bar isn't "it answered my test questions correctly." It's a system that behaves differently, and defensibly, when a question is outside what it can safely answer. Concretely: feed it a question with no support in the corpus and watch it escalate cleanly instead of blending a real citation with an invented detail. Feed it a well-covered question and watch it ship confidently, without an unnecessary hedge. Your eval report includes both the wins and the failures — a report where every case passes usually means the golden set skipped the hard cases, not that the system is finished. And your writeup states the threshold you chose in terms of the tradeoff it represents ("we escalate more than a general-purpose assistant would, because a wrong answer here costs more than a human review"), the way [Escalation and Human-in-the-Loop Design](/learn/hallucinations/escalation-human-in-the-loop) frames it — a threshold with a stated reason is what separates an engineered system from a tuned-until-it-looked-fine one.

For a sense of how far this pattern extends in a domain where every stage is mandatory rather than optional, see the [high-stakes case study](/learn/hallucinations/high-stakes-case-study) — your capstone doesn't need every piece of that stack, but it should be able to explain, for each acceptance criterion above, which piece of that stack it corresponds to.

## Extensions

Ship the core spec first — every extension below is worth more once the base pipeline actually escalates when it should, not before:

- **Add the full claim-extraction fact-checking pipeline** from [Implementation: An Automated Fact-Checking Pipeline](/learn/hallucinations/fact-checking-pipeline-impl) on your highest-confidence answers as a spot-check, and compare its findings against your lighter single-pass guard.
- **Add production-style monitoring** even in a toy deployment — log every decision per [Monitoring Hallucination in Production](/learn/hallucinations/monitoring-hallucination-in-prod) and compute escalation rate and guard-block rate over a batch run of your golden set plus some held-out questions.
- **Simulate an incident.** Deliberately introduce a bug (loosen a guard check, as in the [incident response walkthrough](/learn/hallucinations/incident-response-for-hallucination)), watch your eval report catch the regression, then fix it and add the case to your golden set.
- **Build the UX layer.** Render the routing decision honestly — citations only when required, hedge language proportional to the score — per [The UX of Uncertainty](/learn/hallucinations/ux-of-uncertainty), rather than leaving the reliability layer invisible behind a flat chat UI.
- **Tier your risk scoring further.** Move from two tiers to three, and show the detection intensity and threshold genuinely differing across all three, per the [reliability architecture](/learn/hallucinations/reliability-architecture-overview).

**Related:** [Reliability Architecture: Wiring the Pieces Together](/learn/hallucinations/reliability-architecture-overview), [Implementation: Confidence-Gated Escalation](/learn/hallucinations/confidence-gated-escalation-impl), [Implementation: Input and Output Guardrails](/learn/hallucinations/input-output-guardrail-impl), [Building a Golden Eval Set](/learn/hallucinations/building-golden-eval-set), [Cheatsheet: Production Reliability Checklist](/learn/hallucinations/production-reliability-cheatsheet)
