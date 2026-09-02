---
title: "Lab: build the eval harness for a claims-triage assistant"
phase: ai
module: evals-first
kind: lab
summary: "Build a real, small eval harness in Python for a claims-triage assistant at a fictional Indian health insurer: a labelled JSONL set, a pluggable runner, a scorer with an asymmetric gate and per-slice reporting, and a Markdown report you can hand to a compliance officer."
duration: 4 h
updated: "2026-09-02"
outcomes:
  - Run a labelled eval set through a model and produce a scored, sliced report from one command.
  - Fail a build automatically when a must-never-happen case regresses.
  - Hand the harness to a customer's team so they can run it without you.
artifact: A repository containing cases.jsonl, run.py, score.py, a generated report.md, and a CI step that gates on the critical-error count.
sources:
  - "https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production"
---

**The customer.** Kaveri Health Assurance is a fictional mid-size health insurer operating in Karnataka and Tamil Nadu. Their claims desk receives cashless and reimbursement claims through a web portal, an email inbox, and a WhatsApp number. Sixteen adjusters triage roughly 900 claims a day into three lanes: auto-approve, send for review, reject. They want an assistant that proposes the lane.

You have already run the labelling session and the feasibility test. You have twenty labelled examples and a nine-of-ten hold-out. This lab builds the harness that will grade every change from here to handover.

You will write three files and generate a fourth. Python 3.10 or later, no framework.

## Step 1: Lay out the repository

```
kaveri-triage-eval/
  cases.jsonl        # the labelled set, reviewed like code
  run.py             # produces predictions.jsonl
  score.py           # produces report.md, exits non-zero on a gate failure
  requirements.txt
```

Keep the harness in its own directory, separate from the application. The customer's team will keep running it after your application code has been rewritten twice.

## Step 2: Write cases.jsonl

One JSON object per line. Three examples, redacted, in the shape from the labelling lesson:

```json
{"id":"clm-0001","input":{"claim_text":"Cashless request, day-care cataract, Apollo Bengaluru, invoice 38,400. Policy active 4 years.","policy_id":"P-4482"},"expected":{"decision":"auto_approve","reason_code":"WITHIN_POLICY"},"meta":{"language":"en","channel":"portal","product":"retail"}}
{"id":"clm-0002","input":{"claim_text":"Reimbursement. Discharge summary says 'known diabetic since 2019'. Policy inception 2023.","policy_id":"P-9911"},"expected":{"decision":"review","reason_code":"PRE_EXISTING_UNCLEAR"},"meta":{"language":"en","channel":"email","product":"retail"}}
{"id":"clm-0003","input":{"claim_text":"sir claim ka status batao, hospital bill 1.2 lakh, cosmetic surgery ke liye","policy_id":"P-2210"},"expected":{"decision":"reject","reason_code":"EXCLUSION_APPLIES"},"meta":{"language":"hinglish","channel":"whatsapp","product":"group"}}
```

Write twenty of these. Ten typical, five hard, three broken-input, two that should be refused or escalated. At least four in Hinglish or Devanagari, because that is a fifth of the WhatsApp traffic and it will be your worst slice.

Redact before the file touches your laptop. No member names, no policy numbers that resolve to a real person. Under the DPDP Act 2023, a claim note carrying a diagnosis is sensitive personal data, and a labelled eval set is exactly the kind of file that gets copied into a Slack thread.

## Step 3: Write run.py

The runner's only job is to turn cases into predictions. Keep the model call behind a function so the harness runs offline in CI and so you can swap providers without touching the scorer.

