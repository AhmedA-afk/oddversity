---
title: "Quiz: Evaluating, Versioning, and Shipping"
track: "prompt-engineering"
status: live
summary: "Ten questions on eval-set design, exact-match vs. judge scoring, reading an A/B result, and a safe rollout."
duration: "8 min read"
---

Ten questions covering the module end to end - eval design, scoring method, A/B reasoning, and a full change-management rollout.

## Questions

**1. You write a prompt, then hand-pick five inputs from memory to test it before shipping. What's the main problem with this eval set?**

A. It's too small to be worth running at all
B. The inputs were selected by the same person who wrote the prompt, biasing them toward cases it already handles
C. Hand-picked inputs can't be stored as JSONL
D. It doesn't include a rubric

<details><summary>Answer</summary>

**Correct: B.** Selecting your own test inputs after writing the prompt reproduces the exact selection bias covered in [Why You Evaluate Before You Ship](/learn/prompt-engineering/why-eval-before-ship) - you unconsciously pick cases you expect to work, then feel reassured when they do.

- A is wrong: size matters, but it's not the *main* problem here - a small set of genuinely representative, independently-sourced cases is far more useful than a large set that's all self-selected.
- B is correct.
- C is wrong: any input can be stored as JSONL regardless of how it was chosen - format isn't the issue.
- D is wrong: a rubric matters for open-ended scoring, but this prompt (or any) can fail an eval on missing rubric criteria independent of where the inputs came from - the input-selection bias is the deeper problem.

</details>

**2. Why tag eval cases as `ordinary`, `edge`, or `failure` instead of just reporting one overall pass rate?**

A. Tags are required for JSONL files to parse correctly
B. It lets you see which specific kind of input a prompt struggles with, not just an aggregate number
C. It makes the eval run faster
D. Untagged cases can't be added to a golden set

<details><summary>Answer</summary>

**Correct: B.** As shown in [Building a Prompt Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset), an 83% overall pass rate can hide a category that's completely broken - breaking the report out by tag turns that into "100% on ordinary, 50% on edge cases," which is actionable in a way the average never was.

- A is wrong: tags are plain JSON fields with no bearing on whether the file parses.
- B is correct.
- C is wrong: tagging doesn't change how many model calls the run makes.
- D is wrong: a golden set can be built from any cases you choose to curate; tagging is a convenience for reporting, not a requirement for golden status.

</details>

**3. Your prompt drafts a customer-support reply - open-ended text with no single correct string. Which scoring approach fits?**

A. Exact-match against one canonical reply
B. A rubric with score anchors, applied by an LLM judge
C. Word-count comparison against the canonical reply
D. Skip scoring since the output is subjective

<details><summary>Answer</summary>

**Correct: B.** [Rubric Scoring With an LLM Judge](/learn/prompt-engineering/rubric-and-llm-judge) exists precisely for output where two different strings can both be correct - a fixed rubric with concrete anchors per dimension makes "good" checkable without requiring one canonical answer.

- A is wrong: exact-match assumes one right string, which doesn't exist for open-ended replies - it would fail correct-but-differently-worded output.
- B is correct.
- C is wrong: word count says nothing about accuracy, tone, or completeness - a reply can hit any target length while being wrong on every rubric dimension.
- D is wrong: "subjective" doesn't mean unscoreable - it means you need a rubric with anchors instead of a single string to compare against.

</details>

**4. What does giving each rubric score a concrete anchor (e.g., "1 = states something false or not in the ticket") mainly protect against?**

A. The judge model running slower
B. The judge drifting toward inconsistent, vaguer standards across different calls
C. The need for a human to ever review any output
D. Token costs during scoring

<details><summary>Answer</summary>

**Correct: B.** As covered in [Rubric Scoring With an LLM Judge](/learn/prompt-engineering/rubric-and-llm-judge), a rubric without anchors just relocates the ambiguity from "is this good" to "what does the judge think good means today" - concrete anchors make the standard the same artifact every time, protecting against leniency drift and vague, inconsistent grading.

