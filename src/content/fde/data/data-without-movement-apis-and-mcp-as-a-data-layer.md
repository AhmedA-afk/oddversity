---
title: "Data without movement: APIs and MCP as the data layer"
phase: data
module: identity-permissions-residency
kind: lesson
summary: "Copying data into a warehouse is not the only pattern, and in a residency-sensitive or fast-moving deployment it is often the wrong one. Here is when to query systems live through APIs and MCP instead of pipelining them, and what that trades away."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Decide, for a given source system, whether to pipeline its data or query it live, and justify the choice.
  - Explain what an MCP server is doing at the data layer, and when a plain internal function is simpler.
  - Name the two costs — latency and complexity — that a data-without-movement design pays for its residency and freshness benefits.
artifact: A one-page comparison, for one real system in your current project, of the pipeline approach versus the live-query approach, with a stated recommendation.
sources:
  - "https://www.zenml.io/llmops-database/forward-deployed-engineering-for-enterprise-llm-deployments"
---

Every lesson in this module so far has assumed you are moving data: extracting it, landing it in bronze, conforming it into silver, shaping it into gold. That is the right default for most reporting and analytics work, and it is what most of this phase has taught. It is not the only pattern, and treating it as the only one leads to unnecessary pipelines in exactly the deployments where you can least afford them — the residency-sensitive ones from the previous two lessons, and the ones where the source system changes faster than a nightly sync can track.

## The alternative: query live, do not copy

Instead of extracting a system's data into your own store, you build a thin data layer — an API your application calls, or an MCP server a model calls — that reaches into the source system at query time and returns exactly what was asked for, with nothing persisted on your side. Researchers looking at how OpenAI's Forward Deployed teams build for customers describe exactly this shift for an APAC automotive supply-chain deployment: rather than pipelining a partner's inventory data into a warehouse, the architecture called out to live APIs at decision time, with MCP explicitly named as a starting point for that kind of data connectivity — one usually extended with custom tooling once the shape of the real integration is clear, not treated as a finished product on day one.

The appeal is direct. Nothing is copied, so there is no second copy of personal or sensitive data to secure, retain correctly, or explain in a residency conversation. Nothing goes stale, because every query hits the live system. And nothing needs a sync schedule, a watermark, or a reconciliation job, because there is no second store to keep consistent with the first.

## What an MCP server actually is at this layer

Strip away the protocol details and an MCP server exposing a data source is a small, well-scoped API: a handful of named tools, each with a typed input and a typed output, that a model can call. For a data-without-movement design, the tools are usually thin wrappers around the source system's own API or database, with two things added that the raw source rarely has itself: a shape the model can reliably reason about, and a permission check that runs on every call.

```python
"""A minimal MCP-style tool exposing read-only, permission-checked access
to an ERP's order status, without ever copying order data anywhere."""
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("erp-order-status")

@mcp.tool()
def get_order_status(order_id: str, caller_customer_code: str) -> dict:
    """Return the current status of one order, if the caller is allowed to see it."""
    order = erp_client.fetch_order(order_id)          # live call to the source system
    if order is None:
        return {"error": "not_found"}
    if order["customer_code"] != caller_customer_code:
        return {"error": "not_authorised"}              # same discipline as the RBAC lesson
    return {
        "order_id": order["order_id"],
        "status": order["status"],
        "last_updated": order["last_updated"],
    }
```

Notice what is absent: no local table, no cache, no scheduled job. Every call is a live read, and the permission check happens on every call rather than once at ingestion time — which matters, because a customer whose ERP access was revoked mid-session should lose access to this tool immediately, not whenever the next sync happens to run.

## When a plain function is simpler than an MCP server

MCP earns its place when the caller is a model that needs to discover and choose between several tools dynamically, or when the same data layer needs to be reused across several different agents or applications with a standard interface. If you have one application, calling one system, in one well-defined way, a plain internal function or a direct REST endpoint does the same job with less infrastructure: no protocol server to run, no schema to keep in sync with a separate spec, one fewer thing to explain in a handover document. Reach for MCP when the interface genuinely needs to be exposed to a model as a discoverable tool, or shared across more than one consumer — not by default, because it is the pattern the industry is currently talking about.

## What this design pays for its benefits

Two costs, and both are real enough to weigh deliberately rather than assume away.

**Latency.** A live call to a source system, especially one behind a corporate network, a VPN hop, or a rate-limited API, is slower than a query against your own well-indexed copy. If a use case needs to aggregate across thousands of records in under a second — the kind of query the gold layer from the medallion-architecture lesson exists to serve fast — live querying every source on every request will not meet that bar, and pipelining some or all of the data remains the right answer.

**Complexity per source, not amortised.** A pipeline pays its integration cost once, at build time, and then serves every downstream query from one clean copy. A live-query layer pays a version of that cost on every call — handling the source system's own rate limits, transient failures, and quirks (the same connector-specific lying that the SharePoint, Salesforce, and SAP lessons in this module catalogue) at request time, under whatever latency budget the calling application has. Retry and backoff logic, covered later in this path, becomes load-bearing rather than a nicety, because a live data layer that cannot gracefully handle the source system's occasional bad day will surface that failure directly to a user or a model mid-conversation.

## The decision, in practice

Ask three questions of any source system before choosing a pattern. Does the use case need this data faster than a live call to the source can return it? Does the data need to be joined, aggregated, or historically compared across records in a way a single live call cannot do cheaply? Does keeping a copy create a residency, retention, or consent problem that not copying it would avoid? Two or more "yes" answers point toward a pipeline. A source that is queried rarely, at low volume, where freshness matters and a copy would only add a compliance question, points toward a live data layer instead.

Most real deployments end up with both: pipelined gold tables for the reporting and retrieval workloads that need speed and joins, and a handful of live MCP tools or API calls for the specific, low-volume, freshness-sensitive questions — "what is this order's status right now" — where a stale copy would actively mislead the person asking.

## What you can now do

You can choose, for a given source system, between pipelining its data and querying it live, with a stated reason rather than a default habit, and you can explain to a customer's security team why a specific integration was built as a permission-checked live call rather than a copy — a distinction that matters directly to every residency and consent question raised earlier in this module. This closes out the data phase's identity and residency module; the AI phase that follows builds retrieval and agent tooling on top of exactly this judgment call.
