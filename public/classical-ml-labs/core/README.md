# Classical ML: executable core labs

This small package lets you inspect the mechanics behind common classical machine-learning algorithms. It is deliberately dependency-light and uses tiny deterministic synthetic data so that every result is reproducible without downloads, accounts, or GPU hardware.

It is a learning package, **not** a production ML library. Implementations favour readable vectorised NumPy over performance, extensive input handling, scalability, or every algorithmic option.

## Setup and run

Requires Python 3.10+ and NumPy.

```bash
cd public/classical-ml-labs/core
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\\Scripts\\activate
python -m pip install -r requirements.txt
python run_all.py
```

Expected qualitative result: eight `PASS` lines, then `8 core labs passed.` All data are created inside the scripts, so no network request or external dataset is involved.

You can run one lab directly, for example:

```bash
python linear_regression.py
python gmm_em.py
python calibration_metrics.py
```

Each script runs a `self_check()` containing assertions. An assertion failure is intentionally useful: change a learning rate, threshold, initialisation, or formula and use the failing check to identify what broke.

## Lab map

| Script | Learn by inspecting | Expected qualitative output |
| --- | --- | --- |
| `linear_regression.py` | Normal equation vs. gradient descent | Both find a slope close to 2; MSE drops sharply. |
| `logistic_regression.py` | Sigmoid, log loss, gradient descent | Log loss falls and the tiny data set is classified correctly. |
| `knn.py` | Distance, neighbourhood voting, `k` validation | Queries near each cluster receive its label. |
| `decision_tree_split.py` | Gini impurity and split search | The gap between 3 and 8 is selected with zero child impurity. |
| `kmeans.py` | Assignment/update loop and initialisation | Two visibly separated cluster centres emerge. |
| `pca_svd.py` | Centering, covariance eigenvectors, SVD | The two one-dimensional projections agree up to sign. |
| `gmm_em.py` | Responsibilities and EM updates | Two Gaussian means separate near the two modes. |
| `calibration_metrics.py` | Threshold metrics, proper scoring, calibration | Perfect classification can still have non-zero calibration error. |

## Suggested experiments

1. In `linear_regression.py`, make the learning rate 1.0. Observe divergence, then reduce it until the loss falls again.
2. In `logistic_regression.py`, change the decision threshold from 0.5 to 0.8 and inspect precision/recall using `calibration_metrics.py`.
3. In `kmeans.py`, reorder the first two observations. The deterministic initialisation exposes why k-means depends on starts.
4. In `gmm_em.py`, add a far-out outlier and inspect the fitted variance. This reveals sensitivity and the need for robust modelling choices.
5. In `pca_svd.py`, scale one feature by 100. PCA will chase scale unless you standardise features first.

## File contract

Every lab exports `demo()` and `self_check()`. `run_all.py` is the minimal no-framework test runner. The assertions check algorithmic invariants—such as decreasing loss, valid probabilities, pure splits, or matching PCA projections—not exact fragile floating-point printouts.
