---
title: "Rubric Scoring With an LLM Judge"
track: "prompt-engineering"
status: live
summary: "A judge prompt with fixed score anchors, plus a runner that flags exactly where the judge and a human disagree."
duration: "8 min read"
---

Exact-match scoring works when there's one correct string. It falls apart the moment your prompt writes a paragraph instead of a date - which is most prompts. This lesson builds the scorer for that other, larger case.

## What we're building

A rubric with concrete score anchors, a judge prompt that applies it, and a small runner that scores a batch of outputs and - critically - flags every case where the judge's score and a human's score disagree by more than a point. The disagreements are the point of the exercise, not the average score.

## Setup

You need an open-ended task to grade, since [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset) already covered exact-match for the due-date extractor and explicitly punted open-ended scoring to this lesson. We'll grade a customer-support reply drafter: given a ticket, the model writes the reply a human agent will send. There's no single correct reply, so string equality can't score it.

```
support-eval/
  outputs.jsonl      # ticket, drafted reply, human rubric scores
  judge.py
```

## Build it

### Step 1: Write the rubric before you write the judge prompt

Pick a small number of dimensions and give each one concrete anchors - what a 1, 2, and 3 actually look like, in specifics, not adjectives. Anchors are what keep a judge from drifting: "good tone" means something different every time a model reads it cold, but "does not blame the customer for the company's error" is checkable.

| Dimension | 1 (fails) | 2 (partial) | 3 (meets) |
|---|---|---|---|
| Accuracy | States something false or not in the ticket | Correct but omits a detail needed to act on it | Every claim is supported by the ticket, nothing invented |
| Tone | Blames the customer, curt, or robotic boilerplate | Polite but generic, doesn't acknowledge specifics | Warm, specific to this customer's situation, no boilerplate |
| Completeness | Ignores part of the request | Addresses the main ask, skips a secondary one | Every part of the request is addressed |

> **Why this step?** A rubric without anchors just relocates the ambiguity from "is this good" to "what does the judge think good means today." Anchors make the scoring criteria the same artifact every time, whether a human or a model applies them.

### Step 2: Write the judge prompt

```
You are grading a customer support reply against a fixed rubric.
Score each dimension 1-3 using ONLY the anchors below - do not invent
your own standard of quality, and do not reward length or politeness
that isn't backed by the anchors.

Rubric:
Accuracy: 1 = states something false or not in the ticket.
          2 = correct but omits a needed detail.
          3 = every claim is supported by the ticket.
Tone: 1 = blames the customer, curt, or boilerplate.
      2 = polite but generic.
      3 = warm and specific to this situation.
Completeness: 1 = ignores part of the request.
              2 = addresses the main ask only.
              3 = addresses every part of the request.

Ticket:
{ticket}

Drafted reply:
{reply}

First write one sentence of rationale per dimension, citing the specific
line in the reply that earns or loses points. Then output a JSON object,
exactly this shape, and nothing after it:
{{"accuracy": <1-3>, "tone": <1-3>, "completeness": <1-3>}}
```

Two choices here are deliberate. Rationale comes **before** the JSON, so the model has to justify a score in its own generated text before committing to a number - a judge asked to jump straight to a number has nothing to check itself against. And the rubric text is pasted into every call verbatim rather than summarized, so the judge is never working from a fuzzier version of the standard than the one you wrote.

