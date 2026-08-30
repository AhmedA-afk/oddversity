---
title: "Debugging and Testing MCP: Common Mistakes"
track: "mcp"
status: live
summary: "Five debugging mistakes — starting at the client, trusting a passing demo, no smoke test, never checking tool selection, and reading the answer instead of the trace."
duration: "8 min read"
---

## 1. Starting at the client

**You probably think** the client is where the problem is, because that is where you saw it.

**Why it breaks:** the client is the layer with the least diagnostic output. It shows "server disconnected" for a stdout write, a crashed process, a bad path and a protocol error alike. You end up changing config files at random.

**The correct model:** work the ladder from the bottom. Run the process directly, then the inspector, then the client. Each step eliminates a whole class of cause, and the inspector shows you actual protocol messages.

```bash
python server.py                                        # does it start
npx @modelcontextprotocol/inspector python server.py     # does it speak MCP
```

**How to spot it live:** you have edited the client config more than twice without reading a log.

## 2. Trusting a passing demo

**You probably think** a working demo means a working server.

**Why it breaks:** the demo runs for two minutes, as one user, on one client, with a fresh token, on a small dataset. Every serious MCP failure lives outside that envelope — expiry after an hour, a second user, a different client, a large result, an abnormal shutdown.

**The correct model:** test the envelope deliberately. Leave it running past a token lifetime. Try a second client. Call the tool with a large input. Kill the client without a clean exit and check for orphan processes.

**How to spot it live:** you cannot name what happens after your token expires. Then you do not know.

## 3. No smoke test

**You probably think** the server is small enough not to need tests.

**Why it breaks:** the things that break are not logic bugs, they are wiring: a dependency that starts logging to stdout, a renamed tool, a schema change, a result that grew. All invisible in review and all caught by one test that starts the server and calls everything.

**The correct model:**

```python
def test_server_smoke():
    tools = client.list_tools()
    assert {t.name for t in tools} == EXPECTED
    for name, args in SMOKE_ARGS.items():
        result = client.call_tool(name, args)
        assert not result.isError
        assert len(str(result.content)) < 8000
```

**How to spot it live:** the last three bugs were caught by a person using the assistant. All three would have been caught here.

## 4. Never testing tool selection

**You probably think** if the tools work, the server works.

**Why it breaks:** the most common production failure is not a broken tool, it is the right tool never being called. Nothing errors. The assistant answers from general knowledge and sounds fine, and you find out from a user weeks later.

**The correct model:** ten realistic questions, each with the tool that should be called. Assert the choice.

```python
CASES = [
    ("why was I charged twice", "find_account"),
    ("how do I export my data", "search_articles"),
]

def test_tool_selection():
    for question, expected in CASES:
        assert first_tool_called(run(question)) == expected
```

When it fails, the fix is nearly always the description, not the code.

**How to spot it live:** you have never looked at which tool was chosen, only at whether the answer was good.

## 5. Reading the answer instead of the trace

**You probably think** a wrong answer tells you where the problem is.

**Why it breaks:** it tells you there is one. The same wrong answer results from a tool never called, a tool returning an empty result, a tool returning too much, a swallowed error, or a correct result the model misread. These need five different fixes and look identical from the outside.

**The correct model:** for any misbehaviour, read the trace first: which tools were offered, which were called, with what arguments, what came back, and how large it was. Then form a hypothesis.

**How to spot it live:** you are editing prompts to fix something you have not localised yet.

---

Next: [four failures worked through](/learn/mcp/mcp-debugging-worked-example), and [the cheatsheet](/learn/mcp/mcp-debugging-cheatsheet).
