---
title: "Data-generating processes, sampling, and selection bias"
track: "maths-foundations"
status: live
summary: "The data-generating process is the chain that turns a target population into observed rows: who exists, who is measured, what is recorded, and what."
duration: "5 min read"
---

## The short answer

The data-generating process is the chain that turns a target population into observed rows: who exists, who is measured, what is recorded, and what is missing. Sampling bias occurs when inclusion depends on variables related to the question. Before trusting a statistic, name the target population, inclusion rule, measurement process, and the path by which a row can disappear.

## Why this matters

Training data is rarely “the world.” It is tickets that were opened, users who opted in, images that passed a sensor, or cases that survived a filter. A model can be perfectly trained on that sample and still answer the wrong population question.

**Small incident (illustrative):** a support classifier trained on escalated tickets looked strong in offline testing, then missed routine requests because the training process had selected the hardest cases. The failure was not an optimiser bug; the sample had answered a different task.

## How it works

Let U be the target population, S = 1 indicate inclusion in the dataset, and Y be the outcome of interest. A sample estimates a target quantity such as E[Y] only under assumptions about P(S=1 | Y, X). If inclusion is independent of the relevant outcome after accounting for known variables, adjustment may be possible. If selection depends on unobserved variables, the target may not be identifiable from observed data alone.

### Assumptions and derivation

For a simple random sample, every unit has a known equal inclusion probability, so the sample average is an unbiased estimate of the population average. With unequal known probabilities πᵢ = P(Sᵢ=1), inverse-probability weighting uses a weighted average with terms SᵢYᵢ/πᵢ. The correction relies on positive inclusion probabilities and correctly specified probabilities; a large weight can create high variance.

## AI use

Write a data card or collection note before modelling. Record the target population, time and geography, sampling frame, label availability, exclusions, missingness, and whether the model will be used on a population unlike the sample. This is the bridge from statistical inference to dataset shift, fairness slices, and production monitoring.

## Worked examples and variations

### Example A — smallest happy path

**Input:** choose 100 customer IDs uniformly from a complete list of 10,000 and measure spend. **Mechanism:** each ID has inclusion probability .01, independent of spend under the design. **Output:** a defensible sample mean estimate. **Inspect:** use the sampling frame and random seed, not merely the row count. **Next decision:** report the design before generalising to all customers.

### Example B — meaningful variation

**Input:** estimate average app satisfaction from users who answer an optional survey. **Mechanism:** response depends on satisfaction and time available, so S is related to Y. **Output:** respondents may be systematically happier or angrier than nonrespondents. **Inspect:** compare response rates and available covariates by region, plan, and usage. **Next decision:** weight or stratify only where assumptions and overlap are defensible; otherwise narrow the claim.

### Example C — boundary case

**Input:** a full census of all current users. **Mechanism:** sampling variance from user selection is zero, but measurement error, stale accounts, and a changing future population remain. **Output:** no sampling bias for that exact census target, not universal validity. **Inspect:** define “current user” and the time boundary. **Next decision:** separate census coverage from label and measurement quality.

### Example D — tempting counterexample

**Input:** sample only rows where `outcome = 1`, then report the positive rate as 80%. **Mechanism:** conditioning on the outcome removes all negative cases. **Output:** the statistic is a property of the selected subset, not the target population. **Inspect:** ask for the denominator before reading the percentage. **Next decision:** recover the sampling frame or state that the analysis is descriptive of positives only.

### Example E — production shift

**Input:** an abuse detector is trained on confirmed reports and deployed on all traffic. **Mechanism:** confirmed reports are a selected, delayed, and policy-shaped subset. **Output:** offline recall can be high while the live false-positive rate is unknown. **Inspect:** monitor unlabeled traffic, review samples, and compare selection pathways. **Next decision:** design a measurement plan instead of treating confirmed cases as ground truth for all traffic.

## Computation and interpretation

```python
import numpy as np

rng = np.random.default_rng(7)
spend = rng.lognormal(mean=3.0, sigma=1.0, size=100_000)
uniform_sample = rng.choice(spend, size=1_000, replace=False)
high_spend_sample = spend[spend > np.quantile(spend, 0.90)]

print(spend.mean(), uniform_sample.mean(), high_spend_sample.mean())
```

The high-spend sample is not “wrong” for the question “what do the top decile spend?” It is wrong for the unqualified population mean. The computation demonstrates selection; it does not estimate a correction without a sampling design.

## Two ways to see it

### Builder view

Treat the dataset as a pipeline: `target population → sampling frame → inclusion → measurement → storage → label`. Put an assertion or count at each transition. A row-level schema cannot reveal who never entered the table.

### Systems view

Selection is often policy. A moderation queue, human escalation rule, or opt-in survey changes the distribution of examples. Model metrics inherit those institutional choices, so data provenance belongs in system design, not only in a notebook.

## Hands-on

Create a sampling audit with a fixture of 20 users: ten active daily users, five weekly users, and five inactive users. **Failure fixture:** build the sample only from users with at least one support ticket, then claim it represents all users. **Test:** the audit must show inclusion rate by activity group and fail if any target group has zero observed members. **Reset:** restore uniform sampling from the full ID list and rerun the group table. **No-code route:** draw the population and inclusion funnel on paper and label the missing branch.

## Checkpoint

- [ ] State the target population and sampling frame for a dataset you use.
- [ ] Explain why random sampling from volunteers is not automatically a random sample of all users.
- [ ] Identify one variable that could affect both inclusion and the outcome.
- [ ] State what positivity/overlap means in an adjustment plan.

## What this does not solve

Naming a data-generating process does not remove unmeasured selection, measurement error, or distribution shift. Weighting can increase variance and can amplify a bad model of inclusion. If the required information is absent, narrow the claim or collect better data.

## Continue, go deeper, apply it

- Continue: Estimators, bias, consistency, efficiency, and variance
- Go deeper: Causal inference foundations
- Apply it: Features, leakage, and missingness
