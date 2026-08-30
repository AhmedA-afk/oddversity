---
title: "Self-Consistency: Sampling and Voting"
track: "prompt-engineering"
status: live
summary: "The math behind why majority voting over sampled reasoning paths works, and precisely where that math breaks down."
duration: "9 min read"
---

*This deepens [self-consistency sampling](/learn/prompt-engineering/self-consistency-sampling) with the mechanism underneath it. Treat it as optional depth — the earlier lesson is enough to use the technique; this one is for knowing precisely when to trust it.*

## The mechanism, precisely restated

Sample the same chain-of-thought prompt N times at nonzero [temperature](/learn/llm-foundations/sampling-temperature-top-p), extract the final answer from each sample, and return whichever answer appears most often. The core claim is that agreement across independently-sampled reasoning paths is a stronger correctness signal than any single path's fluency. What follows is *why*, and how far that claim actually reaches.

## Why majority voting works: a toy derivation

Make two simplifying assumptions, both worth stating explicitly because the next section is about what happens when they don't hold:

1. Each sampled path's final answer is correct with some fixed probability *p*, independent of the other samples.
2. Wrong answers don't systematically cluster on one specific wrong value.

This is a simplified version of the [Condorcet Jury Theorem](/learn/maths-foundations/probability-basics-for-ai): with N independent "voters" each correct with probability *p* > 0.5, the probability that a majority vote is correct is:

```text
P(majority correct) = sum over k > N/2 of C(N, k) * p^k * (1-p)^(N-k)
```

Plugging in p = 0.7 for odd N (odd avoids ties):

| N | P(majority correct) |
|---|---|
| 1 | 0.700 |
| 3 | 0.784 |
| 5 | 0.837 |
| 7 | 0.874 |
| 9 | 0.901 |
| 15 | ≈ 0.95 |

The gains shrink as N grows: roughly +8.4 points going from 1 to 3 samples, +5.3 points from 3 to 5, +3.7 from 5 to 7, +2.7 from 7 to 9. Doubling your sample count does not double your accuracy gain — it buys a progressively smaller slice of the remaining error, which is exactly the diminishing-returns curve the earlier lesson describes qualitatively. This table makes it precise, under the stated assumptions.

## Where the toy model overstates the benefit

Both assumptions above are simplifications, and real reasoning tasks violate them in specific, predictable ways:

**Errors aren't independent.** If a problem contains one tempting misreading — an ambiguous referent, a unit-conversion trap, a plausible-but-wrong shortcut — many sampled paths can converge on the *same* mistake, especially if temperature isn't high enough to produce genuinely different framings rather than reworded copies of one framing. When errors correlate this way, N "independent" votes are really fewer effective votes than N, and the table above overstates how much protection you're buying.

**p itself isn't fixed, and it can be below 0.5.** The derivation assumes *p* > 0.5 — each voter more likely right than wrong. On a genuinely hard problem, per-sample accuracy can fall under 50%. When that happens, majority voting doesn't fail neutrally — it actively *amplifies* the wrong answer, because whatever the most common misconception is, more samples make it the more confident-looking winner, not less. Self-consistency sharpens whatever the underlying tendency already is. It's a variance-reduction tool on top of an already-reasonable base rate, not a way to rescue a task the model is bad at to begin with.

This is the same caution as [what chain-of-thought actually does](/learn/prompt-engineering/what-chain-of-thought-actually-does): reasoning tokens are compute, not a correctness guarantee, and self-consistency is built entirely on the assumption that the compute is landing on the right answer *more often than not* per sample.

## Reading the cost curve in practice

Cost scales linearly in N — N full calls, N times the tokens, though wall-clock latency stays close to a single call if you run the samples in parallel. Accuracy gains shrink per the table above. The practical rule: pick the smallest N where held-out eval accuracy — see [building an eval dataset](/learn/prompt-engineering/building-an-eval-dataset) — stops improving meaningfully, rather than assuming a bigger number is automatically safer. Use odd N to avoid ties, and if you do hit a near-even split (say 3-2 at N=5), that split is itself informative: treat it as a low-confidence result worth routing differently than a lopsided 5-0.

## When to reach for it vs alternatives

Self-consistency's whole mechanism is *ensembling independent full attempts and voting*. That's a good fit exactly when a single attempt is decent but not perfect, and errors scatter rather than repeat. It's the wrong tool when the failure mode is a shared early mistake that every attempt would make the same way — a discrete search problem where one wrong first move dead-ends the whole solution needs branching and pruning instead, which is what [tree-of-thought](/learn/prompt-engineering/tree-of-thought-when-worth-it) is for. And on a model with native reasoning, a longer single deliberation that can backtrack in-phase — see [extended thinking and reasoning-effort budgets](/learn/prompt-engineering/extended-thinking-budgets) — sometimes buys similar reliability more cheaply than ensembling several shallower attempts. Test both before assuming either one wins.

**Related:** [Self-Consistency Sampling](/learn/prompt-engineering/self-consistency-sampling), [Sampling, Temperature, and Top-p](/learn/llm-foundations/sampling-temperature-top-p), [Probability Basics for AI](/learn/maths-foundations/probability-basics-for-ai), [Tree-of-Thought: When the Complexity Pays Off](/learn/prompt-engineering/tree-of-thought-when-worth-it), [Extended Thinking and Reasoning-Effort Budgets](/learn/prompt-engineering/extended-thinking-budgets)
