---
title: "Worked Example: Reading an A/B Test Result"
track: "prompt-engineering"
status: live
summary: "Two prompt variants, two weeks of data, and the exact point where an early lead reverses into a wash."
duration: "8 min read"
---

The gap looks real at the end of week one. It isn't real by the end of week two - and the arithmetic that tells you so is the whole lesson.

## The setup

Variant A is the current support-reply prompt. Variant B adds a proactive clarifying question whenever a request looks ambiguous, on the theory that resolving ambiguity up front should reduce escalations later. The metric, decided before the test starts, is **resolved without escalation** - higher is better - and the team pre-committed to a two-week minimum runtime, per [A/B Testing Prompts on Real Traffic](/learn/prompt-engineering/ab-testing-in-production), specifically so nobody calls it early based on a good-looking Tuesday.

## Step by step

### Step 1: Week 1 numbers come in

| Variant | Conversations | Resolved w/o escalation | Rate |
|---|---|---|---|
| A | 200 | 140 | 70.0% |
| B | 210 | 165 | 78.6% |

B leads by 8.6 points. Someone runs the same noise check from [A/B Testing Prompts on Real Traffic](/learn/prompt-engineering/ab-testing-in-production): pooled rate = (140+165)/(200+210) = 305/410 = 74.4%.

```
SE = sqrt(0.744 * 0.256 * (1/200 + 1/210))
   = sqrt(0.1905 * 0.00976)
   = sqrt(0.00186)
   ≈ 0.043  (4.3 percentage points)
```

8.6 points / 4.3 points per SE ≈ **2.0 standard errors** - right at the conventional rough threshold people reach for when they want to call something significant.

> **Why this step?** This is exactly the tempting moment. 2.0 SE *looks* like a green light. But it's one week of data on a metric that was pre-committed to run for two, and a threshold crossed on day 7 of 14 has had far less exposure to the day-to-day and weekday/weekend variation real traffic carries than the same threshold crossed on day 14.

### Step 2: The team holds the line

Nobody ships yet. The stopping rule was set before the test started - two weeks, then decide - specifically to prevent the decision from being made by whoever happens to be looking at the dashboard on the day the numbers look best. Holding here is the entire discipline; skip it and the rest of this example is moot.

> **Why this step?** A rule you can only follow when it's convenient isn't a rule. The value of pre-committing to a duration is that it removes the decision from the moment you're most tempted to make it badly.

### Step 3: Week 2 numbers come in

| Variant | Week 2 conversations | Week 2 resolved | Week 2 rate |
|---|---|---|---|
| A | 280 | 205 | 73.2% |
| B | 285 | 180 | 63.2% |

B's second week is markedly worse than its first. Cumulative totals:

| Variant | Total conversations | Total resolved | Cumulative rate |
|---|---|---|---|
| A | 480 | 345 | 71.9% |
| B | 495 | 345 | 69.7% |

The lead reversed. A is now ahead by 2.2 points. Recomputing the noise check on the full sample: pooled rate = (345+345)/(480+495) = 690/975 = 70.8%.

```
SE = sqrt(0.708 * 0.292 * (1/480 + 1/495))
   = sqrt(0.2067 * 0.00410)
   = sqrt(0.000848)
   ≈ 0.029  (2.9 percentage points)
```

2.2 points / 2.9 points per SE ≈ **0.75 standard errors** - comfortably inside noise. The honest read at two weeks isn't "A won." It's "we can't distinguish these two, and the direction that looked so clear on day 7 doesn't hold up."

> **Why this step?** Notice what happened to the *evidence*, not just the number: a gap that was 2.0 SE in B's favor on thin data became 0.75 SE in the other direction on a full sample. That's not a contradiction - it's what noise does on small samples. One plausible read of the log is that B's clarifying question helped a first wave of straightforward requests but read as friction to the following week's mix, including returning users answering a question they felt should've been unnecessary. That's a reasonable hypothesis for what to look at next, not a proven cause - the data supports "inconclusive, direction flipped," nothing stronger.

### Step 4: Decide, without pretending the data said more than it did

"Not statistically distinguishable, and B added a full extra turn of friction for every ambiguous request" is the actual finding. The team keeps A - the existing prompt, no added complexity, no measured benefit forgone - rather than shipping B on the strength of a week-one read that didn't survive its own test.

> **Why this step?** "No significant difference" is a real, useful outcome. It means *don't ship this change*, not *run the test forever until it turns positive* - a stopping rule that only stops on a win isn't a stopping rule, it's p-hacking with a calendar.

## Where it breaks (+fix)

**Break:** if the team had shipped at the end of week 1 on the 2.0-SE read, they'd have shipped a prompt that, on the full two weeks of traffic, performed slightly worse than what it replaced. **Fix:** the pre-committed duration from [A/B Testing Prompts on Real Traffic](/learn/prompt-engineering/ab-testing-in-production) is what caught this - the fix isn't a smarter statistic, it's not looking until the number of looks was decided in advance.

**Break:** suppose an [LLM-judge](/learn/prompt-engineering/rubric-and-llm-judge) quality score on a sample of B's replies had gone up even as the escalation rate went down - which number wins? **Fix:** decide the *primary* metric before the test starts and hold to it; treat every other number as diagnostic context for understanding *why*, never as a tiebreaker invoked after the fact to rescue a result you wanted.

## Takeaways

- An early lead regresses toward the true effect more often than it feels like it should - treat any result before your pre-committed duration as informative, not decisive.
- Compute a rough standard-error check before trusting a gap; a difference under roughly one SE is not a difference you can act on, no matter how clean the percentages look side by side.
- Decide your primary metric and your minimum runtime before you start, not after you've seen the first week - that decision is what makes the rest of the read honest.

**Related:** [A/B Testing Prompts on Real Traffic](/learn/prompt-engineering/ab-testing-in-production), [A/B Testing Prompts Against Real Traffic](/learn/prompt-engineering/ab-testing-prompts-in-production), [Rubric Scoring With an LLM Judge](/learn/prompt-engineering/rubric-and-llm-judge), [Probability Basics for AI](/learn/maths-foundations/probability-basics-for-ai)
