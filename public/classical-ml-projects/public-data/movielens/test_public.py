import json,tempfile
from pathlib import Path
import starter
def test_offline_contract():
    rows=starter.load_rows()
    assert starter.recommend("u1",rows)[0] == "m3", "Do not recommend seen movies or use held-out labels."
    with tempfile.TemporaryDirectory() as temp:
        out=Path(temp);report=starter.run_offline(out)
        assert report["users_with_holdout"] == 3 and report["hit_rate_at_2"] >= 1.0
        assert (out/"recommendations.csv").exists() and json.loads((out/"metrics.json").read_text()) == report
if __name__=="__main__":test_offline_contract();print("movielens public acceptance passed")
