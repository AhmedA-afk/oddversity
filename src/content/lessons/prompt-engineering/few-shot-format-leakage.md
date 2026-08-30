---
title: "When Your Examples Teach the Wrong Thing"
track: "prompt-engineering"
status: live
summary: "Five ways a few-shot example set silently teaches the wrong pattern — shared length, a phrasing tic, an incidental correlation, or bad labels."
duration: "7 min read"
---

A few-shot prompt that "works" on your test runs and drifts in production is usually not failing because the model misunderstood the task. It's succeeding at a task — just not the one you meant. [In-context learning](/learn/prompt-engineering/in-context-learning-for-prompters) finds whatever pattern is actually shared across your examples, and if that shared pattern includes something you didn't intend, the model learns that too, faithfully.

### The mistake: every example is roughly the same length

**Why it's wrong.** The model has no way to know length wasn't part of the pattern you meant to demonstrate — it's just another consistent property across every example, and consistency across examples is exactly what in-context learning latches onto.

**Symptom.** Summarization examples that are all two sentences long produce two-sentence summaries on every new input, regardless of whether the source material actually warrants one sentence or five. The output length tracks your examples' length, not the input's actual content.

**Fix.** Vary length across your examples deliberately — include a short input with a short output and a long input with a long output — so length stops being a shared cue the model can extract. If you genuinely want a fixed output length, say so explicitly in the instruction rather than relying on examples to imply it.

### The mistake: every example shares a phrasing tic

**Why it's wrong.** Models pattern-match on surface tokens, not just on the labels or transformations you intended to teach. A repeated opening phrase, a consistent filler word, or a shared trailing punctuation mark is just as much "the pattern" to the model as the part you actually cared about.

**Symptom.** Every completion opens with the same boilerplate — "Sure, here's the summary:" — because all three of your examples happened to open that way, and this persists even after you separately instruct the model not to add preamble.

**Fix.** Read your example outputs looking specifically for repeated substrings, not just repeated labels. Strip incidental phrasing so the only thing consistently shared across examples is the actual transformation you want demonstrated.

### The mistake: an incidental detail accidentally correlates with the label

**Why it's wrong.** With only a handful of examples, the model has no statistical way to distinguish a coincidental co-occurrence from the real signal — any shared surface feature looks exactly as load-bearing as the one you meant to teach.

**Symptom.** All your `urgent` examples happen to end in an exclamation mark, and none of your `not_urgent` ones do. A genuinely urgent ticket phrased calmly, without a "!", gets classified as `not_urgent` — the model learned "ends with !" rather than "describes something urgent."

**Fix.** Audit your examples for shared surface features that have nothing to do with the concept you're teaching — punctuation, sentence length, a recurring word. When you find one, add a counter-example that breaks the correlation: an urgent ticket phrased calmly, and a non-urgent one that happens to end with "!".

### The mistake: every example happens to carry the same label

**Why it's wrong.** This is the most avoidable version of a well-documented bias — not a subtle statistical effect, just sourcing every example from the same bucket because that's what was easy to find (three "resolved positive" tickets pulled from one folder, say).

**Symptom.** Every new input, regardless of its actual content, gets pulled toward that one label — a clearly negative review comes back `positive` because nothing in the prompt ever demonstrated what the other classes look like at all.

**Fix.** Cover every label you expect to see at inference time, and get as close to an even split as the task allows rather than defaulting to whatever was on hand. For the deeper mechanism behind why models lean toward whichever label dominates the shots — this shows up even with a partial skew, not only an all-one-class set — see [Label Bias, Recency Bias, and Majority Labels](/learn/prompt-engineering/label-bias-and-majority-label).

### The mistake: inconsistent formatting between examples

**Why it's wrong.** In-context learning relies on the model noticing one stable shape across your examples. If delimiters, field order, or casing shift from example to example, the "pattern" being demonstrated is noisier than the actual task underneath it.

**Symptom.** Real output doesn't reliably follow any single format — sometimes the model uses example 1's field order, sometimes example 2's — because neither was consistently reinforced across the set.

**Fix.** Keep every example in identical structure: same delimiters, same field order, same casing, so the only thing that varies from example to example is the content being transformed. Pair this with [Delimiters and Formatting](/learn/prompt-engineering/delimiters-and-formatting) for how to fence examples off cleanly from each other and from the real input.

## Pre-flight checklist

- [ ] Do my examples vary in length, or does every one look roughly the same size?
- [ ] Did I check for a repeated opening phrase, filler word, or punctuation habit across every example's output?
- [ ] Is there a surface feature — a word, a symbol, a name — that happens to co-occur with one label and not the others?
- [ ] Does every label or class I expect at inference time appear at least once?
- [ ] Is the delimiter, field order, and casing identical across every single example?

**Related:** [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting) · [Label Bias, Recency Bias, and Majority Labels](/learn/prompt-engineering/label-bias-and-majority-label) · [Delimiters and Formatting](/learn/prompt-engineering/delimiters-and-formatting) · [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection) · [Before/After: Repairing a Broken Few-Shot Prompt](/learn/prompt-engineering/fixing-a-failing-few-shot-prompt)
