import json,tempfile
from pathlib import Path
import starter
def test_offline_contract():
    with tempfile.TemporaryDirectory() as temp:
        out=Path(temp); report=starter.run_offline(out)
        assert report["n_transactions"] == 8 and report["n_customers"] == 4
        assert report["top_customers"][:2] == ["c2","c1"], "Ranking must sort by revenue, then customer id."
        assert (out/"customer_revenue.csv").exists()
        assert json.loads((out/"metrics.json").read_text())["top_customers"] == report["top_customers"]
if __name__=="__main__":test_offline_contract();print("online-retail public acceptance passed")

