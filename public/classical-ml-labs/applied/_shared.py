"""Offline runner for the six reproducible Classical ML applied labs."""
from __future__ import annotations

import argparse
import csv
import json
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SPECS = {
    "01-house-price-regression": ("regression", "sale_price", "listing_date", .18),
    "02-churn-classification": ("classification", "churned", "snapshot_date", .10),
    "03-fraud-triage-under-imbalance": ("fraud", "is_fraud", "event_time", .20),
    "04-demand-forecasting": ("forecast", "units", "ds", .12),
    "05-ranking-feedback-loop": ("ranking", "clicked", "impression_time", .08),
    "06-drift-incident-response": ("drift", "defaulted", "event_time", .20),
}

def sigmoid(x):
    return 1 / (1 + math.exp(-max(-30, min(30, x))))

def date(day):
    return f"{2024 + day // 336:04d}-{1 + (day // 28) % 12:02d}-{1 + day % 28:02d}"

def write(path, header, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as file:
        out = csv.writer(file)
        out.writerow(header)
        out.writerows(rows)

def house(path):
    r, rows = random.Random(1101), []
    for day in range(540):
        for _ in range(3):
            sqft, age, dist, school = r.randint(550, 3200), r.randint(0, 85), r.uniform(.2, 28), r.uniform(3.5, 9.8)
            beds, renovated = max(1, min(6, round(sqft / 650 + r.uniform(-.8, .8)))), int(r.random() < .18)
            price = 65000 + 215 * sqft + 16000 * beds - 1050 * age - 2600 * dist + 18000 * school + 33000 * renovated + r.gauss(0, 18500)
            rows.append([date(day), sqft, beds, age, round(dist, 2), round(school, 1), renovated, round(price, 2)])
    write(path, ["listing_date","sqft","bedrooms","age_years","distance_km","school_score","renovated","sale_price"], rows)

def churn(path):
    r, rows = random.Random(2202), []
    for day in range(420):
        for _ in range(5):
            tenure, logins, tickets = r.randint(0, 72), r.randint(0, 35), r.randint(0, 7)
            spend, rise = max(0, r.gauss(55 + tenure * 1.4, 25)), int(r.random() < .15)
            p = sigmoid(1.05 - .055*tenure - .09*logins + .34*tickets - .011*spend + .85*rise)
            rows.append([date(day), tenure, logins, tickets, round(spend, 2), rise, int(r.random() < p)])
    write(path, ["snapshot_date","tenure_months","logins_30d","support_tickets_30d","monthly_spend","recent_price_rise","churned"], rows)

def fraud(path):
    r, rows = random.Random(3303), []
    for hour in range(5200):
        amount, velocity, match, age = math.exp(r.uniform(2.2, 7.0)), r.randint(1,12), int(r.random() > .08), r.randint(1,2500)
        utc = hour % 24
        p = sigmoid(-7 + .0008*amount + .36*velocity - 1.6*match - .001*age + (.8 if utc < 5 else 0))
        rows.append([f"{date(hour // 24)}T{utc:02d}:00:00",round(amount,2),velocity,match,age,utc,int(r.random() < p)])
    write(path, ["event_time","amount","transactions_1h","billing_country_matches","card_age_days","hour_utc","is_fraud"], rows)

def demand(path):
    r, rows = random.Random(4404), []
    for day in range(720):
        dow, promotion, holiday = day % 7, int(r.random() < .15), int(day % 91 in (0,1))
        temp = 14 + 10*math.sin(day/40) + r.gauss(0,2)
        units = max(0, round(72 + .07*day + 15*math.sin(2*math.pi*dow/7) + 23*promotion - 18*holiday + .7*temp + r.gauss(0,7)))
        rows.append([date(day),dow,promotion,holiday,round(temp,1),units])
    write(path, ["ds","day_of_week","promotion","holiday","temperature_c","units"], rows)

def ranking(path):
    r, rows = random.Random(5505), []
    for day in range(500):
        for user in range(14):
            affinity = r.uniform(-1,1)
            for position in range(1,11):
                quality, price, prior = r.uniform(-1,1), r.uniform(7,120), r.randint(0,60)
                p = sigmoid(-1.1 + 1.3*affinity + 1.1*quality + .025*prior - .013*price - .28*position)
                rows.append([f"{date(day)}T12:00:00",user,position,round(affinity,3),round(quality,3),round(price,2),prior,int(r.random()<p)])
    write(path, ["impression_time","user_id","logged_position","user_affinity","item_quality","price","prior_clicks","clicked"], rows)

def drift(path):
    r, rows = random.Random(6606), []
    for day in range(540):
        shifted = day >= 360
        income, util = max(12000,r.gauss(58000 if not shifted else 46000,12000)), min(.99,max(.01,r.gauss(.34 if not shifted else .56,.16)))
        late, loan = r.randint(0,2 if not shifted else 5), max(1000,r.gauss(14000 if not shifted else 19000,6500))
        p = sigmoid(-4.4 - .000018*income + 3.1*util + .5*late + .000018*loan + (.35 if shifted else 0))
        rows.append([date(day),round(income,2),round(util,3),late,round(loan,2),int(r.random()<p),"post_policy" if shifted else "reference"])
    write(path, ["event_time","income","utilization","late_payments_12m","loan_amount","defaulted","period"], rows)

GENERATORS = {"01-house-price-regression":house,"02-churn-classification":churn,"03-fraud-triage-under-imbalance":fraud,"04-demand-forecasting":demand,"05-ranking-feedback-loop":ranking,"06-drift-incident-response":drift}

def split(df, time):
    ordered = df.sort_values(time).reset_index(drop=True)
    return ordered.iloc[:int(.8*len(ordered))].copy(), ordered.iloc[int(.8*len(ordered)):].copy()

def feature_frame(df, target, time, extra=()):
    return df[[c for c in df if c not in {target,time,*extra}]]

def ndcg5(df, scores):
    frame, values = df.copy(), []
    frame["score"] = scores
    for _, group in frame.groupby(["impression_time","user_id"]):
        top = group.sort_values("score",ascending=False).head(5)
        ideal = group.sort_values("clicked",ascending=False).head(5)
        dcg = sum(row.clicked/math.log2(i+2) for i,(_,row) in enumerate(top.iterrows()))
        idcg = sum(row.clicked/math.log2(i+2) for i,(_,row) in enumerate(ideal.iterrows()))
        if idcg: values.append(dcg/idcg)
    return sum(values)/max(1,len(values))

def psi(reference, current):
    lo, hi = float(reference.min()), float(reference.max())
    edges = [lo+(hi-lo)*i/10 for i in range(11)]
    ref = pd.cut(reference,edges,include_lowest=True).value_counts(normalize=True,sort=False)
    cur = pd.cut(current,edges,include_lowest=True).value_counts(normalize=True,sort=False)
    return sum((float(c)-float(q))*math.log((float(c)+1e-6)/(float(q)+1e-6)) for q,c in zip(ref,cur))

def run(lab, solution, make_data=False):
    # Keep generation dependency-free so course builds can commit and inspect the
    # deterministic CSVs without creating a scientific-Python environment.
    import pandas as pd
    from sklearn.dummy import DummyClassifier, DummyRegressor
    from sklearn.ensemble import HistGradientBoostingRegressor
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score, average_precision_score, mean_absolute_error, recall_score, roc_auc_score
    task,target,time,lift = SPECS[lab]
    base = ROOT/lab
    csv_path, artifacts = base/"data/synthetic.csv", base/"artifacts"
    if make_data or not csv_path.exists(): GENERATORS[lab](csv_path)
    artifacts.mkdir(exist_ok=True)
    df = pd.read_csv(csv_path)
    train,test = split(df,time)
    result = {"lab":lab,"rows":len(df),"train_rows":len(train),"test_rows":len(test),"split_rule":"chronological 80/20; no future rows in training"}
    if task == "regression":
        xtr,xte=feature_frame(train,target,time),feature_frame(test,target,time)
        baseline=DummyRegressor(strategy="mean").fit(xtr,train[target])
        model=(HistGradientBoostingRegressor(max_iter=250,learning_rate=.07,random_state=7) if solution else baseline).fit(xtr,train[target])
        b,m=mean_absolute_error(test[target],baseline.predict(xte)),mean_absolute_error(test[target],model.predict(xte))
        result.update(baseline_mae=round(b,2),model_mae=round(m,2),acceptance=m < b*(1-lift))
    elif task in ("classification","fraud","ranking"):
        extra=("logged_position",) if task=="ranking" else ()
        xtr,xte=feature_frame(train,target,time,extra),feature_frame(test,target,time,extra)
        baseline=DummyClassifier(strategy="prior",random_state=7).fit(xtr,train[target])
        model=(LogisticRegression(max_iter=1000,class_weight="balanced" if task=="fraud" else None,random_state=7) if solution else baseline).fit(xtr,train[target])
        bs,s=baseline.predict_proba(xte)[:,1],model.predict_proba(xte)[:,1]
        if task=="classification":
            b,m=roc_auc_score(test[target],bs),roc_auc_score(test[target],s)
            result.update(baseline_roc_auc=round(b,3),model_roc_auc=round(m,3),acceptance=m>b+lift)
        elif task=="fraud":
            budget=max(1,int(.05*len(test))); flagged=pd.Series(s).nlargest(budget).index
            recall=recall_score(test[target],test.index.isin(test.iloc[flagged].index))
            result.update(review_budget=budget,positive_rate=round(float(test[target].mean()),4),average_precision=round(average_precision_score(test[target],s),3),recall_at_review_budget=round(recall,3),acceptance=recall>=lift)
        else:
            b,m=ndcg5(test,bs),ndcg5(test,s)
            result.update(baseline_ndcg_at_5=round(b,3),model_ndcg_at_5=round(m,3),acceptance=m>b+lift)
    elif task == "forecast":
        xtr,xte=feature_frame(train,target,time),feature_frame(test,target,time)
        baseline=test.day_of_week.map(train.groupby("day_of_week")[target].mean()).fillna(train[target].mean())
        model=HistGradientBoostingRegressor(max_iter=220,learning_rate=.06,random_state=7).fit(xtr,train[target]) if solution else None
        b,m=mean_absolute_error(test[target],baseline),mean_absolute_error(test[target],model.predict(xte) if model else baseline)
        result.update(baseline_mae=round(b,2),model_mae=round(m,2),acceptance=m < b*(1-lift))
    else:
        xtr,xte=feature_frame(train,target,time,("period",)),feature_frame(test,target,time,("period",))
        baseline=DummyClassifier(strategy="prior",random_state=7).fit(xtr,train[target])
        model=LogisticRegression(max_iter=1000,random_state=7).fit(xtr,train[target]) if solution else baseline
        score,shift=accuracy_score(test[target],model.predict(xte)),psi(train.utilization,test.utilization)
        result.update(holdout_accuracy=round(score,3),utilization_psi=round(shift,3),drift_alarm=shift>=.20,acceptance=shift>=.20)
    (artifacts/("solution_metrics.json" if solution else "starter_metrics.json")).write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps(result,indent=2))
    # A solution is an executable acceptance contract, not a report that can
    # silently claim success. Student/starter runs remain exploratory; the
    # reference solution must exit non-zero when its stated acceptance target
    # is not met so it can be used in CI and grading.
    if solution and not result["acceptance"]:
        raise SystemExit(f"Acceptance check failed for {lab}; inspect the recorded metrics and split.")
    return result

def cli(lab, solution):
    parser=argparse.ArgumentParser()
    parser.add_argument("--make-data",action="store_true",help="Regenerate deterministic data first.")
    args=parser.parse_args()
    run(lab,solution,args.make_data)
