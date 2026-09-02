---
title: "Orchestration Cheatsheet"
track: "tools-function-calling"
status: live
summary: "One page for multi-step design: the parallel-vs-sequential test, the DAG executor skeleton, the streaming-delta pattern, when to go code-driven."
duration: "5 min read"
---

The reference version of this module — pull this up when you're wiring a new multi-step tool workflow and don't want to re-derive the shape from scratch.

## Parallel or sequential — start here, then measure

The one test, from [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision):

```text
Does call B need a value that only exists because call A already ran?
  yes → sequential, B must wait for A
  no  → independent, batch A and B in one parallel turn
```

| Signal | What it means |
|---|---|
| One turn, multiple `tool_use` blocks | Model judged these calls independent |
| One `tool_use` per turn, repeated | Model is resolving real dependencies one at a time |
| One `tool_use` per turn, but the calls *look* independent | Check your prompt — a numbered-step system prompt can force false sequencing |

Fan-out-then-join is the common real shape: several calls depend on the same earlier result but not on each other (see [A Sequential Booking Flow](/learn/tools-function-calling/sequential-booking-flow-worked) and [Chaining Calls Into a DAG](/learn/tools-function-calling/chaining-into-dag-workflows)) — that's still a parallel batch, just one nested inside a chain.

## Executing a parallel batch — the skeleton

From [Executing Parallel Calls Concurrently](/learn/tools-function-calling/executing-parallel-calls-async):

```python
async def run_one(tool_call):
    try:
        result = await TOOL_REGISTRY[tool_call["name"]](**tool_call["input"])
        return {"type": "tool_result", "tool_use_id": tool_call["id"], "content": json.dumps(result)}
    except Exception as exc:
        return {"type": "tool_result", "tool_use_id": tool_call["id"],
                "content": json.dumps({"error": str(exc)}), "is_error": True}

async def execute_batch(tool_calls):
    return await asyncio.gather(*(run_one(tc) for tc in tool_calls))  # order preserved, failures isolated
```

**Start here:** every handler catches its own exceptions and returns an `is_error` result — never let one failing call abort `gather` for the rest of the batch.

## The DAG executor skeleton

From [Building a DAG Executor](/learn/tools-function-calling/building-a-tool-dag-executor):

```python
def topological_layers(graph):
    remaining, resolved, layers = dict(graph), set(), []
    while remaining:
        layer = [n for n, node in remaining.items() if set(node["deps"]) <= resolved]
        if not layer:
            raise ValueError("cycle detected")
        layers.append(layer); resolved.update(layer)
        for n in layer: del remaining[n]
    return layers

async def run_dag(graph):
    results = {}
    for layer in topological_layers(graph):
        outputs = await asyncio.gather(*(graph[n]["fn"](**graph[n]["args"](results)) for n in layer))
        results.update(dict(zip(layer, outputs)))
    return results
```

Each layer is a set of nodes whose dependencies are already resolved — run every layer's nodes concurrently, layers themselves strictly in order.

| Use a DAG when | Stay model-driven when |
|---|---|
| The workflow's shape is stable, same nodes and edges every run | The number and identity of steps genuinely varies with what earlier results return |
| A step must provably always run (audit log, entitlement check) | No step in the workflow needs a guarantee, only a good result |
| You're adding a conditional branch every other week — stop, this graph wants to be an agent loop | You're seeing the same shape converge repeatedly across many real runs — stop, this loop wants to be a graph |

## Streamed argument deltas — the accumulation pattern

From [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls-concept) and [Parsing Streamed Argument Deltas](/learn/tools-function-calling/parsing-streamed-tool-call-deltas):

```text
per tool-call INDEX (never assume ordering, batches interleave by index):
  on each delta  → append to buffer[index]["json"]; buffer is a PREVIEW ONLY
  on stop/finish → json.loads(buffer[index]["json"]) with the STRICT parser
                    → only this result may reach dispatch()
```

| Provider | Delta event | Argument field | Completion signal |
|---|---|---|---|
| Anthropic | `content_block_delta`, type `input_json_delta` | `delta.partial_json` | `content_block_stop` |
| OpenAI | `delta.tool_calls[i]` | `function.arguments` (chunk), keyed by `.index` | `finish_reason == "tool_calls"` |

**Start here:** two parsers, two jobs — a lenient one for on-screen preview, a strict one that runs exactly once per call, on the explicit completion event, and whose output is the only thing that ever reaches execution.

## Model-driven vs. code-driven — the call

From [Model-Driven vs. Code-Driven Orchestration](/learn/tools-function-calling/model-driven-vs-code-driven-orchestration):

| | Model-driven loop | Code-driven DAG | Hybrid |
|---|---|---|---|
| Reliability | Probabilistic — usually right | Guaranteed — the edge either exists or it doesn't | Skeleton guaranteed, filled steps probabilistic |
| Cost per run | A model call per decision, even obvious ones | Paid once at design time | Model calls only where judgment is real |
| Handles novel shapes | Yes, natively | No — unhandled case, not graceful adaptation | Only within the model-filled steps |
| Maintenance | Cheap to iterate (prompt), hard to prove | Expensive to change (code), easy to prove | Both, split by layer |

**Start here:** model-driven for anything genuinely unpredictable in shape; graduate to a DAG once real usage converges on one dominant shape, or a step needs a hard guarantee no prompt can provide.

## Pressure points to check before shipping

- [ ] Every claimed ordering is enforced by a real data dependency or a graph edge — not by prompt wording alone.
- [ ] Parallel batches are actually dispatched with `gather`, not looped-and-awaited one at a time.
- [ ] Streamed tool calls dispatch only from the strict post-completion parse.
- [ ] Every sequential loop has a hard iteration cap that errors loudly on exhaustion.
- [ ] Large tool results are trimmed or summarized before they re-enter a growing message history.

**Related:** [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision), [Building a DAG Executor](/learn/tools-function-calling/building-a-tool-dag-executor), [Streaming Partial Tool Calls](/learn/tools-function-calling/streaming-partial-tool-calls-concept), [Model-Driven vs. Code-Driven Orchestration](/learn/tools-function-calling/model-driven-vs-code-driven-orchestration), [Orchestration Mistakes](/learn/tools-function-calling/orchestration-common-mistakes)
