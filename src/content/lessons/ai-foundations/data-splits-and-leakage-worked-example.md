---
title: "Splits, Leakage, and the Lie of a Good Score"
track: "ai-foundations"
status: live
summary: "A worked example where a churn classifier hits 0.99 accuracy for two stacked, fixable reasons — a target-derived feature and duplicate rows crossing the train/test boundary — then "
duration: "16 min read"
---

A model that predicts churn with 99% accuracy looks like a win right up until you find out it's cheating. Below is the exact anatomy of that cheat on one dataset, end to end: where the leak hides, how it survives a "correct-looking" workflow, and what the honest number turns out to be once you close it.

If you haven't read [train, validation, and test splits](/learn/ai-foundations/train-validation-test-splits) yet, get the basic division of labor from there first — this page assumes it and spends its time on the two ways that discipline quietly breaks in real pipelines.

## The setup (specific)

You're predicting next-month churn for a subscription business, from a table of customer-month snapshots. Five columns, one label:

| customer_id | tenure_months | usage_hours_30d | support_tickets_30d | cancel_request_submitted | churn |
|---|---|---|---|---|---|
| C1001 | 14 | 1.2 | 3 | 1 | 1 |
| C1002 | 32 | 9.4 | 0 | 0 | 0 |
| C1003 | 3 | 0.6 | 4 | 1 | 1 |
| C1004 | 47 | 11.8 | 1 | 0 | 0 |
| C1003 | 3 | 0.6 | 4 | 1 | 1 |
| C1005 | 21 | 4.1 | 1 | 0 | 0 |
| C1006 | 8 | 1.9 | 2 | 0 | 0 |
| C1007 | 55 | 7.0 | 0 | 0 | 0 |

Stare at that table for a second before reading on — the answer to "why 99%" is sitting in it twice.

First: `cancel_request_submitted` matches `churn` on every single row. That's because it isn't really a predictor — it's stamped by the billing pipeline the moment a cancellation is processed, which is the same moment the `churn` label gets set. It's the label, wearing a different column name.

Second: row 5 (`C1003`) is an exact duplicate of row 3. A webhook in the event pipeline retries on timeout, and roughly 8% of customer-months got logged twice. Nothing about the *values* is wrong — it's the same customer, correctly described twice.

Neither bug is exotic. They're the two most common ways real tabular data lies to you, and they fail differently, which is the whole point of walking through both on the same dataset.

Generate the full version in code so the rest of this is runnable:

```python
import numpy as np
import pandas as pd

rng = np.random.default_rng(0)
n_customers = 2000

tenure_months = rng.integers(1, 60, n_customers)
usage_hours_30d = rng.gamma(2.0, 3.0, n_customers).round(1)
support_tickets_30d = rng.poisson(1.2, n_customers)

# the real signal, plus real noise — nobody's churn is fully explained by three features
logit = (-0.35 * usage_hours_30d
         + 0.6 * support_tickets_30d
         - 0.02 * tenure_months
         + rng.normal(0, 1.5, n_customers))
churn_prob = 1 / (1 + np.exp(-logit))
churn = (rng.random(n_customers) < churn_prob).astype(int)

df = pd.DataFrame({
    "customer_id": np.arange(n_customers),
    "tenure_months": tenure_months,
    "usage_hours_30d": usage_hours_30d,
    "support_tickets_30d": support_tickets_30d,
    "churn": churn,
})

# bug 1: a feature that's really the label in disguise
df["cancel_request_submitted"] = df["churn"]

# bug 2: webhook retries duplicated ~8% of rows verbatim
dup_mask = rng.random(n_customers) < 0.08
duplicates = df[dup_mask].copy()
df_raw = pd.concat([df, duplicates], ignore_index=True)

print(df_raw.shape)                      # (~2160, 6)
print(df_raw.duplicated().sum())         # ~160 exact-duplicate rows
```

> **Why this step?**
> The noise term in `logit` matters as much as the leak does. Without it, even a clean model would hit near-100% honestly, and you'd never see the difference between "the model is genuinely great" and "the model is cheating." Real churn has irreducible uncertainty — two customers with identical usage and tenure can still make different decisions — so a trustworthy model here should top out well short of perfect.

## Step by step

**1. Do the obvious thing.** Random 80/20 split, train a classifier, score it.

