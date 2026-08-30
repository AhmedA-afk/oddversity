---
title: "Quiz: Async & Batching"
track: "python-data-apis"
status: live
summary: "A 6-question self-check on async/await mechanics, asyncio.gather's return order, why semaphores exist, why async doesn't speed up CPU-bound work, and diagnosing/fixing a rate-limit"
duration: "12 min read"
---

Six scenarios where the code looks fine and isn't. Work through each one, pick an answer, then read every option's feedback before moving on — the wrong answers are where the real confusions live.

## 1. What does `await` actually hand control to?

```python
import asyncio

async def fetch_price(symbol):
    print(f"starting {symbol}")
    await asyncio.sleep(1)          # <-- what happens right here?
    print(f"done {symbol}")
    return 100

async def main():
    await asyncio.gather(fetch_price("AAPL"), fetch_price("MSFT"))

asyncio.run(main())
```

When `fetch_price("AAPL")` hits `await asyncio.sleep(1)`, what does control actually pass to?

- A. The operating system's thread scheduler, which pauses the whole Python process
- B. The asyncio event loop, which is now free to run any other ready coroutine (like `fetch_price("MSFT")`) until this one's wait is over
- C. The caller of `fetch_price`, which gets the return value immediately
- D. A background thread that runs the sleep timer while the main thread blocks

<details><summary>Answer</summary>

**Correct: B.** `await` doesn't pause your program — it suspends *this coroutine* and gives the event loop a chance to run something else that's ready to make progress. That's the entire mechanism behind concurrency in asyncio: one thread, one loop, and coroutines that voluntarily yield at `await` points. Run the snippet and you'll see `starting AAPL`, `starting MSFT`, then (after ~1 second) both `done` lines — proof that MSFT started while AAPL was "waiting."

**A** is the mental model for OS-level threading, not asyncio. Nothing here touches the OS scheduler; it's all cooperative, single-threaded control flow inside the Python process. **C** confuses `await` with a plain function return — if that were true, `fetch_price` could never resume after the sleep, since the caller already moved on. **D** is a natural guess if you're picturing `setTimeout`-style timers, but `asyncio.sleep` doesn't spin up a thread — it registers a wake-up time with the same single-threaded event loop and yields back to it.

</details>

If that felt shaky, [Async Python for I/O](/learn/python-data-apis/async-python-for-io) walks through the event loop model before you touch `gather`.

## 2. What does `asyncio.gather` actually return?

```python
import asyncio

async def slow():
    await asyncio.sleep(2)
    return "slow"

async def fast():
    await asyncio.sleep(0.1)
    return "fast"

async def main():
    results = await asyncio.gather(slow(), fast())
    print(results)

asyncio.run(main())
```

What gets printed?

- A. `['slow', 'fast']` — the list matches the order the arguments were passed to `gather()`, regardless of which one finished first
- B. `['fast', 'slow']` — whichever coroutine finishes first appears first in the list
- C. Whichever one happens to finish first, non-deterministically — order isn't guaranteed
- D. A single combined value, since `gather()` merges results into one object

<details><summary>Answer</summary>

**Correct: A.** `gather()` returns a list positionally matched to the awaitables you passed it — first argument's result at index 0, second at index 1, and so on — no matter which one actually completed first under the hood. `fast()` finishes in 0.1s and `slow()` takes 2s, but the printed list is still `['slow', 'fast']` because that's the order they were passed in. This is exactly why `gather()` is the right tool when you need "call five things concurrently, then process results as a batch, matched to their inputs" — you don't have to track which result belongs to which input yourself.

**B** is a reasonable guess if you're thinking of a race, but that's not what `gather()` does — you're thinking of `asyncio.as_completed()`, which *does* yield results in completion order (as an iterator, not a list) and is the right tool when you want to react to whichever result lands first. **C** would be true if `gather()` had no ordering guarantee at all — but determinism here is the whole point; the API is designed so you never have to guess. **D** mixes up `gather()` with something like `asyncio.wait()`'s more complex return shape, or just an assumption that concurrency implies merging — it doesn't; you get one result per awaitable, same as if you'd called them one at a time in a loop.

</details>

## 3. What is a semaphore actually doing in async code?

```python
import asyncio

sem = asyncio.Semaphore(5)

async def do_request(item):
    await asyncio.sleep(0.5)          # stand-in for a real network call
    return item * 2

async def call_api(item):
    async with sem:
        return await do_request(item)

async def main(items):
    return await asyncio.gather(*(call_api(i) for i in items))

results = asyncio.run(main(range(20)))
```

