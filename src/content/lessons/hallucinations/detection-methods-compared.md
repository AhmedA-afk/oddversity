---
title: "Comparison: Choosing a Detection Method"
track: "hallucinations"
status: live
summary: "Six detection methods side by side on cost, access needed, what they catch, and where each one has a blind spot."
duration: "8 min read"
---

Every method in this module answers the same underlying question — is this output likely hallucinated — but they answer it from different evidence, at different costs, with different blind spots. This is the map for picking one, or several, for a given detection stage.

## Self-consistency (resampling)

**How it works:** sample the same prompt N times at nonzero temperature, cluster the answers, and measure agreement. Built in [Implementation: A Self-Consistency Hallucination Detector](/learn/hallucinations/self-consistency-detector-impl).

**When it wins:** open-domain factual questions with a short, checkable answer, no source document available, and you need a cheap black-box signal without standing up a search index or a second model provider.

**Failure mode:** a stable, widely-repeated wrong answer resamples identically and passes with a perfect agreement score — see [Intuition: If It Keeps Changing Its Story, Distrust It](/learn/hallucinations/consistency-implies-reliability). It catches variance, not bias.

**Relative cost:** moderate — N generation calls, no extra model or search infrastructure needed.

## Self-verification

**How it works:** the model drafts, generates independent verification questions, answers them in a fresh context, then revises. Built in [Implementation: Self-Verification and Chain-of-Verification](/learn/hallucinations/self-verification-chain-impl).

**When it wins:** reasoning-heavy tasks with a checkable structure — arithmetic, code, multi-step derivations — or catching sloppy, unsupported leaps in a first draft that a second look genuinely re-derives differently.

**Failure mode:** a belief shared between the draft and the fresh verification pass survives untouched, because both draw on the same parametric memory — see [Worked Example: When Self-Verification Rubber-Stamps a Lie](/learn/hallucinations/self-verification-when-it-fails).

**Relative cost:** low — one extra full generation, no external infrastructure.

## Ensemble cross-checking

**How it works:** send the same question to two or three different model families and flag disagreement. Built in [Implementation: Cross-Checking Across Multiple Models](/learn/hallucinations/ensemble-cross-check-impl).

**When it wins:** high-stakes factual claims where you can afford multiple model calls and want independence from any one model's specific training-data gaps.

**Failure mode:** correlated errors — model families trained on overlapping web-scale data can share the exact same misconception and agree on it confidently.

**Relative cost:** high — cost scales with the number of sources, typically 2-3x a single call, plus managing multiple provider integrations.

## LLM-as-judge

**How it works:** a separate model call decomposes an answer into atomic claims and scores each one against a rubric — supported/unsupported/contradicted for faithfulness, true/false/uncertain for factuality. Explained in [LLM-as-Judge for Faithfulness and Factuality](/learn/hallucinations/llm-as-judge-for-faithfulness).

**When it wins:** claims that need real judgment rather than a mechanical check — does this answer overstate what the source actually said, is this nuance accurate — and cases with no single hard ground-truth label available.

**Failure mode:** judge self-bias when the judge shares a family with the generator, position bias in comparative judging, and being swayed by fluent wording over actual accuracy.

**Relative cost:** low-to-moderate for a single verdict call, higher (Mx) if polled ChainPoll-style for a graded score.

## NLI entailment grounding

**How it works:** a small, specialized NLI model classifies each (source sentence, claim) pair as entailment, neutral, or contradiction. Built in [Implementation: NLI Entailment as a Grounding Check](/learn/hallucinations/nli-entailment-grounding-check-impl).

**When it wins:** RAG faithfulness checks where the correct source document is already in hand — fast, cheap, no LLM tokens spent on the check itself, well suited as a first-pass filter across every claim.

**Failure mode:** a blunt three-way label with no explanation, sensitive to how far the claim's wording drifts from the source's, and dependent on the claim-to-source matching step being done well.

**Relative cost:** lowest of the six — a small model, sub-second per check, no per-token LLM billing.

## Retrieval-based fact checking

**How it works:** decompose the answer into claims, query a search index or trusted source for each one, and score the support the retrieved evidence gives. Explained in [Retrieval-Based Fact Checking as Detection](/learn/hallucinations/retrieval-based-factuality-check).

**When it wins:** open-domain factuality checks where there's no pre-supplied source to check against — the one method in this module that introduces genuinely new evidence the model never had at generation time.

**Failure mode:** "no evidence found" is ambiguous between false, obscure-but-true, and simply outside index coverage — a nuance that complicates evaluation as much as detection.

**Relative cost:** highest — search calls, claim extraction, and scoring, per claim, plus the ongoing cost of maintaining index coverage.

## Decision table

| Method | Access needed | Relative cost | Catches | Blind spot |
|---|---|---|---|---|
| Self-consistency | black-box, N samples | Moderate | Instability / variance | Stable systematic error |
| Self-verification | black-box, 1 extra call | Low | Reasoning slips, unsupported leaps | Shared parametric belief |
| Ensemble cross-check | black-box, 2-3+ model APIs | High | Idiosyncratic single-model gaps | Correlated training-data errors |
| LLM-as-judge | black-box, 1+ judge calls | Low–moderate | Faithfulness, nuanced claims | Judge self-bias, fluency bias |
| NLI entailment | small model + source in hand | Lowest | Extrinsic additions, contradictions | No source = no check; blunt labels |
| Retrieval-based check | search index/API | Highest | Open-domain factual falsehoods | Ambiguous "not found," coverage gaps |

## How to choose

**Open QA, no source document, need a cheap signal:** start with self-consistency; escalate to ensemble cross-checking for claims where the cost of being wrong justifies the extra model calls.

**RAG faithfulness — the answer should only say what the source said:** run NLI entailment as a cheap first pass across every claim, and reserve LLM-as-judge for the subset it flags, where nuance actually matters. When a claim fails, [corrective RAG](/learn/rag/corrective-self-rag) is the fix that goes back for better retrieval rather than just flagging.

**Agent tool calls and structured claims:** self-verification's re-derivation mode catches computation and logic errors directly; pair it with a retrieval-based check for facts the tool result should match against something external.

**Reasoning-heavy tasks (math, multi-step logic, code):** self-verification's re-derivation mode is the strongest fit — the check is a genuinely independent computation, not a second draw from the same memory.

**Need a graded score, not a binary flag, for threshold tuning:** [ChainPoll-style polling](/learn/hallucinations/chainpoll-detector-impl) turns a single judge call into a continuous score that separates confident passes from genuinely ambiguous cases.

No single method here is sufficient alone for anything genuinely high-stakes — [Common Mistakes: When Detectors Give False Comfort](/learn/hallucinations/detection-false-comfort) is the reason why, and most production detection stages combine at least two methods whose blind spots don't overlap.

**Related:** [Implementation: A Self-Consistency Hallucination Detector](/learn/hallucinations/self-consistency-detector-impl), [Implementation: Cross-Checking Across Multiple Models](/learn/hallucinations/ensemble-cross-check-impl), [LLM-as-Judge for Faithfulness and Factuality](/learn/hallucinations/llm-as-judge-for-faithfulness), [Retrieval-Based Fact Checking as Detection](/learn/hallucinations/retrieval-based-factuality-check), [Cheatsheet: Detection Methods and When to Use Them](/learn/hallucinations/detection-cheatsheet)
