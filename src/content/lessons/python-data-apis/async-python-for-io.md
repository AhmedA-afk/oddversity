---
title: "Async Python for I/O-Bound Work"
track: "python-data-apis"
status: live
summary: "Introduces coroutines, the event loop, and async/await through runnable examples, then draws a precise line between I/O-bound work (where concurrency overlaps waiting and wins big)"
duration: "14 min read"
---

Call an LLM API 200 times in a plain `for` loop and you'll spend most of that run doing nothing at all — your CPU sits idle while each request sits on the network waiting for a response. Async Python lets one program hold all 200 requests in flight at once, turning a job that takes minutes into one that takes seconds, without adding a single extra core.

## What it is

A **coroutine** is a function, defined with `async def`, that can pause its own execution at specific points and let something else run, then resume later exactly where it left off. Calling a coroutine function doesn't run its body immediately — it creates a coroutine object, a paused computation waiting to be driven forward.

`await` is what drives it. Inside an `async def` function, `await some_coroutine()` means: run this until it either finishes or needs to wait on something (a network response, a timer) — and if it needs to wait, hand control back so something else useful can happen in the meantime.

The thing deciding what runs next is the **event loop**: a single-threaded scheduler that tracks a set of paused coroutines and resumes whichever one becomes ready. You start it with `asyncio.run(main())`, which creates the loop, drives your top-level coroutine to completion, and tears the loop down.

Put together: `async def` marks a function as pausable, `await` is where it pauses, and the event loop decides who runs next while everyone else waits. None of this involves extra threads or extra CPU cores — it's one thread, taking turns.

## The mental model

Picture one cook running a kitchen with three orders going at once. The cook doesn't chop three dishes simultaneously — there's only one pair of hands. Instead: start water boiling for the pasta (8 minutes, unattended), slide a tray into the oven (12 minutes, unattended), then turn to whatever needs hands-on attention right now. Every time a dish enters an unattended waiting phase, the cook checks what else is pending and switches to it. Nothing runs in true parallel, but almost nothing sits idle either, because waiting and working are different resources.

That's asyncio. The cook is your one Python thread. The unattended waiting is I/O — a request sitting on the network, a disk read waiting on hardware. Each `await` is the moment a task enters its waiting phase and the thread is freed to check on something else. When the response arrives, that coroutine resumes exactly where it left off, like pulling the tray out when the timer dings.

Now imagine all three orders are "multiply these numbers by hand" — pure calculation, no waiting involved. There's no unattended phase to switch during. The cook has to grind through order A, then B, then C. Juggling doesn't create more hands. That's CPU-bound work under asyncio: with no I/O wait to overlap, wrapping the code in `async`/`await` doesn't make the arithmetic faster — you still have exactly one thread doing exactly one calculation at a time. (Regular Python threads don't fix this either, thanks to the GIL — the real fix for CPU-bound work is multiprocessing, a different tool entirely.)

> Async speeds up waiting, not computing. If the slow part of your program is sitting idle for a response, async can overlap that waiting across hundreds of tasks. If the slow part is the CPU actively computing something, async does nothing for it.

## Why it works this way

The trick underneath async I/O is that "waiting on the network" doesn't require your program to do anything. When you make a request, the actual waiting happens inside the operating system: your process hands off a socket and asks the OS to say something when data arrives. Operating systems have efficient primitives for tracking thousands of pending sockets at once (Linux's epoll, macOS's kqueue, Windows' IOCP) without parking a thread on each one. Python's event loop is built directly on top of these.

So when a coroutine hits `await some_network_call()`: the request goes out, the OS starts tracking the socket, and your coroutine is suspended and set aside. The event loop is now free to resume any other coroutine that's ready. When the OS reports that a particular socket has data, the loop resumes that exact coroutine right after its `await`. Your one Python thread was never blocked — it was busy running other coroutines the whole time, and the actual waiting was outsourced to the OS.

This only works because coroutines cooperate: a coroutine gives up control at an `await` and nowhere else. If a coroutine never awaits anything, because it's doing pure computation rather than I/O, the event loop never gets a chance to switch away from it — it runs start to finish, blocking everything else, exactly like an ordinary function call would. That's the precise reason async buys you nothing for CPU-bound work: the win comes entirely from overlapping waiting time, and CPU-bound code has no waiting time to overlap — every microsecond is spent with the interpreter actively doing something, on the one thread you've got.

## A concrete example

First, I/O-bound work, using `asyncio.sleep` as a stand-in for time spent waiting on a network response:

```python
import asyncio
import time

async def fetch_page(name: str, delay: float) -> str:
    print(f"start  {name}")
    await asyncio.sleep(delay)  # stands in for waiting on a network response
    print(f"finish {name}")
    return f"{name}-result"

async def main():
    start = time.perf_counter()
    results = await asyncio.gather(
        fetch_page("A", 1.0),
        fetch_page("B", 1.0),
        fetch_page("C", 1.0),
    )
    print(results)
    print(f"elapsed: {time.perf_counter() - start:.2f}s")

asyncio.run(main())
```

Run it and all three `start` lines print immediately, then after about a second, all three `finish` lines print together. Total elapsed: roughly 1 second, not 3. `asyncio.gather` schedules all three coroutines, each hits `await asyncio.sleep(1.0)` almost right away, and the event loop spends that second running whichever of the other two is ready instead of sitting idle.

Compare that to awaiting the same `fetch_page` calls one at a time:

