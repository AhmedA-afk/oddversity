---
title: "Routing: Picking a Model Per Request"
track: "genai-app-dev"
status: live
summary: "Route by task, by tenant plan, or by live provider health — and know when a static config beats a dynamic classifier."
duration: "7 min read"
---

"Which model handles this request" sounds like one decision. In a real app it's usually three overlapping ones: what the task needs, what the caller is entitled to, and what's actually healthy right now. Routing policy is where those three answers get combined into a single pick.

## What it is

[Model Routing and Multi-Provider Failover](/learn/genai-app-dev/model-routing-and-failover) introduces the basic tiered-model idea — cheap models for easy tasks, frontier models for hard ones. This lesson breaks "routing" into the distinct axes production systems actually route on, and shows how to encode them as one policy object your request path evaluates instead of scattered `if` statements.

Three axes, in the order most teams add them:

1. **By task.** Classification, extraction, and short rewrites go to a cheap, fast model. Open-ended drafting, multi-step reasoning, and anything customer-facing where quality mistakes are expensive go to a stronger one.
2. **By tenant or plan.** A free-tier user might get a smaller model with a lower rate limit; an enterprise plan gets the frontier model and a higher ceiling. This is a business rule wearing a routing decision's clothes.
3. **By live health.** Independent of task or tenant, if the model you'd normally pick is erroring or slow right now, route around it. This axis feeds directly into [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains).

## The mental model

Model these as layered filters over one config object, not three separate code paths:

```ts
interface RequestContext {
  taskType: "classify" | "extract" | "draft" | "reason" | "chat";
  tenantPlan: "free" | "pro" | "enterprise";
  requiresTools: boolean;
  requiresContextTokens: number;
}

interface RoutingRule {
  match: (ctx: RequestContext) => boolean;
  provider: string;
  model: string;
}

interface RoutingPolicy {
  rules: RoutingRule[];          // evaluated in order, first match wins
  fallback: { provider: string; model: string };
}

const policy: RoutingPolicy = {
  rules: [
    { match: ctx => ctx.taskType === "classify", provider: "openai", model: "gpt-4o-mini" },
    { match: ctx => ctx.tenantPlan === "free" && ctx.taskType === "draft", provider: "openai", model: "gpt-4o-mini" },
    { match: ctx => ctx.taskType === "reason" || ctx.requiresContextTokens > 100_000, provider: "anthropic", model: "claude-opus" },
  ],
  fallback: { provider: "anthropic", model: "claude-sonnet" },
};

function resolveModel(ctx: RequestContext, policy: RoutingPolicy) {
  return policy.rules.find(r => r.match(ctx))?.provider
    ? policy.rules.find(r => r.match(ctx))!
    : policy.fallback;
}
```

Health isn't in this object at all — it's deliberately a separate concern, evaluated *after* `resolveModel` picks a target, because health can change mid-request in a way task type and tenant plan never do. That separation is exactly what makes this policy reusable as-is by the failover router in the next lesson: `resolveModel` picks the primary, and failover decides what happens if that primary can't be reached.

## Why it works this way

Static, rule-based routing wins for most apps because the rules are auditable and cheap to evaluate — a support engineer can read `policy.rules` and know exactly why a request went where it went, which matters when a customer asks "why did I get a worse answer." Dynamic routing — a small classifier model that scores task difficulty and picks a tier at runtime — only pays for itself once your task mix is genuinely unpredictable (open-ended user input where "task type" isn't knowable in advance) and the classifier's own cost and latency are small next to what you save by not over-routing to the expensive model.

Start static. Move a rule to dynamic only when you can point at cases the static rule gets wrong often enough to matter — don't add a classifier because it's more sophisticated, add it because a specific rule is measurably failing.

## A concrete example (shown)

A support product with three plans might resolve routing like this for an incoming ticket-reply draft:

| Input | Rule that fires | Result |
|---|---|---|
| Free plan, `taskType: "draft"` | Rule 2 (free + draft) | Cheap model |
| Enterprise plan, `taskType: "draft"` | No task/plan rule matches | Falls through to `fallback` (stronger model) |
| Any plan, `taskType: "reason"` | Rule 3 (reasoning or large context) | Frontier model, regardless of plan |
| Any plan, `taskType: "classify"` | Rule 1 (classify) | Cheap model, regardless of plan |

Notice rule 3 overrides plan entirely — a free-tier user's request that genuinely needs multi-step reasoning still gets the model that can do it, because routing by task correctness comes before routing by cost tier in this policy's evaluation order. Getting that order backwards is how a cost-saving policy quietly ships wrong answers to your best customers.

## Where it shows up

Routing by task shows up almost immediately once a product has more than one LLM feature. Routing by tenant plan shows up as soon as pricing tiers exist and product wants the expensive model gated. Routing by health shows up the first time a provider has a bad afternoon and someone asks "why didn't we just use the other one" — which is the point where this policy object needs to plug into a failover router rather than live as a one-off `if` block.

## Watch out for

- **Letting cost rules override correctness rules.** If a cheap-model rule for "free plan" fires before a task-based rule that needs the strong model, you'll silently downgrade output quality for users who happen to be on the wrong plan for a task that had nothing to do with plan. Order rules by correctness constraints first, cost constraints second.
- **Routing on stale health signals.** A model that failed twice five minutes ago might be fine now. Health-based routing needs a decay window, not a permanent blacklist — that's covered fully in [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains).
- **Hardcoding capability assumptions into rules.** A rule like "reasoning tasks go to `claude-opus`" breaks silently the day that model is deprecated. Express capability requirements (needs tool-calling, needs a 100k+ context window) as data on the rule, not as a hardcoded model name, so the resolver can pick any model that currently satisfies them — see [Cost- and Capability-Aware Routing in Action](/learn/genai-app-dev/cost-and-capability-based-routing) for that pattern worked through.

## Where next

This policy object is inert until something executes it against live provider health and an actual fallback chain. That's the next lesson.

**Related:** [Model Routing and Multi-Provider Failover](/learn/genai-app-dev/model-routing-and-failover), [Implementing Failover and Fallback Chains](/learn/genai-app-dev/implementing-failover-and-fallback-chains), [Cost- and Capability-Aware Routing in Action](/learn/genai-app-dev/cost-and-capability-based-routing), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking), [Feature Flagging AI Features](/learn/genai-app-dev/feature-flagging-ai-features)
