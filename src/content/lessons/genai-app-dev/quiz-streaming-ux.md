---
title: "Quiz: Streaming and Real-Time UX"
track: "genai-app-dev"
status: live
summary: "Ten scenario questions on transport choice, endpoint/client wiring, partial-render safety, and abort propagation."
duration: "9 min read"
---

Ten questions, mostly scenario-based. Each one checks whether you can apply a rule from this module, not just recall its name.

## 1. Choosing a transport

Your team is building a standard chat completion feature: the user sends one message, the assistant streams back a reply, and there's no need for the client to send anything while the reply is generating. What's the right default transport?

A. WebSockets, because "real-time" features should always use a persistent bidirectional connection.
B. SSE, because the feature is a one-way push of chunks over a single request-response shape that HTTP already handles natively.
C. Polling every 500ms, since it's the simplest to reason about.
D. Raw chunked HTTP with a custom framing format, to avoid any SSE overhead.

<details><summary>Answer</summary>

**Correct: B.** [SSE vs WebSockets: Choosing a Transport](/learn/genai-app-dev/sse-vs-websockets-deep) is explicit that SSE is the default for exactly this shape — ask once, receive a stream of chunks until done — because it rides plain HTTP that proxies, load balancers, and browser tooling already understand.

**A** reaches for the more expensive option (stateful, sticky sessions, protocol upgrade) for a feature that never needs the client to send anything mid-stream — WebSockets solve a problem this feature doesn't have.

**C** is the naive baseline the same lesson calls out as the worst choice for token-level output — it adds latency or request-volume overhead with no offsetting benefit.

**D** pays real engineering cost (inventing and maintaining your own framing) to avoid SSE's minor overhead, without a stated reason that justifies it here.

</details>

## 2. What SSE gives up

A colleague argues against SSE because "it can't handle the user clicking Stop mid-generation, since the client can't send anything back on the same connection." Is this actually a blocker for a stop button?

A. Yes — without a bidirectional channel, there's no way to implement a stop button at all.
B. No — the client aborts the open SSE connection (or the underlying fetch) directly, which the server can detect and propagate as an upstream cancellation; no reply channel is needed for that.
C. Yes, but only because SSE doesn't support HTTPS.
D. No — SSE connections can't actually be closed by the client once opened.

<details><summary>Answer</summary>

**Correct: B.** [SSE vs. WebSockets for Streaming LLM Output](/learn/genai-app-dev/sse-vs-websockets) and [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation) both cover this — stopping doesn't require sending a message *on* the stream; closing the connection (via `AbortController.abort()`) is itself the signal, and the server's disconnect handler is what turns that into an upstream cancellation.

**A** overstates SSE's one-way limitation — a stop action doesn't need a reply channel, only a close signal, which SSE supports.

**C** invents an unrelated and false constraint; SSE works fine over HTTPS.

**D** is backwards — closing the connection client-side is exactly the mechanism the stop button relies on.

</details>

## 3. Diagnosing a stalled stream behind a proxy

A streaming endpoint works perfectly in local development. After deploying behind an nginx reverse proxy, the same endpoint either loads the entire response at once after a long delay, or times out on longer generations. The relay code and headers were verified against the working local version. What's the most likely cause?

A. The model itself is slower in production for no discoverable reason.
B. nginx's default `proxy_buffering` is collecting the full response before forwarding any of it, and/or an idle-connection timeout is shorter than gaps between chunks.
C. The client's `EventSource` implementation only works on `localhost`.
D. SSE requires a dedicated port that wasn't opened in production.

<details><summary>Answer</summary>

**Correct: B.** This is the exact scenario [Streaming Failure Modes and How to Survive Them](/learn/genai-app-dev/streaming-failure-modes) opens with — code that streams correctly locally (no proxy in the path) breaks once a buffering proxy or a too-short idle timeout sits in front of it in production. The fix is `proxy_buffering off` plus `X-Accel-Buffering: no`, and a heartbeat comment for the idle-timeout case.

**A** assumes a model-side cause with no evidence, when the symptom (works locally, breaks only behind the proxy) points directly at the infrastructure layer that differs between the two environments.

**C** is a fabricated constraint — `EventSource` and fetch-based streaming work identically regardless of hostname.

**D** is also fabricated — SSE runs over the same HTTP port as any other request; no dedicated port is involved.

</details>

## 4. Endpoint headers

Which response header is specifically responsible for telling nginx not to buffer a streaming response, separate from the `Content-Type` that identifies it as SSE?

A. `Cache-Control: no-cache`
B. `X-Accel-Buffering: no`
C. `Connection: keep-alive`
D. `Transfer-Encoding: chunked`

<details><summary>Answer</summary>

**Correct: B.** [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint) calls this out specifically — nginx checks `X-Accel-Buffering: no` and disables its own response buffering for that route when it sees it.

