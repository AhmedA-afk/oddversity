---
title: "Building a DAG Executor"
track: "tools-function-calling"
status: live
summary: "A topological scheduler that runs independent tool calls in parallel and threads each node's output into the calls waiting on it."
duration: "9 min read"
---

The graph from [Chaining Calls Into a DAG](/learn/tools-function-calling/chaining-into-dag-workflows) is only a picture until something walks it. This builds the executor: topological scheduling, concurrent dispatch per layer, and outputs wired straight into the downstream calls that need them.

## What we're building

A data-enrichment workflow for a single company record: fetch the company, then fan out to three independent lookups that all need the company's data, then join their results into one enriched record.

```
fetch_company(domain)
        │
   ┌────┼────────────┐
   ▼    ▼             ▼
lookup_    lookup_     lookup_
funding    tech_stack  employee_count
   │    │             │
   └────┴──────┬──────┘
               ▼
        merge_enrichment
```

The executor needs to: run `fetch_company` first, run the three lookups concurrently once it resolves, then run `merge_enrichment` once all three of those resolve — without you hand-coding that specific shape.

## Setup

Each node is declared with its dependencies and a handler:

```python
import asyncio
import time

async def fetch_company(domain: str) -> dict:
    await asyncio.sleep(0.5)
    return {"domain": domain, "name": "Acme Robotics", "founded": 2019}

async def lookup_funding(company: dict) -> dict:
    await asyncio.sleep(1.2)
    return {"total_raised_usd": 42_000_000, "last_round": "Series B"}

async def lookup_tech_stack(company: dict) -> dict:
    await asyncio.sleep(0.8)
    return {"languages": ["Python", "Rust"], "cloud": "AWS"}

async def lookup_employee_count(company: dict) -> dict:
    await asyncio.sleep(1.0)
    return {"employees": 340}

async def merge_enrichment(company, funding, tech_stack, employee_count) -> dict:
    await asyncio.sleep(0.1)
    return {**company, "funding": funding, "tech_stack": tech_stack, "headcount": employee_count}

GRAPH = {
    "company":        {"fn": fetch_company,        "deps": [],
                        "args": lambda r: {"domain": "acme-robotics.com"}},
    "funding":        {"fn": lookup_funding,        "deps": ["company"],
                        "args": lambda r: {"company": r["company"]}},
    "tech_stack":      {"fn": lookup_tech_stack,     "deps": ["company"],
                        "args": lambda r: {"company": r["company"]}},
    "employee_count":  {"fn": lookup_employee_count, "deps": ["company"],
                        "args": lambda r: {"company": r["company"]}},
    "enriched":        {"fn": merge_enrichment,      "deps": ["company", "funding", "tech_stack", "employee_count"],
                        "args": lambda r: {"company": r["company"], "funding": r["funding"],
                                            "tech_stack": r["tech_stack"], "employee_count": r["employee_count"]}},
}
```

Each node names its dependencies by key and builds its own call arguments from a dict of already-resolved results (`r`) — that's the "thread outputs into downstream inputs" part, made explicit instead of implicit in a model's judgment.

## Build it

### Step 1 — topologically sort the graph into layers

```python
def topological_layers(graph: dict) -> list[list[str]]:
    remaining = dict(graph)
    resolved: set[str] = set()
    layers = []
    while remaining:
        layer = [name for name, node in remaining.items() if set(node["deps"]) <= resolved]
        if not layer:
            raise ValueError("cycle detected in graph — a DAG can't have one")
        layers.append(layer)
        resolved.update(layer)
        for name in layer:
            del remaining[name]
    return layers
```

> **Why this step?** A "layer" is exactly the set of nodes whose dependencies are all already satisfied — which is precisely the independence test from [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision), applied to the whole graph at once. The cycle check matters because a DAG executor walking a graph that isn't actually acyclic will hang forever with no error otherwise — `remaining` never shrinks and `layer` comes back empty.

For `GRAPH` above, this produces `[["company"], ["funding", "tech_stack", "employee_count"], ["enriched"]]` — three layers, with the middle one holding all three independent lookups.

### Step 2 — run each layer concurrently, feeding resolved results forward

```python
async def run_dag(graph: dict) -> dict:
    layers = topological_layers(graph)
    results: dict = {}
    for layer in layers:
        outputs = await asyncio.gather(*(
            graph[name]["fn"](**graph[name]["args"](results)) for name in layer
        ))
        results.update(dict(zip(layer, outputs)))
    return results
```

> **Why this step?** This reuses the exact concurrent-dispatch pattern from [Executing Parallel Calls Concurrently](/learn/tools-function-calling/executing-parallel-calls-async) — `asyncio.gather` on everything in one layer — just applied per graph layer instead of per model turn. `results` only ever contains fully-resolved values by the time a later layer's `args` function reads from it, because layers execute strictly in dependency order even though nodes within a layer run concurrently.

## Run it

```python
start = time.monotonic()
final = await run_dag(GRAPH)
print(f"{time.monotonic() - start:.1f}s")   # ~2.3s: 0.5 (company) + max(1.2, 0.8, 1.0) (layer 2) + 0.1 (merge)
print(final["enriched"])
```

Compare that to a naive serial run of the same five calls: 0.5 + 1.2 + 0.8 + 1.0 + 0.1 = 3.6 seconds. The layered executor pays 0.5 + 1.2 + 0.1 = 1.8 seconds of unavoidable sequential dependency, plus whatever the slowest node in the middle layer costs — the same "sum vs. max" win from [Executing Parallel Calls Concurrently](/learn/tools-function-calling/executing-parallel-calls-async), now automatic across an arbitrary graph instead of hand-written for one batch.

## Harden it

- **Per-node error isolation.** As written, one failing node in a layer takes the whole `gather` down via its default exception propagation. Wrap each node's call the way [Executing Parallel Calls Concurrently](/learn/tools-function-calling/executing-parallel-calls-async) does — catch, tag as an error result — and decide per node whether downstream nodes should run with a degraded input or the whole run should abort.
- **Validate the graph before running it.** `topological_layers` catches cycles, but not a node whose `deps` names a key that doesn't exist in `graph` at all — that surfaces as a confusing `KeyError` mid-run instead of a clear validation error before anything executes. Check every `deps` entry resolves to a real node up front.
- **Cap concurrency within a layer.** A layer with fifteen independent nodes fires fifteen calls at once by default — fine here, not necessarily fine against a rate-limited downstream API. Bound it with a semaphore the same way you would a flat parallel batch.

## Extend it

Everything here assumes a static graph — the same nodes and edges every run. The moment a node's *existence* depends on a runtime decision (skip `check_entitlement` if the customer is internal, say), you've moved from a pure DAG executor into the conditional-branching territory [Chaining Calls Into a DAG](/learn/tools-function-calling/chaining-into-dag-workflows) flags, and from there into the fuller tradeoff [Model-Driven vs. Code-Driven Orchestration](/learn/tools-function-calling/model-driven-vs-code-driven-orchestration) works through.

**Related:** [Chaining Calls Into a DAG](/learn/tools-function-calling/chaining-into-dag-workflows), [Executing Parallel Calls Concurrently](/learn/tools-function-calling/executing-parallel-calls-async), [Chaining Tool Calls into a DAG Workflow](/learn/tools-function-calling/chaining-tools-into-workflows), [Model-Driven vs. Code-Driven Orchestration](/learn/tools-function-calling/model-driven-vs-code-driven-orchestration)
