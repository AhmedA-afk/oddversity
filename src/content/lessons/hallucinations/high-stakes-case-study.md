---
title: "Worked Example: A High-Stakes Medical/Legal Deployment"
track: "hallucinations"
status: live
summary: "One dangerous query traced through a clinical-assistant stack, showing exactly which layer catches it and what shipping it uncaught would cost."
duration: "8 min read"
---

Every technique in this track sounds reasonable in the abstract. This lesson makes one of them concrete: a single query, entering a clinical documentation assistant, traced through every layer that has to work for it not to hurt someone.

## The setup

The system: a clinical documentation assistant used by nurses to look up medication interaction and dosage guidance while charting. It's grounded in an internal formulary and interaction database — not open-web search, not the model's parametric memory. The stakes: a wrong dosage or a missed contraindication reaching a chart unflagged is a patient-safety incident, not a UX complaint.

The required stack for a domain like this, drawn from the [architecture overview](/learn/hallucinations/reliability-architecture-overview), is non-negotiable in every piece:

- **Mandatory grounding.** No answer to a clinical question is allowed to skip retrieval — see [grounding with source documents](/learn/hallucinations/grounding-with-source-documents). If retrieval returns nothing relevant, that's an automatic escalation, not a fallback to general knowledge.
- **Verified citations.** Every dosage or interaction claim must carry a citation that a [claim-check guard](/learn/hallucinations/input-output-guardrail-impl) has confirmed actually supports it — a citation that merely looks plausible doesn't count.
- **A low escalation threshold.** Per [escalation and human-in-the-loop design](/learn/hallucinations/escalation-human-in-the-loop), the cost asymmetry here is extreme — a false escalation costs a pharmacist a few minutes, a missed one costs a harm event. The threshold is set far more conservatively than a general-knowledge tool would use.
- **Audit logging.** Every query, retrieved source, draft, guard result, and routing decision is logged immutably, both for [incident response](/learn/hallucinations/incident-response-for-hallucination) if something goes wrong and for regulatory review.

What one unmitigated hallucination costs here isn't abstract: a wrong maximum-dose figure charted and acted on is the textbook worst case this entire module exists to prevent, which is why every stage below is mandatory rather than tuned for convenience.

## Step by step

A nurse enters: *"Patient on warfarin, prescribed a course of fluconazole for a fungal infection — anything to flag?"*

**Step 1 — Risk scoring.** The query mentions two named drugs and asks about an interaction. The risk classifier tags it `high: drug_interaction`, which sets every downstream threshold to its most conservative setting for this request.

> **Why this step?** Risk scoring has to run before anything else, because it determines how much scrutiny every later stage applies. A generic classifier missing "drug interaction" language here would let a dangerous query flow through the same lightweight path as "what's the visiting hours policy."

**Step 2 — Retrieval and grounding.** The system queries the interaction database specifically for the warfarin–fluconazole pair, not a general search for either drug alone.

```text
Retrieved: "Fluconazole significantly inhibits CYP2C9 metabolism of
warfarin, increasing INR and bleeding risk. Recommend reduced warfarin
dose and increased INR monitoring frequency during and after
fluconazole course." [Source: interaction-db, entry #4471]
```

> **Why this step?** Retrieval targeted at the specific pair, rather than generic per-drug lookups the model would have to synthesize itself, sharply reduces the chance of the model inferring an interaction that "sounds right" instead of citing a documented one.

**Step 3 — Generation with inline citation.** The model drafts an answer that states the interaction and cites the retrieved entry directly, rather than writing free text and hoping a citation gets attached after the fact.

```text
Draft: "Yes — fluconazole inhibits warfarin metabolism (CYP2C9),
raising bleeding risk. Recommend reduced warfarin dose and closer
INR monitoring. [interaction-db #4471]"
```

**Step 4 — Detection.** Three resamples of the same prompt are generated. All three land on the same interaction, same mechanism, same citation — low semantic entropy, per [semantic entropy](/learn/hallucinations/semantic-entropy-and-uncertainty-quantification). The claim-check guard confirms the cited entry does state exactly this.

> **Why this step?** Even a well-grounded draft gets checked, because grounding reduces the *rate* of misreading a source, it doesn't eliminate it — the model could still have gotten the direction of the interaction backwards despite citing the right entry.

**Step 5 — Confidence gate.** Low uncertainty, guard passed, but the risk tier from step 1 still requires the citation to display and forbids full auto-ship for a drug-interaction category regardless of confidence — this domain's policy caps how much any detector score alone is trusted, per [confidence-gated escalation](/learn/hallucinations/confidence-gated-escalation-impl).

**Step 6 — Output.** The nurse sees the answer with the citation visible and a note that the recommendation is decision support, not a substitute for pharmacist review on dose adjustment specifics.

## Where it breaks (and the fix)

Change one detail: the nurse instead asks about a rare drug combination that isn't in the interaction database at all.

```text
Retrieved: [] — no entries match this specific pair
```

A system without mandatory grounding would let the model answer from parametric knowledge here, producing a plausible-sounding but unverifiable interaction claim — exactly the [intrinsic hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination) risk this stack is built to close off. With mandatory grounding enforced, empty retrieval is itself the trigger: the confidence gate routes straight to escalation without ever letting the model draft an answer with nothing to ground it. The fix isn't a smarter model — it's a policy that treats "no source found" as a hard stop, not a prompt to guess.

## Takeaways

- In a domain like this, every stack layer from the [architecture overview](/learn/hallucinations/reliability-architecture-overview) is mandatory, not optional — the case study only worked because grounding, citation verification, a conservative threshold, and audit logging were all present together.
- The domain-specific "tells" from earlier in the track — numeric claims, named-entity interactions, anything checkable against a source — are exactly what should set the risk tier in step 1, per [hallucination risk factors](/learn/hallucinations/hallucination-risk-factors).
- Empty or thin retrieval should be a first-class trigger for escalation, not a gap the model is left to fill in on its own.
- Audit logging isn't a compliance afterthought here — it's what makes the [incident response](/learn/hallucinations/incident-response-for-hallucination) process possible if a case does slip through.

**Related:** [Reliability Architecture: Wiring the Pieces Together](/learn/hallucinations/reliability-architecture-overview), [Grounding: Constraining Answers to Supplied Sources](/learn/hallucinations/grounding-with-source-documents), [Hallucination Risk Factors](/learn/hallucinations/hallucination-risk-factors), [Implementation: Confidence-Gated Escalation](/learn/hallucinations/confidence-gated-escalation-impl), [Incident Response When a Hallucination Ships](/learn/hallucinations/incident-response-for-hallucination)
