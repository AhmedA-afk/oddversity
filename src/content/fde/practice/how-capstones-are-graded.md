---
title: "How capstones are graded"
phase: practice
module: capstones
kind: reference
summary: The five capstones are graded against one rubric, and the rubric is deliberately harsh about the things enterprise buyers actually check. Two of the eight requirements are pass-or-fail gates, and a system that only ever ran on your laptop fails one of them.
duration: 10 min
updated: "2026-09-02"
outcomes:
  - State the eight requirements every capstone submission must meet, and which two are hard gates.
  - Score your own capstone against the weighted rubric before you show it to anyone.
  - "Write the four artifacts that accompany every build: the eval report, the rollback note, the adoption plan, and the generalise-vs-one-off memo."
artifact: A filled-in scoring sheet for each capstone, kept alongside the repository, with your own score and the evidence for each line.
sources:
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-for-enterprise-llm-deployments
  - https://www.tryexponent.com/guides/openai-forward-deployed-engineer-interview
  - https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde
  - https://job-boards.greenhouse.io/anthropic/jobs/5302966008
---

Every capstone in this module is rebuilt from a deployment that a company has talked about publicly. None of them are graded on whether your version resembles the original. They are graded on whether you did the eight things an enterprise buyer checks before they let software touch their data, and whether you can prove each one with a file in a repository.

Read this page before you start Capstone 01, and score yourself against it before you publish anything.

## The eight requirements

### 1. The eval existed before the build. Hard gate.

Not a test suite. An eval: a set of labelled examples, a scorer that turns a system output into a number, and a baseline number produced by something dumb.

The order matters and it is checkable. Your repository history has to show the labelled set and the scorer committed before the first line of the system that is being scored. If the eval arrives afterwards, you built the thing and then found a way to make it look good, which is the failure mode the whole exercise exists to prevent.

OpenAI's head of FDE, Colin Jarvis, describes this as eval-driven development, and the examples he gives are small: on the order of twenty expert-labelled examples to start, and a rough feasibility heuristic of getting seven or eight of ten right in a playground before committing to a build. Those figures come from a talk, transcribed in the ZenML LLMOps database, not from a paper. Treat them as a practitioner's rule of thumb, which is what they are, and which is enough. Twenty labelled examples you actually argued about are worth more than two hundred you generated.

The baseline is the part people skip. If you cannot beat a keyword search, a regex, a lookup table, or "always answer the most common class", you have not shown anything. Capstone 05 has no model in it at all and still needs a baseline: the spreadsheet the hospital uses today.

### 2. The system runs somewhere that is not your laptop. Hard gate.

A container on a small virtual machine you rented, or a service inside a VPC with a private subnet and no public database. Not `localhost`. Not a notebook. Not a hosted playground with your key pasted in.

The point is not the cloud bill. It is that deploying into someone else's environment is the part of the job that generic AI courses do not touch, and the first time you meet DNS, an egress rule, a service account, and a container that starts fine locally and dies on boot, you want it to be on your own time. Every capstone names a deployment target. Each one also names an air-gapped variant as a stretch: rebuild it with every dependency pre-staged and no network at run time.

### 3. There is a rollback story.

Written, and rehearsed once. Three questions:

- How does someone turn this off in under a minute without your help? A feature flag read from an environment variable, a queue you stop draining, a route you flip back. Name the exact command.
- What happens to work in flight when it is turned off? A partially processed ticket, a half-written comment, an agent mid-tool-call.
- How do you go back to the previous version, and how do you know the previous version is still good? Pinned image tags, a migration that is reversible or additive-only, and the eval re-run on the old version.

Rollback is graded on evidence: a terminal transcript or a short clip of you turning it off and back on.

### 4. There is an adoption plan.

The build is the short part. The Morgan Stanley engagement, as Jarvis describes it, took six to eight weeks to build the technical pipeline and then roughly four more months of trust-building and eval rigour before it was used in a regulated workflow. Those durations are his account of the project, not an audited figure, but the shape is the lesson: the ratio of build time to trust time in a regulated enterprise is not one to one.

