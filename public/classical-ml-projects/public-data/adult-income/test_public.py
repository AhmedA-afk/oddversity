import json, tempfile
from pathlib import Path
import starter

def test_offline_contract():
    with tempfile.TemporaryDirectory() as temp:
        out = Path(temp); report = starter.run_offline(out)
        assert report["n"] == 8
        assert report["accuracy"] >= 0.75, "Improve the baseline without using label leakage."
        assert (out / "predictions.csv").exists()
        saved = json.loads((out / "metrics.json").read_text())
        assert saved["accuracy"] == report["accuracy"]

if __name__ == "__main__":
    test_offline_contract(); print("adult-income public acceptance passed")