- A is wrong: anchors don't affect inference speed.
- B is correct.
- C is wrong: anchors reduce judge drift, but human calibration checks are still recommended precisely because a judge - anchored or not - can still be wrong.
- D is wrong: anchors add a small amount of prompt text, if anything a negligible cost increase, not a saving - and cost isn't what they're solving for.

</details>

**5. When should a golden-set regression gate run?**

A. Only after a customer files a complaint about a regression
B. Once, when the prompt is first written, to establish a baseline
C. On every proposed prompt change, automatically, before it merges
D. Only during the quarterly prompt audit

<details><summary>Answer</summary>

**Correct: C.** [Regression Tests: Keeping a Golden Set Green](/learn/prompt-engineering/regression-tests-for-prompts) treats the golden set as a gate, not a one-time measurement - it has to block every change that could plausibly affect behavior, before that change reaches anyone, the same way [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow) wires it into CI.

- A is wrong: this is finding out from a user, which is exactly what a gate exists to prevent.
- B is wrong: a baseline measured once and never rerun can't catch a regression introduced by any later change.
- C is correct.
- D is wrong: quarterly is far too infrequent to catch a regression before it reaches a meaningful share of traffic - the whole value of the gate is running on every change, not on a schedule.

</details>

**6. Three days into a planned two-week A/B test, variant B leads variant A by a noticeable margin on a small sample. What should the team do?**

A. Ship variant B immediately - a lead is a lead
B. Discard variant B immediately, since early results are unreliable
C. Wait for the full pre-committed duration before deciding, since an early lead on a small sample can be noise
D. Switch 100% of traffic to variant B to gather data faster

<details><summary>Answer</summary>

**Correct: C.** [Worked Example: Reading an A/B Test Result](/learn/prompt-engineering/reading-ab-test-results) shows exactly this pattern - an 8.6-point lead at one week that was within about 2 standard errors reversed into a 2.2-point deficit, well within noise, by the two-week mark. The stopping rule is decided before the test starts specifically so a good-looking early read doesn't override it.

- A is wrong: this is the peeking-and-stopping trap covered in [A/B Testing Prompts on Real Traffic](/learn/prompt-engineering/ab-testing-in-production) - an early lead on a small sample is exactly the least trustworthy moment to decide.
- B is wrong: discarding a variant early is just as much a premature call as shipping it early - both skip the pre-committed window.
- C is correct.
- D is wrong: routing everyone to one variant destroys the comparison entirely - you'd no longer have a concurrent baseline to measure against.

</details>

**7. Variant A: 50/400 conversations escalate (12.5%). Variant B: 42/410 escalate (10.2%). This is day 1 of a planned two-week test. What's the right move?**

A. Ship B today - it already leads by 2.3 points
B. Wait for the full two-week window; a 2.3-point gap on one day of data hasn't been checked against noise yet, and the duration was pre-committed
C. Throw out the whole test since the gap is small
D. Route all remaining traffic to B immediately to reach significance faster

<details><summary>Answer</summary>

**Correct: B.** The gap might be real or might not be - the point of [A/B Testing Prompts on Real Traffic](/learn/prompt-engineering/ab-testing-in-production)'s noise check is to run that arithmetic before trusting a number this early, and the point of pre-registering a duration is to not need to make that call under time pressure on day one.

- A is wrong: one day of data is a small fraction of the planned window - the same early-lead trap as the previous question.
- B is correct.
- C is wrong: a small gap on thin data isn't evidence of nothing - it's simply not yet evidence of anything either way. The test isn't broken; it's just early.
- D is wrong: this eliminates the concurrent comparison entirely, which is the opposite of what running the test longer is meant to provide.

</details>

**8. Which sequence matches the change-management workflow for a prompt change?**

A. Canary the change first, then run the eval gate only if the canary looks bad
B. Propose the diff → run the eval and golden gate → review diff and report together → canary a small slice → ramp or roll back
C. Ship to 100% of traffic, then write the eval set based on what breaks
D. Review the diff alone, skip the eval gate if the reviewer is confident, then ramp