All 20 `call_api` coroutines get created and handed to `gather()` at once. If you deleted the `sem` and the `async with sem:` line entirely (kept everything else), what would actually change?

- A. Nothing — the calls would still run one at a time, since `await` inside `do_request` already serializes them
- B. The requests would start retrying automatically on failure
- C. The results list would come back in a different, unpredictable order
- D. Up to all 20 `do_request` calls would be in flight at once, instead of at most 5 at a time

<details><summary>Answer</summary>

**Correct: D.** A semaphore is a counter with a limit — `async with sem` blocks a coroutine at that line until fewer than 5 others currently hold it. Remove it, and nothing stops all 20 coroutines from calling `do_request` in the same instant. That's fine against a toy `asyncio.sleep`, but against a real API it's exactly how you trip a rate limiter: you've replaced "20 requests, 5 at a time" with "20 requests, all at once." This is also the core mechanism behind [batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput) — you want concurrency, but bounded concurrency.

**A** is the mistake of thinking `await` alone serializes things — it doesn't; `await` yields control during a wait, but with no semaphore, all 20 coroutines are independently waiting on their own `asyncio.sleep`, and the event loop is free to keep them all in flight simultaneously. **B** confuses concurrency control with retry logic — a semaphore has no idea whether a call succeeded or failed; that's a separate concern (see [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries)). **C** borrows the previous question's lesson but misapplies it — `gather()`'s input-order guarantee has nothing to do with how many requests are in flight at once; removing the semaphore doesn't touch ordering at all, only concurrency.

</details>

## 4. Would wrapping a CPU-heavy loop in async make it faster?

```python
import asyncio, time

async def hash_chunk(data):
    # pretend this is expensive: hashing, regex, parsing, whatever —
    # the point is it's pure computation, no I/O anywhere in here
    total = 0
    for b in data:
        total = (total * 31 + b) % 1_000_000_007
    return total

async def main(chunks):
    start = time.perf_counter()
    results = await asyncio.gather(*(hash_chunk(c) for c in chunks))
    print(f"took {time.perf_counter() - start:.2f}s")
    return results
```

You benchmark this against a plain `for` loop calling a synchronous version of `hash_chunk` on the same chunks. What do you expect?

- A. Noticeably faster — asyncio spreads the chunks across your CPU cores
- B. Noticeably faster — each coroutine gets its own OS thread once it hits `await`
- C. About the same, maybe slightly slower — there's no I/O for any coroutine to yield during, so they still run one after another on the same thread, plus you now pay event-loop overhead
- D. Impossible to say without knowing how big each chunk is

<details><summary>Answer</summary>

**Correct: C.** `hash_chunk` never actually awaits anything meaningful — it's a tight CPU loop with no I/O. Even though it's wrapped in `async def` and scheduled through `gather()`, there's no point where it can hand control back to the event loop, because there's nothing to wait *on*. So the 20 (or however many) chunks still get hashed strictly one after another on the same single thread — you've just added the bookkeeping cost of coroutines and the event loop on top of the same sequential work. Async buys you concurrency during *waiting*; if there's no waiting, there's nothing to overlap. See [why async helps API calls](/learn/python-data-apis/why-async-for-api-calls-intuition) for the I/O-bound case where this actually pays off.

**A** is the most common version of this mistake: "concurrent" gets read as "parallel." asyncio is single-threaded cooperative multitasking — it does not use multiple CPU cores. For genuine parallel CPU work you want `multiprocessing` or `loop.run_in_executor` with a `ProcessPoolExecutor`. **B** overstates what `await` does — hitting an `await` doesn't spawn a thread; only specific integrations (like `run_in_executor`) hand work off to a thread or process pool, and this code doesn't use one. **D** sounds appropriately cautious, but it dodges the actual comparison being asked: regardless of chunk size, the *relative* result — concurrent version never beats sequential here — doesn't change, because the reason (no yield points) is structural, not a matter of scale.

</details>

## 5. Unbounded concurrency trips the rate limiter — what's the fix?

```python
import asyncio
import httpx  # pip install httpx

async def fetch(client, url):
    resp = await client.get(url)
    resp.raise_for_status()
    return resp.json()

async def main(urls):
    async with httpx.AsyncClient() as client:
        tasks = [fetch(client, url) for url in urls]
        return await asyncio.gather(*tasks)

results = asyncio.run(main(urls))  # urls has 2,000 entries
```

