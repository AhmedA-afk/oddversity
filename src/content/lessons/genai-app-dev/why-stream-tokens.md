---
title: "Why Streaming Changes Perceived Latency"
track: "genai-app-dev"
status: live
summary: "The same 4-second answer feels instant or interminable depending only on when the first word shows up."
duration: "5 min read"
---

Two users ask your assistant the same question. Both wait exactly 4.0 seconds for the full answer to finish generating. One calls the app snappy. The other calls it slow and closes the tab. The only difference between them is when the first word appeared on screen.

## The analogy: the kitchen vs. the delivery truck

Picture two restaurants. At the first, you order, and forty minutes later a truck pulls up and drops your entire meal — appetizer, entree, dessert — on the table at once, still warm because it was all cooked in parallel somewhere out of sight. At the second, a waiter brings the bread two minutes after you order, the appetizer at minute eight, the entree at minute twenty. Both restaurants took the same forty minutes to fully feed you. Only one of them felt like a meal instead of a wait.

That's the entire difference between a blocking LLM call and a streamed one. The kitchen isn't faster in the streaming version — the food takes exactly as long to cook. What changed is that you stopped staring at an empty table and started reading the menu, buttering bread, being *occupied* while the rest of the order finished.

## Walking through the same four seconds twice

Say a completion takes 4.0 seconds of total generation time, illustratively:

**Blocking.** The user hits send at t=0. Nothing changes on screen — no text, no indication of progress beyond a spinner — until t=4.0s, when the entire paragraph appears at once. The user's experience of "waiting" spans the full 4.0 seconds, because there is nothing to attend to until the very end.

**Streamed.** The user hits send at t=0. Around t=0.3s (a typical time-to-first-token for a short prompt), the first few words appear. From there, words keep arriving steadily until t=4.0s, when the last one lands. The user starts *reading* at 0.3s. By the time they've read the first sentence, the second one is already there. The perceived wait — the gap between "I asked" and "something is happening" — collapsed from 4.0 seconds to roughly 0.3.

Total wall-clock time: identical. What moved is time-to-first-token, and time-to-first-token is what a user's nervous system actually measures when it decides whether an app feels fast. This is the foundation [How Token Streaming Works End to End](/learn/genai-app-dev/streaming-response-fundamentals) builds on, and the reason [SSE vs WebSockets: Choosing a Transport](/learn/genai-app-dev/sse-vs-websockets-deep) treats "get the first chunk out fast" as the whole design brief.

## The wrong intuition, and why it's tempting

The natural assumption — including among engineers who should know better — is "we added streaming, so the app got faster." It didn't. Streaming a 4-second completion still takes 4 seconds of total generation; in fact, framing each chunk as its own event adds a small amount of real overhead, so a streamed response is very slightly *slower* end to end than a blocking one, not faster. What streaming actually buys you is a redistribution of *when* the user perceives progress, not a reduction in *how much* work happens.

This distinction matters operationally. If your team measures "did streaming help" by checking total request duration in your logs, you'll conclude it did nothing — because on that metric, it didn't. The metric that moves is time-to-first-token, and if you're not measuring that separately from total latency, you're blind to the entire benefit you shipped. See [Latency Budgets for LLM Features](/learn/genai-app-dev/latency-budgets-for-llm-features) for how to budget and measure the two numbers separately.

## When the analogy breaks

The restaurant picture holds for a human reading text on a screen, one word at a time, at reading speed. It breaks the moment the "diner" isn't a person at all.

If the consumer of your response is another service — a downstream job that parses the completion as JSON and writes it to a database — there is no one "reading along" to benefit from early words. That service needs the *whole* answer before it can do anything useful with it, so streaming buys it nothing but complexity: it still has to buffer every chunk and wait for the terminal event before parsing, exactly as if the response had arrived all at once. This is precisely why [structured output](/learn/genai-app-dev/structured-output-in-apps) generation is a special case — you can't act on a half-finished JSON object the way you can read a half-finished sentence, until you adopt the tolerant-parsing techniques in [Streaming Structured Output Into Live Components](/learn/genai-app-dev/streaming-structured-generative-ui).

The other place the analogy strains: kitchen courses have no real dependency on each other, but token generation is strictly sequential and can stall. A course that's late is just late; a token stream that stalls mid-sentence because of a network hiccup or an idle-timeout drop looks, to the user, exactly like the meal never showing up at all — worse than blocking, because now they've been reading a sentence that never finishes. [Streaming Failure Modes and How to Survive Them](/learn/genai-app-dev/streaming-failure-modes) catalogs exactly this failure and how to guard against it before it reaches a user.

**Related:** [How Token Streaming Works End to End](/learn/genai-app-dev/streaming-response-fundamentals), [Latency Budgets for LLM Features](/learn/genai-app-dev/latency-budgets-for-llm-features), [Streaming Failure Modes and How to Survive Them](/learn/genai-app-dev/streaming-failure-modes)
