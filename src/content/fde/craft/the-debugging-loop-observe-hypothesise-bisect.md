---
title: "The debugging loop: observe, hypothesise, bisect"
phase: craft
module: debugging-unfamiliar-systems
kind: lesson
summary: "A repeatable three-step loop for debugging code you did not write, in an environment you do not control, with no time to read it end to end first."
duration: 11 min
updated: "2026-09-02"
outcomes:
  - Run the observe, hypothesise, bisect loop on an endpoint or script you have never seen before.
  - Write a hypothesis that is falsifiable in one step, not a vague guess dressed as one.
  - Cut a search space in half instead of reading every line, using logs, git history, or the request path itself.
artifact: A one-page debugging log from a real bug you fixed this week, in the observe / hypothesise / bisect format, kept as the first entry in your journal's debugging section.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

Vinoo Ganesh, who ran Palantir's Project Frontline and trained more than 250 engineers into the field, uses one question as his standard technical interview for the role: given a slow endpoint you have never seen before, walk from monitoring to logs to profiling to a fix. Not "fix this bug" on code you wrote yesterday. A system that is a stranger to you, under time pressure, with someone watching.

That is the actual shape of debugging on an engagement. You are not maintaining your own service. You are three days into a customer's stack, something is broken or slow, and the person who wrote it is not in the room. Reading the whole codebase first is not an option. You need a method that works when you understand almost nothing about the system and have to understand just enough, fast.

The method is three steps, repeated until you are done: **observe, hypothesise, bisect.**

## Observe before touching anything

The instinct under pressure is to start changing things. Resist it for the first few minutes. Observation means gathering signal without altering behaviour: read the error message in full, not just its first line; check what the dashboard or monitoring shows about when the problem started; find one concrete, reproducible instance of the failure, not a vague report of "it's slow sometimes."

A customer saying "the export is broken" is not an observation you can act on. A specific correlation id, a timestamp, and an error message is. Your first job when a bug arrives secondhand is almost always to convert a vague report into a reproducible case. Ask for the exact request, the exact time, and the exact output. Most of the debugging time in an unfamiliar system is lost to skipping this step and guessing instead.

## Hypothesise something falsifiable

A hypothesis is a specific, testable claim about the cause, not a feeling. "The database might be slow" is not a hypothesis you can act on. "This endpoint is slow because it runs an unindexed query per row in a loop, and the loop count scales with the customer's ticket volume" is. The difference is that the second one predicts something you can check in under a minute: does the query count in the logs scale with input size?

Write the hypothesis down before you test it. This forces specificity, and it means that when you are wrong, you know exactly what you were wrong about, instead of drifting into a vague sense that "something's off with the DB layer." Being wrong quickly and precisely is the fast path. Being vaguely wrong for twenty minutes is the slow one.

## Bisect: cut the search space in half

Once you have a reproducible case and a hypothesis, do not read the whole call path looking for the bug. Cut the space where it could be.

- **Time bisection.** If a service used to work and now does not, `git bisect` between the last known-good commit and the current one finds the change in log(n) steps, not n.
- **Request bisection.** If one input triggers the bug and another does not, remove half the difference between them and see which half still reproduces it. This is how you turn "the customer's file is broken" into "row 214 is broken" without reading all 4,000 rows.
- **Layer bisection.** Is the slowness in the client, the network, the application code, or the database? Time each layer once, separately, and you usually find that three of the four are innocent in under five minutes.

```bash
# time bisection on a regression
git bisect start
git bisect bad HEAD
git bisect good v2.3.0
# git checks out a midpoint; test, then:
git bisect good   # or: git bisect bad
# repeat until it names the commit
```

Bisection is a discipline, not a tool. The same idea works with print statements, with a stopwatch against three stages of a request, or with a spreadsheet of which of ten input files fail. The goal in every case is the same: eliminate half the possibility space with one test, instead of reading code linearly hoping to spot the problem.

## Why this loop is the FDE version of debugging

A product engineer debugging their own team's service has a huge head start: they know the architecture, they have access to internal dashboards, and they can ask the person who wrote the function down the hall. None of that is guaranteed for you. You may have read-only access to logs through a jump box, no architecture diagram, and a customer engineer who is friendly but does not actually know why the code does what it does.

The loop above does not depend on any of that context. It depends only on being able to observe a symptom, state a falsifiable guess, and cut the space in half. That is why it is the right default when the system is unfamiliar, because it works whether or not you ever get the missing context.

The other reason to make this explicit and repeatable is that it is testable. Interviewers ask this exact question because narrating the loop out loud is the evidence they are checking for, not the final fix. Saying "I'm going to check the logs first, because I want to see if the slowness correlates with request size before I guess at a cause" is the signal. Silently poking at code and eventually stumbling on the answer is not, even if you get there.

## Do this now

Pick a bug from something you are already running, real or from a lab in this path. Write three sections in your journal: what you observed (with the specific reproducible case), the hypothesis you formed and what would falsify it, and how you bisected the space to confirm or reject it. Keep this format for every bug you fix from here on. [Walkthrough: the slow endpoint, from dashboard to diff](/roles/forward-deployed-engineer/craft/the-slow-endpoint-walkthrough) is a full worked example of the same loop against a specific case.
