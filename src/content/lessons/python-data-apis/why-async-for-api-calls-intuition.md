---
title: "Why Concurrency Speeds Up API Calls"
track: "python-data-apis"
status: live
summary: "Intuition-building lesson using the waiter/kitchen analogy to explain why concurrency collapses wall-clock time for API calls, with a step-by-step mental simulation, worked arithme"
duration: "14 min read"
---

A waiter who stands at one table until the food arrives can serve maybe ten customers a night. A waiter who takes an order, walks off, takes another order, and comes back only when a dish is ready can serve fifty. The kitchen didn't get faster. The waiter just stopped wasting time standing still.

## The waiter analogy, mapped to code

In a restaurant, three things happen for each table:

1. **Take the order** — fast, a few seconds, the waiter is actively working.
2. **The kitchen cooks** — slow, minutes, the waiter is *not* needed for this part.
3. **Deliver the food** — fast again, the waiter is actively working.

The bad waiter treats step 2 as if it required their attention. They plant themselves by the kitchen door and wait. Every other table sits ignored the whole time, even though there's nothing the waiter could do to make the food cook faster by standing there.

The good waiter treats step 2 as dead time they can spend elsewhere. Order at table 1, straight to table 2, order there, straight to table 3 — and by the time they've worked the room, table 1's food is probably ready.

Now map that onto an API call:

| Restaurant | Code |
|---|---|
| Take the order | Build the request (construct the payload, serialize JSON) |
| Kitchen cooks | Network round-trip + server processing — you are **waiting**, not computing |
| Deliver the food | Receive the response, parse it |
| One waiter | One thread running your Python program |
| Standing at the kitchen door | A blocking call like `requests.get()` or `time.sleep()` |
| Working the room while food cooks | `await` on an async call, letting the event loop run something else |

The part that takes 200ms in a typical API call is almost never your CPU computing something — it's your process sitting idle, waiting for bytes to come back over the network. That idle time is exactly the "kitchen cooking" phase. Concurrency doesn't make the kitchen (the API server) cook faster. It stops your program from standing at the door doing nothing while it could be starting the next order.

## Walk the simulation, step by step

Three calls, each taking 200ms to get a response. Watch the clock.

**Sequential — the waiter stands and waits:**

```
t=0ms     send call 1  →  wait...
t=200ms   call 1 returns  →  send call 2  →  wait...
t=400ms   call 2 returns  →  send call 3  →  wait...
t=600ms   call 3 returns. Done.
```

Three calls, 600ms. Nothing overlapped — each call's wait time is fully serialized after the previous one.

**Concurrent — the waiter fires all three orders and watches for whichever comes back:**

```
t=0ms     send call 1, send call 2, send call 3  (all in flight now)
t=200ms   call 1, call 2, and call 3 all return, roughly together. Done.
```

Three calls, ~200ms. The *waiting* for all three overlapped, because waiting doesn't require your CPU to do anything — it's idle time, and idle time stacks for free.

This is the whole trick. There's no magic acceleration of any individual call. Call 1 still takes 200ms door-to-door. What changed is that calls 2 and 3 didn't have to wait for call 1's 200ms to *start their own* 200ms.

## Put the numbers on it

Scale that up to 100 calls, each 200ms, and the difference stops being academic.

**Sequential:** 100 calls × 200ms each = 20,000ms = **20 seconds**, no matter what you do to the code around it, because each call's wait is stacked on top of the last one's.

```python
import time

def fetch_sync(i):
    time.sleep(0.2)  # stand-in for "waiting on the network"
    return {"id": i, "status": "ok"}

start = time.perf_counter()
results = [fetch_sync(i) for i in range(100)]
elapsed = time.perf_counter() - start
print(f"{elapsed:.2f}s for {len(results)} calls")
# 20.0x s
```

**Concurrent:** fire all 100 off close together and let their 200ms waits overlap. The wall-clock time approaches the time of *one* call plus some small scheduling overhead — not the sum of all of them.

```python
import asyncio
import time

async def fetch_async(i):
    await asyncio.sleep(0.2)  # the waiter walks off while this "cooks"
    return {"id": i, "status": "ok"}

async def main():
    start = time.perf_counter()
    results = await asyncio.gather(*(fetch_async(i) for i in range(100)))
    elapsed = time.perf_counter() - start
    print(f"{elapsed:.2f}s for {len(results)} calls")
    print(results[0], results[-1])

asyncio.run(main())
# well under 2s for 100 calls
# {'id': 0, ...} {'id': 99, ...}   <- order preserved, first-in first-out
```

Same 100 calls, same 200ms each, roughly **ten times less wall-clock time** — because the 20 seconds of sequential code was never 20 seconds of *work*. It was 200ms of work repeated 100 times with 19.8 seconds of pure idle waiting stacked in between. Concurrency collapses the idle part; it can't touch the 200ms part.

Notice the last line of output: `results[0]` corresponds to call `id=0` and `results[-1]` to `id=99`, even though under the hood the responses could have arrived in any order. `asyncio.gather` hands you results back in the same order you submitted the coroutines, not completion order — you don't need to manually track which response belongs to which request.

For real HTTP calls, swap the simulated `asyncio.sleep` for an async HTTP client and cap how many are in flight at once (real servers rate-limit you, more on that below):

```python
import asyncio
import httpx

async def fetch_one(client, sem, url):
    async with sem:  # never more than max_concurrent requests in flight
        response = await client.get(url)
        response.raise_for_status()
        return response.json()

async def fetch_all(urls, max_concurrent=20):
    sem = asyncio.Semaphore(max_concurrent)
    async with httpx.AsyncClient(timeout=10.0) as client:
        tasks = [fetch_one(client, sem, url) for url in urls]
        return await asyncio.gather(*tasks)

urls = [f"https://api.example.com/items/{i}" for i in range(100)]
results = asyncio.run(fetch_all(urls))
```

