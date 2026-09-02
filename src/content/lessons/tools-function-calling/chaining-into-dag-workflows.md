---
title: "Chaining Calls Into a DAG"
track: "tools-function-calling"
status: live
summary: "Once you know which calls depend on which, the whole workflow is a graph you can schedule instead of a conversation you have to guess at."
duration: "5 min read"
---

Every dependency in a multi-step tool workflow is really just an edge. Draw all of them at once, for a workflow whose shape doesn't change run to run, and you stop having a conversation with the model about ordering and start having a schedule.

## What it is

Take every sequential and parallel call from a workflow and write them as one picture instead of a transcript: a node per tool call, an edge from A to B whenever B's arguments need a value A returns. [Sequential, Dependent Tool Use](/learn/tools-function-calling/sequential-multi-step-basics) and [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision) both describe this at the level of "the next call" — a DAG (directed acyclic graph) describes the *entire* workflow's dependency structure at once, before any call has run.

```
        fetch_ticket(id)
             │
    ┌────────┴────────┐
    ▼                  ▼
lookup_customer     check_entitlement
(ticket.customer_id) (ticket.customer_id, ticket.product)
    │                  │
    └────────┬─────────┘
             ▼
         draft_reply(ticket, customer, entitlement)
```

`lookup_customer` and `check_entitlement` both depend on `fetch_ticket`, but not on each other — that's exactly the independence test from [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision), applied to a whole graph layer at once instead of one pair of calls. `draft_reply` depends on both, so it waits for the slower of the two.

## Why fix the order at all

For a workflow whose shape is stable — same nodes, same edges, every run — letting the model rediscover this graph turn by turn is paying a real cost for no benefit: every step is a round trip re-deriving a structure it already re-derives identically every time, and every step is a fresh chance to skip a dependency, mis-order a call, or loop. If "fetch the ticket, look up the customer, check entitlement, draft a reply" never varies in shape, encoding that shape once — as an actual graph your code walks — turns four live decisions into one. [Chaining Tool Calls into a DAG Workflow](/learn/tools-function-calling/chaining-tools-into-workflows) covers this tradeoff and the static-vs-conditional split in full; this lesson is about the executor that turns the picture into behavior.

## What "chaining" buys you over ad hoc sequencing

Two things a graph gives you that a sequence of model decisions doesn't:

- **Maximal parallelism becomes visible.** In the picture above, `lookup_customer` and `check_entitlement` are both one layer of the graph — nothing stops them from running concurrently the moment `fetch_ticket` resolves. A model working turn by turn might still batch them correctly, but a graph makes it structural rather than hoped-for: your executor can walk each layer and fan out automatically, the same concurrent dispatch built in [Executing Parallel Calls Concurrently](/learn/tools-function-calling/executing-parallel-calls-async), applied per layer instead of per turn.
- **The model only sees the slice it needs.** Once the graph is fixed, the model doesn't need to see the plumbing between `fetch_ticket` and `draft_reply` — your orchestrator wires the data. The model gets invoked only at nodes that genuinely need judgment (drafting the reply, picking a tone), which is a real context saving on top of the reliability one.

## Where the model still fits in

A DAG doesn't remove the model from the workflow — it narrows *where* the model's judgment is allowed to matter. The graph decides which node runs when; the model (or a small rule) still decides what a given node's output means, or which of a small fixed set of branches to take next. That's the static-vs-conditional distinction, and it's worth internalizing before you build the executor: a DAG earns its keep by being boring and stable, not by trying to cover every branch you can imagine. If you're adding a new conditional edge every other week, that complexity belongs back in the model's live reasoning, not in a graph definition trying to keep up with it.

## Where next

[Building a DAG Executor](/learn/tools-function-calling/building-a-tool-dag-executor) is the code: a topological scheduler that runs each independent layer concurrently, threads outputs into downstream inputs, and executes exactly this kind of graph end to end.

**Related:** [Chaining Tool Calls into a DAG Workflow](/learn/tools-function-calling/chaining-tools-into-workflows), [Building a DAG Executor](/learn/tools-function-calling/building-a-tool-dag-executor), [Parallel or Sequential?](/learn/tools-function-calling/parallel-vs-sequential-decision), [Model-Driven vs. Code-Driven Orchestration](/learn/tools-function-calling/model-driven-vs-code-driven-orchestration)
