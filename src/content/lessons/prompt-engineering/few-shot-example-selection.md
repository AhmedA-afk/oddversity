---
title: "Choosing Which Examples to Show"
track: "prompt-engineering"
status: live
summary: "Why covering the decision boundary with confusable examples beats adding more obvious ones, with a worked classifier comparison."
duration: "8 min read"
---

*This is deferred-depth material — if you just need the working rule, jump to the [Few-Shot Design Cheatsheet](/learn/prompt-engineering/few-shot-design-cheatsheet). Stay here if you want to see why the rule holds.*

Two three-shot prompts, same task, same model, same instructions — one set of examples covers the decision boundary and one doesn't — and the accuracy gap between them is routinely bigger than the gap between three shots and eight. Count matters less than most people assume; coverage matters more.

## The mechanism: why coverage beats count

Think of each example as an anchor point in the space of possible inputs. [In-context learning](/learn/prompt-engineering/in-context-learning-for-prompters) works by the model finding the pattern nearest examples establish and extending it to the new input — which means a new input close to one of your anchors gets classified with real confidence, and a new input sitting *between* two anchors, near the actual boundary between two classes, gets whatever the model's weakest, least-informed guess produces. Three examples that all sit deep in "obviously class A" territory leave the entire boundary between A and B completely unanchored. Three examples where one deliberately sits right on that boundary give the model the one thing it actually needed: a demonstrated answer for the case that was genuinely hard to call.

This is also why "more examples" is a weaker lever than "better-placed examples." Adding a fourth obvious example doesn't move the boundary anchor any closer to where confusion actually happens — it just adds another point far from where the model needed help.

## Worked comparison: obvious examples vs. boundary examples

Take a two-class ticket classifier: `billing` vs. `technical`. Set A picks the three most textbook-obvious examples available:

```text
"I was charged twice this month." -> billing
"The app crashes on launch." -> technical
"Can I get a refund for last month?" -> billing
```

Every one of these is decidable from a single keyword — "charged," "refund," "crashes" — and none of them ever shows the model a case where those keywords point the wrong way. Set B, instead, picks three examples specifically because they're confusable:

```text
"I paid for the premium plan but the export button is greyed out." -> technical
"My card was charged for a plan I already cancelled." -> billing
"The invoice PDF won't download from my account." -> technical
```

Every one of these contains billing-flavored vocabulary ("paid," "charged," "invoice") attached to a label that vocabulary alone would get wrong two times out of three. Set B forces the model to anchor on *what actually broke*, not on which payment-adjacent word showed up.

Now run both sets against five held-out messages:

| # | Message | True label |
|---|---|---|
| 1 | "The receipt in my email shows the wrong amount." | billing |
| 2 | "I can't get the password reset email to send." | technical |
| 3 | "I was billed for two seats but only have one user." | billing |
| 4 | "The report I paid to unlock exports as a blank PDF." | technical |
| 5 | "My trial ended and now checkout keeps failing." | billing |

Set A pattern-matches on shallow lexical cues — "charged"/"billed"/"paid" → billing, "crashes"/"button" → technical — because that's the only signal its three examples ever demonstrated. Message 4 contains "paid," so Set A predicts billing; the true cause is a broken export, a technical issue, and Set A never showed a case where payment language points to a technical root cause. That's one flip from correct to wrong out of five test messages — the difference between 4/5 and 5/5 on this mini eval, illustrating the mechanism rather than a measured benchmark. Set B, having already seen "I paid for the premium plan but the export button is greyed out" resolve to `technical`, has an anchor close enough to message 4 to get it right, and having seen "charged for a cancelled plan" resolve to `billing` anchors message 3 the same way.

Nothing about Set B is "smarter." It's the same model, same instructions, same three-example budget — the only difference is where the three anchors sit relative to the boundary the real traffic actually tests.

## Matching the real input distribution

Coverage of the boundary isn't the only axis. If 80% of your live traffic is unambiguous and 20% is boundary-adjacent, don't swing all the way to three boundary examples and zero obvious ones — that overcorrects the model's effective prior toward rare cases and can introduce a [majority-label-style skew](/learn/prompt-engineering/label-bias-and-majority-label) in the other direction. A reasonable rule: reserve at least one anchor per class you expect, then spend any remaining shot budget on the confusable cases you've actually observed — not hypothetical ones you're guessing at.

## The tradeoffs, precisely stated

- **A boundary example carries more information per token than a redundant obvious one.** Once a class has one clean anchor, a second obvious example teaching the same lexical association adds little; a single example that resolves a real ambiguity moves accuracy on exactly the inputs a fixed instruction couldn't already handle.
- **Returns diminish once the boundary is covered.** More examples of the *same* confusable pattern don't keep paying off at the same rate — see [How Many Shots, and In What Order](/learn/prompt-engineering/example-count-and-ordering) for where that curve flattens.
- **You need to already know your failure modes to pick boundary examples.** This is the real cost: you can't hand-pick confusable cases you haven't seen yet. Mine them from a held-out eval set or real production misses — see [Prompt Evaluation Basics](/learn/prompt-engineering/prompt-evaluation-basics) — rather than guessing at what might be ambiguous.
- **Hand-picking doesn't scale past a fixed prompt.** Once your traffic is diverse enough that no fixed three-to-eight examples can cover every boundary you'll meet, the fix stops being "pick better examples" and becomes "pick examples per request" — see [Retrieving Few-Shot Examples at Runtime](/learn/prompt-engineering/dynamic-few-shot-retrieval).

## Where next

[Worked Example: A Three-Shot Intent Classifier](/learn/prompt-engineering/three-shot-classifier-worked) applies exactly this principle to fix a real misclassification. [Before/After: Repairing a Broken Few-Shot Prompt](/learn/prompt-engineering/fixing-a-failing-few-shot-prompt) shows the same idea applied as a repair to an already-broken prompt.

**Related:** [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting) · [Zero-Shot vs Few-Shot](/learn/prompt-engineering/zero-shot-vs-few-shot) · [Worked Example: A Three-Shot Intent Classifier](/learn/prompt-engineering/three-shot-classifier-worked) · [Retrieving Few-Shot Examples at Runtime](/learn/prompt-engineering/dynamic-few-shot-retrieval) · [Label Bias, Recency Bias, and Majority Labels](/learn/prompt-engineering/label-bias-and-majority-label)