This is the same shape you'll use for [calling REST APIs](/learn/python-data-apis/calling-rest-apis-with-python) or [batching LLM calls](/learn/python-data-apis/batching-llm-calls-for-throughput) at volume — see [concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio) for the full pattern including error handling per request.

## The wrong intuition — and why it's wrong

> **Wrong intuition:** "Concurrency makes each API call faster."

It doesn't. Call 1 above still takes 200ms whether it runs alone or alongside 99 others. Nothing about `await` speeds up the network, the server's processing, or the round trip. What concurrency buys you is *not paying for 100 separate 200ms waits back to back* — it lets those hundred waits happen during the same 200ms window, because waiting consumes no CPU and no CPU is the bottleneck.

This matters because it tells you exactly when concurrency will and won't help: it helps when the slow part is *waiting*, and does nothing when the slow part is *computing*. If a "call" actually meant 200ms of your CPU crunching numbers, running 100 of them concurrently on one thread would still take roughly 20 seconds — there'd be no idle time to overlap. The waiter can't take table 2's order while actually cooking table 1's food themselves; they can only do it while food is cooking in someone else's kitchen.

Two more misconceptions worth clearing up while you're here:

- **"Firing off requests concurrently scrambles the order of my results."** It doesn't, as shown above — `asyncio.gather` preserves input order regardless of completion order. You don't need to attach IDs and re-sort unless you're using a lower-level pattern like `asyncio.as_completed`, which explicitly gives you completion order instead.
- **"Concurrency means my calls are running in parallel, using multiple CPU cores."** In plain `asyncio`, no — it's one thread, cooperatively switching between tasks at every `await` point. That's exactly why it works for I/O-bound waiting but does nothing for CPU-bound work, which is the next section.

## Where concurrency gives you nothing

Name these before you reach for `asyncio` reflexively, because each one is a case where the extra complexity buys you zero speedup:

**1. CPU-bound work.** If each "call" is actually local computation — parsing a huge JSON blob, running a model locally, a heavy pandas transform — there's no idle waiting to overlap. `asyncio` on one thread just runs them one after another with extra bookkeeping on top. You'd need multiprocessing for real parallelism here, not async.

**2. Blocking calls inside async code.** This is the trap that makes async look like it doesn't work at all:

```python
import asyncio
import time

async def fetch_blocking(i):
    time.sleep(0.2)  # blocking - freezes the whole event loop, not just this task
    return i

async def main():
    start = time.perf_counter()
    await asyncio.gather(*(fetch_blocking(i) for i in range(100)))
    print(f"{time.perf_counter() - start:.2f}s")

asyncio.run(main())
# ~20.0s - identical to the sequential version
```

`time.sleep` and libraries like plain `requests` don't yield control back to the event loop — they just block the one thread you have, so nothing else can run during the wait. You need an async-native client (`httpx.AsyncClient`, `aiohttp`) or `asyncio.sleep`, or the waiter genuinely can't walk away from the table.

**3. Sequential dependencies.** If call 2 needs the output of call 1 (a multi-step agent loop, pagination where each page's cursor comes from the last response), there's nothing to overlap — you can't take table 2's order before table 1 tells you what to cook. Concurrency parallelizes independent work, not chains.

**4. A hard rate limit that's already your bottleneck.** If an API enforces 1 request per second regardless of how many you send, firing 100 concurrently doesn't get you under 100 seconds — you're throttled at the server, and concurrency just means 99 requests are queued up waiting instead of 99 requests not yet sent. See [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) for handling this properly with backoff.

**5. Tiny N.** Two or three calls, one time, in a script — the setup cost of an event loop and async client isn't worth the code complexity to save a few hundred milliseconds. Concurrency earns its keep at volume.

## When the analogy breaks

**The kitchen has finite capacity.** A restaurant analogy suggests you could have one waiter juggle 500 tables with no downside. Real API servers can't cook 500 orders "at once" either — they have their own concurrency limits, and past a point they start returning 429s or slowing down for everyone, including you. Sending everything at once isn't free just because *your* client is idle while waiting; you can overwhelm the other side. That's why the `httpx` example above uses a `Semaphore` to cap concurrent requests rather than firing all 100 with no limit — you're deliberately not using all the concurrency you technically could, to stay a good citizen of someone else's kitchen.

**One waiter really is one thread.** Plain `asyncio` gives you *one* thread, cooperatively switching at each `await`. That's the whole reason it's free (no thread-creation overhead, no locking) and the whole reason it can't help with CPU-bound work — a single waiter, no matter how good at multitasking, cannot literally be chopping vegetables at two stations simultaneously. If your workload mixes waiting *and* real per-response computation (say, embedding each result locally), the computation part still serializes on that one thread even while the waiting part overlaps.

**Waiters aren't free.** Every concurrent request holds open a connection, a chunk of memory, a slot in whatever pool you configured. "Just fire off 10,000 concurrent requests" can exhaust your own client's file descriptors or memory before it exhausts anything on the server. Real systems cap concurrency deliberately — not just to be polite to the API, but because unbounded concurrency is a resource leak waiting to happen on your side too.

Once you've internalized what's actually overlapping and what isn't, the natural next steps are seeing [why async fits Python's I/O model](/learn/python-data-apis/async-python-for-io) in more depth and working through the hands-on patterns in [concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio).

**Related:** [async Python for I/O](/learn/python-data-apis/async-python-for-io) · [concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio) · [batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput) · [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) · [calling REST APIs with Python](/learn/python-data-apis/calling-rest-apis-with-python) · [async & batching quiz](/learn/python-data-apis/async-and-batching-quiz)
