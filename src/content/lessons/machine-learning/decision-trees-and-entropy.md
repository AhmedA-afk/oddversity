---
title: "Read decision trees as recursive questions"
track: "machine-learning"
status: live
summary: "A decision tree partitions examples by asking feature-based questions until a leaf makes a prediction."
duration: "3 min read"
---

## The short answer

A decision tree partitions examples by asking feature-based questions until a leaf makes a prediction. Splits seek purer or lower-error groups, but a deep tree can memorize idiosyncrasies. Trees are valuable because the path is inspectable; that path is not automatically a causal explanation.

## The mechanism

For each candidate split, measure impurity reduction such as entropy or Gini
decrease. Choose a split, recurse, then stop or prune using depth, minimum leaf
size, validation error, or another complexity control.

## Four examples

### Example A: support route

Ask whether the issue contains a billing term, then whether the account is in a
priority tier. Inspect the leaf distribution before routing automatically.

### Example B: mixed feature types

Trees can handle threshold and category questions differently from a linear model.
Still define missing and unseen category behavior explicitly.

### Boundary case: one identifier split

A customer ID may create pure leaves with no transfer value. Block identifier-like
features or test a group split.

### Counterexample: deep means intelligent

A tree with one leaf per training case has low training error and little useful
generalization. Limit complexity and inspect validation behavior.

## An illustrative story

A fraud tree used a “reviewer ID” split that looked predictive. It had learned
which reviewer saw which cases, not fraud. Feature provenance and a future split
exposed the shortcut.

## Two ways to see it

### Algorithm view

Greedy recursive partitioning reduces impurity locally.

### Audit view

Every split is a question about the data-generating process and deserves a
meaning, availability, and stability check.

## Hands-on

Build a tiny tree by hand for eight labeled examples. Calculate impurity before and
after two candidate splits, choose one, then compare a shallow and deep library
tree on a fixture containing an ID-like feature.

## Checkpoint

- [ ] You can explain impurity reduction and stopping.
- [ ] A leaf prediction includes uncertainty or sample count.
- [ ] Identifier and leakage risks are tested.

## What this does not solve

Readable paths can still encode unfair policy or unstable correlations. Inspection
is an invitation to review, not a proof of causality.

## Continue, go deeper, apply it

- Continue: Ensemble methods
- Go deeper: Constraint satisfaction
- Apply it: publish a tree diagram with rejected splits and reasons.

## Calculate a split before asking software to search

For a binary node with positive fraction p, entropy is:

~~~text
H(p) = -p log₂(p) - (1-p) log₂(1-p)
~~~

It is zero for a pure node and one bit for a 50/50 node. Suppose a parent contains 10 cases, six positive and four negative. Its entropy is about 0.971. A candidate split creates a left child with four positive and one negative and a right child with two positive and three negative. Their entropies are about 0.722 and 0.971. The weighted child entropy is (5/10)×0.722 + (5/10)×0.971 = 0.847, so information gain is 0.971 - 0.847 = 0.124.

The calculation ranks a partition; it does not discover meaning. A split on an identifier can have high gain because it isolates accidental historical groups. Candidate features must be valid before impurity is optimized.

Gini impurity, 1 - Σ p_k², is another common criterion. For binary classes it is 2p(1-p). It often produces similar trees to entropy and can be faster. Choose a criterion consistently and evaluate its effect on validation performance, leaf size, and interpretability rather than treating small benchmark changes as insight.

## Leaf estimates, pruning, and instability

A classification leaf should expose its sample count and class distribution. A leaf with 100% positive outcome from one training row is not equal to a leaf with 100% positive outcome from 100 rows. Smoothing or minimum-leaf-size constraints prevent extreme probabilities from tiny leaves.

Trees are high-variance learners: changing a few rows can change an early split and therefore the whole downstream structure. Pre-pruning limits depth, minimum samples per split, and minimum leaf size. Post-pruning grows a tree and removes branches that do not improve validation or cost-complexity criteria. Neither form of pruning repairs leakage or a broken split.

## Debugging clinic: the split that should never have existed

Train a tree and list the first ten split features with their timestamp and owner. Then shuffle each feature column in validation one at a time to see whether performance changes; this is a diagnostic, not causal proof. If reviewer ID, record creation time, or a post-decision status appears near the root, remove it and rebuild the temporal join. Compare a random split with a group/time split. A tree often makes shortcut learning visible because it puts the shortcut in plain text.

## Assessment: build and critique a tiny tree

Given eight labeled cases with one numerical feature and one category, calculate parent impurity and information gain for two candidate splits. Choose a split, state the predicted probability and sample count at each leaf, and name a stopping rule. Then identify one valid predictive use of a tree path and one invalid causal claim someone might make from the same path.

Require a held-out result after every manual split choice. A split that looks pure in eight training rows is an hypothesis about future rows, not a conclusion.
