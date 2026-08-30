from __future__ import annotations
import csv,json
from pathlib import Path
import numpy as np
ROOT=Path(__file__).parent
def load_fixture(path=ROOT/"fixture.csv"):
 r=list(csv.DictReader(path.open()));x=np.array([[float(a["x1"]),float(a["x2"])] for a in r]);y=np.array([int(a["label"]) for a in r]);m=np.array([a["split"]=="train" for a in r]);return x[m],y[m],x[~m],y[~m]
def kernel(x,z,kind="linear",gamma=1.):
 if kind=="linear":return np.asarray(x)@np.asarray(z).T
 if kind=="rbf":
  a=np.asarray(x);b=np.asarray(z);return np.exp(-gamma*((a[:,None,:]-b[None,:,:])**2).sum(2))
 raise ValueError(kind)
def fit_kernel_svm(x,y,kind="rbf",C=10.,gamma=1.,max_iter=500):
 # Deterministic projected coordinate updates on the dual; adequate for this fixture.
 y=np.asarray(y,float);K=kernel(x,x,kind,gamma);a=np.zeros(len(y))
 for _ in range(max_iter):
  changed=0
  for i in range(len(y)):
   grad=1-y[i]*(K[i]@(a*y)); new=np.clip(a[i]+grad/(K[i,i]+1e-9),0,C)
   if abs(new-a[i])>1e-8:changed+=1
   a[i]=new
  # enforce alpha dot y = 0 by a deterministic small projection
  imbalance=a@y
  for i in np.argsort(-a):
   delta=min(a[i],abs(imbalance))
   if imbalance*y[i]>0:a[i]-=delta;imbalance-=delta*y[i]
   if abs(imbalance)<1e-8:break
  if not changed:break
 scores=K@(a*y); support=(a>1e-7)&(a<C-1e-7); b=float(np.mean(y[support]-scores[support])) if support.any() else 0.
 return {"x":np.asarray(x).tolist(),"y":y.tolist(),"alpha":a.tolist(),"b":b,"kind":kind,"gamma":gamma}
def predict(x,model):
 tr=np.array(model["x"]); y=np.array(model["y"]);a=np.array(model["alpha"])
 s=kernel(np.asarray(x),tr,model["kind"],model["gamma"])@(a*y)+model["b"];return np.where(s>=0,1,-1)
def select_kernel(x_train,y_train,x_val,y_val,output_dir=ROOT/"artifacts"):
 models={k:fit_kernel_svm(x_train,y_train,k) for k in ("linear","rbf")}
 scores={k:float(np.mean(predict(x_val,v)==y_val)) for k,v in models.items()}
 selected=max(("linear","rbf"),key=lambda k:(scores[k],k=="rbf"))
 report={"validation_accuracy":scores,"selected_kernel":selected,"C":10.0,"gamma":1.0}
 output_dir.mkdir(exist_ok=True);(output_dir/"kernel_selection.json").write_text(json.dumps(report,indent=2,sort_keys=True)+"\n");return report
