---
title: "Deep Dive: How Errors Compound Across Reasoning Hops"
track: "hallucinations"
status: live
summary: "Modeling per-hop reliability as multiplicative shows why long reasoning chains fail more than intuition suggests — and why the real risk is worse than the math."
duration: "8 min read"
---

*Optional depth: this extends [multi-hop compounding hallucination](/learn/hallucinations/multi-hop-compounding-hallucination) with the arithmetic behind why chains fail as often as they do, and a precise argument for why that arithmetic is optimistic. Read the base lesson first for the mechanism.*

## Tracing one poisoned hop

Take a four-hop question: *"What industry is the company that acquired the startup founded by the inventor of the widget-forming press currently in?"* Hop 1: identify the inventor. Hop 2: find their startup. Hop 3: find the acquirer. Hop 4: find the acquirer's current industry.

Suppose hop 1 goes wrong — the model attributes the invention to the wrong engineer, say because two similarly-named people worked on related patents around the same year. Every hop after that is now reasoning about a different, wrong person. Hop 2 doesn't fail — it correctly finds *that wrong person's* startup, if they have one, or fabricates one if they don't, because the question "what startup did this specific person found" is no longer being asked about anyone real. Hop 3 correctly (from its own perspective) finds an acquirer of that fabricated-or-wrong startup. Hop 4 correctly names that acquirer's industry.

The final answer is wrong. Every individual step, examined in isolation, looks like competent reasoning. That's the mechanism from the base lesson: a wrong intermediate fact doesn't produce a wrong-looking chain, it produces a *differently true* chain built on a false premise — internally consistent, externally worthless.

## The multiplicative model

Model each hop as an independent event with some probability `p` of being correct *given that everything it depends on so far is correct*. By the chain rule of probability, the odds the whole chain lands on the right final answer are:

```
P(all n hops correct) = p₁ × p₂ × p₃ × ... × pₙ
```

If every hop shares the same reliability `p`, this collapses to `p^n`. Concretely, for a 3-hop question where each hop is individually 90% reliable:

```
0.9 × 0.9 × 0.9 = 0.9³ = 0.729
```

Round to about 73%. A chain built from three steps that each look comfortably reliable on their own ends up wrong more than a quarter of the time — arithmetic that's easy to state and consistently underestimated by teams evaluating each hop's accuracy in isolation and stopping there. Push to four hops at the same 90% and the number drops further, to `0.9⁴ = 0.6561` — under two-thirds.

## Why this is the optimistic case, not the pessimistic one

The formula above is *exactly* correct as a chain-rule identity — `pᵢ` is defined as accuracy *conditional on* every prior hop being right, which is the only definition that makes the multiplication valid. The trap is where that per-hop reliability number usually comes from: teams measure "hop accuracy" by testing each hop type on questions with a correct, given premise — "given the right inventor, how often does the model find the right startup?" That's a fine measurement, but it's not what's happening once hop 1 has actually failed.

Once hop 1 is wrong, hop 2 isn't operating in the regime it was measured in at all. There is no "correct startup" for a person who didn't found one — the question has silently become ill-posed, and the model, having no mechanism to detect that, proceeds exactly as if it weren't. So the 90%-per-hop figure describes performance in the *good* branch of the tree; it says nothing about what happens in the branch where an earlier hop already broke, because that branch was never inside the definition. The multiplicative estimate is a correct calculation of "how often does everything go right," which is a real and useful number — but it is not a calculation of "how bad is it when something goes wrong," and that second question is unbounded by this formula: a broken chain can land anywhere, with no correction pulling it back toward the true answer partway through.

The second, aggravating factor: **you cannot detect the break by reading the chain.** [Chain-of-thought](/learn/hallucinations/multi-hop-compounding-hallucination) makes the steps visible, but visible isn't the same as verifiable — a fluent, well-structured hop 3 built on a wrong hop 1 reads exactly like a fluent, well-structured hop 3 built on a correct one. Confidence language doesn't drop. Internal consistency doesn't drop. The only thing that's actually wrong is invisible from inside the chain: the premise.

## What this motivates, precisely

The math says two things worth separating. First, even at genuinely good per-hop reliability, chains longer than two or three hops accumulate real, non-negligible failure rates purely from multiplication — this alone justifies decomposing a long chain into independently checkable pieces rather than trusting one long uninterrupted generation, as covered in [the base lesson](/learn/hallucinations/multi-hop-compounding-hallucination) and [task decomposition](/learn/prompt-engineering/task-decomposition). Second, and more importantly: because a broken hop produces a coherent-looking downstream chain rather than an obviously broken one, **verification has to happen at each hop, against ground truth, before the next hop consumes it** — not at the end, and not by re-reading the reasoning trace for signs of trouble, because there won't be any. [Self-verification techniques](/learn/hallucinations/self-verification-techniques) and [ensemble cross-checking](/learn/hallucinations/ensemble-cross-checking) both apply here specifically at the intermediate-hop level, not just as a final-answer sanity check — verifying only the last hop verifies the arithmetic of a chain that may already be reasoning about the wrong company entirely.

**Related:** [Multi-Hop Compounding: How One Wrong Step Snowballs](/learn/hallucinations/multi-hop-compounding-hallucination), [Self-Verification: Having the Model Check Its Own Work](/learn/hallucinations/self-verification-techniques), [Ensemble Cross-Checking](/learn/hallucinations/ensemble-cross-checking), [Worked Example: One Wrong Answer, Different Diagnoses](/learn/hallucinations/same-output-two-failure-modes)
