---
title: "Tracing One Request Through Eight Hops"
track: "genai-app-dev"
status: live
summary: "Build a spatial map of a GenAI request by walking it hop by hop, from button click to rendered token."
duration: "7 min read"
---

When a "draft reply" button feels slow, or worse, silently wrong, the question is never "is the AI broken." It's "which of the eight hops between the click and the screen broke, and how." Here's the map.

## The analogy: ordering a custom cake across town

You walk into a bakery's front counter and describe the cake you want. The counter clerk doesn't bake it — they phone the order in to a head baker working out of a central kitchen across town. There's no fixed recipe; the baker improvises the cake layer by layer as they go, using their judgment at each step. Rather than wait for the whole cake to finish, a courier carries each layer back to the shop the moment it's done, and the clerk sets each one in the display window as it arrives, so you can watch the cake take shape through the glass.

That round trip has eight distinct legs, and each one can go wrong in its own way.

## The simulation, hop by hop

1. **You describe the cake (client event).** The agent clicks "Draft reply." Nothing has left the browser yet — this is just a UI event firing.
2. **Clerk phones the kitchen (client → your server).** The browser sends a request to your own API route. This hop lives entirely on your infrastructure — it's usually the fastest leg of the trip, and the one most within your control.
3. **Dispatcher writes the ticket (prompt assembly).** Your server builds the actual message array: the standing instructions (system message), this order's specifics (user message), maybe prior context. This is compute, not network — but a slow database lookup for context here shows up as latency before the "real" call even starts.
4. **Ticket goes across town (your server → provider).** Your server calls the model provider's API. This is a real network hop to infrastructure you don't control, and it's where a provider outage or an unauthenticated request fails loudly.
5. **The baker improvises (inference).** The model generates tokens one at a time, each one conditioned on everything before it. This is the one genuinely nondeterministic leg, and for most features it's the single largest chunk of the total wait — see [What Actually Happens Over the Wire](/learn/genai-app-dev/what-happens-over-the-wire) for why generation, not transit, tends to dominate.
6. **Layers arrive by courier (provider → your server, streamed).** Rather than waiting for the whole response, the provider sends tokens back as they're produced. This is the hop [streaming](/learn/genai-app-dev/streaming-responses-to-the-ui) exists to shorten perceptually — it doesn't reduce hop 5's total work, it just starts hop 7 earlier.
7. **The clerk checks each layer before displaying it (validation).** Your server inspects what's coming back — is it well-formed, does it match the expected shape — before forwarding it onward. Skip this and hop 8 renders whatever the model produced, unchecked.
8. **You watch it assemble through the glass (client render).** The browser paints tokens into the UI as they arrive. A slow or janky renderer here can make a fast backend feel sluggish anyway.

Eight legs, three of them real network hops (2, 4, 6), one of them genuine compute you own (3), one of them a check you own (7), one of them nondeterministic and out of your hands (5), and two of them pure UI (1, 8).

## The wrong intuition, and the correction

The instinctive guess is that most of the wait is **transit** — bytes crossing the network on hops 2, 4, and 6. That's the same instinct that makes people think a slow website is "the internet being slow." It's usually wrong here for the same reason it's usually wrong there: a chat completion is a few kilobytes of JSON in either direction. Even a mediocre connection moves that in a blink.

The actual bottleneck is almost always **hop 5** — the model generating tokens one at a time, autoregressively, where each new token requires a fresh forward pass conditioned on every token before it. A longer response doesn't just mean more bytes to transfer; it means more sequential generation steps, each one waiting on the last. That's why "how long is the response" predicts latency far better than "how far away is the server," and why streaming (shortening the *felt* wait on hop 6+7+8) is a bigger lever than moving your servers closer to the provider.

The second wrong intuition: once the request leaves your server on hop 4, "it's out of your hands." It isn't — hop 7 is yours, always. A validation step you skip there is a decision, not an absence of one, and it's usually the decision that turns a slow response into a wrong one reaching a user. [Antipatterns in Your First GenAI Feature](/learn/genai-app-dev/first-genai-feature-antipatterns) catalogs what happens when that hop gets skipped.

## When the analogy breaks

The cake never captures three things about the real system, and stretching it to cover them will mislead you:

- **A real provider serves thousands of "bakers" at once, on shared hardware, with your request queued and batched alongside everyone else's.** The one-baker-one-cake picture is fine for reasoning about *your* request's shape, but it says nothing about why load on the provider's side affects your latency — that's a capacity and rate-limiting problem, not a baking-speed problem. See [Rate Limits and Retry Strategies](/learn/genai-app-dev/rate-limits-and-retry-strategies) territory for that.
- **The layers aren't independent pieces you could bake in parallel — they're strictly sequential.** Token 50 genuinely cannot be produced before token 49 is decided, because it's generated conditioned on it. A cake's layers are just a metaphor for "arrives incrementally," not for "must be produced in this exact order" — though for this feature, both happen to be true.
- **There's no ingredient bill in the cake picture.** Every token on both sides of the exchange costs money, and the analogy has nothing to say about that — for the real accounting, see [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking).

Keep the eight-hop shape in your head, though — it's the map [error handling](/learn/genai-app-dev/error-handling-for-llm-calls), [latency budgets](/learn/genai-app-dev/latency-budgets-for-llm-features), and later observability lessons all point back to when they ask "which hop failed, and what does that failure look like from here."

**Related:** [The Deterministic Shell Around a Probabilistic Core](/learn/genai-app-dev/what-makes-a-feature-genai), [What Actually Happens Over the Wire](/learn/genai-app-dev/what-happens-over-the-wire), [Where the LLM Boundary Belongs in Your Architecture](/learn/genai-app-dev/where-the-llm-boundary-lives), [Latency Budgets for LLM Features](/learn/genai-app-dev/latency-budgets-for-llm-features)
