---
title: "Cheatsheet: Detection Methods and When to Use Them"
track: "hallucinations"
status: live
summary: "Every detector in this module on one page — access needed, default parameters to start from, and the shared claim-decomposition recipe."
duration: "6 min read"
---

The reference version of this module: what to reach for, what to set as a first guess, and the one recipe that shows up inside three different techniques.

## Orientation — pick by scenario

| Scenario | Reach for first |
|---|---|
| Open QA, no source document | Self-consistency, escalate to ensemble cross-check for high stakes |
| RAG faithfulness (answer vs. a known source) | NLI entailment first pass, LLM-judge for the flagged subset |
| Reasoning / math / code | Self-verification (re-derivation mode) |
| Agent tool-call arguments or results | Self-verification plus a retrieval-based check on the underlying fact |
| Need a graded score, not a binary flag | ChainPoll-style polling of a judge |
| No fixed source, open-domain factuality | Retrieval-based fact check |

Full writeup with failure modes per method: [Comparison: Choosing a Detection Method](/learn/hallucinations/detection-methods-compared).

## Defaults — start here, then measure

| Method | Default parameter | Notes |
|---|---|---|
| Self-consistency | N = 5–7, flag if agreement < 0.6 | Temperature must be genuinely nonzero (~0.7–0.9) or you learn nothing. See [Implementation](/learn/hallucinations/self-consistency-detector-impl). |
| Self-verification | 1 extra generation, isolated context | Verification questions must never see the original draft. See [Implementation](/learn/hallucinations/self-verification-chain-impl). |
| Ensemble cross-check | 2–3 independent model families | Strict agreement (all sources match), not majority vote, is the safer default. See [Implementation](/learn/hallucinations/ensemble-cross-check-impl). |
| LLM-as-judge | 1 call, claim-by-claim verdicts | Force per-claim SUPPORTED/UNSUPPORTED/CONTRADICTED, never one holistic score. See [Concept](/learn/hallucinations/llm-as-judge-for-faithfulness). |
| ChainPoll | M = 5 polls, nonzero temperature | Score = fraction voting "hallucinated"; keep the raw score, don't collapse to binary early. See [Implementation](/learn/hallucinations/chainpoll-detector-impl). |
| NLI entailment | Flag anything not "entailment" | Both neutral and contradiction get flagged — they mean different things downstream. See [Implementation](/learn/hallucinations/nli-entailment-grounding-check-impl). |
| Retrieval-based check | 1+ query per atomic claim | Keep "unsupported" and "contradicted" as separate outcomes — see [Concept](/learn/hallucinations/retrieval-based-factuality-check). |

Every number above is a starting point, not a measured one — validate against your own labeled data before trusting it, per [Evaluating Your Detector](/learn/hallucinations/evaluating-your-detector).

## The claim-decomposition recipe

LLM-judge, NLI grounding, and retrieval-based checking all share this first step. Get it right once and all three methods benefit:

1. **Split into atomic claims** — one checkable fact per unit, not a whole paragraph.
2. **Resolve pronouns and dropped context** — "it was founded in 2015" needs the subject filled back in before it's checkable in isolation.
3. **Preserve numbers, dates, and names verbatim** — don't paraphrase the thing you're about to check.
4. **Keep bundled claims separate** — "founded in 2015 by two engineers" is two claims; a check that passes one and fails the other needs to say so.

## Black-box vs. white-box, quick reference

| | Black-box | White-box |
|---|---|---|
| Requires | API access only (text in/out, sometimes logprobs) | Model weights, hidden states, or full logit access |
| Unlocks | Self-consistency, self-verification, ensemble, judge, NLI, retrieval | Token-entropy scoring, hidden-state probes |
| Typical user | Anyone on a hosted frontier model | Teams self-hosting open weights |

Full breakdown: [Black-Box vs. White-Box Detection](/learn/hallucinations/black-box-vs-white-box-detection).

## Minimal interface to wire a detection stage around

```python
from dataclasses import dataclass

@dataclass
class DetectionResult:
    score: float          # 0 = trust it, 1 = likely hallucinated
    method: str
    flagged: bool
    detail: dict          # method-specific evidence for a human reviewer

def detect(answer: str, question: str, source: str | None = None) -> DetectionResult:
    ...  # plug in self-consistency, judge, NLI, or retrieval here
```

Every implementation in this module can sit behind this same shape — a score, a flag, and enough detail for a human to see *why* without re-running the check.

## When to escalate instead of retry

A flag is not automatically a retry. Escalate to a human rather than looping when: the flag came from a method with a known blind spot for this exact claim type (a stable-but-possibly-wrong self-consistency pass on a high-stakes fact), the retry budget is already exhausted, or the claim type is one your organization has decided always needs a human regardless of score. See [Escalation: Handing Off to a Human in the Loop](/learn/hallucinations/escalation-human-in-the-loop) and [Confidence-Gated Escalation](/learn/hallucinations/confidence-gated-escalation-impl) for the routing logic.

**Related:** [Comparison: Choosing a Detection Method](/learn/hallucinations/detection-methods-compared), [Deep Dive: Detect-Then-Regenerate vs. Prevent-at-Source](/learn/hallucinations/detecting-vs-preventing), [Common Mistakes: When Detectors Give False Comfort](/learn/hallucinations/detection-false-comfort), [Evaluating Your Detector](/learn/hallucinations/evaluating-your-detector)
