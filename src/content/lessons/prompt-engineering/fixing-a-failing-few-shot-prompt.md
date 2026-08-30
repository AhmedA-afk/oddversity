---
title: "Before/After: Repairing a Broken Few-Shot Prompt"
track: "prompt-engineering"
status: live
summary: "A three-shot prompt with all-positive, same-length examples repaired by rebalancing labels, adding a hard case, and shuffling order."
duration: "8 min read"
---

Three examples, all the same length, all the same label — a prompt like this can look completely reasonable in isolation and still fail in a very specific, very predictable direction the moment it meets real traffic.

## The setup

A three-way sentiment classifier for app-store-style reviews (`positive` / `negative` / `neutral`) ships with this example set:

```text
"This app is amazing, I use it every day!" -> positive
"This app is amazing, it saved me so much time!" -> positive
"This app is amazing, best purchase ever!" -> positive
```

Every example is the same length, opens the same way, and carries the same label — this is both the majority-label problem from [Label Bias, Recency Bias, and Majority Labels](/learn/prompt-engineering/label-bias-and-majority-label) and the shared-phrasing problem from [When Your Examples Teach the Wrong Thing](/learn/prompt-engineering/few-shot-format-leakage), stacked in one set. Here's the 10-item mini eval it's about to meet:

| # | Message | True label |
|---|---|---|
| 1 | "Crashes every time I open it." | negative |
| 2 | "It's fine, does what it says." | neutral |
| 3 | "Worst update ever, lost all my data." | negative |
| 4 | "Love the new interface, so much cleaner!" | positive |
| 5 | "Works but the ads are annoying." | neutral |
| 6 | "Perfect, exactly what I needed." | positive |
| 7 | "Meh, nothing special." | neutral |
| 8 | "Great app but battery drain is bad." | neutral |
| 9 | "Completely broken since the last update." | negative |
| 10 | "Does the job, no complaints." | neutral |

## Step by step

### Step 1 — Run the broken prompt

The set has no `negative` or `neutral` anchor at all — the model has never seen either class demonstrated, only three variations on "amazing." Following the majority-label mechanism, expect strongly-worded negative cases to still resolve correctly (the vocabulary itself is unambiguous enough to overcome the skew), but every case that isn't overwhelmingly negative to pull toward `positive`, the only label with any anchor:

| # | Message | True | Before |
|---|---|---|---|
| 1 | "Crashes every time I open it." | negative | negative |
| 2 | "It's fine, does what it says." | neutral | **positive** |
| 3 | "Worst update ever, lost all my data." | negative | negative |
| 4 | "Love the new interface, so much cleaner!" | positive | positive |
| 5 | "Works but the ads are annoying." | neutral | **positive** |
| 6 | "Perfect, exactly what I needed." | positive | positive |
| 7 | "Meh, nothing special." | neutral | **positive** |
| 8 | "Great app but battery drain is bad." | neutral | **positive** |
| 9 | "Completely broken since the last update." | negative | negative |
| 10 | "Does the job, no complaints." | neutral | **positive** |

Five correct out of ten (50%). The numbers here trace the mechanism rather than a measured model run — run your own before/after mini-eval for real figures — but the pattern is exactly what majority-label bias predicts: every miss clusters on the classes with zero anchors, and every hit is a case strongly-worded enough to overcome the skew on vocabulary alone.

> **Why this step?** Running against a labeled mini eval before repairing anything is what turns "this prompt feels a little off" into a specific, addressable pattern — misses cluster on `neutral` and unclear cases, not randomly, which is the tell that this is a coverage problem, not a model-capability problem.

### Step 2 — Diagnose against the known mechanisms

Every miss is a `neutral` case, and `neutral` was never demonstrated at all — this is majority-label bias in its purest form, compounded by format leakage from the identical length and "amazing" phrasing across all three shots. There's no ambiguity to resolve here: the fix isn't a smarter model or a rewritten instruction, it's an example set that actually covers the classes the eval is testing.

### Step 3 — The repair: three moves, not one

**Rebalance labels.** Replace two of the three `positive` examples so every class gets exactly one anchor.