```python
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

feature_cols = ["tenure_months", "usage_hours_30d", "support_tickets_30d", "cancel_request_submitted"]
X = df_raw[feature_cols]
y = df_raw["churn"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)

clf = DecisionTreeClassifier(max_depth=4, random_state=0)
clf.fit(X_train, y_train)
print(accuracy_score(y_test, clf.predict(X_test)))   # 1.0 -- a perfect score, already suspicious
```

> **Why this step?** This is the workflow most tutorials teach, followed exactly right: split, fit, score. That's what makes leakage dangerous — nothing here is a mistake in the ordinary sense. The bug isn't in the code, it's in the data the code was handed.

**2. Get suspicious instead of happy.** A score this high on a genuinely noisy label (remember, you built the noise in yourself) should read as a bug report, not a result. Two checks, both cheap:

```python
# check A: is any one feature doing all the work?
for name, importance in zip(feature_cols, clf.feature_importances_):
    print(f"{name}: {importance:.3f}")
# cancel_request_submitted: ~1.000, everything else: ~0.000

# check B: did the same entity end up on both sides of the split?
train_customers = set(df_raw.loc[X_train.index, "customer_id"])
test_customers = set(df_raw.loc[X_test.index, "customer_id"])
print(len(train_customers & test_customers))   # > 0
```

> **Why this step?** `feature_importances_` on a tree tells you how many splits it actually needed. One feature at ~1.0 means the tree found a single column that separates the classes perfectly — with a noisy real-world label, that should never happen, and when it does, that column is worth interrogating before you trust anything else. The customer-overlap check is the second, independent smell test: it asks whether "unseen" test rows are actually unseen.

## Where it breaks

Both checks come back dirty, for two unrelated reasons, and they don't fix each other.

**Bug 1: the leak is a row-level property, so splitting can't touch it.** `cancel_request_submitted` equals `churn` on every row, in train and in test alike — a different split just moves the same perfect signal to different rows. The diagnostic question that catches this: *would I know this value before the label exists?* A cancellation timestamp exists only because the cancellation already happened. Fail that test and the fix is to remove the feature (or, if there's a legitimately earlier version of it — say, a "cancellation flow started" event days before the account actually closes — re-derive a version that's genuinely available at prediction time).

```python
feature_cols_honest = ["tenure_months", "usage_hours_30d", "support_tickets_30d"]
```

Rerun the naive split with only the honest features and the score drops — but not all the way. Say it lands around 0.78 — closer to honest, but still a touch high, because bug 2 is still sitting in the data: some of those duplicate rows from the webhook retry are still split across train and test, so part of "test" performance is the model recognizing rows it memorized, not generalizing to new ones.

