---
title: "Agents: loops, stop conditions, and safe fallbacks"
phase: ai
module: prompts-and-structure
kind: lesson
summary: "An agent is a loop: call the model, execute what it asks for, feed the result back, repeat. The engineering that matters is not the loop itself. It is deciding when the loop stops and what happens when it cannot finish."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Write an agent loop with an explicit maximum iteration count and a cost ceiling, not an implicit "until it's done".
  - Design at least two stop conditions beyond "the model said it's finished", and explain why each exists.
  - Design a fallback path that hands off to a human cleanly when an agent cannot converge.
artifact: An agent loop with a hard iteration cap, a cost tracker, and a fallback handoff, tested against one input you construct specifically to make it fail to converge.
---

The agent loop itself is a dozen lines of code: call the model with the conversation and the available tools, if it asks for a tool run it and append the result, if it produces a final answer stop, repeat. Every framework ships this loop. What separates a demo agent from one you can put in front of a customer is everything the naive version leaves out: what happens when it does not converge, what it costs while it tries, and who gets told when it gives up.

## The loop, made explicit

```python
def run_agent(conversation: list, tools: dict, max_iterations: int = 8) -> dict:
    for i in range(max_iterations):
        response = call_model(conversation, tools=list(tools.values()))

        if response.stop_reason == "end_turn":
            return {"status": "complete", "result": response.text, "iterations": i + 1}

        if response.stop_reason == "tool_use":
            tool_result = execute_tool(response.tool_call, tools)
            conversation.append(response.to_message())
            conversation.append(tool_result.to_message())
            continue

    return {"status": "max_iterations_exceeded", "iterations": max_iterations}
```

Write out this shape explicitly even if you are using a framework that hides it, because every decision that makes an agent safe to run in a customer's environment lives in the parts this snippet only sketches: `max_iterations`, and what `max_iterations_exceeded` actually does.

## Stop conditions beyond "the model said so"

Relying only on the model's own judgment that it is finished — its `end_turn` signal — is not enough for anything customer-facing, for the same reason you would not let a junior analyst decide unsupervised when a task is done. Build explicit stop conditions on top of it:

- **A hard iteration cap.** Every loop needs a maximum number of steps, chosen from how many steps a real task in this domain plausibly takes, not left as an unbounded `while True`. A debug-triage agent chasing one failure across a handful of tool calls might reasonably cap at eight to twelve; a supply-chain reallocation agent calling a simulator repeatedly might need more, but it still needs a number.
- **A cost ceiling.** Track cumulative token spend across the loop and stop if a single task run is burning far more than a typical case, independent of whether it has hit the iteration cap — a loop that calls an expensive tool in a tight cycle can exhaust a cost budget in far fewer iterations than the cap anticipates.
- **A repetition detector.** If the agent calls the same tool with the same arguments two or three times in a row, it is stuck, not making progress, regardless of what stop_reason the model reports.
- **A confidence or scope check.** If the model's own structured output includes a confidence field (see the previous lesson), a low-confidence "complete" answer should route to a human review path, not be treated the same as a high-confidence one.

None of these are exotic. They are the same category of defensive engineering you would apply to any retry loop against an external system, which the craft phase of this path covers in general — here the twist is that the thing you are looping against also has a cost per call and no guaranteed termination.

## Designing the fallback, not just detecting failure

Detecting that an agent has not converged is half the job. The other half is what happens next, and "throw an exception" is not an acceptable answer in front of a customer.

```python
def run_agent_with_fallback(conversation: list, tools: dict, escalate) -> dict:
    result = run_agent(conversation, tools)
    if result["status"] != "complete":
        ticket = escalate(
            conversation=conversation,
            reason=result["status"],
            partial_progress=summarise_tool_calls(conversation),
        )
        return {"status": "handed_off", "ticket_id": ticket.id}
    return result
```

The handoff should carry the partial progress the agent already made — the tools it called and what they returned — so the human reviewer is not starting from zero. An agent that fails silently and an agent that fails loudly with full context handed to a person are the same failure rate and a completely different customer experience.

## The lineage worth knowing

The pattern of small, composable agent loops with explicit handoff logic is not new engineering; it is the same shape OpenAI's internal Swarm framework formalised for the Klarna and T-Mobile engagements before it became the public Agents SDK — lightweight orchestration, explicit tool boundaries, and a defined path when an agent should stop and pass control elsewhere. The framework changed; the underlying discipline — bound the loop, watch the cost, hand off cleanly — is what an FDE actually needs to reproduce with or without a framework's help.

## The FDE angle

An agent that loops forever in a customer's environment is not a bug report, it is an incident: it is burning the customer's API budget, possibly retrying a write operation it should not repeat, and doing it unattended. The craft-phase lesson on retries and idempotency covers the general shape of this risk; agents make it sharper because the "retry" is itself a probabilistic decision made by the model, not a fixed number of attempts you chose. Whoever is on call at 2 a.m. needs a dashboard that shows iteration counts and cost per run, not just success or failure, because a stuck loop looks identical to a slow success until you look at the count.

## What you should be able to do now

Given an agent design, you should be able to name its iteration cap, its cost ceiling, and its handoff path before you demo it — and explain what happens, concretely, the first time a real input causes it to not converge.

Build the artifact now: take an agent loop from an earlier lab in this path, add a hard iteration cap, a cumulative cost tracker, and a fallback handoff function, then construct one input deliberately designed to make it loop without converging and confirm the fallback actually fires.
