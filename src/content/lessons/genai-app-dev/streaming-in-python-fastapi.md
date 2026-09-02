---
title: "Streaming From a Python FastAPI Backend"
track: "genai-app-dev"
status: live
summary: "The same SSE relay as the Next.js endpoint, built with an async generator and FastAPI's StreamingResponse."
duration: "7 min read"
---

Same feature as [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint), same event shape reaching the client — built for teams whose backend is Python instead of Node. The mechanism differs (an async generator instead of a `ReadableStream`), but the SSE framing on the wire is identical, so [Consuming a Token Stream in React](/learn/genai-app-dev/consuming-a-stream-in-react) works against either backend unmodified.

## What we're building

A `POST /chat` FastAPI route that opens an async Anthropic stream, relays deltas as SSE via an async generator, and stops consuming the upstream call the moment the client disconnects.

## Setup

```bash
pip install fastapi uvicorn anthropic
```

```python
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
import anthropic, json

app = FastAPI()
client = anthropic.AsyncAnthropic()  # reads ANTHROPIC_API_KEY from env
```

The async client matters here specifically — a sync `Anthropic()` client would block the event loop for the whole request, defeating the point of an async framework. Background on why async matters for this kind of I/O-bound call: [Async Python for I/O](/learn/python-data-apis/async-python-for-io).

## Build it

### 1. An async generator that yields SSE frames

```python
def sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"

async def event_generator(request: Request, messages: list[dict]):
    try:
        async with client.messages.stream(
            model="claude-sonnet-4-5",
            max_tokens=1024,
            messages=messages,
        ) as stream:
            async for event in stream:
                if await request.is_disconnected():
                    break  # stop pulling from upstream — see Harden it

                if event.type == "content_block_delta" and event.delta.type == "text_delta":
                    yield sse("delta", {"text": event.delta.text})

            final = await stream.get_final_message()
            yield sse("done", {"usage": final.usage.model_dump(), "stop_reason": final.stop_reason})
    except Exception as e:
        yield sse("error", {"message": str(e)})
```

> **Why this step?** `async with client.messages.stream(...)` is a context manager — breaking out of the loop early (the `is_disconnected` check) still runs `__aexit__` on the way out, which closes the underlying HTTP connection to the provider. That's the entire cancellation mechanism in Python: not an explicit `.abort()` call like the TypeScript SDK's `signal` option, but exiting the `async with` block. See [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation) for why Python cancellation is cooperative rather than immediate.

### 2. Checking for disconnect inside the loop

```python
                if await request.is_disconnected():
                    break
```

> **Why this step?** Starlette (FastAPI's ASGI base) does not automatically stop your generator when the client disconnects mid-stream — an unbounded generator that never checks will keep pulling from the upstream provider and burning tokens for a client that's already gone. `request.is_disconnected()` is an awaitable check you have to call yourself, on a schedule tight enough to matter — every loop iteration is the safe default here, since text deltas are cheap and frequent.

### 3. Wire the generator into a StreamingResponse

```python
@app.post("/chat")
async def chat(request: Request):
    body = await request.json()
    return StreamingResponse(
        event_generator(request, body["messages"]),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",  # nginx: don't buffer this response
        },
    )
```

> **Why this step?** `media_type="text/event-stream"` is what tells the client this is SSE, not a plain JSON body — the same content-type contract as the Next.js endpoint, which is exactly why either backend can serve the same React client. The headers guard against the identical proxy-buffering failure covered in [Streaming Failure Modes and How to Survive Them](/learn/genai-app-dev/streaming-failure-modes) — Python and Node hit the same infrastructure problem for the same reason.

## Run it

```bash
uvicorn main:app --reload
curl -N -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello in three words"}]}'
```

`-N` again disables curl's own buffering so you see the incremental arrival, not the final result appearing all at once.

## Harden it

- **`uvicorn` needs to run without an intervening buffering layer.** Behind gunicorn workers or a reverse proxy, confirm the deploy path doesn't collect the full response before forwarding it — the same class of failure as an nginx misconfiguration, just at a different layer of your stack.
- **Wrap the whole generator body in `try`/`except`, not just the network call.** A bug in your own delta-handling code should still reach the client as an `error` event rather than leaving the connection open with no terminal frame — the FastAPI equivalent of the `finally`-guaranteed terminal event in the Next.js version.
- **Set a hard ceiling with `asyncio.timeout()`** around the `async with` block for cases where the upstream call itself hangs rather than the client disconnecting — disconnect-checking handles one failure mode, a stuck provider connection is a different one.

## Extend it

Swap the `text_delta` branch for `input_json_delta` handling and this becomes the backend for [Streaming Structured Output Into Live Components](/learn/genai-app-dev/streaming-structured-generative-ui). For calling patterns beyond this single endpoint — retries, batching many calls, the sync-vs-async client tradeoff in more depth — see [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python).

**Related:** [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint), [Async Python for I/O](/learn/python-data-apis/async-python-for-io), [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation), [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python)
