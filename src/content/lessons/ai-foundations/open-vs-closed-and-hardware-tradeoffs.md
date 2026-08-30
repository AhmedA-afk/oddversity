---
title: "Open Weights or an API? Two Scenarios"
track: "ai-foundations"
status: live
summary: "A worked cost-and-hardware comparison of a startup calling a closed API versus a hospital self-hosting an open-weight model for the same workload — with the GPU memory math, the mo"
duration: "15 min read"
---

TicketFlow and Riverside General need the exact same thing from a language model: turn a page of messy text into a short, structured summary, a couple thousand times a day. One of them is going to call an API. The other is going to rent a GPU, whether the spreadsheet likes it or not. Same workload, same shape of prompt — completely different answer. Let's find out why, in dollars.

## The setup (specific)

If you haven't read [Open Weight vs Closed Models](/learn/ai-foundations/open-weight-vs-closed-models) yet, that's the conceptual page — what "open weight" actually means, who controls what. This page assumes you know that and goes straight to pricing the decision out.

**TicketFlow** is a 4-person startup. They're building a support-ticket triage tool: a customer's message comes in, the model classifies it and writes a one-line summary for the human agent. No compliance obligations beyond normal SaaS terms. They plan to change the prompt weekly and might swap the underlying model twice before they find product-market fit.

**Riverside General** is a mid-size hospital system. They're building a similar-shaped tool: a clinician's free-text notes go in, a structured discharge summary comes out. Under the hospital's data governance policy, patient note text may not leave the hospital's network to a third-party processor — full stop, before anyone discusses cost. That single sentence is going to decide almost everything below.

To make the comparison honest, both companies are processing **the same volume of the same shape of text**: 2,000 requests a day, about 600 tokens of input, about 150 tokens of generated output. Any difference in what they pay or how they fail comes from their constraints, not from one of them having a bigger workload.

## Step by step

Every snippet below continues in the same Python session — variables from one step carry into the next.

### Step 1: Pin the workload to numbers

```python
requests_per_day = 2_000
tokens_in_avg    = 600
tokens_out_avg   = 150
days_per_month   = 30

requests_per_month  = requests_per_day * days_per_month
tokens_in_per_month  = requests_per_month * tokens_in_avg
tokens_out_per_month = requests_per_month * tokens_out_avg

print(f"requests/month:   {requests_per_month:,}")
print(f"input tokens/mo:  {tokens_in_per_month:,}")
print(f"output tokens/mo: {tokens_out_per_month:,}")
```

```
requests/month:   60,000
input tokens/mo:  36,000,000
output tokens/mo: 9,000,000
```

> **Why this step?** Every decision below — API bill, GPU sizing, breakeven point — is a function of these three numbers. If you skip straight to "open weight vs. closed," you're arguing about philosophy. If you start here, you're arguing about arithmetic, and arithmetic actually settles things. See [tokens, context & cost](/learn/ai-foundations/tokens-context-cost) if the token-counting step feels unfamiliar.

### Step 2: Price the hosted-API path

```python
# Illustrative hosted-API pricing — check the actual rate card for
# whichever model you're evaluating, this moves and varies by vendor.
price_in_per_million  = 3.00   # $ per 1M input tokens
price_out_per_million = 15.00  # $ per 1M output tokens

hosted_cost = (tokens_in_per_month  / 1_000_000) * price_in_per_million \
            + (tokens_out_per_month / 1_000_000) * price_out_per_million

cost_per_request = hosted_cost / requests_per_month

print(f"hosted API cost:  ${hosted_cost:,.2f}/month")
print(f"cost per request: ${cost_per_request:.5f}")
```

```
hosted API cost:  $243.00/month
cost per request: $0.00405
```

> **Why this step?** $243/month for zero infrastructure, zero on-call, and the ability to change the prompt or swap models by editing a string, is a genuinely hard number to beat at this volume. Keep this number — it's the line every self-hosting argument has to cross.

### Step 3: Size the GPU for the open-weight path

Pick a working assumption: a 13-billion-parameter open-weight model — big enough to follow a structured extraction prompt reliably, small enough to run on one GPU. Swap in your real candidate's parameter count and rerun this.

