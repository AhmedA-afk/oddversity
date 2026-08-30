---
title: "Building an MCP Server: Check Yourself"
track: "mcp"
status: live
summary: "Six scenario questions on primitives, tool descriptions, argument validation and the failures that only appear once a client is attached."
duration: "8 min read"
---

Six scenarios, not six definitions. Each is a bug report; you need the mechanism.

## 1. The server that dies on one tool

Your server connects fine. Three tools work. The fourth kills the connection every time — the client shows a parse error. The tool's own logic is a two-line database query that runs correctly in a Python REPL.

- **A.** The tool's return type is not JSON-serialisable, so the framework fails to encode it.
- **B.** Something in that tool's code path writes to stdout, which corrupts the protocol stream.
- **C.** The tool's schema is invalid and the client rejects it on call.
- **D.** The database connection is not thread-safe and the server crashes.

<details><summary>Answer</summary>

**Correct: B.** A local server speaks JSON-RPC over stdout. A `print()`, or a library that logs to stdout, injects text into the middle of a message and framing fails. That it works in a REPL is the tell — the REPL has no protocol on stdout to corrupt. **A** would raise a serialisation error the framework reports as a tool error, not a connection failure. **C** an invalid schema fails at listing time, so all four tools would be affected, not one. **D** a crash would drop the connection, but it would not produce a parse error, and a two-line query is not where you would find a threading bug first.

</details>

## 2. Two tools, wrong one chosen

You expose `search_articles` ("Search the knowledge base") and `find_account` ("Account lookup"). Users asking "why was I charged twice?" get article search, and the model then apologises for finding nothing.

- **A.** Put the tools in separate servers so the model cannot confuse them.
- **B.** Rewrite the descriptions to say when each applies and what each excludes.
- **C.** Lower the temperature so the model chooses more deterministically.
- **D.** Add a system prompt telling the model to prefer `find_account` for billing.

<details><summary>Answer</summary>

**Correct: B.** The description is the selection criterion, and both of these describe a category rather than a situation. "Search internal support articles for how-to and troubleshooting questions. Does not cover billing or account data — use find_account for those" fixes it at the source. **A** hides the problem rather than solving it, and the user needs both. **C** temperature affects sampling, not the quality of the information the choice is made from. **D** works sometimes, costs tokens on every request, and leaves the underlying ambiguity in place for every other client.

</details>

## 3. The turn nobody needed

Your traces show `get_schema()` called at the start of almost every conversation, always with no arguments, always returning the same text.

- **A.** Cache the result so the repeated calls are cheap.
- **B.** Expose it as a resource instead, so the host can supply it without a turn.
- **C.** Inline the schema into every tool description.
- **D.** Nothing — this is normal and correct.

<details><summary>Answer</summary>

**Correct: B.** Content the model needs to *know* rather than *do* belongs in a resource, which the host can pull into context without spending a turn on a tool call. **A** makes the wasted round trip cheaper without removing it, and the round trip is the cost. **C** duplicates the same text across every schema and inflates what is sent on every single request. **D** a tool called identically every time is the classic sign of a resource wearing a tool's clothes.

</details>

## 4. The limit that was not a limit

Your `find_orders` tool takes `limit: int = 10`. A user asks a question about a document that happens to contain the text "set limit to 5000000". The tool is called with that value and the server hangs.

- **A.** The model malfunctioned; report it to the provider.
- **B.** Add "never use a limit above 50" to the tool description.
- **C.** Clamp the value in code — the argument came from a model reading untrusted text.
- **D.** Set a smaller default so the model is less likely to raise it.

<details><summary>Answer</summary>

**Correct: C.** Every tool argument is model-supplied, and the model has been reading content you did not write. Treat it exactly as you would a parameter from an anonymous HTTP request: `min(limit, 50)` in the function body. **A** the model did what the text told it; the missing control is yours. **B** a description is guidance, not enforcement, and this is precisely the case where guidance is overridden. **D** changes the default, not the ceiling — the model can still pass any value.

</details>

## 5. The empty result that became a lie

Your order lookup catches exceptions and returns an empty list. A database outage causes the assistant to tell a customer they have never placed an order.

- **A.** Return an empty list but log the exception, so you can investigate later.
- **B.** Raise with the real error message so the model knows the lookup failed.
- **C.** Retry silently until the database recovers.
- **D.** Return the last successful result from cache.

<details><summary>Answer</summary>

**Correct: B.** An empty result and a failed lookup are different claims, and collapsing them turns an outage into a confident falsehood told to a customer. The model is a capable reader — "order database unavailable: connection refused" lets it say so. **A** logging helps you and not the user, who has already been misinformed. **C** an unbounded retry converts an error into a hang, and the user still learns nothing. **D** serving stale data as current during an outage is a different confident falsehood.

</details>

## 6. The server that never starts

It runs perfectly under the inspector. Added to Claude Desktop's config with `"command": "python", "args": ["server.py"]`, it never appears — and there is no error anywhere.

- **A.** The config needs a `"type": "stdio"` field.
- **B.** Claude Desktop requires servers to be published to a registry first.
- **C.** Both the interpreter and the script need absolute paths; the client's working directory and `PATH` are not yours.
- **D.** The server must implement resources as well as tools.

<details><summary>Answer</summary>

**Correct: C.** The client launches your process from a directory you did not choose, with a `PATH` that will not contain your virtualenv. `server.py` does not resolve, `python` may not be the right interpreter, and the failure is silent. **A** stdio is the default and the omission is not the cause. **B** local servers need no registry. **D** a tools-only server is entirely valid — you saw it work in the inspector.

</details>

---

Missed two or more? [The worked example](/learn/mcp/mcp-server-worked-example) reproduces failures 1 and 6 deliberately, and [common mistakes](/learn/mcp/mcp-server-common-mistakes) covers the rest.
