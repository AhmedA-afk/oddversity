---
title: "Worked Example: Voting Over Samples on a Hard Classification"
track: "prompt-engineering"
status: live
summary: "Sampling five labels on an ambiguous moderation call, and the small script that tallies the majority vote."
duration: "7 min read"
---

A single greedy call can lock onto the wrong reading of an ambiguous case the same way it locks onto anything else — confidently, and just once. Sampling several times and voting gives the correct reading a chance to outnumber it.

## The setup

A content-moderation queue needs to label comments `toxic` or `not_toxic`. Policy: sarcasm or criticism directed at a product or company is **not** toxic; toxic requires a personal attack, harassment, or hate directed at a person. General complaints, however sharp, don't clear that bar on their own.

Comment: *"Oh great, another 'update' that breaks everything. Real professional work there."*

By policy this is `not_toxic` — sarcastic, negative, but aimed at a product update, not at a person. It's exactly the kind of case a tone-sensitive read can misfire on.

## Step by step

**A single greedy call** (temperature 0): illustrative output — **`toxic`**. A plausible route: the sarcastic tone and phrases like "breaks everything" carry enough negative-sentiment signal to outweigh the fact that nothing in the comment targets a person, and greedy decoding commits to whichever single reading is most probable, with nothing to catch it if that reading underweights the policy's actual bar.

> **Why this step?** This establishes the failure mode voting is meant to catch: greedy decoding takes the model's single most probable path once. If that path leans on tone over policy, that's the label you get, with no second look.

**Self-consistency: sample five independent labels** at a nonzero temperature (e.g. 0.7):

```python
from collections import Counter

def self_consistency_vote(model_call, prompt: str, n: int = 5):
    """Sample n independent labels for the same prompt and return the
    majority label plus the full tally, so callers can see how split the
    vote was -- a 3-2 split is a much weaker signal than 5-0."""
    labels = [model_call(prompt) for _ in range(n)]
    tally = Counter(labels)
    winner, _ = tally.most_common(1)[0]
    return winner, tally
```

Illustrative run:

```python
winner, tally = self_consistency_vote(classify_toxicity, comment_prompt)
# labels sampled: ["not_toxic", "toxic", "not_toxic", "not_toxic", "not_toxic"]
# tally: Counter({'not_toxic': 4, 'toxic': 1})
# winner: 'not_toxic'
```

> **Why this step?** Different samples land on different framings of the same policy question — one sample weights the sarcastic tone heavily and lands on `toxic`, but most key correctly on "no personal target, product complaint only." Because the policy-correct reading is more probable than the tone-driven misread even when it isn't certain, it wins the vote more often than it loses.

**Compare to the single greedy call:** in this run, the greedy call alone landed on the minority reading (`toxic`); the five-sample vote landed on the majority, policy-correct reading (`not_toxic`) 4-to-1. This one comparison demonstrates the mechanism on a single case — it isn't a general accuracy number. Establishing a real accuracy gain requires running this across a labeled set, not one example; see [building an eval dataset](/learn/prompt-engineering/building-an-eval-dataset).

## Where it breaks (+fix)

**Break 1 — temperature too low.** If temperature isn't high enough to produce genuinely different framings, all five samples can collapse onto the same reading — including a wrong one — giving a unanimous but wrong vote (5-0 for `toxic`) that looks more confident than a single call ever could, without being any more correct.

**Break 2 — treating every win as equally confident.** A naive implementation that only returns `most_common(1)` throws away the shape of the vote. A 3-2 split and a 5-0 split mean very different things, and code that doesn't check the tally can't tell them apart.

**Fix:** raise temperature enough to get real variation in reasoning framing, not just reworded restatements of one framing. Add a confidence gate on the tally itself — for example, only auto-apply a label when the winning count clears a threshold like 4 of 5, and route closer splits to human review instead of auto-deciding them.

## Takeaways

- Self-consistency doesn't reason better on any single call — it detects when the "obvious" tone-driven reading and the policy-correct reading diverge, by taking several independent looks and letting the more robust reading outvote a plausible-but-wrong one.
- The tally is itself useful information, not just the winner — discard it and you discard the signal that tells you how much to trust the result.
- One worked example shows the mechanism, not the size of the real-world gain. Validate on a labeled eval set before trusting this in production, and see [self-consistency: sampling and voting](/learn/prompt-engineering/self-consistency-sampling-explained) for how the accuracy-vs-cost curve behaves as you change N.

**Related:** [Self-Consistency Sampling](/learn/prompt-engineering/self-consistency-sampling), [Self-Consistency: Sampling and Voting](/learn/prompt-engineering/self-consistency-sampling-explained), [Building an Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset), [Prompt Evaluation Basics](/learn/prompt-engineering/prompt-evaluation-basics), [Which Reasoning Technique When](/learn/prompt-engineering/reasoning-technique-decision-guide)
