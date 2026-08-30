import importlib,json,os,shutil
from pathlib import Path
import numpy as np
m=importlib.import_module(os.environ.get("STUDENT_MODULE","starter"));root=Path(__file__).parent;out=root/"artifacts";shutil.rmtree(out,ignore_errors=True)
xt,yt,xv,yv=m.load_fixture(); k=m.kernel(xt,xt,"rbf",1.0); assert k.shape==(4,4) and np.allclose(np.diag(k),1)
report=m.select_kernel(xt,yt,xv,yv,out); saved=json.loads((out/"kernel_selection.json").read_text())
assert saved==report and report["selected_kernel"]=="rbf", report
assert report["validation_accuracy"]["rbf"]>=.75
model=m.fit_kernel_svm(xt,yt,"rbf"); assert np.mean(m.predict(xt,model)==yt)>=.75
print("PASS: kernel SVM selection respects the public validation protocol.")
