---
title: "Evaluate recommenders as ranking and feedback systems"
track: "machine-learning"
status: live
summary: "A recommender ranks items for a user under limited attention and incomplete feedback."
duration: "3 min read"
---

## The short answer

A recommender ranks items for a user under limited attention and incomplete feedback. Offline relevance metrics are useful, but exposure changes what users can click, so the system creates its own data. Evaluate ranking, novelty, coverage, feedback bias, and user impact together.

## The mechanism

Represent users and items with features or latent factors, score candidates, and
rank them under constraints such as availability, diversity, or policy. Separate
candidate generation from final ranking so each stage can be inspected.

## Four examples

### Example A: new user

With no history, use declared interests, popular-but-safe items, or exploration.
Do not infer a detailed profile from one click.

### Example B: long-tail item

An item may be relevant but rarely exposed. Track coverage and exploration rather
than using clicks as the only ground truth.

### Boundary case: feedback loop

Popular items receive more impressions and therefore more clicks. A click metric
can reinforce exposure rather than measure intrinsic relevance.

### Counterexample: offline top-k victory

A model can improve offline ranking by exploiting leakage or popularity while
reducing diversity and user trust in the live interface.

## An illustrative story

A homepage metric rose after the ranker learned to repeat familiar items. Users
spent less time exploring. The team added coverage, novelty, and survey signals to
make the tradeoff visible.

## Two ways to see it

### Ranking view

Predict which candidates should appear near the top under an evaluation protocol.

### Feedback view

The ranked list changes exposure, behavior, and future training data.

## Hands-on

Build a toy implicit-feedback recommender. Compare popularity, nearest-neighbor,
and latent-factor-style scores. Evaluate top-k relevance, item coverage, and a
new-user slice; simulate how repeated exposure changes the next dataset.

## Checkpoint

- [ ] Candidate generation and ranking are distinct.
- [ ] New-user, long-tail, and feedback-loop cases are tested.
- [ ] Relevance is reported with coverage or diversity.

## What this does not solve

Offline ranking cannot fully predict satisfaction, long-term effects, or whether
the objective should optimize attention at all.

## Continue, go deeper, apply it

- Continue: Time series and temporal validation
- Go deeper: Clustering and k-means
- Apply it: write a recommender metric contract with an exploration policy.
## Formal extension

Ranking is an ordered-slate decision under historical exposure. For relevance labels one, zero, one at the top three, precision at three is two-thirds, but that offline number is conditional on what the previous policy exposed. Candidate generation, ranking, and exploration must be separated.

## Worked calculation or protocol

Take a prediction policy with ten reviewed cases and three confirmed positives. Precision at ten is three tenths; it must be reported with the event definition, decision cost, time window, and population. Change the review budget to five and recompute the action table before calling either policy better. This simple calculation illustrates why an aggregate model score is not an operational decision.

## Debugging and assessment studio

Write the relevant objective, data timeline, or decision rule for one project in this course. Deliberately introduce one invalid assumption: a future feature, a random split across repeated entities, a threshold selected on the test set, or a claim stronger than the evidence. Show the inflated or ambiguous conclusion, reset the pipeline, and submit the corrected result with a limitation statement.

## Advanced checkpoint

- [ ] I can state the mathematical or decision object this method estimates.
- [ ] I can identify the exact observation and evaluation boundary.
- [ ] I can explain one failure mode that a high aggregate score would hide.
- [ ] I have a fallback, escalation, or no-ship condition.
