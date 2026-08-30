---
title: "Similarity-search design clinic"
track: "maths-foundations"
status: live
summary: "A similarity-search system is a chain of choices: representation, valid input."
duration: "6 min read"
---

## The short answer

A similarity-search system is a chain of choices: representation, valid input
contract, preprocessing, metric, candidate ranking, threshold or `k`, and
evaluation set. Choose them from the retrieval task and failure costs. Cosine
is useful for direction-focused embeddings; dot product preserves norm; L1/L2
may fit measured features. A good top-k score is not evidence that the returned
item is authorised, current, or factually sufficient.

## Why this matters

“Use a vector database” skips the part that determines behaviour. A search can
be numerically correct and operationally wrong because a zero vector was
indexed, a model version changed, a threshold was copied from another corpus,
or an access filter ran after retrieval. This clinic turns vector algebra into a
reviewable retrieval specification and a set of tests.

## How it works

For query `q` and candidates `xᵢ`, define a score `s(q,xᵢ)` and rank by it.
For unit-normalised vectors,

```text
||q̂−x̂ᵢ||² = 2 − 2(q̂·x̂ᵢ),
```

so cosine ranking and Euclidean ranking on the normalised vectors agree. A
threshold `τ` is a decision rule such as “return candidates with
`s≥τ`”; `τ` must be selected on reviewed positives and negatives, with recall,
precision, latency, and abstention costs visible. A top-k rule always returns
something unless an explicit minimum-score or empty-result policy is added.

The design artifact should state:

```text
input -> representation -> preprocessing -> metric -> ranking -> filter/threshold -> review/output
```

Keep authorization and metadata filters as explicit constraints rather than
assuming the geometric score can enforce them.

## Worked examples and variations

### Example A: semantic text retrieval with normalised embeddings

**Input:** a query and document embeddings from the same encoder, all finite
and nonzero. **Mechanism:** normalise rows, compute dot products, rank
descending, then apply a threshold chosen from reviewed pairs. **Output:** a
ranked candidate list with scores and document IDs. **Inspect:** encoder version,
norm policy, score distribution, and examples of relevant and irrelevant
matches. **Decision:** use cosine-style ranking when direction is the validated
semantic signal; add an empty-result rule.

### Example B: measured features where absolute distance matters

**Input:** a sensor vector with calibrated coordinates and a service-level
maximum deviation per coordinate. **Mechanism:** use L∞ distance and reject any
candidate above the allowed worst-coordinate error. **Output:** candidates
that satisfy a hard per-feature tolerance. **Inspect:** units, missingness, and
whether one coordinate is safety-critical. **Decision:** L∞ is defensible when
the largest violation controls acceptance; cosine would discard the scale.

### Example C: norm carries a useful quality signal

**Input:** two candidates have similar direction, but one embedding norm was
validated as a quality/confidence signal. **Mechanism:** compare a documented
hybrid score such as a direction score plus a separately bounded quality term.
**Output:** a ranking that preserves both signals without letting raw norm
dominate unchecked. **Inspect:** ablate the quality term and evaluate reviewed
pairs. **Decision:** keep the added term only if it improves the target metric
without unacceptable false positives.

### Boundary case: no candidate crosses the threshold

**Input:** all scores are below `τ`, though top-k has a highest-scoring item.
**Mechanism:** a thresholded search returns an empty result; top-k alone would
return a possibly irrelevant result. **Output:** empty/abstain versus forced
answer. **Inspect:** false-positive cost and how downstream code handles empty
context. **Decision:** make abstention explicit and test it as a success state.

### Counterexample: raw dot product reverses a reviewed relevance order

**Input:** `q=(1,0)`, candidate `a=(10,5)` reviewed as less relevant than
`b=(1,0)`. **Mechanism:** raw dots rank `a` (`10`) above `b` (`1`), while
cosines rank `b` (`1`) above `a` (`≈0.894`). **Output:** a plausible but wrong
ranking under the chosen task semantics. **Inspect:** candidate norms and angle,
not just the top score. **Decision:** change metric or representation only after
recording the reviewed failure and rerunning the comparison.

### Production case: model-version drift

**Input:** queries are encoded with a new embedding model while the index still
contains old-model vectors. **Mechanism:** the dot product is computable but
the coordinate spaces are not guaranteed comparable. **Output:** unexplained
recall drop or score drift. **Inspect:** model ID and dimension metadata on both
query and index, plus a canary set of reviewed pairs. **Decision:** rebuild,
dual-write, or route by version; do not “fix” the threshold first.

## Two ways to see it

### Symbolic view

The design is a composition `R(q,D)=filter(rank({s(q,x):x∈D}),τ,k)`. Each
operator has an assumption: `s` needs valid vectors, `rank` needs a direction,
`filter` needs a calibrated threshold, and `D` needs the right corpus and
access scope. Write the composition so a failed stage has a name.

### Geometric view

The metric draws neighbourhoods around a query: angular cones for cosine,
circles/spheres for L2, and boxes for L∞. A threshold chooses a neighbourhood
size; `k` chooses a count even when the neighbourhood is empty. The picture
explains why these are different abstention policies.

### Computational view

```python
import numpy as np

q = np.array([1., 0.])
X = np.array([[10., 5.], [1., 0.]])
norms = np.linalg.norm(X, axis=1)
if np.any(norms == 0):
    raise ValueError("zero embedding cannot be ranked by cosine")
scores = (X @ q) / norms
order = np.argsort(-scores)
assert order.tolist() == [1, 0]
```

In a real fixture, attach IDs, model versions, metadata filters, and reviewed
labels. Test the complete chain, not only the score function.

## Hands-on

Write a one-page **similarity-search specification** for a small retrieval
task. It must name the representation, metric, preprocessing statistics,
zero-vector policy, model-version policy, ranking rule, threshold/abstention
rule, metadata/access filter, and evaluation cases. Implement a small NumPy
fixture with four candidates and print the inspection table.

**Failure fixture:** mix embedding versions, add a zero vector, and set a
threshold above every candidate. **Test:** fail on version mismatch, report the
zero-vector state, and accept an explicit empty result rather than replacing it
with the top candidate. Add a reviewed case that catches the dot/cosine rank
reversal. **Reset:** restore one model version, remove or quarantine the zero
vector, choose a threshold from the fixture labels, and rerun all tests.

Feedback prompts:

- Retrieve: list the stages between raw query and returned document.
- Calculate: show why cosine and normalised L2 produce the same order.
- Compute: change `τ` and observe when the result changes from candidates to
  abstention.
- Diagnose: decide whether a score drift points first to threshold tuning or
  representation/version mismatch, and explain why.

Submit the specification, inspection table, and failed fixture as A1, the
embedding geometry lab.

## Checkpoint

- [ ] Choose cosine, dot, L2, L1, or L∞ for a stated retrieval task and name the
  signal your choice preserves.
- [ ] Explain why top-k and thresholded retrieval have different empty-result
  behaviour.
- [ ] List three metadata or validity checks that must happen before trusting a
  similarity score.
- [ ] Design a test that catches model-version mismatch without relying only on
  a single aggregate retrieval metric.

## What this does not solve

Metric design does not establish semantic truth, access control, freshness,
grounding, or answer quality. Retrieval metrics can miss harmful or rare cases,
and a threshold tuned on one corpus can drift on another. Keep authorization,
provenance, reranking, generation, and human review as separate contracts.

## Continue, go deeper, apply it

- Continue: Ingestion, chunking, and retrieval
- Go deeper: Linear algebra for ML
- Apply it: A1 embedding geometry lab