```python
"""Run the triage eval set through a predictor and write predictions.jsonl."""
import argparse, json, os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

DECISIONS = ("auto_approve", "review", "reject")
REASON_CODES = (
    "WITHIN_POLICY", "PRE_EXISTING_UNCLEAR", "DOC_MISSING",
    "EXCLUSION_APPLIES", "AMOUNT_OVER_LIMIT", "DUPLICATE_CLAIM",
)

SYSTEM = f"""You triage health insurance claims for an Indian insurer.
Return one decision from {list(DECISIONS)} and one reason code from {list(REASON_CODES)}.
Claims may be written in English, Hindi or Hinglish.
If the evidence does not clearly support auto_approve or reject, return review.
Quote the exact phrase you relied on in `evidence`."""


def baseline(case):
    """Defer everything. The floor any real system must beat."""
    return {"decision": "review", "reason_code": "DOC_MISSING", "evidence": ""}


def anthropic_predict(case):
    from anthropic import Anthropic
    client = Anthropic()
    tool = {
        "name": "record_triage",
        "description": "Record the triage decision for one claim.",
        "input_schema": {
            "type": "object",
            "properties": {
                "decision": {"type": "string", "enum": list(DECISIONS)},
                "reason_code": {"type": "string", "enum": list(REASON_CODES)},
                "evidence": {"type": "string"},
            },
            "required": ["decision", "reason_code", "evidence"],
        },
    }
    msg = client.messages.create(
        model=os.environ.get("MODEL", "claude-sonnet-4-5"),
        max_tokens=512,
        system=SYSTEM,
        tools=[tool],
        tool_choice={"type": "tool", "name": "record_triage"},
        messages=[{"role": "user", "content": json.dumps(case["input"], ensure_ascii=False)}],
    )
    for block in msg.content:
        if block.type == "tool_use":
            return block.input
    return {"decision": "review", "reason_code": "DOC_MISSING", "evidence": ""}


PREDICTORS = {"baseline": baseline, "anthropic": anthropic_predict}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cases", default="cases.jsonl")
    ap.add_argument("--out", default="predictions.jsonl")
    ap.add_argument("--predictor", default="baseline", choices=sorted(PREDICTORS))
    args = ap.parse_args()

    cases = [json.loads(l) for l in Path(args.cases).read_text(encoding="utf-8").splitlines() if l.strip()]
    predict = PREDICTORS[args.predictor]

    def one(case):
        try:
            out = predict(case)
            return {"id": case["id"], **out}
        except Exception as exc:                      # a crash is a prediction of "nothing"
            return {"id": case["id"], "decision": "<error>", "error": repr(exc)}

    with ThreadPoolExecutor(max_workers=4) as pool:
        rows = list(pool.map(one, cases))

    with open(args.out, "w", encoding="utf-8") as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"wrote {len(rows)} predictions to {args.out}")


if __name__ == "__main__":
    main()
```

Two decisions worth noticing. Errors become a prediction of `<error>` rather than crashing the run, because a harness that dies on case seven tells you nothing about cases eight to twenty. And the model is forced through a tool schema, so a formatting failure cannot masquerade as a reasoning failure.

## Step 4: Write score.py

This is the file the customer will read. It produces the four-part metric set: primary metric, must-never count, slices, deferral rate.

```python
"""Score predictions against cases and emit a Markdown report."""
import argparse, collections, json, sys
from pathlib import Path

CRITICAL = ("reject", "auto_approve")     # expected, predicted: the one that must never happen
SLICE_KEYS = ("language", "channel", "product")


def load(path):
    rows = {}
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if line.strip():
            row = json.loads(line)
            rows[row["id"]] = row
    return rows


def score(cases, preds):
    confusion = collections.Counter()
    slices = collections.defaultdict(lambda: [0, 0])
    critical, errors, deferred = [], [], 0

    for cid, case in cases.items():
        want = case["expected"]["decision"]
        pred = preds.get(cid, {})
        got = pred.get("decision", "<missing>")
        confusion[(want, got)] += 1
        if got == "<error>":
            errors.append(cid)
        if got == "review":
            deferred += 1
        if (want, got) == CRITICAL:
            critical.append(cid)
        for key in SLICE_KEYS:
            name = f"{key}={case['meta'][key]}"
            slices[name][1] += 1
            slices[name][0] += int(got == want)

    total = len(cases)
    correct = sum(n for (w, g), n in confusion.items() if w == g)
    return {
        "total": total,
        "accuracy": correct / total if total else 0.0,
        "confusion": confusion,
        "slices": dict(slices),
        "critical": critical,
        "errors": errors,
        "deferral_rate": deferred / total if total else 0.0,
    }


def report(res, thresholds):
    pct = lambda x: f"{100 * x:.1f}%"
    out = ["# Triage eval report", "",
           f"Cases: {res['total']}  ",
           f"Routing accuracy: **{pct(res['accuracy'])}** (target {pct(thresholds['accuracy'])})  ",
           f"Deferral rate: {pct(res['deferral_rate'])}  ",
           f"Runner errors: {len(res['errors'])}", "",
           "## Must-never-happen", "",
           f"Rejectable claim auto-approved: **{len(res['critical'])}** "
           f"(allowed {thresholds['critical']})"]
    if res["critical"]:
        out.append("")
        out += [f"- `{cid}`" for cid in res["critical"]]

    out += ["", "## By slice", "", "| Slice | Correct | Total | Rate |", "|---|---|---|---|"]
    for name in sorted(res["slices"]):
        ok, n = res["slices"][name]
        out.append(f"| {name} | {ok} | {n} | {pct(ok / n)} |")

    out += ["", "## Confusion", "", "| Expected | Predicted | Count |", "|---|---|---|"]
    for (want, got), n in sorted(res["confusion"].items()):
        out.append(f"| {want} | {got} | {n} |")
    return "\n".join(out) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cases", default="cases.jsonl")
    ap.add_argument("--preds", default="predictions.jsonl")
    ap.add_argument("--out", default="report.md")
    ap.add_argument("--min-accuracy", type=float, default=0.85)
    ap.add_argument("--max-critical", type=int, default=0)
    args = ap.parse_args()

    thresholds = {"accuracy": args.min_accuracy, "critical": args.max_critical}
    res = score(load(args.cases), load(args.preds))
    Path(args.out).write_text(report(res, thresholds), encoding="utf-8")

    failed = []
    if res["accuracy"] < args.min_accuracy:
        failed.append(f"accuracy {res['accuracy']:.3f} < {args.min_accuracy}")
    if len(res["critical"]) > args.max_critical:
        failed.append(f"{len(res['critical'])} critical errors > {args.max_critical}")
    print(f"wrote {args.out}")
    for line in failed:
        print("GATE FAILED:", line, file=sys.stderr)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
```

