---
title: "MCP Primitives: Common Mistakes"
track: "mcp"
status: live
summary: "Five primitive-design mistakes — tools that should be resources, prompts nobody ships, sampling used where a tool belongs, and returning tool output nothing can read."
duration: "8 min read"
---

## 1. Everything is a tool

**You probably think** tools are the primitive and the others are optional extras.

**Why it breaks:** a tool costs a turn to invoke and a schema slot on every request. For content the model simply needs to *know*, both are pure waste — and worse, the model must decide to call it, so correctness now depends on a judgement it may get wrong on an obliquely phrased question.

**The correct model:**

- Content the model should have → **resource**
- An action, or a fetch depending on arguments the model genuinely chooses → **tool**
- A workflow you want to offer → **prompt**

**How to spot it live:** a tool called with the same arguments (often none) at the start of nearly every conversation.

## 2. No prompts at all

**You probably think** prompts are a nicety and users can type what they want.

**Why it breaks:** you know how to use your server correctly and every user reconstructs it from scratch, badly. The instructions that prevent bad outcomes — "state the clause you relied on", "decline if the policy is silent", "do not issue the refund, recommend only" — are exactly the ones a user will not think to add.

**The correct model:** ship the two or three workflows your server is for as prompts. They are the cheapest quality control available, and they cost nothing on requests where they are not used.

**How to spot it live:** your server exposes tools and zero prompts, and you find yourself explaining to colleagues how to phrase requests.

## 3. Using sampling where a tool belongs

**You probably think** sampling — the server asking the client's model to complete something — is a general way to add intelligence to a server.

**Why it breaks:** it inverts control. The client is paying for the tokens, the client's user may not expect their model invoked on the server's behalf, and not all clients support it. A server that silently requires sampling simply fails on half the clients that connect.

**The correct model:** sampling is for cases where the server genuinely needs model judgement it cannot obtain otherwise, and it must degrade gracefully when unsupported. If you can do the work in code, do it in code.

**How to spot it live:** your server works in one client and does nothing in another. Check whether you assumed a capability that was never negotiated.

## 4. Ignoring capability negotiation

**You probably think** if the protocol defines a feature, clients have it.

**Why it breaks:** clients and servers announce what they support during initialisation, precisely because implementations differ and evolve. Using an unannounced capability produces an error at the worst possible moment — mid-task, with no useful message.

**The correct model:** check what was negotiated and have a path for its absence. If elicitation is unavailable, ask for the missing value as part of the tool's error message instead.

**How to spot it live:** failures that correlate with the client rather than the input.

## 5. Tool output nothing can read

**You probably think** returning your API's response verbatim is faithful.

**Why it breaks:** a 40,000-character JSON blob consumes the context the model needed for reasoning, buries the two fields that mattered, and can push earlier content out of the window entirely. Fidelity to the upstream API is not a virtue here — the consumer is a model with a budget.

**The correct model:** return what the caller needs, truncate explicitly, and say when you have truncated.

```python
rows = fetch(query)[:50]
result = {"rows": [summarise(r) for r in rows], "returned": len(rows)}
if len(rows) == 50:
    result["note"] = "truncated to 50 rows; narrow the query for more"
```

Structured tool output is worth using where the client supports it — the client can render it rather than the model paraphrasing it.

**How to spot it live:** measure the character length of your tool results. Anything past a few thousand deserves a reason.

---

Next: [the primitives cheatsheet](/learn/mcp/mcp-primitives-cheatsheet), and [check yourself](/learn/mcp/mcp-primitives-quiz).