**Add a hard case, not just any negative and neutral example.** The eval's actual misses (2, 5, 7, 8, 10) are mixed-signal or lukewarm phrasing, not clear-cut negativity — so the `neutral` anchor should specifically be a mixed-sentiment case, matching the shape of what's actually failing, per [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection).

**Vary length and shuffle order.** No more three identical-length exclamations.

```text
"The design is beautiful but it drains my battery fast." -> neutral
"This update finally fixed the sync issue — works great now." -> positive
"Crashes constantly, can't even log in most days." -> negative
```

> **Why this step?** This is the three fixes from [Few-Shot Format Leakage](/learn/prompt-engineering/few-shot-format-leakage) and [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection) applied together: balanced labels remove the majority-label pull, the mixed-sentiment `neutral` example anchors exactly the ambiguity the eval exposed, and varied length plus a shuffled order remove the incidental cues the original three examples all shared.

### Step 4 — Run the repaired prompt

| # | Message | True | After |
|---|---|---|---|
| 1 | "Crashes every time I open it." | negative | negative |
| 2 | "It's fine, does what it says." | neutral | neutral |
| 3 | "Worst update ever, lost all my data." | negative | negative |
| 4 | "Love the new interface, so much cleaner!" | positive | positive |
| 5 | "Works but the ads are annoying." | neutral | neutral |
| 6 | "Perfect, exactly what I needed." | positive | positive |
| 7 | "Meh, nothing special." | neutral | neutral |
| 8 | "Great app but battery drain is bad." | neutral | neutral |
| 9 | "Completely broken since the last update." | negative | negative |
| 10 | "Does the job, no complaints." | neutral | **positive** |

Nine correct out of ten (90%) — again, an illustrative walkthrough of the mechanism rather than a benchmark figure, but the shape of the improvement is the expected one: items 2, 5, 7, and 8 flip to correct because they now structurally resemble the new mixed-sentiment `neutral` anchor far more than they resemble either the positive or negative example. Item 10, "Does the job, no complaints," still resolves to `positive` — "no complaints" leans mildly positive in isolation, and this is a genuinely defensible edge case a human annotator could reasonably disagree on too, not a bug in the repair.

## Where it breaks (+fix)

Nine of ten is a real improvement, not a perfect one, and that's the honest result of hand-repairing three examples: it fixes the specific gap the eval revealed without guaranteeing every future edge case is covered. A prompt this hand-tuned also doesn't scale past a handful of classes and a handful of known ambiguities — once your real traffic surfaces more boundary shapes than three fixed shots can anchor, the next move isn't a fourth or fifth hand-picked example, it's retrieving the right examples per request, covered in [Retrieving Few-Shot Examples at Runtime](/learn/prompt-engineering/dynamic-few-shot-retrieval). For a fast reference to the checklist this repair followed, see the [Few-Shot Design Cheatsheet](/learn/prompt-engineering/few-shot-design-cheatsheet).

## Takeaways

- A prompt with zero anchors for a class doesn't fail randomly on that class — it fails in one predictable direction, toward whatever label *was* demonstrated. That predictability is what makes the diagnosis fast.
- The fix is rarely one change. Rebalancing labels, adding a case shaped like the actual misses, and varying length/order each addressed a distinct mechanism — leaving any one out would have left part of the original failure in place.
- A mini eval — even ten items — is what turns "this feels off" into a specific, fixable pattern, and later into a number you can compare before and after a repair.
- Perfect accuracy isn't the bar. A repair that turns systematic, predictable misses into one genuinely defensible edge case is a real fix, not an incomplete one.

**Related:** [Few-Shot Format Leakage](/learn/prompt-engineering/few-shot-format-leakage) · [Label Bias, Recency Bias, and Majority Labels](/learn/prompt-engineering/label-bias-and-majority-label) · [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection) · [How Many Shots, and In What Order](/learn/prompt-engineering/example-count-and-ordering) · [Few-Shot Design Cheatsheet](/learn/prompt-engineering/few-shot-design-cheatsheet)
