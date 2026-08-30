---
title: "Use UMAP and t-SNE without being misled"
track: "machine-learning"
order: 406
status: live
summary: "Use nonlinear embeddings as local-neighbourhood visual aids and avoid inferring global geometry, density, or separation from them."
duration: "15 min read"
updated: "2026-08-30"
---

## The short answer

t-SNE and UMAP make high-dimensional neighbourhoods visible in two or three dimensions. They are excellent exploratory tools, but distance between islands, island size, and empty space often do not mean what viewers assume.

## Why this matters

Embedding plots frequently become evidence in product, science, and model reviews. A visually separated colour cloud can be created by tuning perplexity, neighbours, seed, or preprocessing rather than by a robust data distinction.

## How it works

t-SNE matches high-dimensional and low-dimensional neighbour probabilities, emphasizing local structure. UMAP builds a fuzzy neighbour graph and optimizes a low-dimensional graph layout; it supports transforming new points but still depends on its fit data and settings. Standardise, choose a meaningful metric, and repeat runs.

## Worked examples and variations (4–6, include boundary and counterexample)

1. **Embedding audit:** colour a text embedding by a known topic to find mixed or mislabeled examples.
2. **Quality review:** inspect local nearest neighbours for duplicate images.
3. **Model drift:** project a new batch with a fixed UMAP and compare local coverage, not island distance alone.
4. **Boundary:** a tiny class may form a large visual island because rendering spreads neighbours apart.
5. **Counterexample:** two distant t-SNE islands do not prove the original clusters are globally far apart.

## Two ways to see it

The map is a lossy graph drawing. The trustworthy question is often “who is near this point?” rather than “how far apart are these two blobs?”

## Hands-on

Generate one continuous manifold and one labelled dataset. Create UMAP and t-SNE maps with three seeds and two neighbourhood settings; calculate original-space nearest-neighbour label purity. Deliberately claim that the most distant islands are opposites. Reset by checking original distances and write only local claims supported by the data.

## Checkpoint

- [ ] Metric, seed, preprocessing, and hyperparameters are recorded.
- [ ] Claims concern local neighbourhoods where appropriate.
- [ ] Important patterns were checked in original space.

## What this does not solve

An embedding plot is not a classifier, clustering validation score, or causal analysis. It can conceal uncertainty and sampling bias.

## Continue, go deeper, apply it

Pair visual maps with cluster stability and nearest-neighbour audits. Apply them in review notebooks, not as standalone decision dashboards.

