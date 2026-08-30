import json, tempfile
from pathlib import Path
import starter
def test_offline_contract():
    with tempfile.TemporaryDirectory() as temp:
        out=Path(temp); report=starter.run_offline(out)
        assert report["n"] == 8 and report["recall"] >= .75 and report["precision"] >= .6
        assert (out/"predictions.csv").exists() and json.loads((out/"metrics.json").read_text())["n"] == 8
if __name__ == "__main__": test_offline_contract(); print("bank-marketing public acceptance passed")

