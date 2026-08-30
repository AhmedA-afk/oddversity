import importlib,json,os,shutil
from pathlib import Path
import numpy as np
m=importlib.import_module(os.environ.get("STUDENT_MODULE","starter")); root=Path(__file__).parent; out=root/"artifacts"; shutil.rmtree(out,ignore_errors=True)
x,y=m.load_fixture(); t,p,e=m.best_stump(x,y,np.full(len(y),1/len(y)))
assert e == 0.0 and p in (-1,1) and -0.5 < t < 0.5, (t,p,e)
learners=m.fit_adaboost(x,y,rounds=8); assert len(learners)>=1
assert np.mean(m.predict(x,learners)==y)==1.0
report=m.run_noise_experiment(x,y,output_dir=out)
assert set(report)=={"0.0","0.25"} and report["0.0"]["accuracy"]==1.0
saved=json.loads((out/"noise_sensitivity.json").read_text()); assert saved==report
print("PASS: AdaBoost noise experiment is deterministic and meets public acceptance.")
