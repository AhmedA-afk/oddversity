---
title: "Implementation: Monitoring Hallucination in Production"
track: "hallucinations"
status: live
summary: "Build the logging and dashboards that catch a reliability regression after a model or prompt change, before users report it."
duration: "8 min read"
---

Your CI eval suite runs against a fixed set of examples, on a schedule you control. Production traffic doesn't hold still — a model version bump, a prompt tweak, or a shift in what users are asking can degrade reliability in ways [CI never sees](/learn/hallucinations/tracking-hallucination-in-ci). This lesson builds the monitoring layer that catches it anyway.

## What we're building

A logging schema and a small set of dashboard metrics computed from it: escalation rate, guard-block rate, sampled faithfulness score, and user-reported error rate, all tracked over time with a basic drift alert.

## Setup

Every request that passes through the [confidence-gated router](/learn/hallucinations/confidence-gated-escalation-impl) already produces the raw signal this needs — monitoring is mostly about not throwing that signal away.

```python
import time
import json

def log_request_outcome(request_id, question, decision, guard_result,
                         uncertainty_score, model_version, prompt_version):
    record = {
        "request_id": request_id,
        "timestamp": time.time(),
        "model_version": model_version,
        "prompt_version": prompt_version,
        "action": decision.action,                # answer_directly | answer_with_citations | escalate
        "uncertainty_score": uncertainty_score,
        "guard_passed": guard_result.all_supported,
        "flagged_claims": len(guard_result.flagged),
    }
    append_to_log(record)  # your log sink: a file, a table, an event stream
```

## Build it

### Step 1: compute the four core metrics from raw logs

```python
def compute_daily_metrics(records: list[dict]) -> dict:
    n = len(records)
    if n == 0:
        return {}
    escalations = sum(1 for r in records if r["action"] == "escalate")
    guard_blocks = sum(1 for r in records if not r["guard_passed"])
    return {
        "n_requests": n,
        "escalation_rate": escalations / n,
        "guard_block_rate": guard_blocks / n,
        "avg_uncertainty": sum(r["uncertainty_score"] for r in records) / n,
    }
```

### Step 2: sample a slice for full faithfulness scoring

Running the full [fact-checking pipeline](/learn/hallucinations/fact-checking-pipeline-impl) on every production request is rarely worth the cost (see [latency, cost, and reliability tradeoffs](/learn/hallucinations/latency-cost-reliability-tradeoffs)), but running it on a random daily sample gives you a trustworthy faithfulness trend line without paying for full coverage.

```python
import random

def sample_and_score_faithfulness(records: list[dict], sample_rate: float = 0.02) -> float:
    sample = [r for r in records if random.random() < sample_rate]
    scores = [fact_check(fetch_answer(r["request_id"]))["clean"] for r in sample]
    return sum(scores) / len(scores) if scores else None
```

### Step 3: fold in user-reported errors

A thumbs-down, a support ticket tagged "wrong answer," or an explicit correction is the most expensive-to-collect but most trustworthy signal you have — it's a real person telling you something broke.

```python
def user_reported_error_rate(records: list[dict], reports: dict) -> float:
    n = len(records)
    reported = sum(1 for r in records if reports.get(r["request_id"]))
    return reported / n if n else 0.0
```

### Step 4: alert on drift, not on a static threshold

A fixed threshold ("alert if escalation rate exceeds 15%") misses a system that's always run hot at 20% and misses a slow creeping drift that never crosses a hard line. Comparing against a rolling baseline catches both.

```python
def check_drift(today: dict, baseline: dict, z_threshold: float = 2.0) -> list[str]:
    alerts = []
    for metric in ("escalation_rate", "guard_block_rate", "avg_uncertainty"):
        mean, std = baseline[metric]["mean"], baseline[metric]["std"]
        if std == 0:
            continue
        z = (today[metric] - mean) / std
        if abs(z) >= z_threshold:
            alerts.append(f"{metric} drifted: today={today[metric]:.3f}, "
                           f"baseline={mean:.3f}±{std:.3f}, z={z:.1f}")
    return alerts
```

> **Why this step?** Reliability drift after a model or prompt change is often gradual, not a cliff — a z-score against a rolling baseline (last 14–30 days, say) catches a metric quietly moving two standard deviations off its normal range well before it becomes an obvious outage.

## Run it

A prompt change ships that slightly loosens the grounding instruction. Escalation rate and guard-block rate the next day:

```text
baseline: escalation_rate mean=0.09, std=0.015
today:    escalation_rate = 0.041

z = (0.041 - 0.09) / 0.015 = -3.3   -> alert: escalation rate dropped sharply
```

A dropping escalation rate looks like good news until you check *why*: the guard-block rate over the same window barely moved, which means the drop isn't fewer genuinely uncertain answers — it's the confidence gate letting more through unchallenged. That combination (escalation down, guard-block flat, avg_uncertainty flat or up) is the signature of a threshold or prompt regression, not a real improvement, and it's exactly the kind of spike this dashboard exists to catch before a user-reported error rate confirms it independently.

## Harden it

- **Log at the decision layer, not just the final response.** If you only log what shipped, you lose the ability to reconstruct why a given request took the path it did — the fields from [confidence-gated escalation](/learn/hallucinations/confidence-gated-escalation-impl) need to be in the record.
- **Version-tag every record.** `model_version` and `prompt_version` on every row are what let you attribute a drift alert to a specific deploy instead of guessing.
- **Keep the sampled faithfulness check's sample rate stable.** Changing it silently between periods makes the trend line uncomparable — treat it like any other pinned eval parameter.

## Extend it

- Segment metrics by risk tier from the [architecture overview](/learn/hallucinations/reliability-architecture-overview) — a drift in the high-risk tier's escalation rate matters more, and can be masked by low-risk traffic if you only look at the blended number.
- Feed confirmed regressions into the [incident response](/learn/hallucinations/incident-response-for-hallucination) process, using this dashboard as the detection trigger, not just a retrospective artifact.
- Cross-reference dashboard drift against [CI eval tracking](/learn/hallucinations/tracking-hallucination-in-ci) — a regression CI missed but production monitoring caught is the strongest argument for adding a new golden-set example that mirrors it.

**Related:** [Implementation: Confidence-Gated Escalation](/learn/hallucinations/confidence-gated-escalation-impl), [Tracking Hallucination Rate in CI](/learn/hallucinations/tracking-hallucination-in-ci), [Implementation: An Automated Fact-Checking Pipeline](/learn/hallucinations/fact-checking-pipeline-impl), [Incident Response When a Hallucination Ships](/learn/hallucinations/incident-response-for-hallucination), [Deep Dive: Latency, Cost, and Reliability Tradeoffs](/learn/hallucinations/latency-cost-reliability-tradeoffs)
