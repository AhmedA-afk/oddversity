---
title: "Implementation: ChainPoll-Style Ensemble Judging"
track: "hallucinations"
status: live
summary: "Poll a judge model with chain-of-thought several times on the same yes/no question and average the votes into a graded score."
duration: "7 min read"
---

A single LLM-as-judge call gives you one verdict, and one verdict from a model is exactly as noisy as one sample from that same model on any other task — ask it again and you might get a different answer. ChainPoll fixes this the same way [self-consistency](/learn/hallucinations/self-consistency-detector-impl) fixes it for a generator: poll multiple times and let agreement do the work, except here the thing being polled is a judge, not the original answer.

## What we're building

A `ChainPollDetector` that asks a judge model the same "is this answer hallucinated?" question M times, each time with chain-of-thought reasoning forced before the final verdict, and aggregates the M yes/no votes into a continuous score between 0 and 1. A score is more useful than a single binary call because it supports threshold tuning downstream instead of locking you into whatever one judge call happened to decide.

## Setup

One `judge_call(prompt, temperature)` stub, called M times per detection. Temperature needs to be nonzero — polling the same judge prompt at temperature 0 just gets you the same answer M times, the identical trap covered in [Intuition: If It Keeps Changing Its Story, Distrust It](/learn/hallucinations/consistency-implies-reliability), just applied to a judge instead of a generator.

## Build it

### Step 1: A judge prompt that forces reasoning before a parseable verdict

```python
JUDGE_PROMPT = """You are checking whether an answer contains a hallucination
(a claim not supported by the source, or a fact that's simply wrong).

Source: {source}
Question: {question}
Answer: {answer}

Think step by step: check each claim in the answer against the source and
your own knowledge. Then on the final line, output exactly one of:
ANSWER: YES
ANSWER: NO
"""

def judge_call(source: str, question: str, answer: str, temperature: float) -> str:
    prompt = JUDGE_PROMPT.format(source=source, question=question, answer=answer)
    # return your model client's response.content[0].text
    raise NotImplementedError("wire up your model client here")
```

> **Why this step?** Forcing chain-of-thought before the verdict matters — a judge asked to jump straight to YES/NO tends to pattern-match on fluency rather than actually checking claims. Making the final line a strict, fixed format (`ANSWER: YES` / `ANSWER: NO`) is what makes parsing reliable across M different reasoning traces that will otherwise vary a lot in wording.

### Step 2: Poll M times and parse strictly

```python
import re

def parse_verdict(response: str) -> bool:
    match = re.search(r"ANSWER:\s*(YES|NO)", response, re.IGNORECASE)
    if not match:
        raise ValueError(f"judge response had no parseable verdict:\n{response}")
    return match.group(1).upper() == "YES"

def poll(source: str, question: str, answer: str, m: int = 5) -> list[bool]:
    votes = []
    for _ in range(m):
        response = judge_call(source, question, answer, temperature=0.7)
        votes.append(parse_verdict(response))
    return votes
```

> **Why this step?** Raising on a malformed response instead of silently defaulting to a guess is a deliberate choice — a detector that quietly treats unparseable output as "not hallucinated" is a detector that fails silently exactly when it's needed most.

### Step 3: Aggregate into a continuous score

```python
from dataclasses import dataclass

@dataclass
class ChainPollResult:
    score: float          # fraction of votes saying "hallucinated"
    votes: list[bool]
    m: int

def chainpoll_detect(source: str, question: str, answer: str, m: int = 5) -> ChainPollResult:
    votes = poll(source, question, answer, m)
    score = sum(votes) / m
    return ChainPollResult(score=score, votes=votes, m=m)
```

> **Why this step?** Keeping the raw score instead of collapsing straight to a binary decision is the entire point — a score of 0.2 and a score of 0.8 are both "closer to no" and "closer to yes" respectively, but a score of 0.4 tells you something a single YES/NO never could: the judge itself is uncertain, which is worth routing differently than a confident 0.0 or 1.0.

## Run it

```python
clean_case = chainpoll_detect(
    source="The product ships within 3-5 business days.",
    question="How long does shipping take?",
    answer="Shipping takes 3 to 5 business days.",
    m=5,
)
# votes: [False, False, False, False, False] -> score = 0.0

fabricated_case = chainpoll_detect(
    source="The product ships within 3-5 business days.",
    question="How long does shipping take?",
    answer="Shipping is guaranteed to arrive the next day.",
    m=5,
)
# votes: [True, True, True, True, True] -> score = 1.0

boundary_case = chainpoll_detect(
    source="The refund policy was last updated in March.",
    question="When was the refund policy last updated, and by whom?",
    answer="The refund policy was updated in March by the legal team.",
    m=5,
)
# votes: [False, True, False, True, False] -> score = 0.4
```

The clean and fabricated cases separate cleanly at the extremes. The boundary case — an answer that adds a plausible but unverifiable detail ("by the legal team") to an otherwise-correct claim — lands at 0.4, and that's the value a binary judge call would have thrown away. A single call might have landed on YES or NO by chance; the graded score tells you the judge itself is split, which is exactly the signal you want for a claim that's genuinely ambiguous rather than clearly right or wrong.

## Harden it

- **Keep the chain-of-thought real, not decorative.** If every poll reaches the same reasoning almost verbatim, you're not getting M independent checks, you're getting one rationalization repeated M times — the same failure as running self-consistency at temperature 0.
- **Vary phrasing slightly across polls**, not just the sampling seed, if you can afford it — a small amount of prompt variation combined with nonzero temperature reduces the chance the judge just falls into the same reasoning groove every time.
- **Keep M modest.** Judge cost multiplies with M exactly the way self-consistency cost multiplies with N — 5 is a reasonable starting point for most uses; go higher only for claims expensive enough to justify it.

## Extend it

This lesson builds on the rubric-writing basics from [LLM-as-Judge for Faithfulness and Factuality](/learn/hallucinations/llm-as-judge-for-faithfulness) — ChainPoll is that same judge, run multiple times and aggregated rather than trusted once. For where a graded ChainPoll score sits against a single judge call, self-consistency, and the other methods on cost and coverage, see [Comparison: Choosing a Detection Method](/learn/hallucinations/detection-methods-compared).

**Related:** [LLM-as-Judge for Faithfulness and Factuality](/learn/hallucinations/llm-as-judge-for-faithfulness), [Implementation: A Self-Consistency Hallucination Detector](/learn/hallucinations/self-consistency-detector-impl), [Intuition: If It Keeps Changing Its Story, Distrust It](/learn/hallucinations/consistency-implies-reliability), [Comparison: Choosing a Detection Method](/learn/hallucinations/detection-methods-compared)