Your plan names: the first five users by role, what they do today instead, the one metric they will judge it on, the shadow period before anyone relies on it, the training you will run, and the date you would kill it if the metric does not move.

### 5. The write-up is first person and carries real numbers from your own harness.

"I built", not "we built" and not "this project demonstrates". Every number in it comes out of your scorer, on your data pack, on a run you can point at. Include the run that got worse. A write-up where the numbers only ever improve reads as marketing, and the people reading it hire for a living.

Company-reported figures from the original case can appear, labelled as such. "OpenAI reports 98% advisor adoption at Morgan Stanley" is a fine sentence. "My system reached 98% adoption" is a lie, and "adoption reached 98%" without a subject is worse, because it is a lie you can pretend you did not tell.

### 6. There is a recorded walkthrough.

Five to eight minutes, screen and voice, unedited. Show the failing case first, then the fix. OpenAI's FDE loop includes a take-home whose deliverables are working code, a running app, and a recorded walkthrough, followed by a live session where you defend the customer-facing decisions, so this is not an invented requirement. Practise defending the decisions out loud, because that is the round.

### 7. The guardrails are in code, and you can point at the file.

The architectural split that FDE sources keep returning to is deterministic where the business has a hard rule, probabilistic where it has a judgement. In the APAC automotive supply-chain build Jarvis describes, supplier minimums, material coverage, and lead times were enforced deterministically and the model orchestrated around them.

So: one module, obviously named, containing the constraints as pure functions or as database policies. Refund ceilings, entitlement filters, row-level security, command allowlists, cost caps. If a rule is only expressed as a sentence inside a prompt, it is not a guardrail, it is a preference, and you must grade it as one.

### 8. There is a generalise-vs-one-off memo.

One page per capstone. Three columns: what was specific to this customer, what three customers would need, and what should be a configuration option rather than code. Then a recommendation with a cost.

Jarvis names the opposite error too, and it is the more common one among engineers: generalising too early, which produces a platform nobody asked for. His stated reuse targets are roughly 20% reusable components in the first engagement and about 50% by the third. Aim at the first number, not the second, on Capstone 01.

## The rubric

Score out of 100. The two hard gates are scored, and also block: fail either one and the capstone is incomplete regardless of the total.

| # | Line | Weight | What earns full marks |
|---|---|---|---|
| 1 | Eval before build (gate) | 20 | Labelled set, scorer, and baseline committed before the system. Labelling protocol written down. Disagreements recorded, not smoothed. |
| 2 | Deployed off your laptop (gate) | 20 | Runs in the named target. Config from environment, secrets not in the repo, a health check, and a log line you would actually search. |
| 3 | Measured result | 15 | A table: baseline, v1, final, on the same eval set. At least one regression shown and explained. Cost and latency per unit of work. |
| 4 | Guardrails and rollback | 15 | Named module for rules in code. A test that proves a rule cannot be bypassed by input. Rollback rehearsed on video. |
| 5 | Adoption plan | 10 | Five named roles, the current alternative, the judging metric, the shadow period, the kill date. |
| 6 | First-person write-up | 10 | Your numbers, your harness, your mistakes. Company-reported figures labelled. No unsourced claim. |
| 7 | Recorded walkthrough | 5 | Five to eight minutes, failure shown before success, decisions defended. |
| 8 | Generalise-vs-one-off memo | 5 | Three columns, a recommendation, and a cost attached to the recommendation. |

**Bands.** Below 70: not portfolio-ready. 70 to 84: shows the loop, ship it and move on. 85 and above: this is the artifact you send with an application, and it is worth another week.

**Self-scoring rule.** Score each line before you write the summary, not after. If you cannot name the file, the commit, or the timestamp that earns a line, that line scores zero. "I did think about it" is zero. The whole rubric is built so that every point has an artifact behind it, because the thing you are compensating for is that no course can manufacture production experience, and a file with a date on it is the closest available substitute.

## What is not graded

Model choice. Framework choice. Front-end quality beyond "a person could use it". Line count. Whether your version is more capable than the public deployment it is modelled on. Nobody in an interview will care that your retrieval used one library rather than another; they will care that you can say why the eval said it was better, and what you gave up.
