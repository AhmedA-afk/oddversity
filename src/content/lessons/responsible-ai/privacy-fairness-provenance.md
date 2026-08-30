---
title: "Privacy, fairness, provenance, and accessibility"
track: "responsible-ai"
status: live
summary: "Privacy, fairness, provenance, and accessibility are different questions that often get collapsed into “bias.” Ask separately: was the data collected."
duration: "3 min read"
---

## The short answer

Privacy, fairness, provenance, and accessibility are different questions that often get collapsed into “bias.” Ask separately: was the data collected and used appropriately; do errors or opportunities differ across relevant groups; can we trace the source and transformation of content; and can people with different abilities use and challenge the system? Different questions need different evidence and owners.

## Four checks, four artifacts

| Question | Useful artifact |
|---|---|
| May we use this data? | data inventory, purpose, retention, access rule |
| Who bears errors? | slice metrics, qualitative review, appeal path |
| Where did this answer come from? | provenance record, citation, transformation log |
| Who can use or contest it? | accessibility test, explanation, human route |

## Worked example

An applicant-ranking system has the same overall precision for two groups. Group-level inspection finds that one group is rejected more often because the threshold is applied to less reliable data. The overall score hid the distribution of error. A safer decision may require a different data source, a human review band, or not automating the ranking.

## A small story

The team had a “remove names” privacy fix. Later they learned that location, school, and writing style could still act as proxies. The lesson was not that anonymization is useless; it was that one transformation does not answer a system-level privacy question.

## More examples and variations

- **Minimization:** send the ticket text, not the entire customer profile, when only the text is needed.
- **Provenance:** retain source and revision metadata so a reviewer can trace a policy answer.
- **Fairness:** inspect false negatives and appeal access, not only aggregate accuracy.
- **Counterexample:** removing an explicit sensitive field may leave a strong proxy untouched.

## Two ways to see it

### Data view

Inspect collection, representation, labels, missingness, and access.

### Human-impact view

Ask who gets the benefit, who absorbs mistakes, and who can appeal.

## Hands-on

Take a toy classifier or prompt workflow and produce a data inventory, two slice comparisons, a provenance trail for one output, and an accessibility review of the user flow.

## Checkpoint

- [ ] You did not use one aggregate metric as proof of fairness.
- [ ] A person can challenge an outcome or reach a human.
- [ ] Retention and access are explicit, not implied.

## What this does not solve

Fair-looking metrics do not settle legal, social, or organizational questions. Provenance does not prove that a source is correct.

## Continue, go deeper, apply it

- Continue: Red-teaming LLM applications
- Go deeper: Generalization and evaluation
- Apply it: Risk before model
