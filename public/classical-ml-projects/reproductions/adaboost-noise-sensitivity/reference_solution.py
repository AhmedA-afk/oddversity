from __future__ import annotations
import csv, json
from pathlib import Path
import numpy as np
ROOT=Path(__file__).parent
def load_fixture(path=ROOT / "fixture.csv"):
    rows=list(csv.DictReader(path.open())); return np.array([float(r["x"]) for r in rows]),np.array([int(r["label"]) for r in rows])
def _stump(x,t,p): return np.where(p*(x-t)>=0,1,-1)
def best_stump(x,y,weights):
    candidates=np.r_[x.min()-1, (np.sort(np.unique(x))[:-1]+np.sort(np.unique(x))[1:])/2, x.max()+1]
    best=None
    for t in candidates:
        for p in (-1,1):
            err=float(weights[_stump(x,t,p)!=y].sum()); item=(err,float(t),p)
            if best is None or item < best: best=item
    err,t,p=best; return t,p,err
def fit_adaboost(x,y,rounds=8):
    w=np.full(len(y),1/len(y)); learners=[]
    for _ in range(rounds):
        t,p,err=best_stump(x,y,w); err=np.clip(err,1e-12,1-1e-12)
        if err>=0.5: break
        alpha=.5*np.log((1-err)/err); w*=np.exp(-alpha*y*_stump(x,t,p)); w/=w.sum()
        learners.append((t,p,float(alpha)))
    return learners
def predict(x,learners):
    score=sum(a*_stump(np.asarray(x),t,p) for t,p,a in learners)
    return np.where(score>=0,1,-1)
def run_noise_experiment(x,y,noise_rates=(0.0,.25),rounds=8,seed=13,output_dir=ROOT/"artifacts"):
    rng=np.random.default_rng(seed); report={}
    for rate in noise_rates:
        noisy=y.copy(); count=int(round(rate*len(y)))
        if count: noisy[rng.choice(len(y),count,replace=False)]*=-1
        learners=fit_adaboost(x,noisy,rounds); pred=predict(x,learners)
        final=float(np.mean(pred!=noisy))
        report[str(rate)]={"accuracy":float(np.mean(pred==y)),"final_weighted_error":final,"rounds_completed":len(learners)}
    output_dir.mkdir(exist_ok=True); (output_dir/"noise_sensitivity.json").write_text(json.dumps(report,indent=2,sort_keys=True)+"\n")
    return report
