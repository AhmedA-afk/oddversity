---
title: "Walkthrough: the slow endpoint, from dashboard to diff"
phase: craft
module: debugging-unfamiliar-systems
kind: lesson
summary: A full worked example of the observe, hypothesise, bisect loop against one specific, realistic case, narrated the way you would narrate it in an interview or to a customer's engineer looking over your shoulder.
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Narrate a debugging session out loud, in the order that actually finds the cause, not the order that makes a good story afterwards.
  - Read a latency dashboard, a log line, and a query plan as three views of the same event, not three separate investigations.
  - Turn a fix into a one-line diff and a regression test in the same sitting, not as a follow-up task.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

This is the walkthrough for the case named in [The debugging loop: observe, hypothesise, bisect](/roles/forward-deployed-engineer/craft/the-debugging-loop-observe-hypothesise-bisect): a slow endpoint in a service you have never seen, worked the way Vinoo Ganesh describes it as his standard technical interview question, from monitoring to logs to profiling to a fix.

The scenario below is fictional, sized to be worked in under an hour, and structured to show the loop in the order it actually happens, including the dead ends.

## The situation

You are three weeks into an engagement with a fictional mid-size logistics company, **Halden Freight Analytics**. Their operations dashboard calls a `GET /shipments/{id}/eta` endpoint that used to return in under 200ms. This morning, their ops lead pings you: "the ETA screen is spinning again, same as last week." No ticket, no timestamp, no reproduction steps. This is the normal shape of a first report.

## Step 1: observe, and convert a vague report into a reproducible case

You do not have the ops lead's browser session, so the first move is not to open the code, it is to find the shape of the problem in data you already have access to: the request logs and whatever dashboard exists.

```bash
# grep the access log for this route over the last hour, print status and duration
grep '"GET /shipments/' access.log | awk '{print $9, $NF}' | sort -k2 -n | tail -20
```

The output shows something specific: most requests to this route complete in 150-300ms, but a cluster of requests, all for shipment ids in the 40000-45000 range, take 4 to 11 seconds. That is not "the ETA screen is slow." That is: requests for a specific band of shipment ids are slow, and everything else is fine. This single observation already rules out network, DNS, and anything global to the service, which is most of the codebase.

## Step 2: hypothesise something falsifiable

The shipment ids in the slow band are recent. A reasonable, falsifiable hypothesis: **recent shipments have more tracking events attached, and the ETA calculation does something that scales with event count, most likely an unindexed or per-row database call inside a loop.**

This is falsifiable in one step: if true, the query count in the logs for one of these slow requests should be much higher than for a fast one. If the slow requests show a normal query count but the same query is taking longer, the hypothesis is wrong and the cause is more likely a lock, a growing table without an index, or a resource contention issue outside your code entirely.

## Step 3: bisect with a profiler, not a read-through

Rather than reading the ETA handler function line by line, you attach a lightweight profiler to one slow request and one fast request and compare query counts directly.

```python
import time
import logging

logger = logging.getLogger("query_profile")

def timed_query(cursor, sql, params):
    start = time.perf_counter()
    cursor.execute(sql, params)
    result = cursor.fetchall()
    logger.info("query %.3fs: %s", time.perf_counter() - start, sql[:80])
    return result
```

Wrapping the handler's database calls with this for a single request confirms the hypothesis fast: the fast shipment id issues 3 queries. The slow one issues 214, one per tracking event, in a loop.

```python
# the actual shape of the bug, found by reading the traced call, not the whole file
def get_eta(shipment_id):
    shipment = db.get_shipment(shipment_id)
    events = db.get_events(shipment_id)          # one query, fine
    for event in events:
        carrier = db.get_carrier(event.carrier_id)  # N+1: one query per event
        ...
```

This is an N+1 query, invisible in a code review, invisible in a unit test with three fixture events, and completely obvious the moment you compare query counts on a request with 200 events against one with three.

## Step 4: the diff

The fix batches the carrier lookups into a single query instead of one per event.

```python
def get_eta(shipment_id):
    shipment = db.get_shipment(shipment_id)
    events = db.get_events(shipment_id)
    carrier_ids = {e.carrier_id for e in events}
    carriers = db.get_carriers_by_ids(carrier_ids)   # one query, not N
    carrier_by_id = {c.id: c for c in carriers}
    for event in events:
        carrier = carrier_by_id[event.carrier_id]
        ...
```

Three lines changed. The diff is small because the loop, once you have found it, is a well-understood pattern with a well-understood fix. Almost all of the actual work was in steps one through three.

## Step 5: verify, and pin it with a test

Before calling this done, confirm the fix against the same slow shipment id from step 1 and check the query count dropped, not just that the response got faster, because a faster response for the wrong reason (a cache warming up, a coincidentally quiet database) is a trap.

```python
def test_eta_does_not_scale_with_event_count(db_with_many_events):
    with query_counter() as counter:
        get_eta(shipment_id="SHN-40123")  # 200+ events in the fixture
    assert counter.count < 10, f"expected a bounded query count, got {counter.count}"
```

This test is the point where the bug stops being something you fixed and starts being something the system cannot regress into again without a test failing first.

## Narrating this in an interview

Notice what did not happen: no reading the whole handler file top to bottom, no guessing based on which part of the code "felt slow", no fix attempted before the cause was confirmed. Say each step out loud, in order, as you do it. "I'm going to check the access logs before I open any code, because I want to know if this is one endpoint or everything" is a sentence an interviewer or a customer's engineer can follow and trust, and it is the actual difference between debugging and guessing with extra steps.

## Do this now

Reproduce this bug pattern yourself: build a small service with a deliberate N+1 query, seed it with a mix of low- and high-event records, and find it using only the loop above, without looking at the handler first. Time yourself. The target is not speed for its own sake, it is proof that the loop finds the bug without you needing to already know where it is.
