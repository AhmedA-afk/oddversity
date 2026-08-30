---
title: "The Provider Landscape and Its Tradeoffs"
track: "genai-app-dev"
status: live
summary: "Provider choice is a per-feature decision across latency, price, context, tool-calling fidelity, and rate limits — not a single company-wide pick."
duration: "7 min read"
---

"Which LLM provider should we use?" is the wrong question for a production app. The right question is "which provider should handle *this* feature?" — because the answer is rarely the same for your classifier, your drafting assistant, and your vision pipeline.

## What it is

The market splits into three rough categories, and they trade off differently:

- **Hosted frontier providers** — Anthropic, OpenAI, Google, and similar. You call their API, they run the model on infrastructure you never see. You get the strongest reasoning and tool-calling behavior, first access to new capabilities, and a bill measured per token.
- **Open-weight hosts** — Together AI, Fireworks, Groq, Replicate, or your own self-hosted inference on vLLM or similar. You're running models like Llama, Mixtral, or Qwen variants, either on someone else's managed infrastructure or your own GPUs. You trade some ceiling on capability for control over cost, data residency, and fine-tuning.
- **Gateways and aggregators** — OpenRouter, a self-hosted LiteLLM proxy, or a cloud vendor's multi-model endpoint (Bedrock, Vertex AI). These sit in front of multiple providers behind one API shape and one bill, at the cost of an extra network hop and a dependency on the gateway staying up. See [Build Your Own Layer or Use a Gateway?](/learn/genai-app-dev/gateway-vs-in-app-abstraction) for when that tradeoff is worth it.

## The mental model

Stop thinking of "the provider" as a company-wide commitment and start thinking of it as a portfolio allocated per feature. A support-ticket classifier, a long-form drafting assistant, an image-captioning step, and an embeddings pipeline are four different workloads with four different ideal backends. Locking all four to one vendor because that's who you signed up with first is leaving money and latency on the table.

The axes that actually matter when you allocate:

| Axis | What to check | Why it matters |
|---|---|---|
| Latency | Time-to-first-token *and* tokens/sec once streaming starts | TTFT dominates perceived speed for chat; throughput dominates for long generations |
| Price | Cost per million input tokens and per million output tokens, separately | Output tokens are usually priced several times higher than input — a chatty model costs more than its input price suggests |
| Context window | Usable window, not the marketing number | Some providers degrade quality well before the stated limit; test at the length you'll actually send |
| Tool-calling fidelity | Does it reliably emit valid JSON args, honor `required` fields, support parallel calls | This varies more between models than almost any other axis, and it's the hardest one to catch in a demo |
| Rate-limit posture | Per-key requests/tokens per minute, burst tolerance, whether limits scale with spend history | A model that's fast in testing can throttle hard under real traffic |

## Why it works this way

Frontier providers differentiate on reasoning quality and agentic reliability because that's expensive to build and hard to copy — it's their moat, so it's priced at a premium. Open-weight hosts differentiate on cost and control because the model weights themselves are commoditized; the competition is entirely about who can serve them cheapest and fastest. Gateways differentiate on convenience — one integration, one invoice, one place to add a new model — because for a company running many apps against many providers, that operational simplicity is worth more than shaving milliseconds off any single call.

None of these are "better." They're optimizing for different things, which is exactly why [provider abstraction](/learn/genai-app-dev/why-abstract-the-provider) matters: if you commit to one interface instead of one vendor, you can actually make this allocation instead of defaulting to whichever SDK you installed first.

## A concrete example (shown)

Say your app has four LLM-touching features. A first pass at allocation might look like this:

| Feature | Needs | Reasonable pick |
|---|---|---|
| Ticket classification (5 labels) | Low latency, cheap, no tool use | A small open-weight model on a fast host |
| Long-form drafting assistant | Strong writing, large context | A frontier model |
| Multi-step agent with tool calls | High tool-calling fidelity, moderate context | A frontier model with proven tool-use reliability |
| Document embeddings for search | Cheap, high throughput, no chat behavior at all | A dedicated embeddings endpoint, not a chat model |

Pricing details change constantly and differ by region and contract, so treat any specific number here as illustrative only — the arithmetic that matters is *relative*: if a small model costs a fraction of a frontier model per token and the classification task doesn't need frontier reasoning, routing it there is close to free money. That comparison is worked through with real arithmetic in [Cost- and Capability-Aware Routing in Action](/learn/genai-app-dev/cost-and-capability-based-routing).

## Where it shows up

This shows up the moment a team moves past prototyping. Prototypes hardcode one SDK call because that's the fastest way to a demo. Production apps hit it in three places: onboarding a second feature with different latency needs, hitting a rate limit ceiling that a single provider imposes org-wide, and a procurement or compliance conversation that suddenly makes "can we route around this vendor" a real question rather than a hypothetical.

## Watch out for

- **Chasing leaderboards instead of testing your prompts.** A model's ranking on a public benchmark tells you little about how it handles your system prompt, your tool schemas, and your edge cases. Test candidates on your own traffic sample before allocating a feature to them.
- **Treating rate limits as fixed.** Most providers scale limits with usage history and account tier, and many offer negotiated increases. A limit that blocks you today may not block you after a support ticket — don't architect around a number you haven't actually asked about.
- **Ignoring tool-calling fidelity until it breaks in production.** It's the axis least visible in a quick demo and the one most likely to cause silent failures — malformed arguments, missed required fields — once real users start typing messy input.

## Where next

Once you accept that provider choice is per-feature, the next question is how much abstraction that actually requires — and where a clean interface stops helping and starts getting in the way. That's the subject of [Why (and How Far) to Abstract the Provider](/learn/genai-app-dev/why-abstract-the-provider).

**Related:** [Why (and How Far) to Abstract the Provider](/learn/genai-app-dev/why-abstract-the-provider), [Building a Provider Abstraction Layer](/learn/genai-app-dev/provider-abstraction-layers), [Build Your Own Layer or Use a Gateway?](/learn/genai-app-dev/gateway-vs-in-app-abstraction), [Cost- and Capability-Aware Routing in Action](/learn/genai-app-dev/cost-and-capability-based-routing), [SDK vs. Raw API](/learn/genai-app-dev/sdk-vs-raw-api)
