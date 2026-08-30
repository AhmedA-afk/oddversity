from __future__ import annotations
import csv, json
from collections import defaultdict
from pathlib import Path
ROOT=Path(__file__).parent

def load_rows(path: Path|None=None):
    """TODO 1: validate unique user/item/split rows and prevent train-test leakage."""
    with (path or ROOT/"data/fixture.csv").open(newline="") as handle:return list(csv.DictReader(handle))

def recommend(user_id, rows, limit=2):
    """TODO 2: replace popularity with a validated collaborative or content-based method."""
    seen={r["movie_id"] for r in rows if r["user_id"]==user_id and r["split"]=="train"}
    ratings=defaultdict(list)
    for r in rows:
        if r["split"]=="train" and r["user_id"] != user_id: ratings[r["movie_id"]].append(float(r["rating"]))
    candidates=((sum(values)/len(values),movie) for movie,values in ratings.items() if movie not in seen)
    return [movie for _,movie in sorted(candidates,key=lambda pair:(-pair[0],pair[1]))[:limit]]

def evaluate(rows):
    users=sorted({r["user_id"] for r in rows if r["split"]=="test"})
    hits=0
    for user in users:
        heldout={r["movie_id"] for r in rows if r["user_id"]==user and r["split"]=="test"}
        hits += int(bool(heldout & set(recommend(user,rows))))
    return {"users_with_holdout":len(users),"hit_rate_at_2":hits/len(users) if users else 0}

def run_offline(output_dir:Path):
    """TODO 3: add ranking metrics, cold-start analysis, and user-safety limitations."""
    rows=load_rows(); report=evaluate(rows); output_dir.mkdir(parents=True,exist_ok=True)
    users=sorted({r["user_id"] for r in rows})
    with (output_dir/"recommendations.csv").open("w",newline="") as handle:
        writer=csv.DictWriter(handle,fieldnames=["user_id","movie_id","rank"]);writer.writeheader()
        for user in users:
            writer.writerows({"user_id":user,"movie_id":movie,"rank":rank} for rank,movie in enumerate(recommend(user,rows),1))
    (output_dir/"metrics.json").write_text(json.dumps(report,indent=2)+"\n");return report

