---
title: "Find density clusters with DBSCAN and HDBSCAN"
track: "machine-learning"
order: 403
status: live
summary: "Use density connectivity to find irregular groups and mark noise, while respecting scale and varying-density limits."
duration: "16 min read"
updated: "2026-08-30"
---

## The short answer

DBSCAN joins dense neighborhoods, labels sparse points as noise, and needs no preset number of clusters. HDBSCAN examines density levels and can better handle uneven densities, but neither removes the need to choose a meaningful representation and scale.

## Why this matters

Centroid methods force every record into a group and prefer round shapes. Fraud, location, and behavioural data often contain curved regions and isolated cases where “none of the above” is the honest answer.

## How it works

For DBSCAN, a core point has at least `min_samples` neighbours within radius `eps`; connected core points form a cluster and border points attach to one. HDBSCAN builds a hierarchy using mutual-reachability distance, condenses it, then selects persistent clusters. Choose parameters in domain units, not by chasing a visual outcome.

## Worked examples and variations (4–6, include boundary and counterexample)

1. **City pickups:** geographic coordinates reveal dense pickup zones; use projected metres, not latitude/longitude Euclidean distance.
2. **Sensor states:** dense normal regimes become clusters and isolated readings remain noise.
3. **Image embeddings:** HDBSCAN can identify confident visual themes and leave ambiguous images unassigned.
4. **Boundary:** a cluster smaller than `min_samples` becomes noise by design.
5. **Counterexample:** one global `eps` fails when a sparse legitimate region sits beside a very dense one.

## Two ways to see it

Graphically, the algorithm finds connected components in a neighbourhood graph. Operationally, it is a cautious assignment system that can abstain.

## Hands-on

Create moons plus uniform noise, then fit DBSCAN across an `eps` grid and plot core, border, and noise points. Deliberately measure one feature in thousands and another in fractions; observe collapse. Standardise or use domain scaling, rerun, and document the retained noise rate.

## Checkpoint

- [ ] Distances have interpretable units.
- [ ] Noise is reported rather than silently discarded.
- [ ] Varying-density failure was tested.

## What this does not solve

Density is not importance, risk, or identity. Sparse minority populations may be labelled noise, so inspect coverage before acting.

## Continue, go deeper, apply it

Study mixture models for soft memberships. Apply density clustering where abstention is a product feature rather than a defect.

