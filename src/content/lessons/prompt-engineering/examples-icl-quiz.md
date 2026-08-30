---
title: "Quiz: Examples and In-Context Learning"
track: "prompt-engineering"
status: live
summary: "Six scenario questions on zero- vs few-shot, label bias, boundary coverage, and format leakage — pick the mechanism, not the vocabulary."
duration: "8 min read"
---

Six scenarios, not six definitions. If you've worked through this module, this is where you find out whether the mechanisms actually stuck — read each stem like a bug report and diagnose it, rather than recalling a term.

## 1. Which of these two tasks should stay zero-shot?

You're prompting the same model for two tasks: (a) translating short customer emails into Spanish, and (b) sorting support tickets into your company's seven internal priority tiers, `P0` through `P6`, each with its own specific meaning your team invented. Which one should you keep zero-shot, and why?

- **A.** Neither — any production task benefits from at least a few examples, since more demonstration is never actively harmful.
- **B.** Task (a), the translation — it's a common, well-represented task where the instruction alone summons the right behavior, while `P0`–`P6` carry no meaning the model can infer without seeing them demonstrated.
- **C.** Task (b), the ticket sorting — classification tasks are inherently simpler for a model than open-ended generation like translation, regardless of how the labels are named.
- **D.** Both — translation and classification are both extremely common pretraining patterns, so examples add nothing to either.

<details><summary>Answer</summary>

**Correct: B.** Translation is a task whose name alone implies well-understood behavior the model has practiced enormously — there's no house-specific convention for an instruction to fail to capture. `P0` through `P6` are just labels your team invented; nothing about the string "P3" tells the model where the line between P2 and P3 sits, so an instruction alone leaves that boundary genuinely undefined, and examples are exactly what would resolve it. **A** is wrong because examples are not free — every one costs real tokens on every call, and adding them without an observed failure to justify them is pure cost with no measured benefit. **C** gets the comparison backwards: task difficulty here isn't about generation vs. classification, it's about whether the task's own vocabulary already resolves the ambiguity, and translation's vocabulary does while `P0`–`P6` doesn't. **D** is wrong for the reason B explains — "common in pretraining" applies to translation, not to a company-specific label scheme invented after any model's training data was collected.

</details>

## 2. Diagnosing an over-predicted label

You've built a two-class classifier (`urgent` / `not_urgent`) with a four-example few-shot prompt: three of the four examples are labeled `urgent`. On a mini eval, the model labels almost everything `urgent`, including messages a human would clearly call routine. What's the most likely cause, and what's the fix?

- **A.** The model doesn't understand the concept of "urgent" well enough — the fix is to add a paragraph of instructions defining urgency more precisely.
- **B.** Majority-label bias — three of four examples share one label, which shifts the model's effective prior toward that label on inputs it's otherwise unsure about. The fix is rebalancing toward an even split across both classes.
- **C.** The eval set is mislabeled, since a well-trained model should never over-predict a single class this consistently.
- **D.** The examples need to be longer and more detailed so the model can better distinguish the two classes.

<details><summary>Answer</summary>

**Correct: B.** A 3:1 label split in the shots is a textbook setup for majority-label bias — the model isn't reasoning about urgency incorrectly, it's leaning on a skewed prior that was baked in before the eval's actual content was ever read. Rebalancing to 2:2 (or 1:1 with more classes) removes that pull without touching a single word of the instruction. **A** misdiagnoses a demonstration-set problem as a comprehension problem — more prose describing "urgency" doesn't fix a bias coming from label proportions, and it's exactly the kind of instruction-patch that tends to underperform a well-placed example. **C** dismisses a well-documented, mechanistic bias as a data-quality issue without evidence — a model over-predicting the majority-shown label is the expected outcome here, not a sign the eval itself is broken. **D** targets the wrong lever entirely — length and detail don't correct a label-count imbalance; only the label distribution across examples does.

</details>

## 3. Choosing between two three-shot sets

