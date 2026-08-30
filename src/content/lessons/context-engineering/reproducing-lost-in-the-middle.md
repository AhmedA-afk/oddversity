---
title: "Reproducing Lost in the Middle Yourself"
track: "context-engineering"
status: live
summary: "A needle-in-a-haystack script that places one fact at five positions and plots the U-curve on your own model and window size."
duration: "8 min read"
---

Reading about the U-shaped recall curve is one thing. Watching it appear from a script run against the model you actually use, at the context lengths you actually run, is what tells you whether — and how badly — it applies to your setup. This lesson walks that experiment end to end.

## The setup

The design is simple by intention: one needle fact, one long haystack of filler, five positions to test. Build a haystack of unrelated filler paragraphs long enough to matter (a few thousand tokens is enough to see the effect; scale it to match your production context length for a result that actually transfers). Insert one clearly extractable fact — something with no plausible substitute, so a correct answer is unambiguous:

```python
NEEDLE = "The internal reference code for this year's Q3 planning cycle is ZK-4471."
QUESTION = "What is the internal reference code for this year's Q3 planning cycle?"
```

Pick five insertion points as fractions of total length: 0%, 25%, 50%, 75%, 100%. At each one, build a full context by inserting the needle sentence into the filler at that fractional position, then ask the question at the end of the prompt (after the filler, mimicking how a real query trails retrieved context).

```python
def build_context(filler_paragraphs: list[str], needle: str, position_frac: float) -> str:
    n = len(filler_paragraphs)
    idx = int(n * position_frac)
    idx = min(idx, n)  # clamp for the 100% case
    parts = filler_paragraphs[:idx] + [needle] + filler_paragraphs[idx:]
    return "\n\n".join(parts)
```

## Step by step

### Step 1: generate or source your filler

Filler needs to be plausible, on-topic-adjacent prose that doesn't itself answer the question — company policy documents, meeting notes, product descriptions, anything with no needle-shaped facts buried in it by accident. Reusing real (but irrelevant to the test question) documents from your own corpus is better than generated lorem-ipsum text, because it matches the *kind* of noise your production system will actually surround the needle with.

> **Why this step?** A haystack that's too clean (obviously synthetic filler) or accidentally informative (filler that contains a similar-looking fake reference code) will distort your curve in either direction. The goal is filler that's realistic noise, not noise that's rigged to help or hurt the needle.

### Step 2: run all five positions, multiple trials each

Run each of the five positions several times — filler order or content can vary slightly between trials if you want to average out noise from any one specific arrangement — and score whether the model's answer contains the correct code.

```python
import re

def check_answer(model_output: str, expected: str) -> bool:
    return expected in model_output

results = {}
for frac in [0.0, 0.25, 0.5, 0.75, 1.0]:
    hits = 0
    trials = 5
    for _ in range(trials):
        context = build_context(filler_paragraphs, NEEDLE, frac)
        prompt = f"{context}\n\n{QUESTION}"
        output = call_model(prompt)          # your model call here
        hits += check_answer(output, "ZK-4471")
    results[frac] = hits / trials
```

> **Why this step?** A single trial per position tells you almost nothing — a lucky or unlucky sample at any one position can flatten or exaggerate the curve. Averaging over several trials per position is what turns "the model got it right this one time" into a rate you can actually compare across positions.

### Step 3: plot recall against position

```python
import matplotlib.pyplot as plt

positions = list(results.keys())
recall = list(results.values())

plt.plot(positions, recall, marker="o")
plt.xlabel("Needle position (fraction of context)")
plt.ylabel("Recall rate")
plt.ylim(0, 1.05)
plt.title("Lost-in-the-middle recall curve")
plt.show()
```

> **Why this step?** The numbers alone are hard to read as a shape; the plot is what makes the U (or its absence) visually obvious, and it's a much easier artifact to compare across model versions or context lengths than a table.

### Step 4: read the shape, not just the endpoints

If you see high recall at 0% and 100% and a dip in the middle — that's the effect, confirmed on your own setup. If the dip is shallow, the effect is present but mild at this length; if it's steep, position matters a lot here and ordering work (see [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention)) will pay off. If you see *no* dip at all, don't conclude the effect doesn't exist in general — it may mean your filler wasn't distracting enough, your context was too short to expose it, or this particular model handles this particular length well. Rerun at a longer length before drawing that conclusion.

## Where it breaks (and the fix)

**The needle is guessable from world knowledge.** If your fact is something a model could plausibly hallucinate correctly without reading the context at all (a common city, a well-known date), a "hit" doesn't prove retrieval worked. Fix: use an arbitrary, made-up identifier like the reference code above — something with zero prior probability of being right by chance.

**Filler that's too short to matter.** If your haystack is only a few hundred tokens, you likely won't see much of a dip at all — the effect widens and deepens with length and distractor count. Fix: test at the length your production context actually reaches, not a toy length that happens to be convenient.

**Model and window size change the depth of the dip, not just its presence.** A model advertised with a very large context window can still show a real dip well inside that window — a huge maximum doesn't mean uniform attention across all of it. Conversely, a shorter context with heavy distractor density can show a dip nearly as steep as a much longer one with sparse distractors, because it's competing content, not raw token count alone, that drives the effect (see [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context)). Don't assume a result from one model or one length transfers to another — rerun this script whenever you change either.

## Takeaways

- The U-curve isn't something you have to take on faith — it's a script away from being visible on your own model and your own context lengths.
- A single-trial, single-position test tells you nothing about position sensitivity; you need the spread across positions to see the shape.
- Depth and width of the dip vary by model and length — the *existence* of the effect generalizes; its *severity* at your specific setup does not, and that severity is exactly what should drive how much ordering effort (see [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention)) is worth investing.

**Related:** [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained), [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention), [Signal-to-Noise in the Window](/learn/context-engineering/signal-to-noise-in-context), [Testing Whether Context Actually Helps](/learn/context-engineering/context-window-testing-and-eval)