> **Why this step?** An LLM judge without anchors tends toward two known failure patterns: leniency (everything clusters at the top of the scale) and length bias (longer answers score higher independent of whether they're better). Forcing per-dimension rationale against literal anchor text, in that order, is the cheapest available defense against both.

### Step 3: Score a batch and compare to human labels

```python
import json

def call_judge(prompt: str) -> dict:
    """Stand-in for your model call - parse the trailing JSON object."""
    raise NotImplementedError

JUDGE_PROMPT = open("judge_prompt.txt").read()

def judge_output(ticket: str, reply: str) -> dict:
    prompt = JUDGE_PROMPT.format(ticket=ticket, reply=reply)
    return call_judge(prompt)

def load_outputs(path):
    with open(path) as f:
        return [json.loads(line) for line in f if line.strip()]

def score_batch(path):
    rows = load_outputs(path)
    for row in rows:
        row["judge"] = judge_output(row["ticket"], row["reply"])
    return rows
```

Each line in `outputs.jsonl` already carries a `human` score dict from a reviewer, collected the same way you'd collect expected values for an exact-match set - by having someone competent look at the case and write down the right answer.

> **Why this step?** Running the judge is the easy half. The batch only earns its keep once you can point at the exact rows where it and a human disagree.

### Step 4: Flag disagreements, don't average them away

```python
DIMENSIONS = ("accuracy", "tone", "completeness")

def flag_disagreements(rows, threshold=1):
    flagged = []
    for row in rows:
        gaps = {d: abs(row["judge"][d] - row["human"][d]) for d in DIMENSIONS}
        if max(gaps.values()) >= threshold + 1:
            flagged.append({"id": row["id"], "gaps": gaps,
                             "judge": row["judge"], "human": row["human"]})
    return flagged

def report(rows):
    flagged = flag_disagreements(rows)
    agree = len(rows) - len(flagged)
    print(f"Agreement (within 1 point on every dimension): {agree}/{len(rows)}")
    for f in flagged:
        print(f"  [{f['id']}] gaps={f['gaps']} judge={f['judge']} human={f['human']}")

if __name__ == "__main__":
    rows = score_batch("outputs.jsonl")
    report(rows)
```

A gap of exactly 1 point (2 vs. 3) is normal reviewer noise. A gap of 2 points (1 vs. 3) means the judge and a human looked at the same reply and reached opposite conclusions about whether it's usable - that's the case worth reading by hand.

> **Why this step?** An overall correlation number can look reassuring while hiding one systematically mis-scored dimension. Printing the actual disagreement rows is what tells you *why* the judge is off, not just *that* it is.

## Run it

```
$ python judge.py
Agreement (within 1 point on every dimension): 5/6
  [reply-004] gaps={'accuracy': 0, 'tone': 2, 'completeness': 0} judge={'accuracy': 3, 'tone': 3, 'completeness': 3} human={'accuracy': 3, 'tone': 1, 'completeness': 3}
```

Reading `reply-004` by hand: the drafted reply was factually correct and complete, but opened with "As previously explained..." to a customer who'd only contacted support once. The judge scored tone a 3; the human, who caught the passive-aggressive undertone, scored it a 1. That's a real judge blind spot, not noise - tone anchors describing *content* ("blames the customer") don't fully capture *register*, and the fix is tightening the anchor, not shrugging off the disagreement.

## Harden it

- **Calibrate against a human sample before trusting the judge at scale.** Run the judge against every case a human has already scored, look at every flagged disagreement, and only start relying on judge-only scoring for the dimensions where agreement is consistently high.
- **Use a different model as judge than the one generating the output.** A model grading its own outputs can share its own blind spots with itself - it's less likely to catch a mistake it wouldn't have made, precisely the mistakes you most need caught.
- **Recalibrate whenever the judge model changes**, not just the worker model - the judge is a prompt too, subject to the same portability risk covered in [Portability: Surviving a Model Swap](/learn/prompt-engineering/prompt-portability-across-models-strategy).
- **Keep sampling human review on a slice, ongoing**, even after calibration - a judge that agreed with humans last quarter isn't guaranteed to agree after the task, the rubric, or the traffic shifts.

## Extend it

Flagged disagreements aren't dead ends - feed the reply that exposed a rubric gap into your golden set as a new case, the same way [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset) recommends folding production failures back in. Once the judge is calibrated, it becomes the scoring mechanism a golden-set gate can run in CI - see [Regression Tests: Keeping a Golden Set Green](/learn/prompt-engineering/regression-tests-for-prompts) for what changes when the gate's pass/fail condition is a rubric threshold instead of exact-match.

**Related:** [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset), [Regression Tests: Keeping a Golden Set Green](/learn/prompt-engineering/regression-tests-for-prompts), [Structured Output](/learn/prompt-engineering/structured-output), [JSON Schema in Prompts](/learn/prompt-engineering/json-schema-in-prompts), [Why You Evaluate Before You Ship](/learn/prompt-engineering/why-eval-before-ship)
