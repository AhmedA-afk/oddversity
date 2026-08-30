---
title: "MCP Debugging Cheatsheet"
track: "mcp"
status: live
summary: "The diagnostic ladder, a symptom-to-cause table, the inspector commands, log locations, and the two tests that catch most regressions."
duration: "5 min read"
---

## The ladder — always bottom-up

```bash
python server.py                                       # 1. does it start
npx @modelcontextprotocol/inspector python server.py    # 2. does it speak MCP
#   → list tools, call each one                         # 3. does it work
#   → client log                                        # 4. does the client launch it
#   → conversation trace                                # 5. does the model choose right
```

Starting at step 4 is where the time goes.

## Symptom → cause

| Symptom | Cause | Fix |
|---|---|---|
| Never appears, no error | Relative path, or `python` not on the client's `PATH` | Absolute interpreter and script paths |
| Connects, dies immediately | stdout write at import time | Logging to stderr, before other imports |
| Connects, dies on one tool | stdout write on that path (often a dependency's warning) | Same, plus a stdout-leak test |
| Works alone, silent in one client | Unnegotiated capability (sampling, elicitation) | Check capabilities; degrade |
| Right tool never called | Description says what, not when | Rewrite: when to use, what it excludes |
| Answers degrade after a call | Result too large | Truncate; state the truncation |
| Fine all day, wrong overnight | Token expiry plus a swallowed 401 | Proactive refresh; raise on 401 |
| Intermittent in production only | In-memory sessions across replicas | Shared store, or stateless |
| Orphan processes accumulate | No cleanup on abnormal exit | Handle `SIGTERM`, `SIGINT`, `atexit` |
| Everyone sees everyone's data | HTTP transport, unscoped tools | Scope every query to the principal |

## Client log locations

| Client | Where |
|---|---|
| Claude Desktop (macOS) | `~/Library/Logs/Claude/mcp*.log` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\logs\mcp*.log` |
| Claude Code | `claude mcp list`, then the session output |

```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

## Prove a stdout leak

```bash
python -c "
import server, contextlib, io
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    server.suspect_tool(arg='x')
print('LEAK:', repr(buf.getvalue()[:200]))
"
```

## The two tests worth having

```python
def test_server_smoke():
    tools = client.list_tools()
    assert {t.name for t in tools} == EXPECTED
    for name, args in SMOKE_ARGS.items():
        result = client.call_tool(name, args)
        assert not result.isError, f"{name}: {result}"
        assert len(str(result.content)) < 8000, f"{name} result too large"

def test_tool_selection():
    for question, expected in CASES:
        assert first_tool_called(run(question)) == expected
```

The first catches wiring regressions. The second catches the failure that never raises.

## Before blaming the model

- [ ] The trace shows which tools were offered.
- [ ] The trace shows which were called, with arguments.
- [ ] Tool results are under a few thousand characters.
- [ ] No tool returns an empty result where it means failure.
- [ ] Descriptions say *when*, not just *what*.

## Envelope tests the demo never runs

| Test | Catches |
|---|---|
| Leave running past the token lifetime | Expiry and refresh bugs |
| Connect a second, different client | Unnegotiated capabilities |
| Call with a deliberately huge input | Result-size and timeout problems |
| Kill the client without a clean exit | Missing cleanup, orphan processes |
| Two users at once (HTTP) | Unscoped tools, session collisions |
