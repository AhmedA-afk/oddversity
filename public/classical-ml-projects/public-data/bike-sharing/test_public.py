import json,tempfile
from pathlib import Path
import starter
def test_offline_contract():
    with tempfile.TemporaryDirectory() as temp:
        out=Path(temp);r=starter.run_offline(out)
        assert r["n"]==8 and r["mae"] <= 16, "Beat the seasonal baseline acceptance target."
        assert (out/"predictions.csv").exists() and json.loads((out/"metrics.json").read_text())["mae"]==r["mae"]
if __name__=="__main__":test_offline_contract();print("bike-sharing public acceptance passed")

