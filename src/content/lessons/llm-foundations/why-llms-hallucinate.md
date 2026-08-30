---
title: "Why LLMs Hallucinate"
track: "llm-foundations"
status: live
summary: "Next-token training has no reject option and no truth signal — a hallucination is the objective working normally on a question it can't verify."
duration: "6 min read"
---

A hallucination isn't the model glitching. It's the exact same mechanism that writes a correct sentence, running on a question where "sounds right" and "is right" happen to have come apart.

## What it is

A hallucination is a fluent, confident output that isn't grounded in fact or in the source material provided — a fabricated citation, a wrong date stated with total certainty, a function that doesn't exist described as if it does. The full landscape of hallucination *types* (factual errors, unfaithfulness to a given source, fabricated references) is covered in [a hallucination taxonomy and its mitigations](/learn/llm-foundations/hallucination-taxonomy-and-mitigations); this page is about the single mechanism that makes all of them possible in the first place.

## The mental model

[Pretraining](/learn/llm-foundations/pretraining-explained) optimizes one objective: given the tokens so far, predict the next one. The loss is the average negative log-likelihood the model assigns to whatever token actually came next, across a huge corpus of real text:

```
loss = -(1/T) * sum_t log P(x_t | x_1, ..., x_{t-1})
```

Every gradient step raises the probability of the correct next token and lowers everything else's — millions of times over. Nowhere in that objective is there a class called "I don't know," and nowhere is there a reward for pausing instead of completing a pattern whose specific content the model has no real support for. A classifier built with an explicit reject option has that option because someone designed a label for it and trained against it directly; next-token prediction on raw internet text never sees such a label, because ordinary text isn't annotated with which of its claims the next reader will find false.

At inference, the entire decision procedure is: forward pass, logits over the vocabulary, softmax, then sample or take the argmax. There's no second pass that checks the chosen token against a fact store. If the model has tools for that — retrieval, a calculator — those are add-ons layered on top; the base generation mechanism doesn't include one.

## Why it works this way

The gap that makes hallucination possible is between **fluency density** and **content density** in the training data, and they're controlled by different things. Grammar, formatting conventions, and common sentence templates are reinforced by nearly every sentence in the corpus, regardless of topic — so the model gets extremely good at *sounding* right everywhere. Whether a specific fact is *correct* depends entirely on how often that particular fact showed up in training, which varies enormously and has nothing to do with how well-formed the sentence around it will be. Where a fact is well-represented, next-token prediction across many contexts reinforces the same completion and the output distribution at that position is sharply peaked. Where a fact is rare or absent, the distribution is flatter — several completions are all roughly equally likely — but decoding still has to emit *something*, and greedy or top-p sampling hands you one fluently-phrased token regardless. This is compounded by how [instruction tuning and RLHF](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy) shape the final behavior: human raters tend to prefer answers that sound complete and confident over ones that hedge, so preference-based training can actively push the model toward stating an unsupported claim plainly rather than flagging the uncertainty that was visible, as a flatter probability distribution, at the pretraining stage.

## A concrete example (shown)

Ask a coding assistant: *"What does `numpy.rolling_mean()` do, and what are its arguments?"* There is no such function in numpy (the rolling-window mean lives in pandas, as `Series.rolling().mean()`). A plausible completion:

```
numpy.rolling_mean(a, window, min_periods=None, axis=None)

Computes the moving average of array `a` over a sliding window of
size `window`. Returns an array of the same length as `a`, with the
first `window - 1` elements set to NaN unless `min_periods` is
specified. `axis` controls which dimension the rolling window is
applied along for multi-dimensional arrays.
```

Nothing about this is a random error — every field is a high-probability completion given the prompt. Numpy's real function-naming convention (`snake_case`, verb-ish names like `numpy.mean`, `numpy.convolve`) makes `numpy.rolling_mean` look exactly like a real numpy function name. The argument list follows the exact template of dozens of real numpy and pandas windowing functions (`window`, `min_periods`, `axis` are genuine, common argument names in that ecosystem). The description reads like real numpy documentation because it's built from the same distribution of phrasing real numpy documentation uses. No step in generating this ever queried numpy's actual source or docs — the model produced the *shape* of a correct answer with total fluency, on a question where the specific fact (does this function exist) has zero support in training data, because it doesn't exist.

## Where it shows up

API and library hallucination in coding assistants (inventing a plausible-but-fake function, argument, or import), fabricated citations and case law, invented biographical details on people the model has thin data about, and confidently wrong specifics stitched into an otherwise accurate paragraph. It's most dangerous exactly where it looks least suspicious: prose that's fluent everywhere, correct almost everywhere, and wrong in one specific, unmarked place.

## Watch out for

- **Temperature 0 doesn't remove hallucination.** Greedy decoding removes sampling *variance* — it still walks straight to the argmax token even when the argmax is a fabricated-but-plausible completion. It can make a fabrication more consistent across runs, not less present.
- **A confident tone is not evidence.** Confidence in phrasing is a learned writing style reinforced by fluency density everywhere in training; it carries no information about whether the specific fact underneath has real support.
- **A bigger or newer model shrinks the sparse regions, it doesn't remove them.** Scale improves coverage of facts, so hallucination gets rarer on well-known topics — but any question landing outside the model's dense training support can still get a fluent, wrong answer, and better prose can make it a more convincing one.

## Where next

[A hallucination taxonomy and its mitigations](/learn/llm-foundations/hallucination-taxonomy-and-mitigations) classifies the different failure shapes this mechanism produces and covers what retrieval, abstention training, and self-verification each actually fix.

**Related:** [A Hallucination Taxonomy and Its Mitigations](/learn/llm-foundations/hallucination-taxonomy-and-mitigations), [Pretraining: Learning From the Whole Internet](/learn/llm-foundations/pretraining-explained), [Alignment Tax, Reward Hacking, and Sycophancy](/learn/llm-foundations/alignment-tax-reward-hacking-sycophancy), [RLHF, Reward Models, and PPO](/learn/llm-foundations/rlhf-reward-models-and-ppo)
