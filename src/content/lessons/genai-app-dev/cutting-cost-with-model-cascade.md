---
title: "Cutting Cost With a Model Cascade"
track: "genai-app-dev"
status: live
summary: "Walk one ticket-triage feature through a cheap-model-first cascade and the arithmetic behind the cost drop."
duration: "8 min read"
---

A model cascade is a routing decision made *after* the cheap model has already tried — not instead of routing, but on top of it. This lesson carries one feature through the whole thing: the setup, the escalation rule, the blended-cost math, and where the pattern quietly breaks if you don't watch it.

## The setup

A support product classifies every incoming ticket by urgency (`low` / `medium` / `high`) before it reaches a human queue. It's high-volume — every ticket gets classified — and most tickets are unambiguous ("my invoice is wrong" is obviously not urgent; "production is down" obviously is). A small fraction are genuinely hard to call from the text alone.

Two models, two roles:

- **`claude-haiku-4-5`** ($1.00 / $5.00 per million input/output tokens) attempts every single ticket. Fast, cheap, and correct on the easy majority.
- **`claude-opus-5`** ($5.00 / $25.00 per million input/output tokens) only sees tickets the cheap model flags as uncertain. Slower and five times the input cost, but it's only paying for the hard slice.

The structured output schema both models fill in is the same:

```python
SCHEMA = {
    "type": "object",
    "properties": {
        "urgency": {"type": "string", "enum": ["low", "medium", "high"]},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        "reasoning": {"type": "string"},
    },
    "required": ["urgency", "confidence", "reasoning"],
}
```

## Step by step

### Step 1 — every ticket goes to Haiku first

```python
import anthropic

client = anthropic.Anthropic()

def classify_cheap(ticket_text: str):
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=200,
        system="Classify this support ticket's urgency. Report your confidence honestly — "
               "if the ticket is ambiguous, say so with a low confidence score rather than guessing.",
        output_config={"format": {"type": "json_schema", "json_schema": {"name": "urgency", "schema": SCHEMA}}},
        messages=[{"role": "user", "content": ticket_text}],
    )
    import json
    return json.loads(response.content[0].text), response.usage
```

> **Why this step?** Every ticket gets a fast, cheap first pass no matter what — this is what makes a cascade different from routing-by-task alone (see [Routing: Picking a Model Per Request](/learn/genai-app-dev/model-routing-strategies)). Nothing is pre-classified as "hard" before a model actually looks at it; the model's own confidence is what decides that.

### Step 2 — define the escalation rule

```python
CONFIDENCE_THRESHOLD = 0.7

def needs_escalation(result: dict) -> bool:
    return result["confidence"] < CONFIDENCE_THRESHOLD
```

> **Why this step?** One number, one comparison — this is the entire routing decision. Everything about tuning the cascade later comes down to moving this threshold, so it needs to be a named constant you can change and measure against, not buried inline in a conditional.

### Step 3 — escalate only the uncertain slice

```python
def classify_ticket(ticket_text: str):
    cheap_result, cheap_usage = classify_cheap(ticket_text)
    if not needs_escalation(cheap_result):
        return cheap_result, "haiku", cheap_usage

    response = client.messages.create(
        model="claude-opus-5",
        max_tokens=400,
        system="A faster model was uncertain about this ticket's urgency. Look carefully and classify it.",
        output_config={"format": {"type": "json_schema", "json_schema": {"name": "urgency", "schema": SCHEMA}}},
        messages=[{"role": "user", "content": ticket_text}],
    )
    import json
    strong_result = json.loads(response.content[0].text)
    return strong_result, "opus", response.usage
```

> **Why this step?** The escalated call still costs money on top of the cheap attempt — this isn't a replacement, it's an addition for the uncertain slice. That's exactly what the blended-cost math below has to account for: you always pay Haiku's cost, and only sometimes also pay Opus's.

### Step 4 — do the blended-cost arithmetic