For a two-class ticket classifier (`billing` / `technical`), you're choosing between two three-shot sets to ship. Set A: `"I was charged twice"` → billing, `"the app crashes on launch"` → technical, `"can I get a refund"` → billing. Set B: `"I paid for premium but the export button is greyed out"` → technical, `"my card was charged for a plan I already cancelled"` → billing, `"the invoice PDF won't download"` → technical. Which set is the better choice for real traffic that includes messages mentioning payment language attached to functionality problems, and why?

- **A.** Set A, because its examples are unambiguous and therefore give the model the clearest possible signal for each class.
- **B.** Set B, because each example deliberately pairs billing-flavored vocabulary with a label that vocabulary alone would get wrong — anchoring the model on root cause rather than surface keywords, which is exactly the ambiguity real traffic will test.
- **C.** They're equivalent, since both sets demonstrate one example of each relevant class-boundary combination.
- **D.** Set A, because shorter, simpler examples are always easier for the model to generalize from than examples with more nuance.

<details><summary>Answer</summary>

**Correct: B.** Set A's examples are all decidable from a single keyword ("charged," "crashes," "refund"), so the model never sees a case where payment language points to a technical root cause — exactly the kind of message the scenario says real traffic includes. Set B places every example on that specific confusable pattern, giving the model an anchor near the actual decision boundary instead of three points nowhere near it. **A** mistakes "unambiguous to a person" for "useful as a demonstration" — an obvious example teaches an association the model likely already has, while contributing nothing to the case that's actually hard to call. **C** is false: Set A never demonstrates the payment-language-but-technical-cause pattern at all, so it does not cover the same boundary Set B does — the two sets are not interchangeable for this traffic. **D** confuses simplicity with generalization; a "simple" example that only reinforces an already-easy association doesn't help the model on the harder cases nearby, regardless of how easy it is to read.

</details>

## 4. Spotting format leakage

Your five examples for an "urgent" vs. "not_urgent" classifier all happen to end in an exclamation mark when labeled `urgent`, and none of the `not_urgent` examples do. A new ticket describing a genuinely urgent outage, phrased calmly with no exclamation mark, gets classified `not_urgent`. What happened?

- **A.** The model correctly detected that the new ticket's tone doesn't match genuine urgency, since urgent messages are typically written with more emotional intensity.
- **B.** This is unrelated to the examples — the model simply lacks the general knowledge needed to recognize this specific outage as urgent.
- **C.** Format leakage: the punctuation mark happened to co-occur with the `urgent` label across every example, so the model learned "ends with !" rather than "describes something urgent," and a calmly-phrased urgent message doesn't match that learned surface cue.
- **D.** The fix is to add a written rule stating that urgency doesn't depend on punctuation, appended to the instructions.

<details><summary>Answer</summary>

**Correct: C.** With only a handful of examples, the model has no way to separate a coincidental shared feature from the real signal — every `urgent` example having a "!" and every `not_urgent` one lacking it makes punctuation and label statistically indistinguishable from the model's point of view, so it latches onto the cue that's actually there. **A** treats a coincidence in the example set as a considered judgment about tone, when the actual outage's severity was never in question here — the model's own examples just never demonstrated urgency without an exclamation mark to compare against. **B** is a broader failure than what's shown — outages are a well-represented case type when described in less coincidence-laden examples, so this is a targeted format-leakage issue, not a general knowledge gap. **D** repeats a common mistake: a written rule competes weakly against a concrete pattern present in every single demonstrated example. The reliable fix is breaking the correlation directly with counter-examples — an urgent ticket phrased calmly, and a non-urgent one that happens to end in "!" — not adding a sentence about punctuation.

</details>

## 5. Recency effects on an ambiguous case

Using the same three sentiment examples (one `positive`, one `negative`, one `neutral`) in two different orders, you get two different labels for the same genuinely mixed-signal review — one order labels it `neutral`, the other labels it `positive`. Nothing about the review's wording changed. What's happening, and what should you do about it?

