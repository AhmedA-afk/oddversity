---
title: "Where the Milliseconds Go"
track: "genai-app-dev"
status: live
summary: "Decompose a request into network, queue, TTFT, and generation time to see which parts you can actually change."
duration: "6 min read"
---

Once you've set a [latency budget](/learn/genai-app-dev/latency-budgets), the next question is mechanical: where does that time actually go, and which pieces of it are yours to move?

## The restaurant order

Picture placing an order at a restaurant instead of sending an API request. You tell the waiter what you want — that's your request leaving the client. The waiter walks it to the kitchen — that's the network hop. Your order sits behind three tables' worth of tickets already in the kitchen — that's the queue. The chef reads the entire order before touching a pan, because they need to know what's coming before they start — that's prefill, and it's why a longer order (a longer prompt) delays the first bite even before cooking starts. Then the kitchen sends out each dish as it's plated, one at a time, rather than holding everything until the whole meal is ready — that's generation, streamed token by token.

Time-to-first-token (TTFT) is the wait until your first dish arrives: network out, queue time, and prefill, all stacked before anything reaches your table. Total latency is TTFT plus every dish after it, arriving one by one until the meal is done.

## Walking it step by step

Take one real request and trace it:

1. **Network (client → server).** The request leaves the browser or app, crosses the internet, lands at your API route or the model provider's edge. Tens of milliseconds on a good connection, more on mobile or a bad network — you influence this only indirectly, by putting your endpoint geographically close to your users or the provider close to you.
2. **Queue.** The request waits for a worker or for provider capacity. Near-zero when load is low, and the first thing that balloons during a traffic spike or a provider incident. You influence this by not saturating your own rate limits and by having a [fallback path](/learn/genai-app-dev/implementing-failover-and-fallback-chains) for when a provider queues you behind everyone else.
3. **Prefill (part of TTFT).** The model reads your entire input — system prompt, history, retrieved context, the new message — before producing anything. This scales with input length: a 10,000-token prompt takes meaningfully longer to prefill than a 500-token one, even though neither token has streamed back yet. This is the part [prompt caching](/learn/genai-app-dev/prompt-caching) attacks directly — a cached prefix skips re-reading it.
4. **Generation.** Tokens stream out roughly one at a time. This is the part that's linear in output length: a 600-token answer takes about twice as long to finish as a 300-token one, because there is no shortcut to producing the 600th token before the 599th — each one depends on everything generated before it.

Add network, queue, prefill, and generation together and you have your total latency. TTFT is everything up through step 3; the user's felt "it's already answering" moment is the boundary between step 3 and step 4.

## The wrong intuition, corrected

The common wrong mental model is that the model "thinks for a while, then dumps the whole answer" — as if there's a single black-box delay and then everything arrives at once. That's not what's happening, and believing it leads to the wrong fix: someone who thinks latency is one lump sum tries to fix it by upgrading everything at once (bigger infra, a "faster" model in the abstract) instead of asking which specific stage is actually slow.

The correction: latency is four separable stages, two of which you barely control (network, queue) and two of which you control directly and separately (prefill, driven by input length; generation, driven by output length). A slow feature is almost always dominated by one of those last two, and the fix is different for each — trim or cache the input if prefill is the problem, ask for shorter or more structured output if generation is the problem. Treating them as one undifferentiated "model is slow" is exactly how teams end up paying for a bigger, more expensive model when the real fix was a shorter prompt.

## When the analogy breaks

The kitchen picture holds well for prefill-then-stream, and it even extends nicely to caching — a chef who's already chopped and staged the ingredients for a dish they make constantly is exactly what a cached prefix is. But it breaks in two places worth knowing about:

- **A real kitchen can parallelize across dishes** — one cook on the grill, one on salads, working simultaneously. Token generation for a single response can't: each token depends causally on every token before it, so within one response, generation is strictly sequential. What *does* parallelize is multiple *different* requests at once, which is closer to a kitchen running several orders through different stations concurrently — that's the batching and concurrency your provider handles server-side, not something a single response benefits from.
- **A restaurant course arrives complete or not at all.** A streamed LLM response doesn't wait for the "meal" to be ready — see [Streaming Responses to the UI](/learn/genai-app-dev/streaming-responses-to-the-ui) for how that changes what a user actually experiences versus what the raw total-latency number says.

**Related:** [Setting a Latency Budget](/learn/genai-app-dev/latency-budgets), [Measuring Latency: p50, p95, and TTFT](/learn/genai-app-dev/measuring-latency-p50-p95), [Prompt Caching for Speed and Cost](/learn/genai-app-dev/prompt-caching), [Streaming Responses to the UI](/learn/genai-app-dev/streaming-responses-to-the-ui)
