from __future__ import annotations
import csv,json
from pathlib import Path
import numpy as np
ROOT=Path(__file__).parent
def load_fixture(path=ROOT/"fixture.csv"):
    r=list(csv.DictReader(path.open())); return np.array([[float(z[f"f{i}"]) for i in range(3)] for z in r]),np.array([int(z["label"]) for z in r])
def fit_stump(x,y,feature_indices):
    best=None
    for j in sorted(feature_indices):
        vals=np.unique(x[:,j]); ts=(vals[:-1]+vals[1:])/2
        for t in ts:
            left=int(np.mean(y[x[:,j]<t])>=.5) if np.any(x[:,j]<t) else 0
            right=int(np.mean(y[x[:,j]>=t])>=.5) if np.any(x[:,j]>=t) else 1
            pred=np.where(x[:,j]<t,left,right); item=(int(np.sum(pred!=y)),j,float(t),left,right)
            if best is None or item<best: best=item
    _,j,t,left,right=best; return {"feature":j,"threshold":t,"left":left,"right":right}
def predict_stump(x,s): return np.where(x[:,s["feature"]]<s["threshold"],s["left"],s["right"])
def fit_forest(x,y,n_trees=31,max_features=2,seed=23):
    rng=np.random.default_rng(seed); forest=[]
    for _ in range(n_trees):
        bag=rng.integers(0,len(y),len(y)); feats=rng.choice(x.shape[1],max_features,replace=False)
        forest.append({"stump":fit_stump(x[bag],y[bag],feats),"in_bag":bag.tolist()})
    return forest
def oob_predictions(x,forest):
    votes=[[] for _ in range(len(x))]
    for tree in forest:
        pred=predict_stump(x,tree["stump"]); inbag=set(tree["in_bag"])
        for i,p in enumerate(pred):
            if i not in inbag:votes[i].append(int(p))
    return np.array([-1 if not v else int(np.mean(v)>=.5) for v in votes])
def tree_correlation(x,forest):
    p=np.array([predict_stump(x,t["stump"]) for t in forest],dtype=float)
    vals=[]
    for i in range(len(p)):
        for j in range(i):
            if np.std(p[i]) == 0 or np.std(p[j]) == 0:
                continue
            c=np.corrcoef(p[i],p[j])[0,1]
            if np.isfinite(c): vals.append(c)
    return float(np.mean(vals)) if vals else 0.0
def save_artifacts(x,y,forest,output_dir=ROOT/"artifacts"):
    output_dir.mkdir(exist_ok=True); o=oob_predictions(x,forest); mask=o>=0
    metrics={"oob_accuracy":float(np.mean(o[mask]==y[mask])),"mean_tree_correlation":tree_correlation(x,forest),"n_trees":len(forest),"covered_oob_rows":int(mask.sum())}
    (output_dir/"forest_metrics.json").write_text(json.dumps(metrics,indent=2,sort_keys=True)+"\n")
    with (output_dir/"oob_predictions.csv").open("w",newline="") as f:
        w=csv.writer(f);w.writerow(["row","label","oob_prediction"]);w.writerows((i,int(y[i]),int(o[i])) for i in range(len(y)))
    return metrics
