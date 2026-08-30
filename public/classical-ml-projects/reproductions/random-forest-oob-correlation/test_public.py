import importlib,json,os,shutil
from pathlib import Path
import numpy as np
m=importlib.import_module(os.environ.get("STUDENT_MODULE","starter"));root=Path(__file__).parent;out=root/"artifacts";shutil.rmtree(out,ignore_errors=True)
x,y=m.load_fixture(); forest=m.fit_forest(x,y,n_trees=31,max_features=2,seed=23)
assert len(forest)==31
oob=m.oob_predictions(x,forest); assert oob.shape==y.shape and np.sum(oob>=0)>=8
c=m.tree_correlation(x,forest); assert np.isfinite(c) and -1<=c<=1
metrics=m.save_artifacts(x,y,forest,out); saved=json.loads((out/"forest_metrics.json").read_text())
assert saved==metrics and 0<=metrics["oob_accuracy"]<=1 and metrics["covered_oob_rows"]>=8
assert (out/"oob_predictions.csv").exists()
print("PASS: forest OOB and correlation implementation meets public acceptance.")