With a ~400-token ticket and a ~50-token structured response, Haiku's cost per ticket:

```
haiku_cost = (400/1e6)*1.00 + (50/1e6)*5.00 = 0.0004 + 0.00025 = $0.00065
```

An escalated call re-sends the ticket plus a bit more instruction (~500 tokens in) and returns a longer, more careful response (~150 tokens out) on Opus:

```
opus_cost = (500/1e6)*5.00 + (150/1e6)*25.00 = 0.0025 + 0.00375 = $0.00625
```

At a measured 20% escalation rate, the blended cost per ticket — every ticket pays the Haiku cost, and one in five also pays the Opus cost:

```
blended = haiku_cost + 0.20 * opus_cost
        = 0.00065 + 0.20 * 0.00625 = 0.00065 + 0.00125 = $0.0019
```

Against a baseline of routing every ticket straight to Opus (at the same 500-in/150-out shape, $0.00625 per ticket), the cascade lands at about 30% of that cost — a roughly 70% reduction — while still giving the genuinely hard 20% the stronger model's judgment. Illustrative numbers throughout; run this arithmetic against your own measured token counts and escalation rate before trusting a specific percentage.

### Step 5 — tune the threshold against a labeled eval set

The threshold trades escalation rate against error rate, and the only way to pick it responsibly is to run a batch of labeled tickets — tickets a human has already classified correctly — through the cascade at a few candidate thresholds. An illustrative shape of what that sweep might show:

| Threshold | Escalation rate | Error rate on final classification |
|---|---|---|
| 0.9 | 61% | Lowest — but barely cheaper than always-Opus |
| 0.7 | 20% | Low, close to the always-Opus baseline |
| 0.5 | 8% | Noticeably higher — cheap-model misses start slipping through uncaught |
| 0.3 | 2% | High — the cascade is barely different from always-Haiku |

These numbers are for illustration only, not a benchmark — build the real table from your own [eval set](/learn/genai-app-dev/evals-and-regression-testing) run against your actual traffic. The right threshold is wherever error rate stops dropping meaningfully as you raise it further — past that point you're just paying for more Opus calls without buying more correctness.

## Where it breaks (+ fix)

The cascade's entire cost saving depends on one assumption: that the cheap model's self-reported confidence is honest. It often isn't out of the box — a model can be miscalibrated, reporting high confidence on ticket types it's actually wrong about often, which means the escalation rule never fires for exactly the cases that needed it. The failure is silent: no error, no exception, just a slowly rising rate of misclassified urgent tickets that nobody notices until a real incident gets triaged as low priority.

**The fix:** calibrate the threshold against a labeled eval set rather than trusting the model's raw confidence number at face value — the Step 5 table is that calibration exercise, and it should be re-run any time the cheap model changes. If calibration alone isn't reliable enough, add a second, independent cheap signal instead of relying on self-reported confidence alone — a short rule-based check (keyword heuristics for "down," "outage," "cannot access") that also forces escalation regardless of what the model reports, giving you a floor the model's own miscalibration can't undermine.

## Takeaways

- A cascade adds an escalation cost on top of the cheap attempt — it never replaces it, so the blended-cost formula is always `cheap + escalation_rate * expensive`, not a weighted average of the two prices.
- The escalation rate is the one number that determines whether the cascade is worth building at all — measure it before committing, and re-measure after any prompt or model change on either side.
- Self-reported confidence is a starting point, not a guarantee — validate it against labeled data the same way you'd validate any other model output, per [Output Validation and Moderation](/learn/genai-app-dev/output-validation-and-moderation).

**Related:** [Routing: Picking a Model Per Request](/learn/genai-app-dev/model-routing-strategies), [Cost- and Capability-Based Routing](/learn/genai-app-dev/cost-and-capability-based-routing), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking), [Evals and Regression Testing](/learn/genai-app-dev/evals-and-regression-testing)
