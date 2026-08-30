---
title: "Common Mistakes: Mitigations That Backfire"
track: "hallucinations"
status: live
summary: "Five ways teams apply real mitigation techniques badly enough that they make hallucination worse, not better."
duration: "7 min read"
---

Every technique in this module reduces hallucination when applied correctly and can make things worse when applied carelessly. These are the five ways that actually happens in production, not hypothetical misuse.

### The mistake: dumping huge unfiltered context "to be safe"

**Why it's wrong:** the instinct is understandable — more context feels like more grounding, so surely it can only help. But dumping fifteen loosely-related documents into the prompt instead of the two or three that are actually relevant dilutes the signal the model needs, and increases the odds that at least one irrelevant or contradictory passage pulls the answer off course. This is the mechanism from [context engineering for grounding](/learn/hallucinations/context-engineering-for-grounding): more context isn't automatically better context, and past a point it's actively worse.

**Symptom:** answers get vaguer and more hedged as you add more retrieved documents, or the model starts blending facts from clearly unrelated sections into one answer.

**Fix:** retrieve fewer, more precisely scoped chunks, and add a relevance-grading step — [corrective RAG](/learn/hallucinations/corrective-rag-pattern-impl) — instead of compensating for weak retrieval precision by just returning more results and hoping the right one is in there somewhere.

### The mistake: adding citations without verifying them

**Why it's wrong:** a citation instruction alone produces citations the model *usually* remembers to include, formatted correctly, pointing at real document ids — which looks like grounding succeeded. But as [the citation verification loop](/learn/hallucinations/citation-verification-loop) shows concretely, a citation can point at a real, retrieved passage that doesn't actually say what the claim next to it says. Decorative citations are worse than no citations in one specific way: they create false confidence in a reader who trusts the presence of a citation without checking its content.

**Symptom:** a citation exists for every claim, spot checks pass on the ones a reviewer happens to click through, but a systematic entailment check (or an angry customer) later finds cited sources that contradict or don't support their attached claims.

**Fix:** run an entailment check — [NLI entailment grounding checks](/learn/hallucinations/nli-entailment-grounding-check-impl) or an LLM-as-judge — on cited claims, not just an existence check on the citation id. [Enforcing citations](/learn/hallucinations/enforcing-citations-impl) and [the citation verification loop](/learn/hallucinations/citation-verification-loop) build both halves of this.

### The mistake: over-constraining creative or open-ended tasks

**Why it's wrong:** [constrained generation](/learn/hallucinations/constrained-generation-concept) works because it removes room to invent — which is exactly the wrong property to want in a task whose entire value is invention. Forcing a brainstorming, ideation, or creative-writing task into a rigid schema or a narrow enum doesn't reduce a meaningful hallucination risk (there's no factual claim being fabricated), it just produces stilted, generic, narrower output than the task needed.

**Symptom:** creative outputs feel flat, repetitive, or oddly constrained in ways users complain about, with no corresponding gain in correctness — because there was nothing to be more "correct" about.

**Fix:** reserve structural constraints for tasks with real, checkable ground truth (tool arguments, extracted fields, classification labels) and leave generative tasks generative — see [when hallucination is desirable](/learn/hallucinations/when-hallucination-is-desirable) and [mitigation by task type](/learn/hallucinations/mitigation-by-task-type) for where the line actually falls.

### The mistake: prompting "don't hallucinate" as if it were a switch

**Why it's wrong:** an instruction like "please don't make anything up" or "be factually accurate" names the goal without giving the model any new information or any specific behavior change to execute. It's the vague-instruction failure mode called out directly in [prompting patterns that lower hallucination](/learn/hallucinations/prompting-patterns-to-reduce-fabrication) — the model doesn't know what facts it doesn't have, so telling it to avoid fabricating unknown facts doesn't help it identify which facts those are.

**Symptom:** adding "don't hallucinate" to a system prompt produces no measurable change in hallucination rate, because it doesn't change what the model can check itself against.

**Fix:** replace vague instructions with specific, checkable behaviors — a named fallback string, a quote-before-conclude requirement, an explicit premise check — the actual recipes in [system-prompt grounding recipes](/learn/hallucinations/system-prompt-grounding-recipes).

### The mistake: treating abstention as free

**Why it's wrong:** teams that get burned by a fabrication often overcorrect by making the system abstain aggressively — low confidence threshold, strict grounding requirements, cite-or-die on every claim. This does reduce fabrication, but per [the coverage-faithfulness-abstention triangle](/learn/hallucinations/mitigation-tradeoffs-deep-dive), it isn't a free win: every additional abstention is a question the system used to answer usefully and now doesn't. A support bot that refuses to answer half of legitimate questions has traded one failure mode (occasional wrong answers) for another (mostly useless), and users notice the second one just as fast as the first.

**Symptom:** hallucination rate metrics look great in a review, while usage or satisfaction metrics quietly drop because the system says "I don't know" or "let me escalate this" far more often than the task actually warrants.

**Fix:** treat the abstention threshold as a tuned parameter, not a one-way ratchet — measure both the fabrication rate *and* the unnecessary-abstention rate, and pick the operating point your specific task's cost structure actually calls for, per [the triangle](/learn/hallucinations/mitigation-tradeoffs-deep-dive) and [mitigation by task type](/learn/hallucinations/mitigation-by-task-type).

## Pre-flight checklist

Before shipping a mitigation stack, check:

- [ ] Every retrieved chunk in the prompt is there because it scored as relevant, not just because "more context can't hurt."
- [ ] Every citation has passed an entailment check against its claim, not just an existence check against the document id.
- [ ] Constraint (schemas, enums) is applied only to tasks with real ground truth to constrain toward — not to open-ended generation.
- [ ] Every "don't hallucinate"-style instruction has been replaced with a specific, checkable behavior and a named fallback output.
- [ ] The abstention rate is measured alongside the hallucination rate, so raising one is a visible tradeoff, not a hidden cost.

Measuring whether any of this actually worked — rather than assuming it did because the stack looks reasonable — is the subject of the next module.

**Related:** [Context Engineering for Grounding](/learn/hallucinations/context-engineering-for-grounding), [Citation Verification Loop](/learn/hallucinations/citation-verification-loop), [Constrained Generation](/learn/hallucinations/constrained-generation-concept), [The Coverage-Faithfulness-Abstention Triangle](/learn/hallucinations/mitigation-tradeoffs-deep-dive)
