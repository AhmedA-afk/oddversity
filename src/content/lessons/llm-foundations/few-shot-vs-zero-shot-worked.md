---
title: "Few-Shot vs Zero-Shot: Worked Prompts"
track: "llm-foundations"
status: live
summary: "One sentiment-classification prompt, rebuilt four ways, showing how example count, label balance, and order shift the output as much as wording does."
duration: "7 min read"
---

The wording of an instruction is the part everyone tunes first. The part that quietly does just as much work — how many examples you show, what mix of labels they carry, and what order they sit in — is the part this page carries through one concrete task.

## The setup

**Task:** classify a review as `positive` or `negative`. **Test input**, deliberately ambiguous so the prompt's construction has room to swing it:

```
"The battery life is decent and the screen looks great, but honestly
I'm not sure I'd buy this brand again."
```

That sentence has a real positive clause and a real negative clause — it's the kind of borderline case where prompt construction, not just model capability, tends to decide the output.

## Step by step

### Step 1 — zero-shot baseline

```
Classify the sentiment of this review as positive or negative.

Review: "The battery life is decent and the screen looks great, but
honestly I'm not sure I'd buy this brand again."
Sentiment:
```

> **Why this step?** This is the control. No examples, no [in-context learning](/learn/llm-foundations/in-context-learning) signal about label format or the model's calibration on this particular task — whatever the model does here is closest to its raw prior over "sentiment," shaped only by pretraining and instruction tuning, not by anything in this prompt.

### Step 2 — balanced few-shot, neutral order

```
Classify the sentiment of each review as positive or negative.

Review: "Fast shipping and it works exactly as described."
Sentiment: positive

Review: "Broke after two days, total waste of money."
Sentiment: negative

Review: "Exceeded my expectations, would recommend to anyone."
Sentiment: positive

Review: "Customer service never responded to my emails."
Sentiment: negative

Review: "The battery life is decent and the screen looks great, but
honestly I'm not sure I'd buy this brand again."
Sentiment:
```

> **Why this step?** Two positive, two negative, alternating — this is the version designed to add the least bias possible while still giving the model the label vocabulary and output format via [in-context learning mechanics](/learn/llm-foundations/in-context-learning-mechanics): the induction-head circuit now has clean `review → label` pairs to pattern-match the final review against.

### Step 3 — same examples, unbalanced labels

```
Review: "Fast shipping and it works exactly as described."
Sentiment: positive

Review: "Exceeded my expectations, would recommend to anyone."
Sentiment: positive

Review: "Genuinely the best purchase I've made this year."
Sentiment: positive

Review: "Customer service never responded to my emails."
Sentiment: negative

Review: "The battery life is decent and the screen looks great, but
honestly I'm not sure I'd buy this brand again."
Sentiment:
```

> **Why this step?** Three positive examples against one negative. This is the setup behind a documented pattern sometimes called **majority-label bias** (Zhao et al., "Calibrate Before Use," 2021): on ambiguous inputs specifically, few-shot prompts tend to pull the output toward whichever label dominated the demonstrations — not because the model is reasoning about label frequency, but because the demonstrations shift the model's effective output distribution toward the pattern it saw more often. An input like the test sentence here — genuinely split between a positive and a negative clause — is exactly the case where that pull has room to show up, since there's no strong signal in the input itself to override it.

### Step 4 — same unbalanced examples, negative last

```
Review: "Fast shipping and it works exactly as described."
Sentiment: positive

Review: "Exceeded my expectations, would recommend to anyone."
Sentiment: positive

Review: "Customer service never responded to my emails."
Sentiment: negative

Review: "Genuinely the best purchase I've made this year."
Sentiment: positive

Review: "The battery life is decent and the screen looks great, but
honestly I'm not sure I'd buy this brand again."
Sentiment:
```

> **Why this step?** Same 3:1 label ratio as Step 3, but the last demonstration before the test input is now positive instead of negative — reordered specifically to test **recency bias**, the companion finding in the same research: the demonstration closest to the query tends to exert outsized pull, on top of whatever the overall label balance contributes. Two prompts with an *identical* label count can still push toward different outputs on the same ambiguous input, purely from which example sits last.

## Where it breaks

The uncomfortable finding underneath all four steps: **format can matter as much as content.** Min et al. ("Rethinking the Role of Demonstrations," 2022) found that even few-shot demonstrations with deliberately scrambled or wrong labels can still outperform zero-shot prompting on some tasks — because a large share of the benefit comes from establishing the input-output *shape* (what a review looks like, what a label looks like, where the boundary between them sits), not from the labels being correct. That means a prompt can look well-constructed — balanced examples, sensible labels — and still steer the model through label balance and ordering effects that have nothing to do with the actual content of your examples.

**The fix:** treat few-shot construction as a variable to control for, not a detail to eyeball. Concretely: keep label counts equal (or explicitly document and account for any imbalance), rotate which example sits last across repeated calls rather than fixing an order once, and on tasks where the stakes justify it, run the same query through a few label-balanced, order-shuffled variants of the prompt and check whether the answer holds steady — the same resampling-for-stability instinct used to catch fabricated content applies here to catch prompt-construction artifacts.

## Takeaways

- **Example count, label balance, and order are levers, not incidental details** — the same instruction wording can produce different outputs on ambiguous inputs depending only on how the demonstrations are arranged.
- **Majority-label bias and recency bias are documented, named effects** (Zhao et al. 2021; Min et al. 2022), not folklore — they're a direct consequence of the [induction-head mechanism](/learn/llm-foundations/in-context-learning-mechanics) pattern-matching against whatever shape the demonstrations actually have.
- **Ambiguous inputs are where this shows up** — a clearly positive or clearly negative review is unlikely to flip from prompt construction alone; the borderline cases are exactly where it matters.
- **Balance and rotate, don't just word-smith.** A perfectly worded instruction sitting on top of a 3:1 label-imbalanced, badly-ordered example set is still a biased prompt.

**Related:** [In-Context Learning Mechanics](/learn/llm-foundations/in-context-learning-mechanics), [In-Context Learning](/learn/llm-foundations/in-context-learning), [Is In-Context Learning Implicit Gradient Descent?](/learn/llm-foundations/is-in-context-learning-gradient-descent), [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics)
