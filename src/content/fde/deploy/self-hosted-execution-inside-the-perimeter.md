---
title: "Self-hosted execution inside the perimeter, model outside"
phase: deploy
module: on-prem-and-air-gapped
kind: lesson
summary: "Most customers who say 'we need this on-prem' do not mean the model has to run on their hardware; they mean their data cannot leave, and the code that touches it has to run where they can see it. This page covers the split architecture that satisfies both: execution inside the perimeter, model reasoning outside it, through a channel narrow enough to audit."
duration: 15 min
updated: "2026-09-02"
outcomes:
  - Explain the difference between "the model runs here" and "the data and the tools run here, the model call crosses a narrow channel" to a customer's security team.
  - Design an outbound-only tunnel that lets a hosted model call tools inside a customer's network without opening an inbound port.
  - Name the three things that must never cross that channel, and how you would prove to an auditor that they do not.
sources:
  - https://business-news-today.com/anthropic-moves-claude-agents-inside-the-customer-perimeter-with-self-hosted-sandboxes-and-mcp-tunnels/
---

The instinct when a customer says "on-prem" is to reach for a self-hosted open-weight model. Sometimes that is right: a defence customer with a true air gap, discussed in the previous two lessons, may have no channel to any external API at all. But most customers asking for "on-prem" are not asking for that. They are asking for a narrower thing: **our data does not leave, and the systems that touch it are ones we can see and audit.** Whether the model's weights physically sit on their hardware is often not the actual requirement, and self-hosting a frontier-quality model well is a harder, more expensive problem than most engagements need to take on.

The pattern that satisfies the real requirement without that cost: run the tool-execution layer — the code that reads files, queries databases, calls internal APIs, and holds anything sensitive — inside the customer's perimeter, and let only the model's reasoning happen outside it, reached through a channel narrow enough that a security team can read every byte that crosses it. Anthropic's self-hosted sandbox and MCP tunnel work, described publicly in mid-2026, is exactly this shape: agent execution moves inside the customer's environment while the model call itself goes out through a controlled path.

## What actually needs to stay inside

Be precise about what "the data" means, because vague scoping here is where these conversations go wrong.

- **Raw customer records.** Patient charts, account numbers, case files, anything that is the reason the security review exists. This should never be assembled into a prompt and sent to a model outside the perimeter without an explicit, documented decision to do so.
- **Credentials and secrets.** The database password, the internal API key, the service account token. These belong to the execution layer, never to anything that crosses the channel.
- **The tool call itself, in its raw form.** "Query the claims database for policy number 88213-A" contains a real identifier. Whether that is acceptable to send outside depends on what the model needs to see to reason usefully, and is a decision to make explicitly, not by default.

What can reasonably cross the channel: the model's instructions, a redacted or summarised version of what a tool returned, and the model's response back. The design goal is to make "how much of the sensitive record actually left the building" a question you can answer precisely, not "we're not sure, ask the logs."

## The shape of the split

```
┌─────────────────────── customer perimeter ───────────────────────┐
│                                                                    │
│   customer DB / API / files          MCP tool-execution layer     │
│   ─────────────────────────►         (runs here, holds creds,     │
│                                        reads raw records)          │
│                                              │                     │
│                                              │ outbound only       │
│                                              │ (no inbound port)   │
└──────────────────────────────────────────────┼────────────────────┘
                                                │  mTLS tunnel,
                                                │  allowlisted endpoint
                                                ▼
                                    hosted model API (outside)
                                    sees: instructions, tool
                                    results as sent, nothing else
```

The execution layer initiates every connection outward. Nothing from outside the perimeter ever opens a connection in. This single property is what makes the design defensible in a security review: there is no listening port on the customer's network that an external actor could reach, which removes an entire category of question from the questionnaire in the lesson later in this phase.

## What goes in the tunnel

A minimal, auditable implementation:

```python
# inside the perimeter: an MCP server exposing exactly the tools this
# engagement needs, nothing more, over an outbound connection
from mcp.server.fastmcp import FastMCP
import psycopg

mcp = FastMCP("claims-lookup")

@mcp.tool()
def lookup_policy(policy_id: str) -> dict:
    """Return non-PII summary fields for a policy. Never returns SSN,
    DOB, or free-text adjuster notes — those stay server-side."""
    with psycopg.connect(DB_DSN) as conn:
        row = conn.execute(
            "SELECT status, coverage_type, last_updated "
            "FROM policies WHERE policy_id = %s",
            (policy_id,),
        ).fetchone()
    if row is None:
        return {"error": "not_found"}
    return {"status": row[0], "coverage_type": row[1], "last_updated": str(row[2])}
```

The redaction happens in the tool's return value, not as a policy applied after the fact by the model. `lookup_policy` was written so that a full SSN or an adjuster's free-text notes never enter a variable that could be serialised into a model call, which means there is no configuration mistake that leaks them — the tool simply does not have access to send what it does not select in the query.

The transport carrying this out is a standard outbound mTLS connection to a fixed, allowlisted endpoint — the model provider's API, or an intermediate gateway the customer's security team controls and can log independently. Nothing about MCP requires an inbound listener on the customer side; the tunnel is the execution layer dialing out, same as any outbound HTTPS call, which is why security teams that already trust outbound HTTPS to specific hosts can usually approve this pattern faster than a request for a new inbound rule.

## What to bring to the security conversation

This is the argument that gets the pattern approved, stated the way a security reviewer wants to hear it:

1. **No inbound port.** The execution layer is a client, never a server, from the perimeter's perspective. There is nothing for an external attacker to scan or connect to.
2. **A named, minimal tool surface.** Not "the agent can run arbitrary SQL," but "the agent has exactly these six tools, each one specified, each one reviewed." Show the tool list as an artifact, not a promise.
3. **A redaction boundary that lives in code, not policy.** The tool's return type is the control. A field that is never selected from the database cannot be leaked by a prompt-injection attack or a model mistake, because it was never in scope to leak.
4. **A log of every call that crossed the boundary.** Every tool invocation and every model call, timestamped, retained on the customer's side. This is the artifact an auditor asks for, and it should exist before they ask.

## Where this pattern breaks down

It does not work when the model genuinely needs the raw record to reason well — a clinical note that cannot be meaningfully summarised without losing the detail that matters, for instance. In that case the honest options are: a fully self-hosted model inside the perimeter (a real engineering and cost commitment, covered by the true air-gap lessons in this phase), or an explicit, customer-approved exception that sends the raw record out under a signed data processing agreement. Do not quietly widen the redaction boundary to make a demo work; that is the specific mistake that turns a defensible architecture into a finding in the next review.

## The FDE point

The customer's actual sentence is almost never "put the model on our servers." It is "prove to us that our data does not leave without us knowing exactly what left and why." Those are different engineering problems with very different costs, and confusing them either scares off a customer who would have accepted the cheaper answer, or ships something that fails their audit six weeks after go-live. Learning to hear which one is being asked, in the first scoping call, is worth more than knowing how to self-host any particular model.
