import importlib, json, os, shutil
from pathlib import Path
import numpy as np

m = importlib.import_module(os.environ.get("STUDENT_MODULE", "starter"))
ROOT = Path(__file__).parent
out = ROOT / "artifacts"
shutil.rmtree(out, ignore_errors=True)
X, y = m.load_fixture()
b, w = m.fit_least_squares(X, y)
assert np.isclose(b, 2.0, atol=1e-8), b
assert np.allclose(w, [3.0], atol=1e-8), w
assert np.allclose(m.predict(np.array([[5.0], [-4.0]]), b, w), [17.0, -10.0])
m.save_artifacts(X, b, w, out)
model = json.loads((out / "model.json").read_text())
assert np.isclose(model["intercept"], 2.0)
assert len(model["coefficients"]) == 1
assert (out / "predictions.csv").read_text().splitlines()[0] == "x,prediction"
print("PASS: least-squares implementation and artifacts meet public acceptance.")
