---
title: "Metrics the customer will accept, and the ones they will not"
phase: ai
module: evals-first
kind: lesson
summary: "A single accuracy number hides the errors that get a deployment shut down. Learn the metric set a regulated customer signs off on: an asymmetric must-never count, per-slice reporting, a groundedness check, and a deferral rate."
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Choose a primary metric, a must-never-happen count, and a deferral rate for a given workflow.
  - Report results by slice so a failure in one branch or language is visible.
  - Use an LLM judge where it is defensible and refuse it where it is not.
artifact: A metrics section for your eval charter, with thresholds and slice definitions, agreed in writing.
sources:
  - "https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production"
  - "https://job-boards.greenhouse.io/anthropic/jobs/5302966008"
---

Accuracy is a number that lets everyone avoid the conversation. It is comfortable, it is one figure, and in an enterprise workflow it is almost always the wrong thing to optimise.

Consider a claims-triage assistant that routes to auto-approve, review, or reject. It scores 94%. Inside that 94% sit six failures. If all six are valid claims sent unnecessarily to human review, the system is a success and the cost is a few minutes of an adjuster's time. If two of them are fraudulent claims auto-approved, the system is unshippable and the number told you nothing.

The metric set that survives a customer sign-off has four parts, and the FDE's job is to get all four written down before the build.

## 1. The primary metric, in the customer's units

Pick the thing the workflow is for, and express it the way the business already measures itself.

| Workflow | Weak metric | Metric the customer accepts |
|---|---|---|
| Claims triage | Accuracy | Correct routing decision, by claim type |
| Policy question answering | BLEU or similarity | Answer matches the expert's answer on the material point, with a correct citation |
| Support agent | Resolution rate | Contained without escalation, and the containment was correct |
| Document extraction | Field accuracy | Documents needing zero manual correction |
| CI triage agent | Task success | Root cause identified, and the fix branch compiles |

The right-hand column has a property the left does not: an operations manager can tell you today, from memory, roughly what the human number is. That gives you the baseline, and the baseline is what makes any target defensible. "The system reaches 91% and your team's own sample audit runs at 89%" is a sentence that closes a project. "The system reaches 91%" invites a demand for 99%.

Ask for the human baseline in the first week. Even a rough one. If nobody knows it, that is a finding, and measuring it is a small, useful, fast piece of work you can offer.

## 2. The must-never-happen count

One asymmetric metric, counted absolutely, not as a percentage. This is the metric that decides whether the system ships.

Get it from the expert in one question: "Which mistake here would you have to explain to your manager?" You will hear things like:

- A rejected claim is auto-approved.
- A customer is told about a policy that does not apply to their product.
- A patient record is shown to a clinician outside the care team.
- An outbound message quotes a price the company does not offer.
- The agent restarts a production service.

Then set the allowed count. It is usually zero on the labelled set, and the threshold on live traffic is a separate, lower bar with a monitoring plan behind it. Do not let this become a percentage. "Fewer than 0.5% critical errors" is a sentence a compliance officer will reject and should. "Zero on the eval set, and every occurrence in production raises an alert and a review" is one they will accept.

This is also where the deterministic guardrail belongs rather than the model. If the must-never-happen event can be prevented by a rule in code, prevent it in code and keep the eval as the check that the rule is wired correctly.

## 3. Slices, always

Report the primary metric broken out by the dimensions along which the customer's world actually varies. A single average is where a failure hides.

The slices that earn their place in most Indian and global enterprise deployments:

- **Language and script.** English, Hindi in Devanagari, Hinglish in Latin script, and any regional language in the mix. A support agent at 93% overall can be at 96% in English and 71% in Hinglish, and the Hinglish users are the ones on WhatsApp.
- **Channel.** Portal, email, WhatsApp, voice transcript, scanned upload. Input quality differs by an order of magnitude.
- **Document or product type.** Group policy versus retail, corporate account versus SME, one hospital's discharge summary format versus another's.
- **Branch, region or tenant.** Local conventions are real, and a system that fails in one region will be discovered by that region's head.
- **Recency.** Cases from before and after the last policy change. This slice tells you how fast the system goes stale.

Two rules. Define the slices with the customer, because they know which ones are politically live. And report a slice even when it is small: five failing cases in a slice of eight is a red row, and the average will not show it.

## 4. The deferral rate

The percentage of cases where the system declines to decide and hands to a human. This metric is under-used and it is the one that makes conservative deployments possible.

Report it alongside the primary metric, because they trade off. A system at 97% correct with a 30% deferral rate and a system at 91% correct with a 5% deferral rate are different products, and only the customer can say which they want. Present both operating points. Present the cost of each: deferral rate multiplied by volume multiplied by handling time is a staffing number the operations lead can reason about immediately.

A deployment that starts at a high deferral rate and tightens over the pilot is the pattern that gets through a risk committee. The trust curve is slow. The Morgan Stanley research-access deployment took six to eight weeks to build and roughly four further months of pilots and eval refinement before reaching regulated-use confidence, ending at about 98% advisor adoption. Plan for that shape.

## Groundedness, separately from correctness

For anything that answers from documents, correctness and groundedness are different failures and need different checks.

- **Correct and grounded.** The answer is right and the cited passage supports it.
- **Correct and ungrounded.** The answer is right and the citation does not support it. The model knew it from training or guessed well. This will fail an audit even though a user would score it correct, and it is the failure mode that gets a system pulled in a regulated setting.
- **Wrong and grounded.** The retrieval pulled the wrong document. A fixable, honest failure.
- **Wrong and ungrounded.** The visible disaster, and usually the rarest.

Score them as separate columns. A cheap and effective groundedness check: require the model to output the exact span it relied on, then verify by string containment that the span exists in a retrieved chunk. It catches invented citations without any judging model at all, and it runs in milliseconds.

## When an LLM judge is defensible

Some outputs cannot be graded by exact match: a summary, an explanation, a drafted reply. A second model as grader is legitimate, with conditions.

Use one when: the criterion is written as a short rubric with two or three binary questions ("Does the reply state the correct notice period? Yes or no."), the judge sees the reference answer, and you have measured the judge against human labels on a subset and reported the agreement.

Do not use one when: the metric is going to a regulator, the criterion is "quality" or "helpfulness" with no rubric, the judge is the same model that produced the answer and is grading its own preferred style, or you have not validated it. In a regulated deployment, tell the customer plainly which numbers came from a model and which came from a rule, and never bury it.

The practical pattern: break the judgement into binary rubric questions, grade each with a judge, and report the binary rates. "Correct notice period stated: 19 of 20" is auditable. "Quality score 4.2 of 5" is not.

## Getting it agreed

Put the four parts in the charter, walk the sponsor and the expert through them in one meeting, and get an email that says yes. The agreement is the deliverable, not the document.

Three sentences that do most of the work in that meeting:

- "Here is the number your team hits today, and here is what we are targeting."
- "Here is the one thing that must never happen, and it is zero on the test set with an alert in production."
- "Here is where it is weakest, by language and channel, and here is what we would do about it."

None of those require the stakeholder to understand a model. All three are things they can defend to their own risk committee, which is the actual test.

Next, the lab: build the harness that produces exactly this report.
