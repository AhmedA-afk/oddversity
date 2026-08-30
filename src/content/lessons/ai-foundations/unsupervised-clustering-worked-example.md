---
title: "Finding Groups Nobody Labeled"
track: "ai-foundations"
status: live
summary: "A fully hand-computed k-means run on 8 two-dimensional customers — two real iterations of assign/recompute — followed by a second run from different starting centroids that converg"
duration: "16 min read"
---

Eight customers, two numbers each, and no column anywhere that says which "type" they are. You're about to find groups using nothing but arithmetic: distance, average, distance, average, until nothing moves anymore.

## The setup (specific)

Say you pulled two numbers per customer off your analytics dashboard: visits in the last month, and average order value (in tens of dollars, just to keep the arithmetic small). No CRM tags, no "segment" field — just this table.

| Customer | Visits/month (x) | Avg order value, $10s (y) |
|---|---|---|
| A | 1 | 2 |
| B | 2 | 1 |
| C | 1 | 4 |
| D | 5 | 5 |
| E | 8 | 7 |
| F | 9 | 8 |
| G | 7 | 9 |
| H | 9 | 6 |

Each row is a 2-dimensional vector — exactly the object described in [What Is a Vector](/learn/maths-foundations/what-is-a-vector). If you sketch these eight points on paper, A, B, and C sit low and to the left; E, F, G, and H sit high and to the right; D lands almost exactly between the two clumps. That in-between point is not an accident — it's doing most of the work in this lesson.

You decide to look for k = 2 groups. Nobody told you 2 is correct — you picked it because two clumps are visible by eye. That's already a decision the algorithm can't make for you, and it matters later.

Compare this setup to the [supervised learning worked example](/learn/ai-foundations/supervised-learning-worked-example): there, every row came with a label you could check predictions against. Here, there is no such column, full stop. If you haven't read the concept-level page on this, [Unsupervised Learning](/learn/ai-foundations/unsupervised-learning) covers the *why*; this page is the arithmetic underneath it, done by hand, twice, so you can watch what "no labels" actually changes about the computation.

## Step by step

### Step 1 — Seed two centroids

k-means needs a starting guess for where the k group centers are. The simplest approach (called Forgy initialization) is to grab k actual data points at random and use them as your first centroids. Seed with two real customers:

- Centroid 1 = A = (1, 2)
- Centroid 2 = H = (9, 6)

> **Why this step?** A centroid doesn't have to be a real customer — it's just a point in the same 2D space as your data, and any starting point would technically work. Picking real data points is a convenient default because it guarantees your centroids start somewhere plausible instead of, say, the empty space in a corner. Notice this choice was arbitrary. There was no rule that said "start at A and H." Hold that thought — it's the entire subject of the Where it breaks section.

### Step 2 — Assign every point to its nearest centroid (iteration 1)

For each customer, compute squared distance to each centroid: (x − cx)² + (y − cy)². You can skip the square root — you only care which centroid is *closer*, not by how much, and squaring doesn't change that ordering.

| Customer | Sq. dist to Centroid 1 (1,2) | Sq. dist to Centroid 2 (9,6) | Assigned to |
|---|---|---|---|
| A | 0 | 80 | 1 |
| B | 2 | 74 | 1 |
| C | 4 | 68 | 1 |
| D | 25 | 17 | 2 |
| E | 74 | 2 | 2 |
| F | 100 | 4 | 2 |
| G | 85 | 13 | 2 |
| H | 80 | 0 | 2 |

Cluster 1 = {A, B, C}. Cluster 2 = {D, E, F, G, H}.

> **Why this step?** This *is* the grouping mechanism, in full. No weights, no gradients, no forward pass — just "which of these two reference points is this vector closer to." That's the whole idea behind [Cosine Similarity and Angular Distance](/learn/maths-foundations/cosine-similarity-angular-distance-embedding-retrieval) too, just with a different distance function. Notice D was swept into Cluster 2 on the very first pass, and only barely — 17 versus 25. A customer sitting in genuinely ambiguous territory got assigned with total confidence anyway, because k-means never expresses "I'm not sure." It always commits.

### Step 3 — Recompute each centroid as the mean of its assigned points

Move each centroid to the center of mass of the points now assigned to it:

```
Centroid 1 (new) = mean(A, B, C)
  x = (1 + 2 + 1) / 3 = 1.33
  y = (2 + 1 + 4) / 3 = 2.33

Centroid 2 (new) = mean(D, E, F, G, H)
  x = (5 + 8 + 9 + 7 + 9) / 5 = 7.6
  y = (5 + 7 + 8 + 9 + 6) / 5 = 7.0
```

> **Why this step?** This is the "learning" — and it's just an average. There's a reason the mean is the right update: the arithmetic mean of a set of points is provably the single point that minimizes total squared distance to all of them. So each recompute step doesn't just tidy things up, it's an exact, closed-form minimization — no learning rate, no approximation. That squared-distance total is called **inertia**, and it plays the same role here that a loss does in [Loss Functions Explained](/learn/ai-foundations/loss-functions-explained): a single number the algorithm is trying to shrink. The difference is what it's shrinking distance *to* — here, to centroids it invented itself, not to a ground-truth label.

### Step 4 — Reassign with the updated centroids (iteration 2)

Same computation, new centroids: (1.33, 2.33) and (7.6, 7.0).

| Customer | Sq. dist to Centroid 1 | Sq. dist to Centroid 2 | Assigned to |
|---|---|---|---|
| A | 0.22 | 68.56 | 1 |
| B | 2.22 | 67.36 | 1 |
| C | 2.89 | 52.56 | 1 |
| D | 20.56 | 10.76 | 2 |
| E | 66.30 | 0.16 | 2 |
| F | 90.98 | 2.96 | 2 |
| G | 76.64 | 4.36 | 2 |
| H | 72.30 | 2.96 | 2 |

Same clusters as iteration 1: {A, B, C} and {D, E, F, G, H}. Nobody switched sides.

> **Why this step?** This is the stopping rule: when an assignment pass produces the exact same groups as the pass before it, you've converged — every centroid is now the mean of precisely the points that consider it their nearest centroid, a mutually consistent state. Real implementations check this automatically (or cap out at a max iteration count) and stop. Compare that to how a neural net's training loop stops — on a validation metric plateauing, or a fixed epoch budget, covered in [Gradient Descent Explained](/learn/ai-foundations/gradient-descent-explained). k-means stops because it's *done*, not because you decided it had trained long enough.

Recomputing the centroids one more time from these final groups gives the same means as before — (1.33, 2.33) and (7.6, 7.0) — because the membership didn't change. Total inertia for this run: 5.33 (Cluster 1) + 21.20 (Cluster 2) ≈ **26.53**.

You now have two buckets: {A, B, C} — few visits, low-to-mid spend — and {D, E, F, G, H} — more visits, higher spend. Calling them "occasional" and "frequent" customers is something *you* just did, reading the centroid positions. k-means never produced those words. It produced two lists of indices and two pairs of numbers.

Here's the same run in code, so you can check the arithmetic yourself:

```python
import numpy as np

customers = np.array([
    [1, 2],  # A
    [2, 1],  # B
    [1, 4],  # C
    [5, 5],  # D
    [8, 7],  # E
    [9, 8],  # F
    [7, 9],  # G
    [9, 6],  # H
], dtype=float)
labels = ["A", "B", "C", "D", "E", "F", "G", "H"]

def kmeans_n_steps(data, initial_centroids, n_iter=2):
    centroids = np.array(initial_centroids, dtype=float)
    for _ in range(n_iter):
        sq_dists = ((data[:, None, :] - centroids[None, :, :]) ** 2).sum(axis=2)
        assignments = sq_dists.argmin(axis=1)
        centroids = np.array([
            data[assignments == k].mean(axis=0) for k in range(len(centroids))
        ])
    final_dists = ((data - centroids[assignments]) ** 2).sum(axis=1)
    return assignments, centroids, final_dists.sum()

assignments, centroids, inertia = kmeans_n_steps(customers, initial_centroids=[[1, 2], [9, 6]])
print(dict(zip(labels, assignments)))   # {'A': 0, 'B': 0, 'C': 0, 'D': 1, ...}
print(centroids)                        # [[1.33 2.33] [7.6  7. ]]
print(round(inertia, 2))                # 26.53
```

## Where it breaks

Rerun the exact same eight customers, same k = 2, same algorithm — but seed from two different real customers: C = (1, 4) and F = (9, 8) instead of A and H.

