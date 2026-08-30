import importlib,json,os,shutil
from pathlib import Path
import numpy as np
m=importlib.import_module(os.environ.get("STUDENT_MODULE","starter"));root=Path(__file__).parent;out=root/"artifacts";shutil.rmtree(out,ignore_errors=True)
x=m.load_fixture();model=m.fit_pca(x,1); z=m.transform(x,model);rec=m.inverse_transform(z,model)
assert z.shape==(len(x),1) and rec.shape==x.shape
assert np.allclose(model["components"]@model["components"].T,[[1]],atol=1e-7)
metrics=m.evaluate_and_save(x,out);saved=json.loads((out/"pca_metrics.json").read_text())
assert saved==metrics and metrics["2"]["mse"]<=metrics["1"]["mse"]+1e-12
assert len(metrics["1"]["explained_variance_ratio"])==1 and (out/"reconstruction.csv").exists()
print("PASS: PCA reconstruction and artifacts meet public acceptance.")
