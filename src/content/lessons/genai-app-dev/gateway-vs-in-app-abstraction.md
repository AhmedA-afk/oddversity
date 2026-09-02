---
title: "Build Your Own Layer or Use a Gateway?"
track: "genai-app-dev"
status: live
summary: "Compare an in-app provider layer against a self-hosted proxy, a hosted aggregator, and a cloud multi-model endpoint on control, latency, and billing."
duration: "8 min read"
---

Everything else in this module assumes you're building the abstraction yourself. That's a real choice, not a default — a gateway sitting between your app and every provider does most of the same job, and for some teams it does it better. This lesson compares the options on the axes that actually decide it.

## In-app abstraction layer

The `LLMProvider` interface, adapters, and `FailoverRouter` built across this module — a library that lives inside your app's codebase and process.

**How it works:** your app imports the interface and adapters directly; routing and failover logic run in the same process as the feature calling them.

**When it wins:** a single product where you want routing logic that's specific to your domain (the tenant-plan and task-type rules from [Routing: Picking a Model Per Request](/learn/genai-app-dev/model-routing-strategies) aren't generic — they encode your product's own tiers). You also want it when latency matters enough that an extra network hop is worth avoiding, or when you're not ready to hand every provider key to a third-party service.

**Failure mode:** every new provider is a new adapter your team writes and maintains — normalizing that provider's message shape, streaming format, and error taxonomy by hand, the way [Writing Two Adapters Behind One Interface](/learn/genai-app-dev/provider-adapter-anthropic-openai) did for two. If your org runs many apps, each rebuilding this, you're paying that adapter-maintenance cost N times over.

**Relative cost:** no added infrastructure or per-request fee — cost is entirely engineering time to build and maintain adapters.

## Self-hosted gateway/proxy (e.g., a LiteLLM-style proxy)

A separate service you run — often a small stateless proxy — that exposes one API shape and translates to whichever provider a request's config names, with your keys held centrally in the proxy's own config or vault.

**How it works:** your apps call the proxy's endpoint instead of any provider directly; the proxy holds the adapters, and you deploy and operate it like any other internal service.

**When it wins:** multiple apps or teams inside one org, where duplicating adapter code per app is wasteful and centralizing keys in one service (rather than distributing them to every app's environment) is a real security win — fewer places a leak can happen. It also wins when you want provider changes — adding a model, retiring one — to roll out without redeploying every app that uses it.

**Failure mode:** it's a new single point of failure and a new operational burden — someone has to run it, patch it, and keep its own uptime higher than any individual provider's, or you've added a dependency that can take down every app behind it at once, including ones a given outage wouldn't otherwise have touched.

**Relative cost:** infrastructure cost of running the proxy (usually modest — it's lightweight), plus the ongoing operational cost of owning a service, offset by adapter code written once instead of per app.

## Hosted aggregator (e.g., OpenRouter)

A third-party hosted service that fronts many providers behind one API and one bill, run and operated by someone else.

**How it works:** you call the aggregator's endpoint with the aggregator's model-naming convention; it routes to the underlying provider and handles billing consolidation, without you running any infrastructure yourself.

**When it wins:** fastest path to trying many models/providers without integrating each one, and useful when you want one consolidated invoice instead of N separate provider accounts. Good fit for prototypes, side projects, or teams without the appetite to run their own proxy.

**Failure mode:** you've added a real network hop (your request now goes through the aggregator's infrastructure before reaching the actual provider) and a real dependency on a third party's uptime and pricing decisions — if they raise their margin or drop a provider you rely on, you find out on their timeline, not yours. You also hand a third party visibility into your prompt traffic, which is a real consideration for anything sensitive.

**Relative cost:** typically a small margin on top of each provider's own per-token price, in exchange for zero infrastructure to run — cheap to start, and worth re-evaluating once volume is large enough that the margin adds up.

## Cloud multi-model endpoint (e.g., a cloud vendor's unified model access)

A single cloud vendor's own service that exposes several providers' models through one API, tied to that vendor's existing IAM, billing, and networking.

**How it works:** you call the cloud vendor's SDK or endpoint; it proxies to whichever underlying model you selected, inside that vendor's infrastructure and account boundary.

**When it wins:** you're already deep in one cloud vendor's ecosystem and want model access to inherit that vendor's existing IAM roles, VPC networking, and consolidated billing — a natural fit for a team standardized on one cloud, where a request never has to leave that vendor's network boundary.

**Failure mode:** model availability and API shape both lag behind — and are gated by — that cloud vendor's own rollout schedule, not the underlying provider's. You're binding your provider flexibility to your cloud vendor's roadmap in exchange for the integration convenience.

**Relative cost:** usually priced close to the underlying provider's own rate, sometimes with a cloud vendor markup — the real cost is the coupling to that vendor's ecosystem, not the per-token price.

## The hybrid middle ground

These aren't mutually exclusive. A common pattern once a team has both an in-app layer and access to a gateway: **treat the gateway as one more adapter behind your own `LLMProvider` interface** — one entry in your `FailoverRouter`'s chain routes through a gateway (giving you its multi-provider reach for less-common models) while your primary, highest-volume providers get dedicated in-app adapters (giving you the lowest latency and most control for the traffic that matters most). You get centralized fallback breadth without paying the gateway's hop cost on every request.

## Decision table

| | In-app layer | Self-hosted gateway | Hosted aggregator | Cloud multi-model endpoint |
|---|---|---|---|---|
| Control | Full | High (you run it) | Low | Medium (bounded by cloud vendor) |
| Extra latency hop | None | One | One | One |
| Keys held where | Your app's env/vault | Centralized in the proxy | Third party | Cloud vendor's IAM |
| Best for | Single product, custom routing | Many apps, one org | Prototyping, low ops appetite | Cloud-standardized teams |
| Ongoing ops burden | Adapter maintenance | Running the proxy | None | None |

## How to choose

Start with the question that actually predicts the right answer: **how many apps need this, and how custom does the routing logic need to be?** One product with routing rules tied to your own tenant plans and task types — build the in-app layer, it's not that much code and you've already seen most of it in this module. Many products inside one org, generic routing needs — a self-hosted gateway centralizes the maintenance you'd otherwise duplicate. No appetite to run infrastructure at all, or you're still figuring out which providers you even want — a hosted aggregator gets you moving today, with the option to build a proper layer once you know your real requirements. Already committed to one cloud vendor for everything else — their multi-model endpoint is the path of least resistance, with the tradeoff of being bound to their release schedule.

**Related:** [Building a Provider Abstraction Layer](/learn/genai-app-dev/provider-abstraction-layers), [The Provider Landscape and Its Tradeoffs](/learn/genai-app-dev/provider-landscape-and-tradeoffs), [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains), [Handling API Keys and Secrets Safely](/learn/genai-app-dev/secrets-and-key-management), [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts)
