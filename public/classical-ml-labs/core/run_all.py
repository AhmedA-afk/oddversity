"""Run every core lab self-check without a test framework.

Run from this directory: python run_all.py
"""
from __future__ import annotations

import calibration_metrics
import decision_tree_split
import gmm_em
import kmeans
import knn
import linear_regression
import logistic_regression
import pca_svd


LABS = {
    "linear regression": linear_regression,
    "logistic regression": logistic_regression,
    "k-nearest neighbours": knn,
    "decision-tree split": decision_tree_split,
    "k-means": kmeans,
    "PCA/SVD": pca_svd,
    "Gaussian-mixture EM": gmm_em,
    "calibration and metrics": calibration_metrics,
}


if __name__ == "__main__":
    for name, module in LABS.items():
        module.self_check()
        print(f"PASS  {name}")
    print(f"\n{len(LABS)} core labs passed.")
