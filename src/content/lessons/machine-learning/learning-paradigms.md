---
title: "Choose supervised, unsupervised, or self-supervised learning"
track: "machine-learning"
status: live
summary: "Supervised learning uses target labels, unsupervised learning looks for structure without a target, and self-supervised learning creates a learning."
duration: "3 min read"
---

## The short answer

Supervised learning uses target labels, unsupervised learning looks for structure without a target, and self-supervised learning creates a learning signal from the data itself. The useful choice depends on the decision, available feedback, and whether the learned structure transfers to the task—not on which label sounds most advanced.

## Compare the setups

| Setup | Signal | Example output | Main question |
|---|---|---|---|
| supervised | human or system label | class or value | does it predict the target? |
| unsupervised | structure in inputs | clusters or components | is the structure useful and stable? |
| self-supervised | withheld or transformed input | representation or next item | does the pretext signal transfer? |

## Four examples

### Example A: supervised priority

Past tickets labeled by a triage team can teach a routing model. Check whether the
labels represent policy or merely historical behavior.

### Example B: unsupervised grouping

Group product descriptions to discover catalog themes. A cluster is a lens for
investigation, not automatically a customer segment.

### Example C: self-supervised representation

Hide part of a document and train a model to predict it. The learned embedding may
help retrieval, but its usefulness still needs a task-specific evaluation.

### Counterexample: clustering as truth

If a cluster splits users by an incidental formatting artifact, the algorithm has
found structure but not a meaningful product category.

## An illustrative story

A team asked for labels before it had a stable policy. The first supervised model
faithfully learned inconsistent reviewer habits. An exploratory grouping step
helped the team define categories before collecting better labels.

## Two ways to see it

### Data view

Ask where the learning signal comes from and what biases it carries.

### Product view

Ask how the output will change a decision and whether anyone can validate it.

## Hands-on

Take one dataset and design one supervised, one unsupervised, and one
self-supervised experiment. For each, write the signal, artifact, success test,
and the failure that would make you stop.

## Checkpoint

- [ ] The learning signal is explicit.
- [ ] An unsupervised pattern is not presented as a label.
- [ ] Transfer from a self-supervised task is measured.

## What this does not solve

Changing the learning setup does not repair poor coverage, unclear goals, or
misleading labels.

## Continue, go deeper, apply it

- Continue: Features, leakage, and missingness
- Go deeper: Neural networks and representations
- Apply it: compare three learning setups on a small, documented dataset.

## Start with the feedback loop

The paradigms differ less by algorithm than by what the system is allowed to treat as evidence. In supervised learning, inputs x are paired with a target y, and the objective measures how well a function predicts y. In unsupervised learning, only x is present; the objective encodes a structural preference such as compact clusters, low reconstruction error, or high density. In self-supervised learning, the dataset supplies a proxy target: predict a masked token, a future event, a rotation, or another view of the same example.

The proxy is not the product objective. A representation that predicts the next click may transfer well to ranking but poorly to detecting fraud, because the shortcut that predicts clicks may be an account identifier. Always retain a task-specific evaluation.

## Worked comparison: one dataset, three questions

Suppose 50,000 customer-support messages have text and metadata, but only 2,000 have verified “needs escalation” labels.

- **Supervised:** train on the 2,000 labels. Measure precision and recall on future verified tickets. This directly targets routing but may inherit reviewers' inconsistent labels.
- **Unsupervised:** cluster all messages. Inspect exemplars per cluster to discover unfamiliar issue types. Do not score clusters as if their numeric IDs were escalation labels.
- **Self-supervised:** train an encoder to predict masked text on all 50,000 messages, then fit a small classifier on the 2,000 labels. Compare it with a classifier trained from scratch using the same time split.

The third route wins only if transfer improves the escalation decision on held-out future data, not because the representation loss is lower.

## Labels are observations of a process

“Ground truth” often deserves quotation marks. A moderation label can mean a moderator saw the item, followed a policy, and had enough context. A loan-default label may be observed only among applicants previously approved. If past policy selected who gets labeled, a supervised model can learn that policy's blind spots.

Create a label audit table:

~~~text
label | who produced it | when | coverage | known disagreement | changes over time
~~~

When labels are expensive, active learning can request labels where a model is uncertain or where coverage is weakest. But do not use uncertainty alone: a model can be confidently wrong outside its training distribution.

## Debugging clinic: a beautiful cluster with no use

You cluster product reviews and find one cluster with extremely coherent wording. Before presenting it as “shipping complaints,” sample 30 items, inspect language and source site, then remove the site-name tokens and recluster. If the cluster disappears, the original structure reflected collection source rather than customer issue. That is a useful data finding, but not a customer segment.

For self-supervised work, test a linear probe using shuffled labels. If it performs far above chance, investigate duplicate leakage or an identifier embedded in the representation.

## Assessment: choose and justify a paradigm

For each situation—medical image triage with scarce labels, anomaly exploration in new sensor data, and personalization with delayed purchase labels—choose a primary paradigm and an evaluation plan. State the learning signal, one failure mode in that signal, and a baseline. A high-quality answer may combine paradigms, but it must explain which downstream decision proves the combination helped.
