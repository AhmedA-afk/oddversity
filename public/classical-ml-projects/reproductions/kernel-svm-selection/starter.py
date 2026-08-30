"""Learner-owned binary kernel SVM selection experiment."""
from __future__ import annotations
import csv,json
from pathlib import Path
import numpy as np
ROOT=Path(__file__).parent
def load_fixture(path=ROOT/"fixture.csv"):
    rows=list(csv.DictReader(path.open())); x=np.array([[float(r["x1"]),float(r["x2"])] for r in rows]); y=np.array([int(r["label"]) for r in rows])
    train=np.array([r["split"]=="train" for r in rows]); return x[train],y[train],x[~train],y[~train]
def kernel(x,z,kind="linear",gamma=1.0):
    """TODO: return the Gram matrix for linear or RBF kernels."""
    raise NotImplementedError("TODO: implement kernels")
def fit_kernel_svm(x,y,kind="rbf",C=10.0,gamma=1.0,max_iter=500):
    """TODO: train a dual soft-margin SVM; return a serializable model.
    Keep only support vectors or store a full alpha vector with training data."""
    raise NotImplementedError("TODO: implement deterministic dual optimisation")
def predict(x,model):
    """TODO: return labels in {-1, 1}."""
    raise NotImplementedError("TODO: implement kernel decision function")
def select_kernel(x_train,y_train,x_val,y_val,output_dir=ROOT/"artifacts"):
    """TODO: evaluate linear and RBF without training on validation rows; save report."""
    raise NotImplementedError("TODO: implement validation-based selection")