**A** is a real and useful header for a streaming response, but it controls caching behavior, not buffering.

**C** signals the connection should stay open, but doesn't by itself disable buffering — a proxy can keep a connection alive while still buffering everything sent over it.

**D** describes how the body is framed at the HTTP layer, not a buffering instruction to any specific proxy.

</details>

## 5. The terminal event

A relay endpoint forwards `content_block_delta` events as they arrive but has no `try`/`catch` around the loop. What's the concrete failure this produces on the client?

A. Nothing — the client will always know when a stream is done, since HTTP connections close automatically.
B. If an exception is thrown mid-loop, no `done` or `error` event is ever sent, so the client's read loop (or its typing indicator) waits indefinitely with no signal that anything went wrong.
C. The client automatically retries the request three times before giving up.
D. The browser displays a native "stream failed" dialog to the user.

<details><summary>Answer</summary>

**Correct: B.** [Streaming Failure Modes and How to Survive Them](/learn/genai-app-dev/streaming-failure-modes) names this directly — without a guaranteed terminal event on every code path, a mid-stream exception leaves the client with no way to distinguish "still generating" from "silently failed."

**A** is false — a closed connection with no terminal event tells the client nothing about *why* it closed or whether more was expected; the client has to infer failure, not detect it directly, which is exactly the gap the terminal event closes.

**C** invents retry behavior that isn't automatic — any retry logic has to be built explicitly by the client.

**D** invents a browser feature that doesn't exist for this case; how a failed stream is surfaced is entirely up to your application code.

</details>

## 6. Partial-render safety