- **A.** The model is randomly inconsistent on ambiguous inputs, and there's no reliable mitigation beyond accepting some noise.
- **B.** Recency bias — the example last in the prompt disproportionately influences ambiguous cases. Shuffle example order across calls (or across eval runs) so no single fixed order silently biases every request in one direction.
- **C.** This indicates the three examples are mislabeled, since correctly labeled examples would produce the same answer regardless of order.
- **D.** The fix is to add more examples of each class until the ambiguity resolves itself.

<details><summary>Answer</summary>

**Correct: B.** This is the textbook signature of recency bias: same content, same labels, only the position of one example changed, and the model's answer on the one genuinely ambiguous case tracked the position change rather than the content. Shuffling order — rather than shipping one fixed order — turns this from an invisible, one-directional bias into noise you can measure and average out. **A** overstates the case as unfixable randomness; it's a specific, named, mitigable bias with a known lever (order), not an inherent limit of the model. **C** is a non sequitur — correct labels don't guarantee order-independence, because the bias operates on position in the prompt, not on whether the labels are individually accurate. **D** targets the wrong variable: adding more examples doesn't address an ordering effect, and without also varying order, more examples can just add more material for the same recency effect to act on.

</details>

## 6. Format-only shots vs. reasoning-showing shots

You're prompting a model to output `{"reorder_qty": <int>, "reason": <string>}` for a restocking tool, and your two examples show only clean, correct finished JSON with no visible calculation. On a new case requiring combining two separate stock figures (on-shelf plus incoming shipment) before subtracting demand, the model returns a validly-formatted JSON object with the wrong number. What's the best fix?

- **A.** Add a third format-only example — another clean input/output pair with no visible arithmetic — since more examples of the correct shape should improve accuracy.
- **B.** Rewrite the examples to show the arithmetic procedure — how to compute total demand and total available stock before subtracting — so the model completes the same procedure on new inputs instead of guessing at just the shape.
- **C.** The JSON schema is at fault; switching to a flatter schema with fewer keys will resolve the incorrect number.
- **D.** This can't be fixed with examples at all — only a code-based calculator can produce a reliably correct number.

<details><summary>Answer</summary>

**Correct: B.** The failure here isn't about the output's shape — the JSON was valid — it's that the demonstrated pattern never included the procedure for combining two stock figures before subtracting. Reasoning-showing shots teach the *steps*, not just the finished shape, so completing the pattern on a new input means applying the same steps to new numbers rather than pattern-matching to a shape that happens to look similar. **A** adds more of the same limited signal — another clean shape without visible arithmetic doesn't teach the missing step, and the failure mode (confident, validly-shaped, wrong) would likely repeat. **C** misattributes the problem to the schema, when the schema was never wrong — the number inside a perfectly valid schema was wrong, which is specifically what happens when a reasoning-dependent task is taught with format-only shots. **D** overcorrects: reasoning-showing few-shot examples are a real, lighter-weight fix for exactly this class of problem — a dedicated calculator tool is one valid option for higher-stakes cases, but it isn't the only fix available, and the scenario is solvable by changing what the examples demonstrate.

</details>

If more than one of these caught you out, the fix isn't memorizing these six answers — it's noticing which mechanism (coverage, label balance, ordering, or format vs. reasoning) is actually in play next time an output looks off. For the fast-reference version of all of it, see the [Few-Shot Design Cheatsheet](/learn/prompt-engineering/few-shot-design-cheatsheet).

**Related:** [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting) · [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection) · [Label Bias, Recency Bias, and Majority Labels](/learn/prompt-engineering/label-bias-and-majority-label) · [When Your Examples Teach the Wrong Thing](/learn/prompt-engineering/few-shot-format-leakage) · [Examples for Format vs Examples for Reasoning](/learn/prompt-engineering/examples-for-format-vs-reasoning) · [Few-Shot Design Cheatsheet](/learn/prompt-engineering/few-shot-design-cheatsheet)
