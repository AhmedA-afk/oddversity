---
title: "Reproduction study: PCA, eigenfaces, and low-rank reconstruction"
track: "machine-learning"
order: 885
status: "live"
summary: "Reproduce the low-rank reconstruction mechanism behind eigenfaces while auditing identity, privacy, and benchmark limits."
duration: "110 min study + 6–8 hr project"
updated: "2026-08-30"
---

## Research question

**Executable project package:** [student starter, deterministic fixture, and public checks](/classical-ml-projects/reproductions/pca-low-rank-reconstruction/).

Can you reproduce the central low-rank reconstruction behaviour of an eigenfaces-style pipeline: centring an image matrix, finding principal directions, and trading reconstruction error against retained components? The project is about representation and reconstruction—not a claim that face recognition is harmless, reliable, or appropriate in deployment.

## Primary source and claim

Read Turk and Pentland’s freely available [*Eigenfaces for Recognition*](https://direct.mit.edu/jocn/article/3/1/71/3025/Eigenfaces-for-Recognition) (1991). The paper represents a face image through weights on eigenface features and compares those representations for recognition. Reproduce a limited, inspectable claim: PCA produces an ordered orthogonal basis whose first `k` components give the best rank-`k` squared-reconstruction approximation to a centred data matrix among rank-`k` linear approximations.

Do not claim to reproduce the paper’s recognition rates or to validate an identity system. Your main outcome is reconstruction behaviour; any nearest-neighbour recognition experiment is optional, pedagogical, and must be clearly fenced off.

## Fixed experimental protocol

Use the [AT&T Laboratories Cambridge ORL face database](https://www.cl.cam.ac.uk/research/dtg/attarchive/facedatabase.html) only if its terms permit your educational use and you can protect the images. Otherwise use the non-biometric [Olivetti faces dataset documentation](https://scikit-learn.org/stable/datasets/real_world.html#olivetti-faces-dataset) and record its source/version. Do not upload images, embeddings, or identifiable reconstructions to public issue trackers.

Resize only if required by memory limits, using a declared deterministic method. Select eight images per identity for training and two for test using seed 20260830; if the dataset’s file convention makes this split deterministic, record the mapping. Fit the mean image and PCA on training images only. Evaluate `k` in 1, 2, 5, 10, 20, 40, 80, and the maximum feasible rank. Use full SVD as the reference, and compare with randomized SVD only under a fixed seed and declared tolerance.

Pre-register reconstruction MSE, explained-variance ratio, and a privacy-risk discussion as primary outcomes. Do not tune `k` on the test set. If you add a nearest-neighbour identity task, select `k` on a validation subset drawn from training identities and report it as a separate exploratory analysis.

## Data and provenance plan

Your data card must include source, access date, terms, identity/biometric sensitivity, image count, resolution, train/test mapping, preprocessing, access controls, and retention/deletion plan. A historic benchmark has restricted demographic and acquisition diversity; say this plainly. It cannot establish fairness, surveillance suitability, consent, or performance on the public.

Store a content hash for the raw archive and a manifest of image filenames, not the images themselves if your repository is public. Ensure collaborators can reproduce the split only if their licensed copy is present.

## Required plots and tables

- The training mean image and the first 12 principal components displayed as signed, normalised visualisations with a warning that signs are arbitrary.
- A scree plot of explained variance and a reconstruction-MSE-versus-`k` curve for train and locked test images.
- Grids showing the same test images reconstructed at `k = 5`, `20`, and `80`; preserve an internal, access-controlled original/reconstruction pairing.
- A table of memory, fit time, transform time, reconstruction error, and effective rank.
- A singular-value table comparing full and randomized SVD under the declared configuration.
- If optional recognition is run, a clearly separate table with identity-disjoint caveats and no claim that reconstruction quality implies identification quality.

## Calculations to show

Start from a centred matrix `X = U S V^T`. Show how retaining the first `k` singular values creates `X_k = U_k S_k V_k^T`, then verify on a small hand-built matrix that residual squared Frobenius norm equals the sum of discarded squared singular values. Demonstrate why centring changes the first direction. For one test image, compute projection weights and reconstruction explicitly for `k = 1` and `k = 2` on a toy four-pixel example.

## Statistical and ethical caveats

Images from the same person are dependent, so image-random splits overestimate generalisation for identity-like tasks. Reconstruction MSE does not capture perceptual quality or downstream harm. Explained variance is not a fairness measure and components can encode sensitive attributes. A visible reconstruction may still be personally identifying; low rank is not anonymisation. Do not publish example faces without rights and explicit permission.

Use paired per-image reconstruction differences for comparisons of two SVD procedures, and report the full distribution rather than only a mean. Treat any optional recognition score as benchmark-specific; do not rank people or make security claims.

## Replication rubric

| Criterion | Evidence | Points |
| --- | --- | ---: |
| Source and data stewardship | documented terms, access controls, data card, fixed split | 25 |
| Mathematical fidelity | centred SVD, rank-`k` proof/check, train-only fitting | 25 |
| Experimental quality | pre-registered `k` grid, locked test, required visualisations | 20 |
| Reproducibility | manifest, hashes, environment, deterministic randomised method | 15 |
| Critique | identity dependence, privacy, representativeness, non-anonymity | 15 |

## Extension and critique

Compare PCA with a nonnegative or sparse representation only if you state the changed objective and evaluation trade-off. Then critique eigenfaces as a research artefact: the low-rank approximation result is powerful and reproducible, but turning that representation into a recognition system introduces population, consent, security, and social questions that reconstruction metrics cannot answer.
