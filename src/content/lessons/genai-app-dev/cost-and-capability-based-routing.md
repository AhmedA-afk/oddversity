---
title: "Cost- and Capability-Aware Routing in Action"
track: "genai-app-dev"
status: live
summary: "Walk one traffic mix through capability-constrained routing and see the blended cost saving with real arithmetic."
duration: "8 min read"
---

The routing policy from [Routing: Picking a Model Per Request](/learn/genai-app-dev/model-routing-strategies) is easy to agree with in the abstract. This lesson makes it concrete: one support app, one day of traffic, one routing policy, and the arithmetic that tells you whether the extra complexity was worth it.

## The setup

**TicketFlow** is a support tool with one LLM-touching feature: drafting a reply to an incoming ticket. Two shapes of ticket dominate the traffic:

- **Short factual tickets** — "what's your refund window," "where's my order" — answerable from a lookup, no multi-step reasoning, no tool calls beyond a single order lookup.
- **Long reasoning tickets** — multi-message troubleshooting threads where the model has to hold context across several prior replies and reason about what's already been tried.

On a representative day: **10,000 tickets**, split **7,000 short factual / 3,000 long reasoning**. Every number below is illustrative — treat the shape of the arithmetic as the lesson, not the specific prices, which change by vendor and month.

| | Avg input tokens | Avg output tokens |
|---|---|---|
| Short factual | 200 | 50 |
| Long reasoning | 1,500 | 600 |

Two models are available:

| Model | Input $/M tokens (illustrative) | Output $/M tokens (illustrative) | Tool-calling | Context |
|---|---|---|---|---|
| Cheap | $0.25 | $1.25 | Unreliable | 32k |
| Strong | $3.00 | $15.00 | Reliable | 200k |

TicketFlow today routes everything to Strong, because that's the model the team reached for first. The question: what does capability-aware routing actually save, and where does it risk breaking?

## Step by step

### Step 1 — Compute today's baseline

Everything on Strong, all 10,000 tickets:

```
input tokens  = 7,000 × 200  +  3,000 × 1,500  =  1,400,000 + 4,500,000 = 5,900,000  (5.9M)
output tokens = 7,000 × 50   +  3,000 × 600    =    350,000 + 1,800,000 = 2,150,000  (2.15M)

cost = 5.9M × $3.00  +  2.15M × $15.00
     = $17.70        +  $32.25
     = $49.95 / day
```

> **Why this step?** You can't argue a routing change saved money without a baseline computed the same way you're about to compute the alternative — same traffic, same token estimates, only the routing decision changes.

### Step 2 — Encode capability requirements, not model names

Before routing by cost, rule out models that can't do the job at all. That's a capability constraint, and it has to be checked *before* the cost comparison, not after:

```ts
interface CapabilityRequirement {
  needsReliableToolCalling: boolean;
  minContextTokens: number;
}

function capableModels(req: CapabilityRequirement, catalog: ModelSpec[]): ModelSpec[] {
  return catalog.filter(
    m => (!req.needsReliableToolCalling || m.toolCallingReliable)
      && m.contextTokens >= req.minContextTokens,
  );
}
```

For TicketFlow, short factual tickets that only need a single order lookup still count as `needsReliableToolCalling: true` — a single tool call that silently fails is worse than not attempting one. That's a real constraint, not a cost optimization, and it can rule out the cheap model even for a "simple" task if that model's tool-calling isn't dependable enough to trust unattended.

> **Why this step?** This is the pattern [Routing: Picking a Model Per Request](/learn/genai-app-dev/model-routing-strategies) warned about: routing on a hardcoded model name breaks when that model changes. Routing on capability requirements survives a model swap — recompute `capableModels` against a new catalog and the policy still holds.

### Step 3 — Route by task, within the capable set

Say the cheap model's tool-calling is reliable enough for a single, well-defined lookup call (verified against real traffic samples, not assumed) — so it clears step 2 for short factual tickets. The policy:

```ts
const rules: RoutingRule[] = [
  { match: ctx => ctx.taskType === "factual_short", provider: "cheap", model: "cheap-v1" },
  { match: ctx => ctx.taskType === "reasoning_long", provider: "strong", model: "strong-v1" },
];
```

7,000 tickets route to Cheap, 3,000 to Strong.

### Step 4 — Compute the blended cost

```
Short factual, on Cheap:
  input  = 7,000 × 200 = 1,400,000 (1.4M) → 1.4M × $0.25 = $0.35
  output = 7,000 × 50  =   350,000 (0.35M) → 0.35M × $1.25 = $0.4375
  subtotal = $0.7875

Long reasoning, on Strong:
  input  = 3,000 × 1,500 = 4,500,000 (4.5M) → 4.5M × $3.00  = $13.50
  output = 3,000 × 600   = 1,800,000 (1.8M) → 1.8M × $15.00 = $27.00
  subtotal = $40.50

total = $0.7875 + $40.50 = $41.2875 / day
```

```
saving  = $49.95 − $41.29 ≈ $8.66 / day
percent = $8.66 / $49.95 ≈ 17.3%
```

> **Why this step?** Notice most of the baseline cost was never touched — the long-reasoning tickets stayed on Strong and account for $40.50 of the new $41.29 total. The saving comes entirely from the 7,000 short tickets, which were cheap to begin with and are now cheaper still. That's the honest shape of capability-aware routing: it rarely halves your bill, because the expensive traffic usually needs the expensive model. This is exactly the kind of number that belongs in a [cost budget](/learn/genai-app-dev/cost-budgets-and-usage-tracking), tracked per route so a regression in one traffic segment doesn't hide in an aggregate.

## Where it breaks (+ fix)

**A "short factual" ticket that isn't actually simple.** A ticket classified as `factual_short` by ticket length alone, but that turns out to need multi-step reasoning ("my refund AND my subscription AND a prior agent's note all conflict"), gets routed to Cheap and produces a shallow, wrong answer — silently, because nothing failed.

**Fix:** don't classify by length alone. Add an escalation signal: if the cheap model's response hits its token limit, if a required tool call fails, or if a lightweight confidence heuristic on the output looks weak, re-route the same request to Strong before it reaches the customer. This costs an extra round trip on the minority of misclassified tickets, which is far cheaper than a wrong answer reaching a customer — and it's the same retry-vs-escalate instinct from [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains), applied to task difficulty instead of provider health.

## Takeaways

- Compute the baseline the same way you compute the alternative, or the saving isn't real.
- Check capability requirements *before* cost — a cheaper model that can't reliably do the job isn't actually in your option set.
- Expect savings to come from your cheap-and-frequent traffic, not your expensive-and-rare traffic — the arithmetic above is typical, not pessimistic.
- Route on capability tags, not hardcoded model names, so the policy survives a model catalog change.
- Add an escalation path for misclassification — the cost saving is only real if the failure mode of routing wrong is also handled.

**Related:** [Routing: Picking a Model Per Request](/learn/genai-app-dev/model-routing-strategies), [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking), [The Provider Landscape and Its Tradeoffs](/learn/genai-app-dev/provider-landscape-and-tradeoffs), [Cutting Cost with a Model Cascade](/learn/genai-app-dev/cutting-cost-with-model-cascade)
