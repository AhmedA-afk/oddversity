---
title: "Debugging MCP: Check Yourself"
track: "mcp"
status: live
summary: "Five diagnostic scenarios where the symptom points at the wrong layer, and the reasoning that gets to the real cause."
duration: "7 min read"
---

## 1. Where to start

Your server does not appear in the client. What is the first thing to do?

- **A.** Rewrite the client config with different path formats until it works.
- **B.** Run the server directly, then under the inspector, then read the client's log.
- **C.** Reinstall the client.
- **D.** Add verbose logging to every tool and try again.

<details><summary>Answer</summary>

**Correct: B.** The client is the layer with the least diagnostic output — it reports a stdout write, a crashed process, a bad path and a protocol error identically. Each rung of the ladder eliminates a class of cause. **A** is guessing, and it is where most debugging time is lost. **C** treats a configuration problem as an installation one. **D** logging inside tools tells you nothing about a server that never started, and if it logs to stdout it creates a second bug.

</details>

## 2. The one-tool killer

Three tools work; the fourth kills the connection every time. Under the inspector, calling it produces a JSON parse error rather than a tool error.

- **A.** That tool's return value is not serialisable.
- **B.** Something on that code path writes to stdout, corrupting the protocol stream.
- **C.** That tool's schema is invalid.
- **D.** The tool exceeds a protocol size limit.

<details><summary>Answer</summary>

**Correct: B.** A *parse* error means the transport framing broke, not that the tool failed — the distinction is the whole clue. Note it is often not your own `print()` but a dependency emitting a warning to stdout on that particular input shape. **A** a serialisation failure surfaces as a tool error with a traceback. **C** an invalid schema fails at listing time, affecting all tools. **D** an oversized result degrades the conversation; it does not break framing.

</details>

## 3. The client-specific silence

Your server works in your client. In a colleague's, one tool returns nothing and the assistant carries on. The inspector shows the tool working correctly.

- **A.** Their client is caching an old tool list.
- **B.** The tool depends on a capability their client did not announce — sampling or elicitation.
- **C.** Their machine lacks a dependency.
- **D.** They are on a different protocol version and need to upgrade.

<details><summary>Answer</summary>

**Correct: B.** Failure that correlates with the client rather than the input points at negotiation. Capabilities are announced at initialisation precisely because implementations differ; using one that was not announced fails quietly. Check, and degrade. **A** a stale list would show missing or renamed tools, not a silent no-op. **C** a missing dependency raises on their side and the inspector would fail there too. **D** possible, but the specific silence on one tool while others work points at a capability, not a version.

</details>

## 4. The failure that never errors

Users complain the assistant answers billing questions from general knowledge. Every tool works. Every test passes. Nothing errors anywhere.

- **A.** Increase the model's temperature so it explores tools more.
- **B.** Read the trace to see which tools were offered and what their descriptions said — this is almost always a selection problem.
- **C.** Reduce the number of tools until it picks the right one.
- **D.** Add a system prompt listing which tool to use for which topic.

<details><summary>Answer</summary>

**Correct: B.** The most common production MCP failure is the right tool never being called, and it raises nothing. The trace shows what the model had to choose from; the fix is nearly always a description that says *when* to use the tool and what it excludes. **A** temperature affects sampling, not the quality of the information the choice is made from. **C** sometimes helps by accident and does not address why the description was ambiguous. **D** costs tokens on every request and leaves the ambiguity in place for every other client.

</details>

## 5. The cheapest test

You can write exactly one automated test for your MCP server. Which catches the most?

- **A.** A unit test of each tool's business logic.
- **B.** A test that starts the server, lists the tools, and calls each with a valid input, asserting no error and a bounded result size.
- **C.** A test that the client config file is valid JSON.
- **D.** A load test at a hundred concurrent calls.

<details><summary>Answer</summary>

**Correct: B.** It exercises the wiring, which is where MCP servers actually break: startup, stdout pollution, tool registration, schema changes, handler errors and result growth. **A** valuable, and it passes happily while the server fails to start at all. **C** catches one narrow class and nothing about the server. **D** load is a real concern for hosted servers and not the first failure you will hit.

</details>

---

Next: [four failures worked through](/learn/mcp/mcp-debugging-worked-example) and [the cheatsheet](/learn/mcp/mcp-debugging-cheatsheet).