Skipping straight to the converged result (same mechanics as above, just different starting point): iteration 1 assigns D to Centroid 1 this time (squared distance 17 to C versus 25 to F), and that assignment holds through iteration 2 as well. Final clusters: **{A, B, C, D}** and **{E, F, G, H}**, with final centroids (2.25, 3.0) and (8.25, 7.5). Total inertia: 20.75 + 7.75 = **28.5**.

This run has also converged — assignments are stable, centroids are self-consistent, nothing is going to move if you keep iterating. By every internal check k-means has, it's *done*. And it disagrees with the first run about customer D.

Sanity-check it in plain English before you even look at the inertia numbers: D visits 5 times a month and spends about $50 an order. Lumping D in with A, B, and C — who visit once or twice a month — as "occasional, low-spend" doesn't sit right. That mismatch is your cue. And the inertia number backs it up: 28.5 is a looser, worse-fitting split than the first run's 26.53. Same data, same k, same number of iterations — a different, and objectively worse, answer, purely because of where you happened to start.

This is the sharp edge of "no answer key." In the supervised worked example, you can compute accuracy against true labels and know, numerically, which model did better. Here there is no true label for D — you can only compare inertia between runs, and inertia measures how *tightly packed* a clustering is, not whether it's *correct*. A tighter clustering is a better internal fit to the data you have. It is not proof about the customer you're describing.

The fix in practice is the same one scikit-learn's `KMeans` uses by default: run the whole assign/recompute process several times from different random starting centroids, and keep whichever run has the lowest inertia. Smarter seeding strategies (k-means++) also bias the initial draw away from picking centroids that are close together, which is what causes the worst failures. Neither trick manufactures a ground truth that doesn't exist — for a genuinely borderline point like D, two runs can land within a hair of each other on inertia while disagreeing about which bucket it's in. At that point the honest move is not to squeeze the math harder; it's to go look at what D actually does and make a domain call, the same way you'd flag it to a human if a support ticket triage system couldn't decide between two categories.

```python
best_inertia = None
best_assignments = None
rng = np.random.default_rng(seed=0)

for _ in range(10):
    seed_idx = rng.choice(len(customers), size=2, replace=False)
    assignments, centroids, inertia = kmeans_n_steps(customers, customers[seed_idx])
    if best_inertia is None or inertia < best_inertia:
        best_inertia, best_assignments = inertia, assignments

print(best_inertia, dict(zip(labels, best_assignments)))
```

There's a second, quieter way this breaks that no amount of restarting fixes: you told the algorithm k = 2 before it saw a single point. Nothing in this arithmetic will ever tell you it should have been 3. Choosing k is a decision made outside k-means, using judgment about the business problem — not something the distance formula can hand back to you.

## Takeaways

- Clustering runs on one primitive, repeated: measure distance between vectors, move each centroid to the average of what's near it, repeat until nothing changes. No labels enter the computation at any point.
- "Converged" means self-consistent, not correct. Both runs above converged. Only one was tighter.
- Initialization is not a footnote — it's the main lever you have, and it decides how borderline points like D get classified. Fight it with multiple restarts and better seeding, not more iterations of the same start.
- Inertia is the only feedback signal you get, and it's an internal fit measure, not a substitute for a label. That's the real, load-bearing difference from supervised learning: there, wrong answers get caught by comparison to ground truth; here, a bad clustering can look completely finished.
- The distance formula here — sum of squared differences across features — is the exact same one used when clustering embeddings with hundreds of dimensions instead of 2; see [High-Dimensional Spaces](/learn/maths-foundations/high-dimensional-spaces) and [What Embeddings Are](/learn/ai-foundations/what-embeddings-are) for where this goes next.
- You choose k before the algorithm runs. It has no mechanism for telling you that choice was wrong.

**Related:** [Unsupervised Learning](/learn/ai-foundations/unsupervised-learning) · [Supervised Learning Worked Example](/learn/ai-foundations/supervised-learning-worked-example) · [What Is a Vector](/learn/maths-foundations/what-is-a-vector) · [High-Dimensional Spaces](/learn/maths-foundations/high-dimensional-spaces) · [Loss Functions Explained](/learn/ai-foundations/loss-functions-explained) · [What Embeddings Are](/learn/ai-foundations/what-embeddings-are)