```python
params = 13_000_000_000     # 13B-parameter open-weight model
bytes_per_param = 2         # fp16 weights

weights_gb = params * bytes_per_param / 1e9
print(f"weights alone: {weights_gb:.1f} GB")

# KV cache: the memory that grows with context length and concurrency,
# not with model size alone. Standard multi-head-attention formula —
# models using grouped-query attention need less than this.
num_layers = 40     # illustrative, typical of a model this size
hidden_dim = 5120    # illustrative

bytes_per_token = 2 * num_layers * hidden_dim * bytes_per_param  # K and V, every layer
mb_per_token = bytes_per_token / 1e6
print(f"KV cache per token: {mb_per_token:.4f} MB")

context_budget = 2048   # tokens reserved per in-flight request — headroom
                         # above the ~750-token average, for system prompt
                         # and generation overhead
concurrency = 8          # requests served at once

kv_per_request_gb = context_budget * mb_per_token / 1024
kv_total_gb = kv_per_request_gb * concurrency

overhead_factor = 1.15   # activations, framework overhead
total_gb = (weights_gb + kv_total_gb) * overhead_factor

print(f"KV cache per request: {kv_per_request_gb:.2f} GB")
print(f"KV cache, {concurrency} concurrent: {kv_total_gb:.1f} GB")
print(f"total GPU memory needed: {total_gb:.1f} GB")
```

```
weights alone: 26.0 GB
KV cache per token: 0.8192 MB
KV cache per request: 1.64 GB
KV cache, 8 concurrent: 13.1 GB
total GPU memory needed: 45.0 GB
```

> **Why this step?** This is the number people skip and then get bitten by. A 13B model doesn't need "a GPU" — it needs about 45 GB of memory once you account for the requests actually in flight, not just the weights sitting idle. That rules out a 24 GB card outright (the weights alone, 26 GB, don't fit) and points you at an 80 GB-class GPU with real headroom left over. This is [the hardware stack](/learn/ai-foundations/ai-hardware-stack) turning into a purchase decision.

### Step 4: Price the self-hosted path, and find the breakeven

```python
gpu_rate_per_hour = 2.50   # illustrative on-demand price for an 80GB-class
                           # GPU — check current rates, they vary by cloud
                           # and region and move over time
hours_per_month = 24 * 30

self_hosted_cost = gpu_rate_per_hour * hours_per_month
print(f"self-hosted GPU cost: ${self_hosted_cost:,.2f}/month")
print(f"multiple of hosted API cost: {self_hosted_cost / hosted_cost:.2f}x")

breakeven_requests_per_month = self_hosted_cost / cost_per_request
breakeven_requests_per_day = breakeven_requests_per_month / days_per_month

print(f"breakeven volume: {breakeven_requests_per_month:,.0f} requests/month "
      f"(~{breakeven_requests_per_day:,.0f}/day)")
```

```
self-hosted GPU cost: $1,800.00/month
multiple of hosted API cost: 7.41x
breakeven volume: 444,444 requests/month (~14,815/day)
```

> **Why this step?** This is the whole shape of the tradeoff in three numbers. The hosted API's cost is a straight line through the origin — it scales with tokens. The self-hosted GPU's cost is a flat shelf — roughly $1,800/month whether you send it 200 requests a day or 20,000, right up until you need a second GPU. At 2,000 requests/day, the flat shelf is 7.4x more expensive than the line. Past about 14,800 requests/day, the line crosses above the shelf. **The "right" answer isn't fixed — it's a function of volume**, which is exactly why this is worth computing rather than assuming.

### Step 5: Compare latency, not just cost

```python
compute_time_ms = 300   # illustrative per-request generation time on one GPU
queue_depth = 8         # requests arriving in the same burst, no batching

for i in (1, queue_depth):
    wait_ms = (i - 1) * compute_time_ms
    finish_ms = wait_ms + compute_time_ms
    print(f"request #{i}: starts at {wait_ms}ms, finishes at {finish_ms}ms")
```

```
request #1: starts at 0ms, finishes at 300ms
request #8: starts at 2100ms, finishes at 2400ms
```

> **Why this step?** Your own GPU removes the public-internet round trip, but it also removes the very large fleet a hosted provider load-balances across. Send a burst to one un-batched GPU and request #8 waits behind seven others before it even starts. A hosted provider absorbs that burst across its fleet — part of what the per-token markup is paying for. Continuous batching claws most of this back on your own server, but now *you're* the one building and operating it. See [inference cost and latency](/learn/ai-foundations/inference-cost-and-latency-intuition) for the general shape of this tradeoff. Note which company this matters to: TicketFlow's live triage UI feels this in a demo; Riverside's overnight discharge-summary batch does not care at all.

### Step 6: Apply each company's actual constraint

