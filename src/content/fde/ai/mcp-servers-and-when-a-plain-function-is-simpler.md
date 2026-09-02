---
title: "MCP servers, and when a plain function is simpler"
phase: ai
module: prompts-and-structure
kind: lesson
summary: "MCP turns a tool into something any compatible model client can discover and call, not just the one agent you wrote it for. That is worth the overhead exactly when more than one thing needs it, and not before."
duration: 11 min
updated: "2026-09-02"
outcomes:
  - Explain what an MCP server exposes that a plain function call does not.
  - Decide, for a given tool, whether it belongs behind MCP or as a plain function in your own agent loop.
  - Sketch a minimal MCP server for one customer-system action, and name what a customer's security team would ask about it.
artifact: A one-page decision note applying the MCP-versus-function test to three tools from labs you have already built in this path, with a reason for each answer.
sources:
  - https://job-boards.greenhouse.io/anthropic/jobs/5302966008
  - https://roadmap.sh/forward-deployed-engineer
  - https://www.krishnaik.in/liveclass2/Forward_Deployed_Engineer?id=14
---

Model Context Protocol answers a specific problem: how does a model-calling client discover what tools and data sources are available, without you hand-wiring the connection every time. It is genuinely useful, and it is also currently the most over-applied pattern in AI engineering — reached for by default when a fifteen-line function inside your own agent loop would do the same job with a fraction of the moving parts. Knowing which situation you are in is the actual skill.

## What MCP is, in one paragraph

MCP is a protocol, not a library. An MCP server exposes a set of tools, resources, and prompts over a standard interface; any MCP-compatible client — a chat client, an IDE, another agent — can connect to that server, discover what it offers, and call it, without the server author having to know in advance who will connect or write custom integration code for each one. The server owns authentication to the underlying system, the actual implementation of each tool, and the schema it exposes. The client owns deciding when to call it.

```python
from mcp.server import Server
from mcp.types import Tool

server = Server("procurement-tools")

@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="check_supplier_lead_time",
            description="Look up current lead time in days for a supplier and part number.",
            inputSchema={
                "type": "object",
                "properties": {
                    "supplier_id": {"type": "string"},
                    "part_number": {"type": "string"},
                },
                "required": ["supplier_id", "part_number"],
            },
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> dict:
    if name == "check_supplier_lead_time":
        return query_procurement_db(arguments["supplier_id"], arguments["part_number"])
    raise ValueError(f"Unknown tool: {name}")
```

Notice this is the same tool from the previous lesson, wrapped in a server rather than called directly inside one agent's loop. The tool logic did not change. What changed is who can reach it and how.

## When the overhead earns its keep

Build an MCP server when at least one of these is true:

- **More than one client needs the same tool.** A support agent, an internal ops dashboard's AI assistant, and a customer's own IDE-based coding agent all need to check supplier lead times. Writing the integration once, behind a protocol every client already speaks, beats writing it three times.
- **The tool should be discoverable, not hard-wired.** A general-purpose assistant that customers configure themselves benefits from a catalogue of available servers they can turn on, rather than a fixed list of functions you compiled at build time.
- **The customer's own engineers, or a future agent you have not built yet, will plausibly want the same access.** Anthropic's own FDE postings list MCP servers first among concrete deliverables, precisely because a well-built server becomes reusable across an engagement and often across the next one — it is infrastructure, not a one-off integration.
- **You are exposing a whole system's worth of capability, not one call.** A server wrapping a customer's ticketing system with several related tools — create, search, update, close — is a coherent unit worth packaging together.

## When a plain function is simpler, and correct

Reach for a plain function inside your own agent loop instead when:

- **Exactly one agent, in one codebase, needs this tool, for this engagement.** The protocol overhead — server process, transport, schema registration, a second thing to deploy and monitor — buys you reusability you are not going to use.
- **You are still in the feasibility or prototyping stage.** Wrapping every candidate tool in an MCP server before you know which ones survive contact with the eval set front-loads infrastructure work on tools you may delete next week.
- **The tool needs tight, synchronous control inside a single loop's error handling**, such as the retry-with-diagnosis pattern from the structured-outputs lesson — a plain function call keeps that logic in one place instead of split across a client and a server boundary.

The roadmap.sh station on this exact judgment call frames it well: know when MCP is useful, and know when a normal internal function is simpler. The honest default for a first build, in most engagements, is the plain function — you promote it to an MCP server later, once you know the tool has earned reuse, not before.

## What a customer's security team will ask

If you do build a server, expect these questions in the security review, because they come up in every customer environment: what authenticates a client to this server, and is it scoped per user or is it one shared credential; what happens if a malicious or misconfigured client connects — does the server trust every caller, or does it enforce its own permission checks independent of what the client claims about the user; and where does this server run — inside the customer's perimeter, reachable only from their network, or exposed more broadly than the sensitivity of what it touches warrants. An MCP server that proxies write access to a production system without enforcing its own authorisation is a bigger attack surface than the plain function it replaced, not a smaller one, and a good security reviewer will find that in minutes.

## What you should be able to do now

Given a tool you have already built for one agent, you should be able to say plainly whether it belongs behind MCP, and defend that answer with "who else needs this" rather than "MCP is the modern way to do it".

Build the artifact now: take three tools from labs earlier in this path, apply the test above to each, and write one sentence per tool giving your answer and the specific reason — reuse across clients, discoverability, or the opposite, a single tight loop that does not need the protocol.