A stopped assistant reply ends mid-way through a fenced markdown code block: the text has one opening ` ``` ` with no closing one. Rendered through a naive markdown library, what's the likely failure, and what's the targeted fix?

A. The renderer will automatically detect and fix the mismatched fence — no action needed.
B. The renderer may swallow everything after the open fence into one unstyled block or throw outright; the fix is a pre-render pass that counts fence occurrences and appends a closing fence if the count is odd.
C. The fix is to prevent the user from ever seeing partial output at all.
D. The fix is to switch markdown libraries, since this is a bug specific to one implementation.

<details><summary>Answer</summary>

**Correct: B.** [Stop, Regenerate, and Rendering Partial Output](/learn/genai-app-dev/stop-regenerate-and-partial-render) works through this exact scenario — an unbalanced fence breaks rendering, and a simple fence-counting pass that closes any odd-numbered fence before rendering fixes it without needing to understand markdown structure at all.

**A** is false for most lightweight markdown renderers — they render what's given, they don't validate or repair structural balance on their own.

**C** overcorrects — the whole point of streaming and of preserving stopped output is to show partial content usefully, not hide it.

**D** misattributes the cause — an unterminated fence is ambiguous markdown regardless of which library parses it; the fix belongs in a pre-render pass, not in a library swap.

</details>

## 7. Regenerate and message history

After a user clicks Regenerate on a mediocre reply, the app resends the full conversation, including the mediocre assistant turn, followed by the same original user message. What's the most likely observable problem?

A. None — resending everything is always the safest choice.
B. The model may treat its own prior (mediocre or truncated) answer as something it already said and continue or echo it rather than producing a genuinely fresh attempt.
C. The request will be rejected outright by the API for containing a duplicate user message.
D. Token usage will be identical to a normal turn, since resending history never affects billing.

<details><summary>Answer</summary>

**Correct: B.** [Stop, Regenerate, and Rendering Partial Output](/learn/genai-app-dev/stop-regenerate-and-partial-render) shows this precisely — leaving the stale assistant turn in context before regenerating means the model sees its own broken or mediocre answer as prior conversation and can continue from it instead of starting over. The fix is to splice that turn out before resending.

**A** is the misconception the lesson corrects — resending everything unmodified reintroduces the exact content regenerate is supposed to replace.

**C** invents a validation rule that doesn't exist — duplicate-looking user turns aren't rejected by the API.

**D** is false — every extra turn included in the request, including a stale one, adds to input token count and cost.

</details>

## 8. Client-side double-submit

A chat input disables itself inside the `.then()`/`await` continuation of the send request, after the network call has already started. A fast typist manages to submit the same message twice. What's the underlying cause?

A. React always processes clicks out of order.
B. The disabling guard is set after an asynchronous gap, leaving a window between the click and the input actually becoming disabled where a second click can still slip through.
C. The network itself duplicated the request.
D. This can only happen if `onClick` is bound twice by mistake.

<details><summary>Answer</summary>

**Correct: B.** [Chat UX That Doesn't Feel Broken](/learn/genai-app-dev/chat-ux-that-doesnt-feel-broken) walks through exactly this race — a guard that updates only after an `await` leaves a real window open, and the fix is a synchronous guard (a ref, checked and set instantly on click) rather than a state update that lands after the network call has already started.

**A** misdiagnoses the cause as a general React ordering issue rather than the specific timing gap between the click and the guard taking effect.

**C** blames the network for a client-side logic gap — nothing about this scenario requires the network to misbehave.

**D** proposes a possible but different bug; the scenario as described happens even with a correctly single-bound handler, purely from the async timing gap.

</details>

## 9. Abort propagation across two hops

A Next.js streaming route correctly relays chunks, but a user closing the tab mid-generation doesn't stop the upstream provider call — usage logs show tokens generated well after the client disconnected. The route already reads `req.signal`. What's the most likely missing piece?

A. `req.signal`'s abort event is never forwarded into the provider SDK call's own `signal` option — listening for the disconnect isn't the same as acting on it.
B. Next.js doesn't support `AbortController` at all.
C. The provider API has no way to be cancelled once a request starts, regardless of what the client does.
D. This is expected and unavoidable behavior for all streaming endpoints.

<details><summary>Answer</summary>

**Correct: A.** [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation) is built around exactly this gap — detecting a disconnect (`req.signal` firing) and *acting* on it (forwarding that into the provider call's `signal` option) are two separate steps, and skipping the second leaves the upstream call running even though the disconnect was technically observed.

**B** is false — `AbortController`/`AbortSignal` are standard and supported; the scenario already shows `req.signal` being read.

**C** is false — the provider SDK's per-request `signal` option exists specifically to allow cancelling an in-flight streaming call.

**D** treats a fixable wiring gap as an inherent limitation, which is the exact misconception this module corrects — the lesson exists because this is avoidable, not because it's inevitable.

</details>

## 10. Multimodal message shape

An app needs to send the same 4MB reference diagram to the model across roughly fifteen separate follow-up questions in one session. Which source shape minimizes redundant cost across those fifteen calls?

A. Inline base64 on every call, since it's the simplest to implement.
B. A file reference — upload the image once, then pass its `file_id` on each of the fifteen calls instead of re-sending the bytes.
C. A hosted URL, even if the image isn't actually hosted anywhere publicly reachable.
D. It doesn't matter — all three shapes cost the same regardless of how many times the asset is referenced.

<details><summary>Answer</summary>

**Correct: B.** [Accepting Multimodal Input: Images, Audio, Files](/learn/genai-app-dev/multimodal-input-images-audio-files) frames the decision exactly this way — the question that matters is how many times an asset will be sent, and a file reference is the shape built for "reused across many requests," trading one upload for zero marginal resend cost afterward.

**A** repeats the ~33% base64 inflation and the full transfer cost on every one of the fifteen calls — the most expensive option for a reused asset.

**C** requires the image to actually be hosted and reachable by the model's fetcher; inventing a URL for an asset that isn't hosted anywhere doesn't make this option viable.

**D** is the misconception the lesson is built to correct — the three shapes have genuinely different cost profiles, and that difference is driven specifically by how many times the same asset gets referenced.

</details>

## If a question tripped you up, go here first

- **Missed Q1 or Q2** (transport choice): [SSE vs WebSockets: Choosing a Transport](/learn/genai-app-dev/sse-vs-websockets-deep), [SSE vs. WebSockets for Streaming LLM Output](/learn/genai-app-dev/sse-vs-websockets).
- **Missed Q3 or Q4** (infrastructure, proxy buffering): [Streaming Failure Modes and How to Survive Them](/learn/genai-app-dev/streaming-failure-modes), [A Streaming SSE Endpoint in Next.js](/learn/genai-app-dev/streaming-sse-nextjs-endpoint).
- **Missed Q5** (terminal events): [Streaming Failure Modes and How to Survive Them](/learn/genai-app-dev/streaming-failure-modes).
- **Missed Q6 or Q7** (partial rendering, regenerate): [Stop, Regenerate, and Rendering Partial Output](/learn/genai-app-dev/stop-regenerate-and-partial-render).
- **Missed Q8** (chat UX race conditions): [Chat UX That Doesn't Feel Broken](/learn/genai-app-dev/chat-ux-that-doesnt-feel-broken).
- **Missed Q9** (abort propagation): [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation).
- **Missed Q10** (multimodal message shape): [Accepting Multimodal Input: Images, Audio, Files](/learn/genai-app-dev/multimodal-input-images-audio-files).

If all ten felt clear, you have the full arc this module builds: get tokens to the screen fast, keep the connection honest when it breaks, and give the user a surface that survives both the happy path and the interrupt.

**Related:** [Streaming and Chat UX Cheatsheet](/learn/genai-app-dev/streaming-ux-cheatsheet), [How Token Streaming Works End to End](/learn/genai-app-dev/streaming-response-fundamentals), [Backpressure, Cancellation, and Abort Propagation](/learn/genai-app-dev/backpressure-and-cancellation), [Streaming Failure Modes and How to Survive Them](/learn/genai-app-dev/streaming-failure-modes)
