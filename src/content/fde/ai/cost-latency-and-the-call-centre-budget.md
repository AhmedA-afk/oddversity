---
title: "Cost, latency, and the call-centre budget"
phase: ai
module: guardrails-cost-and-choice
kind: lesson
summary: "A model choice that looks fine in a demo with ten test calls can be an unworkable cost line or an unusable latency figure at call-centre volume. Design for the volume the customer actually has, not the volume you tested against."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Explain why a single large model for every request is usually the wrong default at production volume, and what to route instead.
  - Design a tiered model strategy that matches task difficulty to model cost.
  - Identify where streaming, caching, and context management change perceived latency without changing accuracy.
artifact: A tiering design for one system from an earlier lab — which requests go to a small fast model, which escalate, and the rule that decides.
sources:
  - https://vibeengines.com/roadmap/forward-deployed-engineer
  - https://hashnode.com/blog/a-complete-2026-guide-to-the-forward-deployed-engineer
---

A demo runs ten calls and every one gets the largest, most capable model available, because ten calls cost nothing and nobody is waiting on hold. A call centre runs thousands of calls a day, every one on a metered line, with a customer who hangs up if the wait is too long. The gap between those two situations is where a technically working pilot becomes an unworkable production system, and it is entirely predictable if you design for volume from the start instead of discovering the gap in the customer's monthly invoice.

## Not every request needs the most capable model

Most customer-facing volume is not evenly hard. A call-centre or chat workload is typically dominated by a small number of common, simple intents — check an order status, reset a password, confirm a return policy — with a long tail of genuinely complex cases that need real reasoning. Sending every one of those simple, common requests to the largest available model wastes cost and latency on requests that a smaller, faster, cheaper model handles just as well.

A tiered strategy routes by difficulty:

```python
def handle_request(user_input: str) -> Response:
    intent, confidence = classify_intent(user_input, model=SMALL_FAST_MODEL)

    if intent in ROUTINE_INTENTS and confidence > ROUTING_THRESHOLD:
        return handle_routine(intent, user_input, model=SMALL_FAST_MODEL)

    return handle_with_reasoning(user_input, model=CAPABLE_MODEL)
```

The classification step itself should use the smallest, fastest model that reliably tells routine from complex — it is a triage decision, not the final answer, and it runs on every single request, so its own cost and latency compound at volume in a way the second-tier call does not. Get this router wrong in either direction and you either overpay for simple requests or under-serve complex ones with a model too small to handle them; the classification accuracy of the router is itself something to eval, the same as any other decision in this system.

## What actually drives latency, and what to do about each

**Time to first response.** For anything conversational — a chat interface, a voice call — the user experience is dominated by how long they wait before anything happens, not the total time to a complete answer. Streaming, covered with working code in the provider SDK reference, addresses this directly: the user sees words arriving within a second or two even if the full response takes several seconds to complete, which reads as fast even when the total latency is unchanged. For a voice interface specifically, this matters even more, because silence on a call reads as a dropped connection in a way that a visible "typing" indicator in chat does not.

**Context size.** Every token you put into the context window — conversation history, retrieved documents, tool results — adds to both cost and the time the model takes to process the request before it can start responding. A system that retrieves ten chunks when three would answer the question is paying a latency and cost tax for no accuracy gain; this is a direct argument for the reranking step from the retrieval lessons in this module, which lets you retrieve fewer, better chunks rather than more, mediocre ones.

**Redundant calls within a turn.** An agent loop that calls a tool, reasons, calls the same tool again with slightly different arguments because the first result was ambiguous, and repeats is paying the model-call cost and latency multiple times for one user turn. The stop-condition design from the agents lesson bounds the worst case; caching identical or near-identical tool calls within a single request bounds the common case.

**Network path, on mobile.** A WhatsApp or voice interface reaching users on inconsistent mobile networks — common in Indian deployments and in any rural or low-connectivity market — adds latency the model call itself has nothing to do with. Design for this by keeping individual messages short enough to arrive reliably on a weak connection, and by building a retry and reconnection path into the interface layer itself, not assuming the network is as reliable as the office wifi you built the pilot on.

## Caching as a cost and latency lever

Two different kinds of caching matter here, and they solve different problems. Provider-side context caching, where supported, reduces the cost and latency of reusing a long, unchanged prefix — a system prompt, a large retrieved document — across multiple calls in the same session, because the model does not reprocess the unchanged part each time. Application-level caching of full responses to identical or near-identical routine questions — "what are your business hours" — skips the model call entirely for the highest-frequency, lowest-variability requests, which is often where the real volume-driven cost lives.

## The FDE angle

A stakeholder asking about cost is usually really asking one of two different questions, and the answer differs: "can we afford this at our volume" is a tiering and caching question, answered with a design like the one above. "Will this be fast enough that people don't hang up" is a latency question, answered with streaming and context-size discipline. Confusing the two produces a design that is cheap but slow, or fast but expensive — and a call-centre deployment usually cannot tolerate either failure at real volume, which is why this design work happens before the pilot scales, not after the first month's bill or the first week of hang-up complaints arrives.

## What you should be able to do now

Given a customer-facing system's expected volume and its mix of simple versus complex requests, you should be able to sketch a tiered routing strategy, identify the two or three biggest latency contributors specific to that interface, and name which of caching, streaming, or context trimming addresses each.

Build the artifact now: take a system from an earlier lab, define the routine-versus-complex split for its request types, and write the routing rule — including what confidence threshold sends a request to the larger model, and why you chose that threshold rather than routing everything to one tier.