**TicketFlow**: current volume (2,000/day) is nowhere near the ~14,800/day breakeven. Hosted costs $243/month against $1,800/month self-hosted, with zero ops burden and the freedom to swap models weekly. Nothing in their situation argues for self-hosting yet. Decision: **closed API**. (This is the kind of tradeoff the [model-choice decision framework](/learn/ai-foundations/choosing-a-model-decision-framework) is built to walk through systematically — here, cost and speed-of-iteration both point the same way, so it's not even close.)

**Riverside General**: the governance policy removes the hosted option before cost is even on the table — patient note text cannot leave the network. That's the only reason self-hosting is worth its 7.4x premium at this volume: control isn't a preference here, it's the requirement, and it's *only satisfiable* because the model is open-weight — you can't self-host a closed model's weights, because you were never given them. Decision: **self-hosted open weights**, cost premium accepted as the price of the constraint.

## Where it breaks

**Riverside's GPU, sized for the average note, meets an outlier.** The 45 GB budget in Step 3 assumed a 2,048-token context reservation per request. A discharge summary compiled from a multi-week ICU stay blows well past that.

```python
long_note_tokens = 15_000   # a compiled multi-week discharge note
kv_long_gb = long_note_tokens * mb_per_token / 1024
print(f"KV cache, one long-context request: {kv_long_gb:.1f} GB")

concurrent_short = 8   # the normal daytime batch keeps arriving
concurrent_long = 3    # a few long discharge summaries land at the same time

kv_spike_gb = concurrent_short * kv_per_request_gb + concurrent_long * kv_long_gb
total_spike_gb = (weights_gb + kv_spike_gb) * overhead_factor

print(f"KV cache under the spike: {kv_spike_gb:.1f} GB")
print(f"total memory needed: {total_spike_gb:.1f} GB  (GPU has 80 GB)")
```

```
KV cache, one long-context request: 12.0 GB
KV cache under the spike: 49.1 GB
total memory needed: 86.4 GB  (GPU has 80 GB)
```

Three long notes landing alongside the normal daytime traffic pushes the same 80 GB card to 86.4 GB — an out-of-memory failure, on exactly the patient record most in need of a careful summary. This is the classic self-hosting trap: you size hardware for the median request, and the tail takes you down. A hosted provider's elastic fleet absorbs this for you; your one GPU does not.

**Fix**: don't let one context budget serve every request. Cap concurrent long-context slots (route the ICU-length notes through a small, reserved-memory pool instead of the shared batch), and chunk very long notes — summarize each week separately, then summarize the summaries — so no single call's context grows unbounded. See [context window mechanics](/learn/llm-foundations/context-window-mechanics) for why that ceiling exists in the first place.

**TicketFlow's "hosted always wins" assumption breaks the moment they grow.** The Step 4 math wasn't a one-time verdict, it was a line and a shelf. If product-market fit hits and volume climbs to 15,000 requests/day — past the ~14,800 breakeven —the same GPU that looked like a bad deal in Step 4 is now the cheaper option:

```python
new_requests_per_day = 15_000
new_hosted_cost = new_requests_per_day * days_per_month * cost_per_request
print(f"hosted cost at new volume: ${new_hosted_cost:,.2f}/month")
print(f"self-hosted GPU cost, unchanged: ${self_hosted_cost:,.2f}/month")
```

```
hosted cost at new volume: $1,822.50/month
self-hosted GPU cost, unchanged: $1,800.00/month
```

The crossover isn't hypothetical — it's the same $1,800 shelf from Step 4, and growth just walked the line up to meet it. Teams that treat "we use the API" as a permanent architectural decision, instead of the current answer to a computation that changes with volume, end up locked in past the point where it's actually cheap. **Fix**: instrument cost-per-request from day one, watch it against your own computed breakeven, and put the model call behind a thin interface in your code so that switching paths is a config change, not a rewrite.

## Takeaways

- **Compute the breakeven volume before you argue about philosophy.** Hosted cost is a line (scales with tokens); self-hosted cost is closer to a shelf (roughly flat until you need another GPU). The lines cross somewhere — find where, for your own numbers, before picking a side.
- **GPU memory is weights plus KV cache, not just weights.** A 13B model "needing 26 GB" is the wrong number — concurrency and context length can nearly double it, and that's the number that decides which card you can actually run on.
- **A hard constraint ends the cost argument, it doesn't win it.** Riverside self-hosts at a 7.4x premium not because the math favors it, but because the hosted option was never on the table. Know which of your requirements are like that before you build a cost model to justify a foregone conclusion.
- **Size self-hosted capacity for the tail, not the average.** The single most common self-hosting failure isn't the average request — it's the one three standard deviations out that you never budgeted memory for.
- **"Open weight" is what makes self-hosting possible at all.** You can't self-host a model you can only call — this is the mechanical link between the concept and the GPU bill.
- **Revisit the decision as volume changes, don't just make it once.** The breakeven point isn't trivia — it's the line that tells you when to reconsider.

**Related:** [Open Weight vs Closed Models](/learn/ai-foundations/open-weight-vs-closed-models) · [AI Hardware Stack](/learn/ai-foundations/ai-hardware-stack) · [Tokens, Context & Cost](/learn/ai-foundations/tokens-context-cost) · [Inference Cost and Latency Intuition](/learn/ai-foundations/inference-cost-and-latency-intuition) · [Context Window Mechanics](/learn/llm-foundations/context-window-mechanics) · [Choosing a Model: Decision Framework](/learn/ai-foundations/choosing-a-model-decision-framework)
