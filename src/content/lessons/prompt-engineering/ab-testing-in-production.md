---
title: "A/B Testing Prompts on Real Traffic"
track: "prompt-engineering"
status: live
summary: "Offline eval and online A/B answer different questions - here's the mental model for why, plus the arithmetic for reading a live result."
duration: "7 min read"
---

A golden set can go fully green and the prompt can still make things worse for real users. That isn't a contradiction - it's two different questions being answered by two different tools.

## What it is

[A/B Testing Prompts Against Real Traffic](/learn/prompt-engineering/ab-testing-prompts-in-production) already covers the mechanics: split live traffic between variant A and variant B, keep each user on one variant for the whole session, pick an outcome metric you can compute from behavior rather than from reading outputs yourself, and hold out for real significance before declaring a winner. This lesson is about the question underneath those mechanics - why an eval-set win doesn't already answer them, and how to reason about a result once the numbers come in.

## The mental model

An offline eval asks: *on the cases we've thought to write down, does this prompt produce the output we want?* An online A/B test asks a completely different question: *when this prompt actually runs against everyone, does the thing we care about - resolutions, conversions, escalations - get better?*

Those questions diverge for reasons an eval set structurally cannot see. Real traffic includes inputs nobody wrote a case for yet. Users adapt their own behavior to a system's replies within a conversation, so a slightly different first response can change what a user types next - an effect no static case can capture, because the case doesn't respond to anything. And business metrics sit downstream of model output through code, retries, and human judgment that an eval set never touches at all. A prompt can be a measurable win against every case you own and a wash - or a loss - against the traffic those cases were only ever a sample of.

## Why it works this way

The core reason is statistical, not just conceptual. Any online metric computed from real traffic carries sampling noise - the same true underlying prompt could show a 3-point lift on one day's traffic and a 1-point lift on the next, purely from which users happened to show up. Detecting a real difference means collecting enough traffic that the observed gap is comfortably larger than that noise, not just larger than zero. Checking the result repeatedly while it's running and stopping the instant it looks favorable inflates the odds of a false "win" - each look is another chance for noise alone to cross whatever threshold you're eyeballing, the same reason buying more lottery tickets raises your odds of *a* win without changing the odds of any one ticket. Decide your metric and your minimum runtime before the test starts, and don't revisit that decision based on how the numbers look mid-flight.

## A concrete example

Say variant A (current) and variant B (candidate) run for a week on a support-reply prompt, measured by escalation rate - lower is better.

- Variant A: 120 conversations, 18 escalated → 15.0%
- Variant B: 130 conversations, 14 escalated → 10.8%

A 4.2-point gap looks like a real win for B. Before trusting it, do a rough noise check. Pool the two rates: (18 + 14) / (120 + 130) = 32 / 250 = 12.8%. The standard error of the *difference* between two proportions at roughly this size, with these sample sizes, is approximately:

```
SE = sqrt(p*(1-p) * (1/n_A + 1/n_B))
   = sqrt(0.128 * 0.872 * (1/120 + 1/130))
   = sqrt(0.1116 * 0.0160)
   = sqrt(0.00179)
   ≈ 0.042  (4.2 percentage points)
```

The observed gap (4.2 points) is almost exactly one standard error - nowhere near the roughly two-standard-error bar that's the conventional rough cutoff for "probably not noise." At this sample size, a gap this size is a coin flip's worth of evidence, not a result. [Worked Example: Reading an A/B Test Result](/learn/prompt-engineering/reading-ab-test-results) walks a full case with more traffic, including one where an early lead like this one reverses by the time enough data comes in.

## Where it shows up

Any prompt with enough traffic to make noise a real concern: a support triage assistant, a ranking or recommendation prompt, an onboarding flow where tone changes plausibly shift completion rates. It matters least for low-volume, high-stakes prompts (a legal-document summarizer run a few times a day) where you'll never collect enough traffic to reach significance in a reasonable window - there, a tight offline eval and a cautious canary (see [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow)) carry more of the weight than a formal A/B split ever will.

## Watch out for

- **Peeking and stopping early.** The moment the numbers look good is precisely when they're least trustworthy, for the reason worked out above - each early glance is a fresh chance for noise to look like a win.
- **Splitting by request instead of by user.** If the same user can land in variant A on one message and variant B on the next, you contaminate the comparison with within-session effects that have nothing to do with which variant is actually better.
- **Picking a metric because it's easy to compute, not because it reflects quality.** Output length or response time are trivial to log and mean almost nothing about whether the reply actually helped anyone - pick the outcome you'd defend in a room, then figure out how to measure it.

## Where next

[Worked Example: Reading an A/B Test Result](/learn/prompt-engineering/reading-ab-test-results) carries this exact reasoning through two full weeks of data, including the moment an early lead flips. Once a variant wins for real, [Versioning Prompts Like Production Code](/learn/prompt-engineering/prompt-versioning-like-code) and [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow) cover promoting it deliberately instead of just swapping a file.

**Related:** [A/B Testing Prompts Against Real Traffic](/learn/prompt-engineering/ab-testing-prompts-in-production), [Worked Example: Reading an A/B Test Result](/learn/prompt-engineering/reading-ab-test-results), [Regression Tests: Keeping a Golden Set Green](/learn/prompt-engineering/regression-tests-for-prompts), [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow), [Probability Basics for AI](/learn/maths-foundations/probability-basics-for-ai)
