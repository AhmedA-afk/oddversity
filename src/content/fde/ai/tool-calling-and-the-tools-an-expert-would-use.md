---
title: Tool calling, and the tools an expert would use
phase: ai
module: prompts-and-structure
kind: lesson
summary: "The useful question is not which tools a model can call. It is which tools the domain expert already uses to do this job, because those are the tools worth giving the model, and no others."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Define a tool schema that maps to a real action a domain expert takes, not a generic capability like "search".
  - Explain why an agent's tool set should be scoped to a task, not to everything an API happens to expose.
  - Design a tool response that gives the model enough to decide its next step without dumping raw system output into context.
artifact: A tool definition (schema plus implementation stub) for one real action in a domain you have modelled in this path, with a worked example of the model calling it correctly and one calling it incorrectly.
sources:
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
  - https://job-boards.greenhouse.io/anthropic/jobs/5302966008
---

Ask a new FDE what tools to give an agent and the first answer is usually "web search, a calculator, and access to the database". That answer describes a generic capability list, not a job. The right question is narrower: what does the person who currently does this task actually do, click by click, query by query — and which of those actions can be turned into a function the model can call.

## Tool calling, mechanically

A tool is a function description — name, parameters, a plain-language explanation of what it does and when to use it — that you hand to the model alongside the conversation. The model does not execute the function. It decides, based on the conversation, that calling a particular tool with particular arguments is the right next step, and returns that decision as structured output. Your code executes the actual function and returns the result back into the conversation, and the model continues from there. The provider SDK reference in this module has working code for both major providers.

```python
tools = [
    {
        "name": "check_supplier_lead_time",
        "description": (
            "Look up the current lead time in days for a given supplier and "
            "part number, from the procurement system. Use this before "
            "proposing any reallocation that depends on delivery timing."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "supplier_id": {"type": "string"},
                "part_number": {"type": "string"},
            },
            "required": ["supplier_id", "part_number"],
        },
    }
]
```

The model never sees your procurement database's connection string, schema, or query language. It sees a named action with a description of when to use it, and a typed set of arguments. That boundary is deliberate and it is the whole point: the model reasons about intent, your code owns execution and everything execution touches.

## The tools an expert would use, not the tools an API exposes

An enterprise system typically exposes far more surface area than any one task needs — dozens of endpoints, a general-purpose query interface, an admin console. Wiring all of it up to an agent is the wrong instinct, for three reasons: it multiplies the number of ways the agent can go wrong, it multiplies your security review surface with the customer's IT team, and it drowns the model's decision-making in irrelevant options exactly when you need it focused.

In a disruption-response system built for an automotive supply chain, the field engineers gave the model a small, specific tool set: a data layer exposing exactly the entities the task needed, a simulator the model could call to test a proposed reallocation before committing to it, and nothing that let the model touch the actual ERP write path directly. A semiconductor manufacturer's debug-triage agent was given execution environments and telemetry access scoped to the investigation task, not general access to the build system. In both cases the tool set mirrors what a competent human in that seat already reaches for — a lead-time lookup, a simulator run, a log query — not an inventory of everything the underlying platform can technically do. Anthropic's own postings for the role list "sub-agents" and scoped "agent skills" as deliverables for exactly this reason: narrow, composable tools, not one tool that does everything.

Practically, this means your first conversation about tools is not with an API document. It is with the person who does this job today: what do you check first, what do you check only if the first thing looks wrong, what would you never trust without a second source. That conversation produces your tool list.

## Designing what the tool returns

A tool that dumps a raw database row or a full API response back into the model's context is wasting the model's attention on fields it does not need and burning tokens that could hold something more useful. Shape the tool's return value the way you would shape a response for a colleague who asked you the question directly:

```python
def check_supplier_lead_time(supplier_id: str, part_number: str) -> dict:
    row = query_procurement_db(supplier_id, part_number)
    return {
        "lead_time_days": row["lead_time"],
        "as_of": row["last_updated"].isoformat(),
        "supplier_status": row["status"],  # active, on_hold, deprecated
    }
```

Three fields, each one the model will plausibly need to reason about whether this supplier is a safe choice right now — not the eleven other columns in that table. If the model later needs a field you left out, that shows up as a specific, fixable gap during the eval process, which is a far better place to discover it than in a customer's production incident.

## Errors are part of the interface

A tool call will fail — the supplier ID does not exist, the downstream system times out, permissions deny the query. Return that failure to the model as clearly as you would return success, so the model can reason about it rather than the pipeline silently breaking:

```python
{"error": "supplier_id not found", "supplier_id": "SUP-88213"}
```

An agent that receives a clear error can decide to ask the user for clarification, try an alternative, or stop and say it cannot proceed. An agent that receives a stack trace, or nothing, will either hallucinate a plausible-looking answer or hang — both worse outcomes than a clean failure message.

## What you should be able to do now

Given a workflow description like "an ops analyst checks three systems before approving a reallocation", you should be able to name the tools that mirror those three checks specifically, explain why you would not also expose the other forty endpoints those systems happen to have, and design what each tool returns so the model gets exactly what it needs to decide the next step.

Build the artifact now: pick one real action from a domain you have already modelled earlier in this path, write its tool schema and a stub implementation, and show one transcript where the model calls it correctly and one where it calls it with a plausible but wrong argument — so you have a concrete example for the eval set this feeds into.