**Bug 2: duplicate/grouped rows are a split-level property, so the split is exactly what has to fix it.** The unit that can leak here isn't the row, it's the customer — and `train_test_split` was never told that. Fix it by grouping the split around the entity that generated the rows, using [`GroupShuffleSplit`](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.GroupShuffleSplit.html) instead of a row-blind random split (deduplicating first, or grouping, or both, all work — grouping is the more general fix, because in real data a customer's rows are rarely byte-identical, just correlated):

```python
from sklearn.model_selection import GroupShuffleSplit

df_clean = df_raw.drop_duplicates().reset_index(drop=True)
X = df_clean[feature_cols_honest]
y = df_clean["churn"]
groups = df_clean["customer_id"]

gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=0)
train_idx, test_idx = next(gss.split(X, y, groups=groups))
X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

clf = DecisionTreeClassifier(max_depth=4, random_state=0)
clf.fit(X_train, y_train)
print(accuracy_score(y_test, clf.predict(X_test)))   # something like 0.78
```

Now both bugs are closed and the score falls again — this time landing somewhere in the high 70s to low 80s (your exact figure will depend on your environment, but the *shape* — 0.99, then a partial drop, then a real drop — is what to expect from this setup). That number is lower, and it's the only one of the three you should put in a report.

| Bug | Symptom | Fix |
|---|---|---|
| Target-derived feature | One feature is suspiciously (or perfectly) predictive; importance concentrates on it | Ask "would I know this before the label exists?" Drop it or re-derive an earlier version |
| Duplicate / grouped rows across the split | Train and test share entities; score barely moves across re-splits | Dedupe, and split by the entity that can leak (customer, session, patient) — not by row |

Now do the part the naive version skipped: a real validation set, so tuning doesn't quietly repeat bug 2 against the hyperparameter search instead of the feature list. Split off test once, tune on validation, then touch test exactly once:

```python
# split off test by customer, and don't touch it again until the very end
gss_test = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=0)
trainval_idx, test_idx = next(gss_test.split(X, y, groups=groups))
X_trainval, y_trainval, groups_trainval = X.iloc[trainval_idx], y.iloc[trainval_idx], groups.iloc[trainval_idx]
X_test, y_test = X.iloc[test_idx], y.iloc[test_idx]

# split the remaining 80% into train/validation, still by customer
gss_val = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=0)  # 0.25 of 80% ≈ 20% overall
train_idx, val_idx = next(gss_val.split(X_trainval, y_trainval, groups=groups_trainval))
X_train, y_train = X_trainval.iloc[train_idx], y_trainval.iloc[train_idx]
X_val, y_val = X_trainval.iloc[val_idx], y_trainval.iloc[val_idx]

# tune max_depth using ONLY validation
best_depth, best_val_acc = None, 0
for depth in [1, 2, 3, 4, 5, 6, None]:
    candidate = DecisionTreeClassifier(max_depth=depth, random_state=0)
    candidate.fit(X_train, y_train)
    val_acc = accuracy_score(y_val, candidate.predict(X_val))
    if val_acc > best_val_acc:
        best_depth, best_val_acc = depth, val_acc

# refit on everything except test, then look at test exactly once
final_clf = DecisionTreeClassifier(max_depth=best_depth, random_state=0)
final_clf.fit(X_trainval, y_trainval)
print("honest test accuracy:", accuracy_score(y_test, final_clf.predict(X_test)))
```

> **Why this step?** If you'd instead looped over candidate depths checking accuracy on `X_test` each time and kept whichever depth scored highest, you'd have picked a model *because* it happened to fit that particular test set best — which makes the final "test" number an overestimate again, just a smaller and sneakier one than a leaked feature produces. Validation absorbs the cost of experimentation (try seven depths, throw away six); test's only job is to answer, once, how the one model you already committed to does on data that played no role in choosing it. That's the deeper reason under "why tune on validation and touch test once": every additional decision you base on a set quietly spends its ability to tell you the truth. A shallower tree here also trades variance for bias — see [the bias-variance tradeoff](/learn/ai-foundations/bias-variance-tradeoff) if that swap isn't intuitive yet.

## Takeaways

- **A suspiciously good score is a bug report, not a result.** If your validation accuracy is far above what the noise in your problem should allow, the fix isn't to write it down faster — it's the two checks above, before anything else.
- **Leakage comes in two families that need different fixes.** A feature that shouldn't exist yet needs to be removed at the feature level; no split fixes it, because it's wrong on every row regardless of which set that row lands in. Rows from the same entity landing on both sides needs a *grouped* split; no feature engineering fixes it, because the problem is which set the row is in, not what's in the row.
- **The test question for a feature is "would I know this before the label exists?"**, not "does it live in the same table." Pipeline artifacts, status fields, and anything computed downstream of the outcome are the usual suspects.
- **The unit of your split should be the unit that can leak** — customer, patient, session, document — even when duplicate rows aren't identical, just correlated. `GroupShuffleSplit` (or its cousin `GroupKFold`) is the general tool; row-level `drop_duplicates` only catches the exact-copy case.
- **Validation is where you're allowed to be wrong repeatedly; test is where you find out once.** Every extra look at test to decide something — a hyperparameter, a feature, a threshold — converts test into a second validation set and leaves you with no honest number left to report. If the honest number disappoints, that's information about the problem, not a cue to go back and re-tune against test.

For the general form of everything here — what happens when a model fits its training data too well and how to see it before you ship — see [generalization and overfitting](/learn/ai-foundations/generalization-and-overfitting). To build the habit of writing checks like the two above into a reusable evaluation set rather than one-off print statements, see [building an eval set](/learn/ai-foundations/building-an-eval-set-worked-example). And the same failure shows up one level up the stack, in how public leaderboards get gamed — see [benchmarks and what they miss](/learn/ai-foundations/benchmarks-and-what-they-miss).

**Related:** [train, validation, and test splits](/learn/ai-foundations/train-validation-test-splits) · [generalization and overfitting](/learn/ai-foundations/generalization-and-overfitting) · [bias-variance tradeoff](/learn/ai-foundations/bias-variance-tradeoff) · [building an eval set](/learn/ai-foundations/building-an-eval-set-worked-example) · [regularization techniques](/learn/ai-foundations/regularization-techniques) · [capstone: build, train, evaluate a classifier](/learn/ai-foundations/capstone-build-train-evaluate-a-classifier)