You run this against an API with a documented limit of 50 requests/second. Partway through the batch, responses start coming back as `429 Too Many Requests`. What's the most direct fix?

- A. Catch the `429`s and immediately retry each failed call the same way
- B. Bound concurrency with an `asyncio.Semaphore` so only N requests are in flight at once, instead of all 2,000 at the same time
- C. Replace `asyncio.gather` with `asyncio.as_completed` — it processes results as they finish, which naturally limits concurrency
- D. Lower the per-request timeout so failed calls free up a "slot" faster

<details><summary>Answer</summary>

**Correct: B.** The root cause is that `[fetch(client, url) for url in urls]` builds all 2,000 coroutines up front and `gather()` schedules every one of them essentially at once — there's nothing here capping how many hit the network simultaneously. Wrapping `fetch` in `async with sem:` (with `sem = asyncio.Semaphore(50)` or similar, tuned to sit safely under the documented limit) means at most N requests are ever in flight, and the rest wait their turn automatically. That's the direct fix for *this* failure mode — pair it with backoff-and-retry (see [rate limits and retries](/learn/python-data-apis/rate-limits-and-retries)) for the requests that still fail despite bounded concurrency, and see [concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio) for the full pattern.

**A** treats the symptom, not the cause — retrying the failed calls at the same unbounded concurrency just re-triggers the same 429s; you'd need both backoff *and* a concurrency cap, and the cap is what actually stops it from happening again. **C** is a genuine, common misconception: `as_completed()` changes how you *consume* results (as they finish, rather than all at once at the end) — it does not change how many coroutines are scheduled or running concurrently. All 2,000 tasks are still created and still hit the network at effectively the same time; you've just changed the loop that reads their results. **D** doesn't reduce how many requests go out simultaneously — it just makes the ones that do fail, fail faster, which doesn't relieve pressure on the rate limiter at all and can even mean more retries pile up sooner.

</details>

## 6. What happens when a "concurrent" call is actually synchronous?

```python
import asyncio
import requests  # note: requests is a synchronous library

async def fetch_one(url):
    return requests.get(url).json()

async def main(urls):
    return await asyncio.gather(*(fetch_one(u) for u in urls))

asyncio.run(main(urls))  # urls has 50 entries
```

What actually happens when this runs?

- A. `requests.get` blocks the single thread the event loop runs on, so all 50 "concurrent" calls actually execute one at a time, back to back
- B. asyncio detects that `requests.get` is blocking and automatically runs it in a background thread for you
- C. Python raises a `RuntimeError`, since you can't call a synchronous function from inside `async def`
- D. It works fine and all 50 calls run concurrently, since they're wrapped in `async def` functions

<details><summary>Answer</summary>

**Correct: A.** Wrapping a function in `async def` doesn't make everything inside it non-blocking — only the code between `await` points gets a chance to yield control. There's no `await` anywhere near `requests.get`, so once one `fetch_one` call starts, it holds the only thread the event loop has until `requests.get` returns, fully blocking every other "concurrent" coroutine in the meantime. Run this against 50 real URLs and you'll get the total latency of a plain sequential loop, not the overlap you were expecting — with the added confusion of code that *looks* async. This is one of the most common [API calling mistakes](/learn/python-data-apis/api-calling-common-mistakes): the fix is an async-native client (`httpx.AsyncClient`, `aiohttp`) whose `.get()` actually `await`s, or explicitly offloading the blocking call with `loop.run_in_executor(None, requests.get, url)`.

**B** describes what `run_in_executor` does when you call it explicitly — asyncio has no mechanism that inspects a function body and reroutes blocking calls on its own; you have to opt in. **C** is a reasonable guess if you think Python enforces a strict sync/async boundary, but it doesn't at the call-site level — a plain function call is a plain function call whether you're inside `async def` or not; Python has no way to know `requests.get` blocks. **D** is the exact misconception this question is testing: the presence of `async def` and `asyncio.gather()` doesn't guarantee concurrency — it only *enables* it at points where the code actually awaits something that can yield, and this code has none.

</details>

**Related:** [Async Python for I/O](/learn/python-data-apis/async-python-for-io) · [Why async for API calls — intuition](/learn/python-data-apis/why-async-for-api-calls-intuition) · [Concurrent API calls with asyncio](/learn/python-data-apis/concurrent-api-calls-with-asyncio) · [Batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput) · [Rate limits and retries](/learn/python-data-apis/rate-limits-and-retries) · [API calling — common mistakes](/learn/python-data-apis/api-calling-common-mistakes)
