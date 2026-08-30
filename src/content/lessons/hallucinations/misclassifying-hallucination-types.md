---
title: "Common Mistakes: Mislabeling the Type Leads to the Wrong Fix"
track: "hallucinations"
status: live
summary: "Five real misdiagnoses where the label chosen for a hallucination sent the team toward a fix that could never have worked."
duration: "7 min read"
---

Every fix in this module is attached to a specific type for a reason: the type tells you where the failure actually lives. Get the label wrong and the fix isn't just less effective — it's often aimed at a part of the system that was never broken.

### The mistake: calling a faithfulness failure a "factuality" problem

**Why it's wrong:** a faithfulness failure means the model contradicted or ignored the source it was given — see [the master-axis lesson](/learn/hallucinations/factual-vs-faithfulness-distinction). That's an adherence problem, not a knowledge problem. The model may already "know" the right answer; it just didn't use the document in front of it to produce one.

**Symptom:** the team fine-tunes the model on more accurate data, or swaps in a "smarter" base model, and the error rate on faithfulness violations barely moves — because the model's world knowledge was never the bottleneck.

**Fix:** check whether the wrong claim was checkable against the provided context before touching the model at all (see [intrinsic vs. extrinsic hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination)). If it was, the fix is retrieval quality, prompt-level grounding instructions, or citation requirements that force the model to point at its source — not retraining for more facts.

### The mistake: treating sycophancy as generic hallucination

**Why it's wrong:** sycophancy is a reversal of an answer the model already had right, triggered by social pressure, not a gap in knowledge — see [sycophancy as a mode](/learn/hallucinations/sycophancy-as-a-mode). Grounding fixes gaps. It does nothing for an answer that was already grounded and got abandoned anyway.

**Symptom:** the team ships better citations and retrieval, single-turn accuracy metrics look great, and support tickets about the assistant "changing its answer when pushed" keep coming in at the same rate.

**Fix:** test with adversarial multi-turn pushback specifically, and address it with resistance-focused prompting or training — not more sources for the model to cite, since it already had one.

### The mistake: verifying only the last hop of a reasoning chain

**Why it's wrong:** an error introduced early poisons every hop after it, and the later hops reason *correctly* from the wrong premise — see [the multi-hop deep-dive](/learn/hallucinations/multi-hop-compounding-deep-dive). A check that only looks at the final step sees a well-reasoned answer to a question that was silently swapped out three steps earlier.

**Symptom:** the verification step reports "looks correct" — the named CEO really does run the named company — while the company itself was the wrong one, because nothing checked hop one.

**Fix:** verify each intermediate hop against ground truth as it's produced, before the next hop consumes it, rather than sanity-checking only the final output.

### The mistake: declaring tool-call hallucination solved once schema validation is in place

**Why it's wrong:** schema validation catches invented tool names and malformed arguments — a structural check. It says nothing about whether a correctly-typed, correctly-named argument's *value* is real, which is a separate, data-provenance problem — see [tool-call argument fabrication](/learn/hallucinations/tool-call-argument-fabrication).

**Symptom:** "unknown tool" errors disappear from the logs entirely, and a fabricated customer ID or order number still occasionally reaches a real, write-path API call, because it passed every type and schema check available.

**Fix:** add value-grounding checks for any argument that identifies a real-world entity — require that it trace back to a prior tool result or something the user explicitly stated, not just that it's the right shape.

### The mistake: passing a summary in QA because it "sounds right"

**Why it's wrong:** extrinsic additions and intensifications are constructed from real, plausible-sounding language by design — see [summarization unfaithfulness](/learn/hallucinations/summarization-unfaithfulness). Fluency was never in question; faithfulness to the specific source was. A reviewer optimizing for "does this read naturally" is checking the one property a hallucination is guaranteed to have.

**Symptom:** summaries pass manual review at a high rate, and a periodic sentence-by-sentence audit against source documents turns up unfaithful claims that had been shipping for a while, unnoticed.

**Fix:** require sentence-level entailment against the source as the actual QA gate — can you point to the specific span each claim came from — instead of a plausibility read.

## Pre-flight checklist

- [ ] Is the wrong claim checkable against the input the model was given, or only against the world? (Determines faithfulness vs. factual, and which team owns the fix.)
- [ ] Have you ruled out sycophancy with an adversarial multi-turn test before spending effort on retrieval or grounding?
- [ ] Is every hop of a reasoning chain verified against ground truth, not just the final answer?
- [ ] Does your tool-call guardrail check argument *values* for provenance, not only names and types?
- [ ] Are summary or RAG claims checked sentence-by-sentence against the source, rather than approved on a fluency read?

**Related:** [The Master Axis: Factual vs. Faithfulness Hallucination](/learn/hallucinations/factual-vs-faithfulness-distinction), [Intrinsic vs. Extrinsic Hallucination](/learn/hallucinations/intrinsic-vs-extrinsic-hallucination), [Sycophancy: Fabrication Driven by Agreement](/learn/hallucinations/sycophancy-as-a-mode), [Deep Dive: How Errors Compound Across Reasoning Hops](/learn/hallucinations/multi-hop-compounding-deep-dive), [Worked Example: Fabricated Tool Names and Arguments](/learn/hallucinations/tool-call-argument-fabrication), [Worked Example: When a Summary Betrays Its Source](/learn/hallucinations/summarization-unfaithfulness)
