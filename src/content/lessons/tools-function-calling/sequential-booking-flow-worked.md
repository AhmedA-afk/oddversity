---
title: "A Sequential Booking Flow"
track: "tools-function-calling"
status: live
summary: "Trace a four-step flight-booking chain end to end and see exactly where the model, not your code, decides what happens next."
duration: "7 min read"
---

Four tool calls, one confirmation email, and not one line of orchestration code deciding what order they run in. This traces a complete dependent chain from user request to final answer, the way it actually looks over the wire.

## The setup

Four tools are declared for this conversation:

```json
[
  {"name": "search_flights", "description": "Search available flights between two airports on a given date",
   "input_schema": {"type": "object",
     "properties": {"origin": {"type": "string"}, "destination": {"type": "string"}, "date": {"type": "string"}},
     "required": ["origin", "destination", "date"]}},
  {"name": "book_flight", "description": "Book a specific flight by its flight_id",
   "input_schema": {"type": "object",
     "properties": {"flight_id": {"type": "string"}, "passenger_name": {"type": "string"}},
     "required": ["flight_id", "passenger_name"]}},
  {"name": "send_confirmation", "description": "Email a booking confirmation for a completed reservation",
   "input_schema": {"type": "object",
     "properties": {"booking_id": {"type": "string"}, "email": {"type": "string"}},
     "required": ["booking_id", "email"]}}
]
```

User message:

```text
Book me the cheapest flight from Austin to Chicago on Sept 12. Passenger name
is Alex Rivera, confirm to alex@example.com.
```

Nothing in this message names a flight ID or a booking ID — those don't exist yet. The model has to discover them, in order, through the chain.

## Step by step

### Step 1 — the model calls `search_flights`

```json
{"type": "tool_use", "id": "call_1", "name": "search_flights",
 "input": {"origin": "AUS", "destination": "ORD", "date": "2026-09-12"}}
```

> **Why this step?** This is the only call the model can write from the user message alone — origin, destination, and date are all given directly. "Cheapest" isn't resolvable yet because no prices exist in context until this call returns.

Tool result:

```json
[
  {"flight_id": "fl_2291", "carrier": "SkyLine", "depart": "08:10", "price_usd": 214},
  {"flight_id": "fl_2308", "carrier": "AeroWest", "depart": "13:45", "price_usd": 189},
  {"flight_id": "fl_2340", "carrier": "SkyLine", "depart": "19:30", "price_usd": 231}
]
```

### Step 2 — the model picks the cheapest and calls `book_flight`

```json
{"type": "tool_use", "id": "call_2", "name": "book_flight",
 "input": {"flight_id": "fl_2308", "passenger_name": "Alex Rivera"}}
```

> **Why this step?** `fl_2308` at $189 is the cheapest of the three — the model did that comparison itself, reading the search result, not because your code sorted the list and handed it the winner. Nothing in the tool schema or system prompt encoded "pick the minimum price_usd" as a rule; it's an inference from the returned data against the user's word "cheapest." This is the part your code doesn't do and the DAG-executor pattern in [Building a DAG Executor](/learn/tools-function-calling/building-a-tool-dag-executor) explicitly can't do either — picking the cheapest option is a judgment call, not a fixed edge in a graph.

Tool result:

```json
{"booking_id": "bk_77410", "flight_id": "fl_2308", "status": "confirmed", "price_usd": 189}
```

### Step 3 — the model calls `send_confirmation`

```json
{"type": "tool_use", "id": "call_3", "name": "send_confirmation",
 "input": {"booking_id": "bk_77410", "email": "alex@example.com"}}
```

> **Why this step?** `booking_id` only exists as of the previous tool result. The email address was available from turn one, but the model correctly waits — sending a confirmation for a booking that doesn't exist yet isn't a real action, so there was nothing to confirm until step 2 finished. This is the dependency test from [Sequential, Dependent Tool Use](/learn/tools-function-calling/sequential-multi-step-basics) in practice: `booking_id` is a blank that only step 2 could fill.

Tool result:

```json
{"status": "sent", "message_id": "msg_10a2"}
```

### Step 4 — the model composes the final answer

```text
Booked! You're on AeroWest flight fl_2308 from Austin to Chicago on Sept 12,
departing 13:45, for $189 — the cheapest of the three options available.
Confirmation bk_77410 has been emailed to alex@example.com.
```

Four tool calls, three of them impossible to write until the one before it returned, zero of them scripted by your harness. Your code's entire job across this exchange was: run whatever tool the model asked for, next, and hand back the result — the same generic loop from [Sequential, Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use).

## Where it breaks (+fix)

**Break:** `search_flights` returns an empty list — no flights on that route and date. A model that isn't explicitly told what an empty result means may still call `book_flight` with a hallucinated `flight_id`, because the loop doesn't stop it from calling *something*.
**Fix:** make the empty case unmistakable in the tool result itself — `{"flights": [], "message": "No flights found for AUS→ORD on 2026-09-12"}` rather than a bare `[]` — and treat a downstream call referencing an ID that was never in a prior result as a signal to catch and reject in your harness, not something to trust because it's shaped like a valid `flight_id`.

**Break:** `book_flight` succeeds but `send_confirmation` fails (bad email, mail service down). The booking is real; the confirmation isn't. If your loop treats this as one failed "task," a user might retry the whole flow and get double-booked.
**Fix:** each tool call is its own unit of consequence — a failure in step 3 shouldn't imply step 2 needs redoing. Return an actionable error from `send_confirmation` (see [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries)) so the model can retry *just* the confirmation, referencing the `booking_id` it already has, instead of re-booking.

## Takeaways

- A dependent chain isn't scripted — the model decides ordering, comparison ("cheapest"), and when enough information exists to proceed, all live, from what tool results actually contain.
- Your harness's job stays constant across every step: run the call, return the result, repeat. The judgment happens entirely in the model's read of each result.
- Each step is its own point of failure with its own consequence — a downstream failure shouldn't force redoing an upstream success that already happened.

**Related:** [Sequential, Dependent Tool Use](/learn/tools-function-calling/sequential-multi-step-basics), [Sequential, Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use), [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-tool-errors-and-retries), [Building a DAG Executor](/learn/tools-function-calling/building-a-tool-dag-executor)
