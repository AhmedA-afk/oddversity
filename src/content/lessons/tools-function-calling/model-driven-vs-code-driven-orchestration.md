---
title: "Model-Driven vs. Code-Driven Orchestration"
track: "tools-function-calling"
status: live
summary: "Letting the model plan each step and running a fixed graph are both correct choices — for different reliability, cost, and maintenance budgets."
duration: "9 min read"
---

> This lesson goes deeper than the rest of the module. It states the tradeoff between model-driven and code-driven orchestration precisely enough to make a real call on a real system — treat it as optional depth once the surrounding lessons on sequencing, parallelism, and DAGs make sense on their own.

Every multi-step tool workflow sits somewhere on one axis: how much of "what happens next" is decided live by the model, versus fixed in advance by code you wrote and can read without running it. Neither end is more advanced than the other — they trade reliability for flexibility in opposite directions, and the right point on the axis depends on facts about your workflow, not a general preference.

## The two ends, precisely

**Model-driven** is the loop from [Sequential, Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use): call the model, run whatever it asks for, feed the result back, repeat until it stops asking. Nothing about *which* tool comes next, or whether a step even happens at all, is decided anywhere but inside the model's own generation. The workflow's shape is implicit — it exists only as whatever path the model happens to take on a given run.

**Code-driven** is the DAG executor from [Building a DAG Executor](/learn/tools-function-calling/building-a-tool-dag-executor): nodes and edges fixed in a data structure your code owns, walked by a topological scheduler, with the model invoked (if at all) only inside specific nodes for judgment calls that genuinely need it — drafting text, classifying into a small fixed set of buckets. The workflow's shape is explicit — you can read it, diff it, and unit-test it without running a model at all.

Most real systems sit somewhere between: a fixed skeleton of stages, with the model choosing which of a bounded menu of tools to call *within* a stage. That's the hybrid, and it's worth naming as its own point rather than treating it as an unstable compromise between the two ends.

## Why the tradeoff is structural, not just a style preference

The reliability difference isn't about which approach is "smarter" — it's about where non-determinism lives. A model-driven loop's plan is regenerated from scratch, informed by live results, on every single run. That's exactly what makes it able to handle a case you never wrote code for — a customer request that needs three lookups today and five tomorrow, in an order that depends on what each one returns. It's also exactly what makes two runs on functionally identical inputs able to take visibly different paths, skip a step a human reviewer would consider mandatory, or call a tool in an order that happens to work today and doesn't tomorrow under a different phrasing of the same request.

A DAG's plan is written once and executed identically every time, for every input that fits its shape. That determinism is not a side benefit — it's the entire reason to pay the cost of building the graph. You can test it, you can reason about worst-case latency and cost before running it once, and you can guarantee a compliance-relevant step (an audit log write, an entitlement check) actually happens rather than trusting the model chose to call it. What it can't do is handle a shape it wasn't built for — a genuinely novel branch shows up as an unhandled case, not a graceful adaptation.

## Stating the tradeoffs precisely

**Reliability.** Code-driven wins unambiguously for anything with a compliance, safety, or audit requirement — "this check must run before this write" is trivially true of an edge in a graph and only probabilistically true of a model's plan, no matter how well-prompted. Model-driven wins for tasks whose shape is genuinely unpredictable — the number and identity of steps depends on what earlier steps return in ways no fixed graph anticipates.

**Cost.** A model call to decide "what's next" costs tokens and latency on every step, even for a step whose next action was never actually in question. A workflow with a fixed, obvious shape — the four-step booking flow in [A Sequential Booking Flow](/learn/tools-function-calling/sequential-booking-flow-worked) minus the "which is cheapest" judgment call — pays that decision cost for zero real decision-making, every single run. Code-driven pays that cost once, at design time, not per run.

**Maintainability.** A model-driven loop's behavior lives in a prompt, which is comparatively cheap to iterate on but hard to guarantee — you can shift its typical behavior with better instructions, you can't prove it will always take a given path. A DAG's behavior lives in code, which is comparatively expensive to change (a new branch is a real code change, reviewed and tested) but easy to guarantee — the graph either has the edge you need or it doesn't, and that's checkable without running anything.

## When to graduate a proven agent flow into code

The practical move most teams actually make: start model-driven, because you don't yet know the real shape of the workflow — watch, in production or a solid eval set, which paths the model actually takes. Once one shape (or a small closed set of shapes) accounts for the overwhelming majority of runs, encode *that* shape as a DAG or a fixed skeleton, and keep the model-driven loop only as a fallback for the genuine long tail that doesn't fit. That's not a downgrade — it's converting hard-won, empirically-verified behavior into something that no longer depends on the model reliably rediscovering it every time. The signal that it's time: you're not seeing new shapes anymore, only new arguments to the same shape.

The reverse move — graduating a rigid DAG *back* toward model-driven — happens too, and it's the signal that your graph has quietly become an agent loop wearing a diagram: if you're adding a new conditional edge every other week to handle one more case, that complexity belongs in the model's live reasoning at that node, not in a graph definition racing to keep up with it. [Chaining Calls Into a DAG](/learn/tools-function-calling/chaining-into-dag-workflows) names this same failure mode from the graph-design side.

## The hybrid, concretely

A fixed skeleton with model-filled steps looks like: `intake → [model decides which of 3 verification tools to call] → decision → [model drafts response] → send`. The stage order is code-driven and non-negotiable — intake always precedes decision, send always comes last. What happens *inside* `[model decides which of 3 verification tools to call]` is model-driven, because which verification is relevant depends on what's actually in the ticket. This is usually the right default for anything with both a compliance-relevant skeleton and a genuinely variable middle — you get the guarantee that the skeleton always executes in order, and the flexibility that the middle doesn't need a new graph edge for every new verification type you add.

**Related:** [Chaining Calls Into a DAG](/learn/tools-function-calling/chaining-into-dag-workflows), [Building a DAG Executor](/learn/tools-function-calling/building-a-tool-dag-executor), [Sequential, Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use), [Chaining Tool Calls into a DAG Workflow](/learn/tools-function-calling/chaining-tools-into-workflows)