<details><summary>Answer</summary>

**Correct: B.** This is the exact five-gate sequence from [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow) - each gate catches something the previous one structurally can't: the eval gate catches known regressions, review catches a wrong diagnosis a script can't see, and the canary catches inputs nobody has written a case for yet.

- A is wrong: canarying before an eval gate means live users are exposed to a change nobody confirmed even passes known cases.
- B is correct.
- C is wrong: shipping first and building the eval set from what breaks means every failure is discovered by a real user, not caught before they see it - inverting the entire point of the workflow.
- D is wrong: skipping the eval gate on a reviewer's confidence discards the one check that's cheap, automatic, and doesn't depend on anyone's judgment in the moment.

</details>

**9. You swap the model behind a prompt that was working well. What's the minimum you should do before trusting it in production?**

A. Nothing - if the output still looks reasonable on a couple of manual checks, it's fine
B. Just update the model ID string in config
C. Rerun the exact same eval set on the new model and compare the results like-for-like
D. Test with the same two or three examples you tried by hand originally

<details><summary>Answer</summary>

**Correct: C.** [Portability: Surviving a Model Swap](/learn/prompt-engineering/prompt-portability-across-models-strategy) is explicit that "still returns valid output" is not "still works" - the failure mode is silent quality drift, and the only way to catch it is rerunning the same cases you already have expected answers for, the way [Before/After: Porting a Prompt to a New Model](/learn/prompt-engineering/porting-a-prompt-worked) does.

- A is wrong: this is exactly the silent-drift trap - a response can look fine on a skim and be measurably worse on the harder cases the eval set exists to catch.
- B is wrong: updating the config is necessary but says nothing about whether behavior held up.
- C is correct.
- D is wrong: a couple of hand-picked examples is the same selection-bias problem from question 1, now applied after a model swap instead of before a first ship.

</details>

**10. Before ramping a prompt change to 100% of traffic: the golden gate passed, the canary's primary metric stayed flat (within noise) over a full week, but one non-golden case failed in a spot-check, and there's no way to instantly revert to the previous version if something goes wrong. Is this ready to ship to everyone?**

A. Yes - the golden gate passing is the main requirement, and it did
B. Yes - the canary metric didn't regress, so nothing else matters
C. No - a rollback target should always be instantly available before ramping, regardless of how clean the canary looked
D. No, but only because A/B tests always require exactly two full weeks of data before any decision

<details><summary>Answer</summary>

**Correct: C.** [Versioning Prompts Like Production Code](/learn/prompt-engineering/prompt-versioning-like-code) and the ship/rollback checklist in [Evaluation and Versioning Cheatsheet](/learn/prompt-engineering/eval-versioning-cheatsheet) both treat an instantly-retrievable rollback target as a precondition for ramping, not a nice-to-have - without one, a problem that surfaces at higher traffic has no fast way back, no matter how good every other signal looked.

- A is wrong: the golden gate only proves no *known* regression - it says nothing about the spot-check failure or the missing rollback path, both of which are separate real risks.
- B is wrong: a flat canary metric is necessary but not sufficient - it doesn't address the unresolved spot-check failure or the inability to revert quickly if the ramp goes badly.
- C is correct.
- D is wrong: there's no universal fixed duration - the right runtime is whatever was pre-registered based on the traffic and effect size needed, not a fixed two weeks in all cases. The real blocker here is the missing rollback path, not the calendar.

</details>

**Related:** [Why You Evaluate Before You Ship](/learn/prompt-engineering/why-eval-before-ship), [Regression Tests: Keeping a Golden Set Green](/learn/prompt-engineering/regression-tests-for-prompts), [Worked Example: Reading an A/B Test Result](/learn/prompt-engineering/reading-ab-test-results), [A Change-Management Workflow for Prompts](/learn/prompt-engineering/change-management-workflow), [Evaluation and Versioning Cheatsheet](/learn/prompt-engineering/eval-versioning-cheatsheet)