```python
async def main_sequential():
    start = time.perf_counter()
    await fetch_page("A", 1.0)
    await fetch_page("B", 1.0)
    await fetch_page("C", 1.0)
    print(f"elapsed: {time.perf_counter() - start:.2f}s")

asyncio.run(main_sequential())
```

Same coroutine, same `await`s — but each call is awaited to completion before the next starts, so nothing overlaps. Elapsed time: roughly 3 seconds. This is the shape of a naive loop calling an API 200 times, and closing exactly this gap for real HTTP and LLM calls is what /learn/python-data-apis/concurrent-api-calls-with-asyncio does next — swap `asyncio.sleep(delay)` for `await client.get(url)` on an async HTTP client, and the same overlap happens for real network requests.

Now watch what happens when the work inside the coroutine is CPU-bound instead:

```python
import asyncio
import time

def cpu_bound_work(n: int) -> int:
    total = 0
    for i in range(n):
        total += i * i
    return total

async def compute(name: str, n: int) -> int:
    print(f"start  {name}")
    result = cpu_bound_work(n)  # no await anywhere in here
    print(f"finish {name}")
    return result

async def main():
    start = time.perf_counter()
    await asyncio.gather(
        compute("A", 8_000_000),
        compute("B", 8_000_000),
        compute("C", 8_000_000),
    )
    print(f"elapsed: {time.perf_counter() - start:.2f}s")

asyncio.run(main())
```

Here you'll see `start A`, `finish A`, `start B`, `finish B`, `start C`, `finish C` — strict order, no interleaving. `compute` never hits an `await`, so once the event loop starts it, it runs to completion before anything else gets a turn. Wrapping this in `asyncio.gather` bought nothing over a plain sequential loop, because there's nothing here for the event loop to overlap.

## Where it shows up

- **Calling APIs at scale** — the main reason this track covers async at all. When you need results from hundreds of REST or LLM endpoints, the bottleneck is almost always network wait, not your CPU. See /learn/python-data-apis/concurrent-api-calls-with-asyncio for the real pattern and /learn/python-data-apis/rate-limits-and-retries for what has to sit alongside it once you're firing off that many requests.
- **Calling multiple downstream services at once** while building a single response — a vector store, an LLM, and a cache queried in parallel instead of one after another.
- **Web scraping and crawling**, where each fetch spends most of its time waiting on a remote server rather than doing local work.
- **Servers handling many simultaneous clients** (frameworks like FastAPI, chat and websocket servers) — one process serves many connections at once because each connection spends most of its life idle, waiting on the next message.
- **Database and disk I/O** through async-native drivers, for the same reason: the query itself is fast, the round-trip is what's slow.

It's worth being just as clear about where it doesn't show up: data cleaning with pandas, NumPy array math, JSON parsing — all CPU-bound, and none of it gets faster wrapped in `async def`. If you profile a slow pipeline and the bottleneck is computation rather than waiting, async is the wrong tool; you're looking at vectorization (/learn/python-data-apis/numpy-arrays-fundamentals) or multiprocessing instead.

## Watch out for

**Forgetting to `await` a coroutine.** `fetch_page("A", 1.0)` without `await` doesn't run anything — it creates a coroutine object and immediately discards it. Python usually warns you (`RuntimeWarning: coroutine 'fetch_page' was never awaited`), but it's easy to miss in a busy log, and the visible symptom is just: nothing happened. If a coroutine seems to silently do nothing, check for a missing `await` first.

**Blocking calls inside async functions.** `await asyncio.sleep(1)` yields control; `time.sleep(1)` does not — it blocks the entire thread, stalling every other coroutine on the same event loop. A synchronous HTTP call (`requests.get(...)`) made inside an `async def` has the same problem: it looks like it belongs there, but it stalls the whole program for its duration instead of letting other coroutines run. One blocking call is enough to silently turn all your concurrency back into sequential execution. If a library has no async version, run it in a thread instead of calling it directly: `await asyncio.to_thread(blocking_fn, ...)`.

**Calling `asyncio.run()` where a loop is already running.** Jupyter notebooks already run their own event loop, so `asyncio.run(main())` in a notebook cell raises `RuntimeError: asyncio.run() cannot be called from a running event loop`. Inside a notebook, `await main()` directly in a cell instead — the notebook's loop is already there to drive it. This trips people up on day one of using asyncio in a notebook; see /learn/python-data-apis/setting-up-venv-and-jupyter for that environment.

## Where next

This lesson covered the foundation: coroutines, `await`, the event loop, and the line between I/O-bound work (where async wins big) and CPU-bound work (where it does nothing). From here:

- /learn/python-data-apis/why-async-for-api-calls-intuition builds the intuition further before the code gets more elaborate.
- /learn/python-data-apis/concurrent-api-calls-with-asyncio replaces `asyncio.sleep` above with real HTTP calls, and shows how to bound concurrency so you don't overwhelm an API.
- /learn/python-data-apis/rate-limits-and-retries covers what has to sit alongside concurrency once you're firing off hundreds of real requests.
- /learn/python-data-apis/batching-llm-calls-for-throughput puts it all together for LLM workloads specifically — hundreds of prompts processed concurrently instead of one at a time.

**Related:** /learn/python-data-apis/concurrent-api-calls-with-asyncio · /learn/python-data-apis/why-async-for-api-calls-intuition · /learn/python-data-apis/batching-llm-calls-for-throughput · /learn/python-data-apis/rate-limits-and-retries