## Step 5: Run the floor, then the model

```bash
python run.py --predictor baseline && python score.py
python run.py --predictor anthropic && python score.py --min-accuracy 0.85
```

The baseline defers everything, so it scores whatever fraction of your set is labelled `review` and takes zero critical errors. Any system you build must beat it on accuracy without exceeding it on deferral. Record the baseline number in the report you send. It is the honest floor, and it stops a mediocre first result from reading as progress.

## Step 6: Gate the build

Add one CI step. On any pull request that changes prompts, retrieval, or the model id:

```yaml
- name: Eval gate
  run: |
    python run.py --predictor anthropic --out predictions.jsonl
    python score.py --min-accuracy 0.85 --max-critical 0
```

Non-zero exit blocks the merge. This is the single most valuable line of infrastructure on the engagement, and it is the reason the customer's team can change the prompt after you leave without breaking the deployment.

## Step 7: Add the slice that will embarrass you

Look at the per-slice table. If your Hinglish and WhatsApp rows are not materially worse than the portal and English rows, your set does not contain enough real WhatsApp text. Go back to the export and take five more. A report where every slice is 90% is a report nobody learns from.

## Definition of done

- `cases.jsonl` has twenty reviewed, redacted, labelled examples covering three decisions, at least three slice values per key, and at least two refusal or escalation cases.
- One command produces `predictions.jsonl`; a second produces `report.md`.
- `report.md` contains the accuracy, the critical count, a slice table, a confusion table, and the deferral rate.
- `score.py` exits non-zero when the critical count exceeds zero, and you have proved it by deliberately mislabelling one prediction.
- The baseline predictor runs with no API key and no network.
- A colleague can clone the repository and reproduce your report from the README in under ten minutes.

## How this could go wrong

**The set drifts to match the system.** Someone changes a label because the model got it wrong. Require customer-side approval on any pull request touching `cases.jsonl`, and say so in the README.

**Twenty cases, one model run, big conclusions.** With twenty examples, one case is five percentage points. Do not report a two-point improvement as an improvement. For decisions that matter, run three times and report the spread, and grow the set to sixty before you claim a small win.

**The harness needs the internet and the deployment does not.** If this ships into a VPC or an air-gapped enclave, the baseline path must work with no network and the model path must accept a private endpoint through an environment variable. Test that on day one, not at the security review.

**Data leaves the perimeter.** Confirm in writing where `cases.jsonl` may live and which endpoint it may be sent to. In a health or banking deployment this is a real approval, not a formality, and discovering it late costs weeks.

**Nobody runs it after you go.** Wire it into their CI, not yours. Put the command in their README. Watch one of their engineers run it in front of you before the engagement closes. An eval harness only the FDE can run is a document, not a control.
