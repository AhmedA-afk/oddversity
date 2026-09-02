---
title: "Parallel or Sequential?"
track: "tools-function-calling"
status: live
summary: "One test decides it: does any call need a value only a previous call's result can provide."
duration: "6 min read"
---

Two agents given the same three-tool task can end up with completely different call shapes — one batches all three in one turn, the other issues them one at a time — and only one of those shapes is actually a mistake. Here's the test that tells you which.

## What it is

The rule is a single question, applied per pair of calls: **does call B need any value that only exists because call A already ran?** If yes, B must wait for A — that's [sequential, dependent tool use](/learn/tools-function-calling/sequential-multi-step-basics). If no — B's arguments are fully determined by what was already in context before A ran — then A and B are independent, and there is no correctness reason they can't be issued in the same [parallel batch](/learn/tools-function-calling/parallel-tool-calls-mechanics).

That's the whole rule. Everything else — how many calls, what tools they use, whether they touch the same API — is a red herring. Independence is about data flow, not topic.

## The mental model

Picture each call's arguments as either fully written already, or containing a blank waiting on another call. Calls with no blanks left to fill can all fire the instant the model decides to make them, in whatever order, at the same time. A call with a blank has to wait — not because of a rule you impose, but because there's genuinely nothing to put in that slot yet.

`get_weather("Tokyo")`, `get_weather("Paris")`, and `get_weather("Lima")` — three fully-written calls, zero blanks between them. Parallel. `get_user("alex")` → `get_orders(user_id=<blank, from get_user>)` — one blank, filled only once the first call returns. Sequential, by necessity, not by preference.

## Why it works this way

The model doesn't decide "should I batch these" as a separate strategic choice — it decides based on whether it has everything it needs to write each call right now. That's why the signal for which shape you'll get is visible in the request itself: a single turn with multiple `tool_use` blocks means the model judged them all independent at that point; a lone `tool_use` per turn, repeated across turns, means it's resolving dependencies one at a time (or, less happily, that something about your setup is stopping it from batching — see below).

## A concrete example (shown)

**Independent — should be one batch:**

```text
"What's the weather in Tokyo, Paris, and Lima?"
→ get_weather("Tokyo"), get_weather("Paris"), get_weather("Lima")   # one turn, three calls
```

**Dependent — must be sequential:**

```text
"Cancel my most recent order."
→ get_user("alex")                          # turn 1
→ get_orders(user_id="u_9138")              # turn 2, needs turn 1's result
→ cancel_order(order_id="o_5521")           # turn 3, needs turn 2's result
```

**Mixed — a batch nested inside a chain:**

```text
"Look up shipping and billing addresses for my last order, then email me both."
→ get_orders(user_id="u_9138")                                        # turn 1
→ get_shipping_address(order_id="o_5521"), get_billing_address(order_id="o_5521")   # turn 2, two calls, one batch — both need o_5521, neither needs the other
→ send_email(shipping=..., billing=...)                               # turn 3, needs both results from turn 2
```

The third example is the common real shape: a dependency on an *earlier* step doesn't prevent parallelism among the steps that all depend on that same earlier step but not on each other. Both address lookups need `order_id`, and neither needs the other's result.

## Where it shows up

Fan-out-then-join patterns like the mixed example above are everywhere real workloads live: gather several independent facts about one entity, then act on all of them together. It's also the shape [Building a DAG Executor](/learn/tools-function-calling/building-a-tool-dag-executor) formalizes — a layer of a dependency graph is exactly a set of nodes that have become independent of each other because their shared prerequisite already ran.

## Watch out for

- **A vague tool description forcing false sequencing.** If `get_orders`'s description doesn't make clear that it returns *all* fields needed downstream, a model may call it once, then call it again "just to be sure" before proceeding — turning one call into an accidental two-step chain. Precise descriptions (see [Writing Tool Descriptions Models Follow](/learn/tools-function-calling/writing-tool-descriptions-models-follow)) prevent self-inflicted sequencing.
- **A system prompt that narrates steps as if they're ordered when they aren't.** "First check the weather, then check the exchange rate" reads as a sequence even when the two calls have zero data dependency between them — and some models will follow that narrated order literally, serializing what could have run together. Phrase truly independent lookups as a set, not a numbered list.
- **Assuming independence without checking.** The opposite mistake — batching calls that look unrelated but secretly share state, like two calls that both write to the same record — trades a latency win for a race condition. Independence has to be true of the *data*, not just plausible from the tool names; see the hardening notes in [Executing Parallel Calls Concurrently](/learn/tools-function-calling/executing-parallel-calls-async).

**Related:** [Sequential, Dependent Tool Use](/learn/tools-function-calling/sequential-multi-step-basics), [Parallel Tool Calls](/learn/tools-function-calling/parallel-tool-calls-mechanics), [Executing Parallel Calls Concurrently](/learn/tools-function-calling/executing-parallel-calls-async), [Chaining Calls Into a DAG](/learn/tools-function-calling/chaining-into-dag-workflows)
