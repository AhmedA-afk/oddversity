---
title: "Few-Shot Design Cheatsheet"
track: "prompt-engineering"
status: live
summary: "Try zero-shot first, cover the boundary, balance labels, shuffle order, match the real distribution, watch for leakage — with quick decision tables."
duration: "6 min read"
---

You already know the theory from [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting) and the rest of this module — this page skips it and gives you the working defaults and a fast diagnosis table instead.

## Start here, then measure

1. **Try zero-shot first.** See [Zero-Shot: When You Don't Need Examples](/learn/prompt-engineering/zero-shot-when-its-enough). Don't add examples preemptively.
2. **When it fails, write down exactly what failed** — the specific input and the specific wrong output. This becomes your first example, not a rule.
3. **Add one example per class you expect, plus one on the specific failure you just found.** Three shots is the right starting count for most classification and extraction tasks — see [How Many Shots, and In What Order](/learn/prompt-engineering/example-count-and-ordering).
4. **Balance labels as close to even as the task allows.** Not whatever was easiest to find.
5. **Shuffle example order** before shipping, and again across every eval run.
6. **Re-test against a small held-out set** before calling it done — see [Prompt Evaluation Basics](/learn/prompt-engineering/prompt-evaluation-basics).

## Symptom → fix

| Symptom | Likely cause | Fix |
|---|---|---|
| Model over-predicts one label regardless of input | Majority-label bias — one label dominates your shots | Rebalance toward an even split — see [Label Bias, Recency Bias, and Majority Labels](/learn/prompt-engineering/label-bias-and-majority-label) |
| Ambiguous inputs get different answers across reruns or after reordering | Recency bias — whichever example is last is overweighted | Shuffle order per call or per eval run — see [How Many Shots, and In What Order](/learn/prompt-engineering/example-count-and-ordering) |
| Output copies an incidental phrase, length, or punctuation habit from your examples | Format leakage — your examples share something you didn't mean to teach | Vary length/phrasing across examples — see [When Your Examples Teach the Wrong Thing](/learn/prompt-engineering/few-shot-format-leakage) |
| Output has the right shape but a wrong number or conclusion | Format-only shots on a task that secretly needs a procedure | Switch to reasoning-showing shots — see [Examples for Format vs Examples for Reasoning](/learn/prompt-engineering/examples-for-format-vs-reasoning) |
| Works on your eval, degrades on real traffic | Your fixed shots don't cover the shape of live inputs | Sample examples to match real traffic, or retrieve per-request — see [Retrieving Few-Shot Examples at Runtime](/learn/prompt-engineering/dynamic-few-shot-retrieval) |
| A specific, repeatable input keeps misclassifying | The decision boundary near that input has no anchor | Swap in an example placed on that exact boundary, not a rule describing it — see [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection) |

## Add examples vs. add rules — the one-line test

**If the fix can be shown as one clean input → output pair, add an example. If the fix is a constraint that must hold across every possible input regardless of which example is nearest — a hard limit, a safety boundary, "always emit valid JSON" — add an instruction.** Examples only teach what they demonstrate; they can't reliably enforce a rule they don't happen to show, and a rule that has to hold universally shouldn't depend on the model happening to pattern-match to the one example that mentioned it. See [Why a Good Example Outperforms a Paragraph of Rules](/learn/prompt-engineering/why-examples-beat-instructions-sometimes) for why the first case works so well, and [Negative Instructions: The Pitfall](/learn/prompt-engineering/negative-instructions-pitfall) for a related trap on the instruction side of this split.

## Starting shot counts by task shape

| Task shape | Starting point |
|---|---|
| Binary classification | 2 (one per class), 3 if there's a known boundary case |
| Multi-class (3–6 classes) | 1 per class minimum, plus 1 on the most confusable boundary |
| Format-only extraction/reshaping | 1–2, enough to pin the schema — no need to demonstrate reasoning that isn't there |
| Reasoning-heavy tasks | 2–3 worked examples showing the procedure, not just the answer — or a genuine [chain-of-thought](/learn/prompt-engineering/chain-of-thought-prompting) instruction if the space of cases is too open-ended to enumerate |
| Fine-grained categories (6+ classes) or subtle style-matching | Up to 6–8, one per class plus targeted boundary cases — past this, returns diminish fast |

Treat every number above as a starting point to measure against, not a target to hit — see [How Many Shots, and In What Order](/learn/prompt-engineering/example-count-and-ordering) for the diminishing-returns curve behind these defaults.

## Coverage checklist

- [ ] Every class you expect at inference time has at least one anchor.
- [ ] At least one example sits on a real, observed ambiguity — not just easy, obvious cases.
- [ ] Labels are balanced, not sourced from whatever was convenient to find.
- [ ] Example order is shuffled, not fixed to whatever order you happened to write them in.
- [ ] No shared length, phrasing tic, or incidental correlation runs across every example.
- [ ] Delimiters, field order, and casing are identical across every example.
- [ ] You've re-tested against a held-out set after any change to the example set.

## Format matters as much as content

Keep every example in the exact same structure — same delimiters, same field order — so the model is finding one consistent pattern rather than inferring one from formatting noise. See [Delimiters and Formatting](/learn/prompt-engineering/delimiters-and-formatting) for how to fence examples off cleanly from the real input.

**Related:** [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting) · [Zero-Shot vs Few-Shot](/learn/prompt-engineering/zero-shot-vs-few-shot) · [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection) · [Label Bias, Recency Bias, and Majority Labels](/learn/prompt-engineering/label-bias-and-majority-label) · [Retrieving Few-Shot Examples at Runtime](/learn/prompt-engineering/dynamic-few-shot-retrieval)
