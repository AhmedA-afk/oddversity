---
title: "Implementation: FActScore-Style Atomic-Fact Evaluation"
track: "hallucinations"
status: live
summary: "Build a decomposer and verifier that score a generated biography's precision fact by fact, instead of judging the whole answer at once."
duration: "8 min read"
---

Judging a whole paragraph "true or false" in one shot hides exactly where it went wrong and lets one bad sentence in an otherwise-solid answer either sink the whole judgment or vanish inside it. FActScore-style scoring fixes that by splitting the answer into atomic facts first. This lesson builds one end to end.

## What we're building

An evaluator with two stages: `decompose_into_atomic_facts` turns a passage into a list of independent, minimal factual claims, and `verify_fact` checks each one against a trusted knowledge source. We run it on a generated biography of a fictional person to get a precision score — the fraction of stated facts that are actually supported.

## Setup

Standard library only, plus a `judge(prompt: str) -> str` callable standing in for a real LLM call — wrap your own provider's API behind this same signature and every function below works unchanged. The "knowledge source" here is a small dict simulating a retrieval or search step; swap it for a real lookup in production, exactly as [Grounding with Source Documents](/learn/hallucinations/grounding-with-source-documents) describes for the retrieval side of the same problem.

## Build it

### Step 1: A fictional subject and a knowledge source

```python
# Wholly fictional — invented for this exercise, not a real person.
KNOWLEDGE_SOURCE = {
    "name": "Dana Whitfield",
    "role": "Principal engineer at a mid-size fintech company",
    "joined_year": 2019,
    "prior_company": "a database startup",
    "degree": "B.S. in Computer Science",
    "known_for": "leading the migration to an event-driven architecture",
}

def knowledge_text() -> str:
    k = KNOWLEDGE_SOURCE
    return (
        f"{k['name']} is a {k['role']}, joined in {k['joined_year']} after "
        f"working at {k['prior_company']}. Holds a {k['degree']}. "
        f"Known for {k['known_for']}."
    )

# A biography an LLM generated about Dana Whitfield — includes one
# fabricated specific (the "Series B" detail and the graduation year
# appear nowhere in the knowledge source).
GENERATED_BIO = (
    "Dana Whitfield is a principal engineer at a fintech company, having "
    "joined in 2019 from a database startup where she helped raise a "
    "Series B round. She graduated with a B.S. in Computer Science in "
    "2011 and is best known for leading the company's migration to an "
    "event-driven architecture."
)
```

> **Why this step?** Using a fictional subject keeps the example self-contained and honest — no real biography is being checked or misrepresented, and the fabricated details are ones we planted on purpose so the scorer has something real to catch.

### Step 2: Decompose the answer into atomic facts

```python
DECOMPOSITION_PROMPT = """\
Break the following passage into a list of atomic facts. Each atomic
fact must be a single, independent, minimal factual claim — if a
sentence contains two separate claims, split it into two facts. Do
not combine multiple facts into one line. Output one fact per line,
with no numbering or extra commentary.

PASSAGE:
{passage}
"""

def decompose_into_atomic_facts(passage: str, judge) -> list[str]:
    raw = judge(DECOMPOSITION_PROMPT.format(passage=passage))
    return [line.strip("- ").strip() for line in raw.splitlines() if line.strip()]
```

> **Why this step?** Decomposition is what separates FActScore from whole-answer judging. A judge asked "is this biography accurate, yes or no" collapses six independent claims — five true, one fabricated — into a single verdict that either unfairly fails the whole thing or, more commonly, gets rounded to "mostly fine" and lets the fabrication through. Scoring each claim independently is what makes one bad detail visible instead of averaged away.

### Step 3: Verify each fact against the knowledge source

```python
VERIFY_PROMPT = """\
KNOWLEDGE SOURCE:
{source}

CLAIM:
{claim}

Does the knowledge source support this claim? Answer with exactly one
word: "supported", "contradicted", or "unverifiable" (the source is
simply silent on it, neither confirming nor denying).
"""

def verify_fact(claim: str, source_text: str, judge) -> str:
    verdict = judge(VERIFY_PROMPT.format(source=source_text, claim=claim))
    return verdict.strip().lower()
```

> **Why this step?** A three-way verdict matters more than it looks. "Contradicted" (the source says something different) and "unverifiable" (the source just doesn't mention it) are different failure modes with different implications — the biography's graduation year is unverifiable, not contradicted, since the knowledge source never states a year at all. Collapsing both into a single "unsupported" bucket loses that distinction, which is exactly the numerator/denominator care [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) argues for.

### Step 4: Score the fraction supported

```python
def factscore(passage: str, source_text: str, judge) -> dict:
    facts = decompose_into_atomic_facts(passage, judge)
    verdicts = [(f, verify_fact(f, source_text, judge)) for f in facts]
    supported = sum(1 for _, v in verdicts if v == "supported")
    return {
        "facts": verdicts,
        "supported_count": supported,
        "total_count": len(facts),
        "precision": supported / len(facts) if facts else None,
    }
```

## Run it

```python
result = factscore(GENERATED_BIO, knowledge_text(), judge)

for fact, verdict in result["facts"]:
    print(f"[{verdict:>12}] {fact}")

print(f"\nFActScore precision: {result['precision']:.2f} "
      f"({result['supported_count']}/{result['total_count']})")
```

Expected shape of the output: the role, join year, prior-company type, degree, and "known for" claims come back `supported`; the Series B detail comes back `unverifiable` or `contradicted` depending on how strictly the judge reads "helped raise a Series B round" against a source that never mentions funding at all; the 2011 graduation year comes back `unverifiable`, since the source states a degree but never a year. A reasonable run lands around 4/6 to 5/6 supported — one or two fabricated specifics caught, in a biography that reads as entirely plausible end to end.

## Harden it

- **Don't count "unverifiable" the same as "contradicted" in your headline number.** A source that's simply incomplete isn't the same failure as a claim that's actively wrong — some FActScore variants drop unverifiable facts from the denominator entirely rather than penalizing them as hallucinations. Decide explicitly and state it, per [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators).
- **Watch decomposition drift.** Run the same passage through decomposition twice and check the fact count is stable — an LLM decomposer can merge or split claims differently across runs, which silently shifts your denominator between eval runs even when nothing about the underlying answer changed.
- **Pair precision with a raw fact count.** A vague, six-word non-answer can post a perfect precision score by simply not stating anything checkable — precision alone rewards saying less, which is the same single-number gaming [What to Measure](/learn/hallucinations/what-to-measure-metrics) warns about generally.

## Extend it

Swap the dict-based `KNOWLEDGE_SOURCE` for a real retrieval call against your own documents, or a web search tool, so `verify_fact` checks against live evidence instead of a fixture. For a broader eval — not just precision on one passage, but faithfulness and factuality scored across a whole dataset with multiple prompt variants compared — wire this decomposition-and-verify pattern into the fuller harness built in [An LLM-as-Judge Evaluation Harness](/learn/hallucinations/llm-judge-eval-harness-impl).

**Related:** [Deep Dive: A Tour of Hallucination Benchmarks](/learn/hallucinations/hallucination-benchmarks-tour) · [Implementation: An LLM-as-Judge Evaluation Harness](/learn/hallucinations/llm-judge-eval-harness-impl) · [Grounding with Source Documents](/learn/hallucinations/grounding-with-source-documents) · [Hallucination Rate Denominators](/learn/hallucinations/hallucination-rate-denominators) · [What to Measure: Factuality, Faithfulness, and Abstention Metrics](/learn/hallucinations/what-to-measure-metrics)
