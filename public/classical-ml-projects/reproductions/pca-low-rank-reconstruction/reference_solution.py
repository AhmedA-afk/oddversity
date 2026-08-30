from __future__ import annotations
import csv,json
from pathlib import Path
import numpy as np
ROOT=Path(__file__).parent
def load_fixture(path=ROOT/"fixture.csv"):
 r=list(csv.DictReader(path.open()));return np.array([[float(a[f"f{i}"]) for i in range(3)] for a in r])
def fit_pca(x,n_components):
 mean=np.mean(x,0);_,s,vt=np.linalg.svd(x-mean,full_matrices=False);var=s*s/(len(x)-1)
 return {"mean":mean,"components":vt[:n_components],"explained_variance_ratio":var[:n_components]/var.sum()}
def transform(x,model):return (np.asarray(x)-model["mean"])@model["components"].T
def inverse_transform(z,model):return np.asarray(z)@model["components"]+model["mean"]
def evaluate_and_save(x,output_dir=ROOT/"artifacts"):
 output_dir.mkdir(exist_ok=True);metrics={};rec1=None
 for rank in (1,2):
  model=fit_pca(x,rank);rec=inverse_transform(transform(x,model),model)
  metrics[str(rank)]={"mse":float(np.mean((x-rec)**2)),"explained_variance_ratio":np.asarray(model["explained_variance_ratio"]).tolist()}
  if rank==1:rec1=rec
 (output_dir/"pca_metrics.json").write_text(json.dumps(metrics,indent=2,sort_keys=True)+"\n")
 with (output_dir/"reconstruction.csv").open("w",newline="") as f:
  w=csv.writer(f);w.writerow(["f0","f1","f2"]);w.writerows(rec1.tolist())
 return metrics
