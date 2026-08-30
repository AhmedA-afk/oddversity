---
title: "Label Bias, Recency Bias, and Majority Labels"
track: "prompt-engineering"
status: live
summary: "Three documented few-shot biases toward the majority label, the last-seen label, and common tokens — and how to counter each one."
duration: "8 min read"
---

*This is deferred-depth material — for the quick working rule, see [Few-Shot Format Leakage](/learn/prompt-engineering/few-shot-format-leakage) or the [Few-Shot Design Cheatsheet](/learn/prompt-engineering/few-shot-design-cheatsheet). Stay here for the mechanism behind why the rule works.*

The same three examples, reordered or slightly unbalanced, can silently shift a model's prediction on an ambiguous input — not because the content changed, but because of properties of the example set that have nothing to do with the task itself. Research on calibrating few-shot classifiers has documented three specific, systematic biases behind this. All three share one root cause: [in-context learning](/learn/prompt-engineering/in-context-learning-for-prompters) shapes the model's effective output distribution using everything in the prompt, including things you never meant to be signal.

## Three documented biases, one mechanism

A model's raw output is a probability distribution over possible next tokens. On a genuinely ambiguous input, that distribution should ideally split close to evenly across the plausible labels — but few-shot examples act like a prior over the label space, the same way class imbalance in training data shifts a trained classifier's prior, and that prior can dominate a case the input's actual content should have decided.

1. **Majority label bias.** If one label appears more often across your examples, the model leans toward it on inputs it's genuinely unsure about — independent of what the input actually says.
2. **Recency bias.** The most recent example — the last one in the prompt — has outsized influence on ambiguous cases, so whichever label appeared last gets a boost that has nothing to do with content.
3. **Common-token bias.** Some label words are just more frequent in general text than others, which gives them an uneven baseline likelihood before a single example is ever shown — the model's untrained prior over the label tokens themselves isn't flat.

## Demonstrating majority label bias

Take a billing/bug classifier with a skewed three-shot set — two billing examples, one bug:

```text
"I was charged twice this month." -> billing
"My invoice shows the wrong plan tier." -> billing
"The export button does nothing when I click it." -> bug
```

Now classify a genuinely ambiguous ticket: *"I can't tell if this is a billing or app problem, but something's wrong with my account since the upgrade."* Nothing in the wording clearly favors either class — that's the point of choosing it. With two of three demonstrated examples pointing to `billing`, the model's effective prior leans toward `billing` on exactly this kind of coin-flip case, independent of the ticket's own content. Rebalance to one example per class — or, with a fourth slot available, two and two — and the same ambiguous ticket is decided closer to what its actual wording supports, because the shot set is no longer quietly voting for one answer before the input is even read. The mechanism here is the same one covered from a different angle in [When Your Examples Teach the Wrong Thing](/learn/prompt-engineering/few-shot-format-leakage): a skewed set doesn't just risk over-predicting the majority label on average, it specifically decides the cases the input alone couldn't.

## Demonstrating recency bias

[How Many Shots, and In What Order](/learn/prompt-engineering/example-count-and-ordering) walks through this directly: take one balanced example per class for a three-way sentiment classifier, and change nothing but which example comes last. Putting the `neutral` example last biases a genuinely mixed-signal review toward `neutral`; putting the `positive` example last biases the same review toward `positive`. Same three facts, same three labels, different answer — purely from position in the prompt.

The guidance is the same as for majority-label bias, applied to ordering instead of counts: shuffle example order across calls, or at minimum systematically rotate which label sits last across your evaluation runs, so that no one ordering is silently baked into your shipped prompt as if it were a deliberate choice.

## Common-token and verbalizer bias

Even the specific words you choose *as* labels carry their own baseline weight, separate from your examples. "Yes"/"no", "true"/"false", and a domain-specific class name like "churned" don't necessarily start from an equally likely baseline in the model's raw output distribution — some tokens are simply more common in the training data the model absorbed, which shows up as an uneven starting point before a single example demonstrates anything.

The practical implication is narrower than it sounds: pick short, canonical label tokens, use the exact same spelling and casing for them in every example and in the output contract, and treat a rewording of a label as a real prompt change, not a cosmetic one. Swapping "urgent" for "high priority" isn't a neutral restatement — it's a different token with its own baseline frequency, and it can shift the model's answer on ambiguous inputs even when nothing about the actual categories changed.

## The general fix

- **Balance labels deliberately, not by convenience.** Aim for close to an even split across the classes your examples cover — see the [Few-Shot Design Cheatsheet](/learn/prompt-engineering/few-shot-design-cheatsheet) for concrete starting ratios — rather than whatever examples happened to be easiest to find.
- **Shuffle order across calls, or at minimum across your eval.** This turns a fixed, invisible bias into random noise you can actually detect and average out — see [How Many Shots, and In What Order](/learn/prompt-engineering/example-count-and-ordering).
- **Calibrate against your real traffic distribution when it matters.** Run a held-out set and compare the model's predicted label distribution to your traffic's true label distribution. A mismatch that your examples don't explain is a signal one of these three biases is active — not evidence the model is generally bad at the task.
- **Test the same input under a swapped or reordered label set.** If the answer changes when only the order or the exact wording of the labels changes — not the input's content — you've isolated a biased artifact, not a genuine judgment call.

## Where next

[Worked Example: A Three-Shot Intent Classifier](/learn/prompt-engineering/three-shot-classifier-worked) shows a related but distinct failure — a lexical confusion fixed by a better-chosen example, not a label-count imbalance. [Before/After: Repairing a Broken Few-Shot Prompt](/learn/prompt-engineering/fixing-a-failing-few-shot-prompt) walks through repairing a prompt where majority-label bias is the actual root cause, end to end.

**Related:** [Few-Shot Format Leakage](/learn/prompt-engineering/few-shot-format-leakage) · [How Many Shots, and In What Order](/learn/prompt-engineering/example-count-and-ordering) · [Before/After: Repairing a Broken Few-Shot Prompt](/learn/prompt-engineering/fixing-a-failing-few-shot-prompt) · [Retrieving Few-Shot Examples at Runtime](/learn/prompt-engineering/dynamic-few-shot-retrieval) · [In-Context Learning: Teaching by Example at Inference Time](/learn/prompt-engineering/in-context-learning-for-prompters)
