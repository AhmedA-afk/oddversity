---
title: "Returning a 5,000-Row Result Without Blowing Context"
track: "tools-function-calling"
status: live
summary: "A query tool returns thousands of rows — walk through truncation, server-side summarization, and pagination, and build the truncation version."
duration: "7 min read"
---

A `query_orders` tool is well-designed, well-validated, and returns exactly what was asked for: every row matching the filter. The filter matches 5,000 rows. Dumping all of them into a tool result is technically correct and practically disastrous — this lesson works through what to do instead.

## The setup

The tool:

```python
class QueryOrdersArgs(BaseModel):
    status: str
    since: str  # ISO date

@register("query_orders", QueryOrdersArgs, tier="read")
def query_orders(ctx, args: QueryOrdersArgs):
    return db.orders.filter(status=args.status, created_after=args.since, owner_id=ctx.user_id)
```

The model calls `query_orders(status="shipped", since="2026-01-01")`, expecting to answer something like "how many orders shipped this year, and what's the average value?" The query matches 5,412 rows. Returned as a JSON array, that's easily 200,000+ tokens of mostly-repetitive order data — likely blowing past the model's context window outright, and even if it technically fit, burning that much of the budget on one tool result leaves little room for the rest of the conversation and every subsequent turn that has to re-read it.

## Step by step

### Naive: return everything

```python
def query_orders(ctx, args):
    orders = db.orders.filter(status=args.status, created_after=args.since, owner_id=ctx.user_id)
    return [o.to_dict() for o in orders]  # 5,412 full order objects
```

> **Why this step?** Shown deliberately as the failure case. It's the version everyone writes first because it's the version that requires no design decision — and it's the version that turns one tool call into a context-budget incident.

### Tactic 1: truncate with a count

```python
def query_orders_truncated(ctx, args, limit=50):
    orders = db.orders.filter(status=args.status, created_after=args.since, owner_id=ctx.user_id)
    total = orders.count()
    shown = orders.order_by("-created_at").limit(limit)
    rows = [f"  {o.id}  {o.created_at.date()}  ${o.total_cents/100:.2f}" for o in shown]
    return (
        f"Showing {len(shown)} of {total} matching orders (most recent first):\n"
        + "\n".join(rows)
        + (f"\n... {total - limit} more not shown. Use offset= to page further." if total > limit else "")
    )
```

> **Why this step?** The count (`5,412`) is preserved even though the rows aren't — the model can answer "roughly how many orders shipped" without needing every row, and it knows explicitly that what it's looking at is partial, not the whole answer. That explicit note is the difference between truncation and silent data loss.

### Tactic 2: summarize server-side

If the question is "what's the average order value," the model doesn't need any individual rows — it needs the aggregate:

```python
def query_orders_summary(ctx, args):
    qs = db.orders.filter(status=args.status, created_after=args.since, owner_id=ctx.user_id)
    stats = qs.aggregate(count=Count("id"), avg=Avg("total_cents"), total=Sum("total_cents"))
    return (
        f"{stats['count']} orders matching status='{args.status}' since {args.since}.\n"
        f"Average value: ${stats['avg']/100:.2f}  |  Total value: ${stats['total']/100:.2f}"
    )
```

> **Why this step?** This doesn't fetch 5,412 rows into memory at all, let alone into the model's context — the database does the aggregation. Two lines answer a question that would have taken 200,000 tokens of raw rows to answer worse. The tradeoff: this only works when you can predict the aggregate the model needs, which means either a separate `query_orders_summary` tool or heuristics about which questions warrant which shape.

### Tactic 3: paginate with a follow-up tool

For genuinely row-by-row work — "find the order where the customer complained about a wrong SKU" — neither truncation nor summarization helps, because the model needs to actually look at individual rows, just not all 5,412 at once:

```python
class QueryOrdersPageArgs(BaseModel):
    status: str
    since: str
    cursor: str | None = None

@register("query_orders_page", QueryOrdersPageArgs, tier="read")
def query_orders_page(ctx, args):
    page = db.orders.filter(status=args.status, created_after=args.since, owner_id=ctx.user_id) \
                     .paginate(cursor=args.cursor, page_size=25)
    rows = [f"  {o.id}  {o.created_at.date()}  ${o.total_cents/100:.2f}" for o in page.items]
    result = f"{len(page.items)} orders (page):\n" + "\n".join(rows)
    if page.next_cursor:
        result += f"\n\nMore results available — call again with cursor='{page.next_cursor}'."
    return result
```

> **Why this step?** The model can now call this repeatedly, reading 25 rows at a time and deciding after each page whether it's found what it's looking for — most searches stop well before row 5,412. This trades one big result for several small ones, which costs more round trips but far less total context, since a good search often doesn't need every page.

## Where it breaks (+fix)

The truncation version breaks when the model needs an answer that genuinely depends on rows outside the visible slice — "which order was the largest" when the largest one isn't in the most-recent-50 window. It'll confidently answer from the truncated set, which is wrong, not incomplete-and-honest. The fix is picking the right tactic for the question, not just applying truncation everywhere: sort truncation by the dimension the question cares about (`order_by("-total_cents")` for "largest order," not `-created_at`), or push the actual question ("what's the largest order") down into a summary-style aggregate instead of truncating and hoping the answer is in the visible slice.

The summarization version breaks when the model's next question wasn't anticipated by the aggregate you computed — it asked for average value, now it wants the median, and the tool has no rows to compute it from. There's no clean fix beyond exposing a couple of the aggregates you can predict being useful and falling back to pagination for anything else.

## Takeaways

- Match the tactic to the question the tool call is actually in service of: truncation for "show me some," summarization for "tell me an aggregate," pagination for "let me look through them."
- Never truncate silently — a count of what's hidden and how to get more (`Use offset=` / a cursor) turns a lossy result into an honest partial one the model can reason about correctly.
- Server-side summarization is the cheapest fix when it applies — it avoids the token cost entirely rather than trading it for round trips, and [Caching Tool Results Across Calls](/learn/tools-function-calling/caching-tool-results) can make a repeated aggregate call near-free on top of that.
- All three tactics are really the same idea as [Returning Results the Model Can Use](/learn/tools-function-calling/returning-results-to-the-model) applied under volume: keep the signal, cut the noise, and never hide the fact that you cut something.

**Related:** [Returning Results the Model Can Use](/learn/tools-function-calling/returning-results-to-the-model), [Caching Tool Results Across Calls](/learn/tools-function-calling/caching-tool-results), [Sequential, Multi-Step Tool Use](/learn/tools-function-calling/sequential-multi-step-tool-use), [Token Cost of Tool Schemas](/learn/tools-function-calling/token-cost-of-tool-schemas)
