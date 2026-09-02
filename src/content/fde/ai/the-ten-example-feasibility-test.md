---
title: The ten-example feasibility test
phase: ai
module: evals-first
kind: lesson
summary: Before you commit to a delivery date, paste ten of your labelled examples into a bare model with a rough prompt and count how many it gets right. Seven or eight means engineering will close the gap. Two means say no now.
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Run a ten-example feasibility check in under an hour and read the result correctly.
  - Distinguish a capability gap from a context gap from a specification gap.
  - Write the short memo that tells a sponsor a project is not feasible, with an alternative.
artifact: A feasibility note recording the ten cases, the score, the failure diagnosis, and the go or no-go recommendation.
sources:
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
  - https://www.tryexponent.com/guides/openai-forward-deployed-engineer-interview
---

You have twenty labelled examples. Before anyone puts a date in a plan, take ten of them, open a playground or a fifteen-line script, write the crudest prompt that describes the task, paste each input in, and count.

Jarvis names this as the feasibility heuristic his team uses: a small set of examples, run bare, and a rough target of seven or eight out of ten. It costs an hour. It is the cheapest risk-reduction available to an FDE, and skipping it is how people end up eight weeks into a build that was never going to work.

## Why ten, and why bare

Ten because you are not measuring quality, you are measuring whether the shape of the problem is within reach. Twenty labelled examples are for grading a system. Ten are for deciding whether to build one. Hold the other ten back so your later eval is not contaminated by the prompt you tuned against these.

Bare because the point is to isolate the model's ability from your engineering. No retrieval, no tools, no few-shot examples, no chain of prompts. Give it the input, a one-paragraph description of the task, and the output format. If you add retrieval now you will not know whether a success came from the model or from the fact that you happened to paste in the right paragraph.

Paste the context the human had. That is the one thing you should provide generously: if the adjuster read the policy clause, put the policy clause in. You are testing "can it do the reasoning", not "can it find the document". Finding the document is a later, separate, easier problem.

## Reading the score

**Seven or eight of ten.** Feasible. The remaining gap is what prompt structure, retrieval, tool access, validation and a fallback path are for. This is the normal, good result, and it is the one that lets you commit to a timeline.

**Nine or ten of ten.** Suspicious, and worth ten minutes of paranoia before you celebrate. Usually one of three things: the ten examples were too easy, the answer was present in the input in a form the model could copy, or the task is simpler than the customer described. Sometimes the third is true and wonderful: you have discovered the "two-week configurable engine" is actually a single well-written prompt behind a form, and you should say so rather than build the engine. Sometimes the customer's problem is not the one they told you about, and you should go back to discovery.

**Four to six of ten.** Ambiguous. Do not report this as a number. Go and diagnose the failures, because at this level the cause is almost always fixable and the fix determines the scope.

**Zero to three of ten.** Stop. Something is wrong with the framing, the data, or the request. Diagnose before you decide, but the default answer at this level is that the project as stated does not work.

## Diagnosing the failures

Look at each miss and put it in exactly one of four buckets. The bucket determines what happens next.

**Context gap.** The model did not have the information a human would have had. It did not know the branch code convention, the current rate table, the internal abbreviation. This is the best failure to find. It is a retrieval or a data-plumbing problem, and it is your bread and butter as an FDE. Fixable, and the fix is well understood.

**Specification gap.** The model answered a reasonable question, just not the one intended, or it split a case the expert would not split. This is not a model failure. Your task description is ambiguous, and if it is ambiguous to the model it is ambiguous to the new joiner in the customer's operations team. Rewrite the instruction, note the ambiguity, and take it back to the expert. Often this uncovers a real internal policy disagreement, which is a finding worth reporting on its own.

**Format gap.** The reasoning is right and the output is unparseable, or it has invented a reason code that is not on the list. Ignore this one for the feasibility count entirely. Score the reasoning, not the packaging. Structured outputs and validation solve it, and letting formatting failures depress your feasibility score is how good projects get killed.

**Capability gap.** The model genuinely cannot do the reasoning: multi-step arithmetic across a table it has to reconstruct, a legal distinction that requires reading four cross-referencing documents at once, a judgement that depends on tacit knowledge nobody has written down. This is the one that stops projects, and the one you must be honest about early.

Score the run twice. Once raw, once with format failures forgiven. Report both. The gap between them tells you how much of the work is plumbing.

## What to do when it is not feasible

This is the part of the job the postings mean by "saying no with alternatives", and it is much easier when you have ten concrete cases on a page rather than a general reservation.

Write a short memo. Three paragraphs.

- **What we tested.** Ten real cases from your operations, chosen with your expert, run with no engineering.
- **What happened.** Three of ten correct. Here are two failures with the reason. Here is one the expert themselves called a judgement call.
- **What we recommend instead.** This is the paragraph that saves the engagement.

The alternative is almost never "nothing". Common ones, in the order they usually apply:

- **Narrow the scope to the feasible slice.** The system handles the four intents it scored well on and routes the rest to a person. In a support deployment this is often 60 to 70% of volume, which is a real result.
- **Change the output.** The model cannot decide, but it can draft, summarise, extract, or rank. An assistant that prepares the case file for a human adjuster is worth building even when an auto-decider is not.
- **Fix the input first.** If the failures are context gaps caused by documents that do not exist in machine-readable form, the honest first project is the data one. That is a smaller, more certain, more billable piece of work, and it is a prerequisite either way.
- **Wait, deliberately.** Rare, and only for genuine capability gaps on a problem worth the wait. Note the specific capability, log it as field feedback to the vendor, and set a review date.

The memo protects the customer, and it protects you. Committing to a build that scored three of ten is how an FDE deployment becomes the failed project everyone remembers.

## Do it in the room

The strongest version of this test is run live, with the expert watching, in the first week. Interview loops for these roles put weight on exactly this instinct: the common rejection pattern reported for OpenAI and Palantir decomposition rounds is jumping to a solution before scoping, and running ten examples in front of the customer is the fastest visible way to show you are doing the opposite.

It also changes the relationship. The expert sees the model fail on case four and immediately explains why, and you have just been handed a business rule you would otherwise have discovered in week six. Half the value of this exercise is not the score. It is what the expert says while watching.

## Write it down

Ten lines of input, ten model outputs, ten labels, a score, a bucket per failure, one recommendation. Two pages, and it becomes an appendix in your scope document. When someone asks in month three why the system does not handle a certain case, the answer is on page two of a document they approved.

Next: the metrics you will actually report, and the ones a customer will refuse.
