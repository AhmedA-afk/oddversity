---
title: "Common Mistakes: Production Reliability Antipatterns"
track: "hallucinations"
status: live
summary: "The system-level traps that undo an otherwise well-built reliability stack — each one looks reasonable until you see what it costs in production."
duration: "8 min read"
---

Every mistake below is made by teams who already built the individual pieces correctly — a real detector, a real guardrail, a real escalation path. These are the ways the pieces get assembled wrong at the system level anyway.

### The mistake: a single model self-check as the only guard

**Why it's wrong.** Asking the same model that generated an answer to also verify it shares every blind spot the generation had. If the model doesn't know a fact is wrong, asking it to double-check that fact usually just produces a second, equally confident wrong answer — [self-verification](/learn/hallucinations/self-verification-techniques) catches reasoning slips the model can recognize on a second read, not gaps in what it actually knows. Treating that one check as the entire reliability stack, with no independent grounding or guardrail layer, leaves exactly the failure mode this whole module exists to catch: confident, consistent, ungrounded output.

**Symptom.** The system reports low hallucination rates on internal review (the same model verifying itself agrees with itself) while users report factual errors that the self-check never flagged.

**Fix.** Use self-verification as one layer, not the whole stack — pair it with external [grounding](/learn/hallucinations/grounding-with-source-documents), an independent [output guardrail](/learn/hallucinations/input-output-guardrail-impl), and where the stakes justify it, a different model or method entirely doing the checking, per [ensemble cross-checking](/learn/hallucinations/ensemble-cross-checking).

### The mistake: escalation thresholds never tuned against calibration data

**Why it's wrong.** A threshold picked once, from intuition or a round number, drifts out of sync with reality the moment the underlying model, prompt, or traffic mix changes — the threshold is a statement about a specific uncertainty distribution, and that distribution isn't fixed. [Escalation and human-in-the-loop design](/learn/hallucinations/escalation-human-in-the-loop) is explicit that the threshold should sit at the inflection point of a real accuracy/coverage curve, not an arbitrary number that felt safe on day one.

**Symptom.** Escalation volume creeps up or down over months with no corresponding change in actual answer quality — reviewers either drown in cases that turn out fine (over-escalation, and the alert-fatigue trap from that lesson) or, worse, wrong answers start slipping through unescalated because the threshold was tuned for a model version that's since been replaced.

**Fix.** Re-run calibration ([calibration error and reliability diagrams](/learn/hallucinations/calibration-error-reliability-diagrams)) whenever the model or prompt changes, and treat the threshold as a config value tied to a specific calibration run, not a constant set once and forgotten — the [confidence-gated escalation implementation](/learn/hallucinations/confidence-gated-escalation-impl) shows exactly what that recalibration should feed into.

### The mistake: running expensive checks on every request regardless of risk

**Why it's wrong.** Semantic entropy and full fact-checking pipelines cost several times a base generation call each — running either on 100% of traffic spends most of that budget on requests where nothing was ever at stake, while the [architecture overview](/learn/hallucinations/reliability-architecture-overview) exists specifically so risk scoring can route only the requests that need it into the expensive path.

**Symptom.** Latency and inference cost balloon disproportionately to any measurable gain in answer quality, because the bulk of the expensive checking is running on low-stakes requests (casual chat, brainstorming) that were never going to hallucinate in a way that mattered.

**Fix.** Tier detection by risk, per the worked cost comparison in [latency, cost, and reliability tradeoffs](/learn/hallucinations/latency-cost-reliability-tradeoffs) — a cheap risk classifier gating the expensive stack usually cuts blended cost several-fold with no meaningful accuracy loss on the traffic that matters.

### The mistake: shipping without production monitoring

**Why it's wrong.** A CI eval suite runs against a fixed, known set of examples — it cannot see a regression caused by a shift in real traffic patterns, or a slow drift introduced by a model provider's silent update. Without a dashboard tracking escalation rate, guard-block rate, and sampled faithfulness in production, per [monitoring hallucination in production](/learn/hallucinations/monitoring-hallucination-in-prod), the first signal of a regression is a pile of user complaints, which arrives far later and with far less diagnostic detail than a drift alert would have.

**Symptom.** A prompt or model change ships clean through CI, and weeks later someone notices — through support tickets, not a dashboard — that answer quality has quietly degraded, with no timestamp or version to pin down when it started.

**Fix.** Build the monitoring layer before you need it, not after an incident forces the question — the logging schema in [monitoring hallucination in production](/learn/hallucinations/monitoring-hallucination-in-prod) is designed to be added once and reused across every future deploy.

### The mistake: guardrails treated as a substitute for grounding

**Why it's wrong.** A thick guardrail layer catches specific, checkable failure patterns — a malformed number, an uncited claim — but it cannot catch a plausible-sounding fabrication that happens to pass every pattern match cleanly. Teams that lean entirely on output guardrails while skipping real [grounding](/learn/hallucinations/grounding-with-source-documents) end up with a system that's very good at catching sloppy hallucinations and blind to polished ones.

**Symptom.** The guard-block rate looks reassuringly low, but sampled faithfulness scoring or user reports reveal fabrications that never tripped a single check — because nothing in the guard layer was ever comparing the claim to an actual source, only to a pattern.

**Fix.** Ground first, guard second — guardrails are the last line of defense in the [taxonomy](/learn/hallucinations/guardrails-taxonomy), not the first, and no amount of pattern-matching sophistication replaces an answer that was constrained to real sources from the start.

## Pre-flight checklist

- [ ] Every self-check the system relies on has at least one independent, non-self layer behind it (grounding, an external guardrail, or ensemble cross-checking).
- [ ] Escalation thresholds are tied to a specific calibration run, not a hardcoded constant, and get re-tuned after any model or prompt change.
- [ ] Detection intensity is tiered by a cheap risk score, not applied uniformly across all traffic.
- [ ] Production monitoring — escalation rate, guard-block rate, sampled faithfulness — is live before launch, not added after the first incident.
- [ ] Guardrails sit on top of real grounding, not in place of it.

**Related:** [Reliability Architecture: Wiring the Pieces Together](/learn/hallucinations/reliability-architecture-overview), [A Taxonomy of Guardrails](/learn/hallucinations/guardrails-taxonomy), [Escalation and Human-in-the-Loop Design](/learn/hallucinations/escalation-human-in-the-loop), [Deep Dive: Latency, Cost, and Reliability Tradeoffs](/learn/hallucinations/latency-cost-reliability-tradeoffs), [Implementation: Monitoring Hallucination in Production](/learn/hallucinations/monitoring-hallucination-in-prod)
