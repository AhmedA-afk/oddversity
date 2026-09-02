---
title: "Progressive Disclosure and Namespacing"
track: "tools-function-calling"
status: live
summary: "Four ways to reveal tools gradually instead of retrieving them — namespacing, two-stage category picking, and context-driven disclosure — compared."
duration: "7 min read"
---

Retrieval answers "what's relevant to this query." These patterns answer a related but different question: "what's relevant to this *kind of task*," which often has a cleaner, cheaper answer than a similarity search.

## How it works — compare four approaches

### 1. Flat retrieval (the baseline to beat)

Embed everything, retrieve top-k per query — the approach built in [Retrieval Over a 200-Tool Registry](/learn/tools-function-calling/rag-over-tools-retrieval). No structure assumed, works on any registry shape.

- **When it wins**: the registry has no clean domain boundaries, or queries genuinely cross domains unpredictably.
- **Failure mode**: recall misses (the right tool doesn't make top-k), and no legible explanation for why a given call saw the tools it saw.
- **Relative cost**: highest to build (embeddings, vector store, tuning k) and highest to operate (an embedding call every request).

### 2. Namespacing by domain

Tools are named and grouped by domain — `billing.get_invoice`, `billing.cancel_subscription`, `calendar.create_event` — and the model, or a router, works at the namespace level before the tool level.

```json
{"name": "billing.cancel_subscription", "description": "Cancel a customer's active subscription."}
{"name": "calendar.create_event", "description": "Create a new calendar event."}
```

- **When it wins**: domains are stable and known at design time — most first-party products with a handful of clear feature areas.
- **Failure mode**: a query that straddles two domains ("cancel my subscription and refund this month" is billing *and* refunds) doesn't have one obviously correct namespace.
- **Relative cost**: low to build (it's a naming convention plus grouping in your registry code), near-zero runtime cost.

### 3. Two-stage category picking

The model first sees only category tools (`"billing_category"`, `"calendar_category"`, 8-10 of them), calls one, and only then receives the real tools for that category in a follow-up turn.

```
Turn 1: model sees [billing_category, calendar_category, support_category, ...]
        model calls: select_category("billing_category")
Turn 2: model now sees the 15 real billing tools, picks the actual one to call
```

- **When it wins**: registries large enough (100+) that even namespacing leaves too many tools visible at once, and where getting the category right is easy for the model even when the exact tool isn't obvious yet.
- **Failure mode**: adds a full extra round trip to every request, even ones where the right tool was obvious from turn one.
- **Relative cost**: moderate to build, and a real latency cost per request (see [Router Tools and Grouped Dispatch](/learn/tools-function-calling/tool-namespacing-and-grouping) for the loop mechanics and how caching offsets this).

### 4. Context-driven disclosure

Tool visibility is driven by conversation state rather than a query or an explicit category pick — once the agent's task narrows (a user picked "billing" from a menu, or an earlier tool call returned billing data), billing tools appear and others quietly drop out of `tools` for subsequent turns.

```python
def tools_for_turn(state):
    if state.active_domain == "billing":
        return billing_tools
    return category_tools  # not yet narrowed
```

- **When it wins**: long-running sessions where the task is established early and stays stable — the disclosure decision gets made once, not re-derived every turn.
- **Failure mode**: state can go stale — if the user changes topic mid-conversation and your code doesn't detect it, the tools available no longer match what's needed, and there's no retrieval fallback to catch it.
- **Relative cost**: low runtime cost (no extra model call), but the state-tracking logic itself is the real engineering cost, and it's bespoke per application.

## Decision table

| Approach | Best for | Extra round trip? | Legibility of "why these tools" |
|---|---|---|---|
| Flat retrieval | No clean domain structure, cross-cutting queries | No | Low — a similarity score |
| Namespacing | Stable, known domains | No | High — the name says the domain |
| Two-stage category | Very large registries (100+), fuzzy category boundaries | Yes | High — an explicit model choice |
| Context-driven | Long sessions, task narrows over time | No | Medium — depends on your state logic |

## How to choose

Start with the shape of your registry, not the size. If tools already cluster into clean, stable domains a human would name without hesitation, lead with namespacing — it's the cheapest and most legible option, and you can layer retrieval *within* a namespace later if a domain itself grows past a few dozen tools. If the registry is genuinely flat and cross-cutting (many independent integrations, no natural taxonomy), retrieval is the honest fix, not a category scheme you'd have to force.

Two-stage category picking earns its extra round trip only once a flat namespace list itself gets too long to show the model outright — past roughly 10-15 categories, showing all of them starts recreating the exact problem you were solving. And context-driven disclosure is less a competing option than a refinement you add on top of whichever of the other three you picked, once you have enough conversation history to know the task has narrowed and don't want to keep re-deriving that every turn.

These compose in practice: namespace first, retrieve within a namespace if it's large, and let established conversation state skip the category-picking round trip once the domain is already known. See [Router Tools and Grouped Dispatch](/learn/tools-function-calling/tool-namespacing-and-grouping) for the meta-tool version of two-stage picking built out in full, and [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure) for the broader context-engineering treatment of revealing information — tools included — only as it's needed.

**Related:** [Selecting From Hundreds of Tools](/learn/tools-function-calling/tool-selection-at-scale-strategies), [Router Tools and Grouped Dispatch](/learn/tools-function-calling/tool-namespacing-and-grouping), [Retrieval Over a 200-Tool Registry](/learn/tools-function-calling/rag-over-tools-retrieval), [Progressive Tool Disclosure](/learn/context-engineering/progressive-tool-disclosure)
