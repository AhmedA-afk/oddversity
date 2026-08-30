---
title: "Designing a Handoff Payload"
track: "context-engineering"
status: live
summary: "A concrete schema for what crosses an agent-to-agent boundary, plus a worker that resumes correctly from it alone."
duration: "8 min read"
---

The previous lesson made the case for what a handoff should carry. This one builds it: a structured payload with a fixed shape, a validator that fails loudly when a required field is missing, and a worker that proves it can resume correctly from the payload alone, with no access to the agent that produced it.

## What we're building

A small, versioned handoff object — not an ad hoc dict — that an orchestrator produces and any worker can consume. We'll test it the only way that actually matters: hand a worker nothing but the payload and check whether it does the right thing.

## Setup

Plain Python, no framework — the schema matters more than the language it's written in.

```python
from dataclasses import dataclass, field

@dataclass
class Handoff:
    goal: str                # what the receiving agent must accomplish
    inputs: dict              # small parameters needed to start
    decisions: list[str]      # settled calls the receiver must not re-litigate
    artifacts: list[dict]     # pointers, never raw content: {"kind", "ref", "note"}
    next_steps: list[str]     # what "done" looks like, in order if order matters
    open_questions: list[str] = field(default_factory=list)
    schema_version: str = "1.0"
```

### Build it

#### Step 1: Define the schema as a contract, not a suggestion

```python
REQUIRED = ("goal", "inputs", "decisions", "artifacts", "next_steps")

def validate(payload: dict) -> None:
    missing = [k for k in REQUIRED if k not in payload]
    if missing:
        raise ValueError(f"handoff missing required fields: {missing}")
    for a in payload.get("artifacts", []):
        if "ref" not in a or "kind" not in a:
            raise ValueError(f"artifact missing kind/ref: {a}")
```

> **Why this step?** A schema that's just a convention gets skipped under deadline pressure. A required-field check turns "please include next steps" into a hard failure the orchestrator catches before a broken payload ever reaches a worker.

#### Step 2: Keep artifacts as pointers, not payloads

```python
handoff = Handoff(
    goal="Fix the timing-safe comparison bug and add a regression test.",
    inputs={"repo_root": "/repo", "bug_id": "SEC-114"},
    decisions=[
        "Use hmac.compare_digest, not a manual constant-time loop.",
        "Scope is login.py only; session.py was checked and is not affected.",
    ],
    artifacts=[
        {"kind": "file", "ref": "app/auth/login.py:84", "note": "vulnerable comparison"},
        {"kind": "file", "ref": "tests/test_auth.py", "note": "add regression test here"},
    ],
    next_steps=[
        "Patch login.py:84 to use hmac.compare_digest.",
        "Add a test asserting timing-safe comparison is used.",
        "Run the auth test suite and report pass/fail.",
    ],
)
```

> **Why this step?** `login.py` might be tens of thousands of characters. The worker can read it itself once it knows exactly where to look. Pasting the file into the payload would make the handoff larger than the fix it's requesting — the same logic behind [Just-in-Time Context Loading](/learn/context-engineering/just-in-time-context-loading).

#### Step 3: Serialize and hand it off

```python
import json
payload_json = json.dumps(handoff.__dict__)
print(len(payload_json), "chars")   # a few hundred, not tens of thousands
```

> **Why this step?** JSON over free text means the receiving agent's system prompt can say "you will receive a Handoff object with these exact fields" — the worker doesn't have to parse an essay to find the goal.

#### Step 4: Have a worker resume from the payload alone

```python
WORKER_SYSTEM_PROMPT = """
You are a coding worker. You receive a Handoff object (JSON) and nothing else —
no prior conversation. Do not re-derive decisions already listed under
`decisions`. Fetch any file in `artifacts` yourself before editing it. When
done, report against `next_steps` in order.
"""
```

A correctly-resuming worker reads `goal`, adopts `hmac.compare_digest` from `decisions` without re-debating it, fetches `login.py` at the pointed line rather than waiting for it to be pasted in, applies the fix, writes the test, runs the suite, and reports.

## Run it

```json
{
  "status": "done",
  "next_steps_completed": [
    "Patch login.py:84 to use hmac.compare_digest.",
    "Add a test asserting timing-safe comparison is used.",
    "Run the auth test suite and report pass/fail."
  ],
  "test_result": "12 passed, 0 failed"
}
```

The loop closes without the worker ever needing the orchestrator's original context — that's the actual test of whether the payload was complete, not whether it looked complete.

## Harden it

- **Version the schema** (`schema_version`) so an orchestrator and a worker built at different times don't silently misinterpret a field that changed shape.
- **Validate on both ends.** The orchestrator validates before sending; the worker validates on receipt, since a payload can be corrupted in serialization or truncated by an upstream token limit.
- **Cap `decisions` and `next_steps` length**, and treat overflow as a signal the task should have been split further, not as a reason to write a longer payload — the same discipline as any other line item in [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies).
- **Keep provenance in `artifacts`.** The `note` field lets a human — or another agent — auditing the trail later understand why that pointer is there, without replaying the whole investigation.

## Extend it

- Add a `constraints` field distinct from `decisions` when a handoff needs to state hard limits (deadlines, forbidden files) rather than settled calls — see the distinction drawn in [Context Handoff Between Agents](/learn/context-engineering/context-handoff-between-agents-deep).
- For a chain longer than two agents, append rather than overwrite: each agent folds its own `decisions` and `next_steps` into the payload it passes on, so a fourth agent can still see why the second agent made a call without inheriting the second agent's full transcript.
- Compress a payload that's grown too large with the technique in [Compressing Context for Handoff](/learn/context-engineering/compressing-context-for-handoff) rather than trimming fields ad hoc.

**Related:** [Context Handoff Between Agents](/learn/context-engineering/context-handoff-between-agents-deep), [Reference by Pointer, Not Value](/learn/context-engineering/reference-by-pointer-not-value), [Just-in-Time Context Loading](/learn/context-engineering/just-in-time-context-loading), [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies), [Compressing Context for Handoff](/learn/context-engineering/compressing-context-for-handoff)
