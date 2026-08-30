---
title: "Randomized experiments and online A/B tests"
track: "machine-learning"
order: 512
status: live
summary: "Randomization can make treatment groups comparable at assignment, but valid experiments still need an ethical design, correct unit, guardrails, and careful interpretation."
duration: "18 min read"
updated: "2026-08-30"
---

## The short answer

Random assignment is a powerful way to estimate the effect of an intervention because, in expectation, it balances both measured and unmeasured pre-assignment factors. It does not automatically make every observed difference causal. Define eligibility, assignment unit, exposure, primary outcome, duration, stopping rule, interference risks, harms, and analysis plan before launch.

## Why this matters

Online experiments influence real people, not anonymous rows. An apparently profitable ranking change can increase complaints, inequitable access, or long-term churn. Weak randomization or broken logging can produce an authoritative-looking number about an intervention that was never actually delivered as intended.

## How it works

Choose the unit that prevents treatment spillover: user, household, store, class, or region. Randomize before treatment, verify balance on pre-treatment variables, and log assignment separately from exposure. Analyze an intention-to-treat effect when assignment is the policy lever; analyze uptake or mechanisms only with stronger assumptions. Establish primary and guardrail metrics, sample size, duration across relevant cycles, and a valid sequential rule if monitoring early.

Check for sample-ratio mismatch, logging loss, cross-device contamination, bot traffic, novelty effects, and interference between units. Keep a rollback path and stop an experiment for predefined safety or ethical reasons even if statistical evidence is incomplete.

## Worked examples and variations

### Example 1: checkout reminder

Randomize eligible users, measure completed purchases and support contacts, and predefine whether repeated reminders count as exposure. Assignment effect can differ from effect among users who notice the reminder.

### Example 2: school-level intervention

Randomize schools rather than pupils when teachers share materials. Analyze at the school or cluster-aware level; thousands of pupils do not remove school-level dependence.

### Example 3: ranking system

Randomize a persistent user bucket and include latency and content-diversity guardrails. Re-randomizing each page view can create a confusing user experience and interference.

### Example 4: gradual ramp

Start at low traffic with safety monitors, then expand only after a prewritten review. A ramp reduces exposure but does not replace the planned analysis.

### Boundary case: a must-have legal or safety control

Some interventions cannot ethically be withheld. Use another design, such as phased implementation with careful assumptions, rather than forcing an A/B test because it is convenient.

### Counterexample: post-randomization adjustment

Adjusting for a variable changed by treatment, such as time spent in a redesigned flow, can distort the total assignment effect. Decide adjustment variables from pre-treatment knowledge.

## Two ways to see it

Randomization is a design-based source of comparability. In operations, it is a controlled policy change with consent, support, logging, and reversal obligations.

## Hands-on

Draft an A/B protocol for a model-driven product change: eligibility, randomization unit, primary metric, guardrails, minimum useful effect, runtime, and stop conditions. Deliberately analyze exposed users only, compare it with intention-to-treat, then reset to the prespecified primary analysis. Simulate a sample-ratio mismatch and add a launch-blocking diagnostic.

## Checkpoint

- [ ] Assignment, exposure, and outcome are separately defined and logged.
- [ ] The unit prevents material interference between treatment and control.
- [ ] Ethical guardrails and rollback conditions are operational, not aspirational.

## What this does not solve

Randomization does not automatically transfer a result to another population, future period, or scaled system. It also does not settle normative questions about whose outcomes should count.

## Continue, go deeper, apply it

Continue with observational causal estimation and its limits. Go deeper with cluster experiments and sequential analysis. Apply this by keeping the experiment protocol and assignment code under version control.
