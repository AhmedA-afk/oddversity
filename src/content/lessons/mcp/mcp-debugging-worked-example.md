---
title: "Debugging MCP, Worked: Four Failures From Symptom to Cause"
track: "mcp"
status: live
summary: "Four real symptoms — silent non-start, connection death on one tool, a client-specific failure, and a wrong tool choice — each traced through the same diagnostic ladder."
duration: "10 min read"
---

MCP failures are unusually opaque because the client is often the only thing that can see them, and clients report them badly. The fix is a fixed ladder: reproduce outside the client, then narrow.

## The ladder

1. **Does the process start on its own?** `python server.py` in a terminal.
2. **Does it speak the protocol?** `npx @modelcontextprotocol/inspector python server.py`.
3. **Does it work in the inspector?** List tools, call each one.
4. **Does the client launch it?** Check the client's server log.
5. **Does the model choose correctly?** Read the trace, not the answer.

Most time is lost by starting at step 4.

## Failure 1 — the server that never appears

**Symptom.** Added to the client config. No server in the UI, no error dialog, nothing.

**Step 1.** `python server.py` — runs, no output, sits there. Correct: a stdio server waits on stdin.

**Step 2–3.** Inspector connects, tools list correctly, calls succeed. So the server is fine.

**Step 4.** Open the client's log:

```
spawn python ENOENT
```

**Cause.** The client's `PATH` does not contain the `python` you meant. It launches with a minimal environment — not your shell's.

**Fix.**

```json
{ "mcpServers": { "orders": {
    "command": "/Users/you/project/.venv/bin/python",
    "args": ["/Users/you/project/server.py"]
} } }
```

Absolute for both. If the log had said `can't open file 'server.py'` instead, the cause is the same class: the working directory is not yours either.

## Failure 2 — connection dies on one tool

**Symptom.** Three tools work. The fourth kills the connection every time. The tool's logic is a two-line query that runs fine in a REPL.

**Step 2.** In the inspector, call it. The output pane shows a JSON parse error rather than a tool error — the *protocol* broke, not the tool.

**Cause.** Something on that code path writes to stdout. Here it was not a `print()` — it was a data library emitting a `SettingWithCopyWarning` to stdout on that query shape only.

**How to prove it in ten seconds:**

```bash
python -c "
import server, contextlib, io
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    server.problem_tool(arg='x')
print('STDOUT LEAK:', repr(buf.getvalue()[:200]))
"
```

**Fix.** Route logging to stderr at the top of the file, and — because a dependency can still misbehave — redirect stdout defensively at startup:

```python
import sys, logging
logging.basicConfig(level=logging.INFO, stream=sys.stderr)

# Anything that writes to stdout by mistake goes to stderr instead;
# the protocol keeps the real stdout handle.
_real_stdout, sys.stdout = sys.stdout, sys.stderr
```

(Only do the swap if your framework lets you hand it `_real_stdout` explicitly. Otherwise the logging fix plus a stdout-leak test in CI is the safer version.)

## Failure 3 — works in one client, not another

**Symptom.** Everything works in your client. In a colleague's, one tool returns nothing and the assistant carries on as if it had.

**Step 3.** Inspector: the tool works.

**Step 4.** Their client's log, on that call:

```
Server requested sampling; client does not support sampling. Request ignored.
```

**Cause.** The tool asked the client's model to summarise something. Sampling is a negotiated capability, and that client does not implement it. Your server assumed it.

**Fix.** Check what was negotiated, and degrade rather than depending on it:

```python
if ctx.session.client_capabilities.sampling:
    summary = await ctx.session.create_message(...)
else:
    summary = text[:2000]        # honest fallback, stated as truncated
```

The general rule: any protocol feature beyond tools, resources and prompts needs a path for its absence.

## Failure 4 — the tool is never called

**Symptom.** No error at all. The assistant answers billing questions from general knowledge instead of calling `find_account`.

**Steps 1–4 all pass.** This is not a protocol failure, which is why it is the one people chase longest.

**Step 5.** Read the trace: which tools were offered, and what their descriptions said.

```
search_articles  — "Search the knowledge base"
find_account     — "Account lookup"
```

**Cause.** Neither description says *when*. "Why was I charged twice?" reads as a knowledge-base question, and the model has nothing to distinguish them on.

**Fix.**

```python
"""Look up one customer's account, subscription and billing history by email.

Use for questions about charges, invoices, plan changes or account status.
Does not cover product how-to questions — use search_articles for those.
"""
```

**How to verify:** ten real questions, check which tool was chosen for each. This is the cheapest eval in the whole track and almost nobody runs it.

## Symptom to cause

| Symptom | Look at |
|---|---|
| Server never appears, no error | Client log; absolute paths; `PATH` |
| Connects, dies on one tool | stdout writes on that code path |
| Connects, dies immediately | stdout write at import time |
| Works alone, fails in one client | An unnegotiated capability |
| Works, but the wrong tool is chosen | Tool descriptions |
| Works, but answers degrade after a call | Tool result size |
| Fine all day, silent overnight | Token expiry with a swallowed 401 |
| Intermittent in production only | In-memory sessions across replicas |

## The test that removes most of this

```python
def test_server_smoke():
    tools = client.list_tools()
    assert {t.name for t in tools} == EXPECTED
    for name, args in SMOKE_ARGS.items():
        result = client.call_tool(name, args)
        assert not result.isError, f"{name}: {result}"
        assert len(str(result.content)) < 8000, f"{name} result too large"
```

Startup failures, stdout pollution, schema regressions, broken handlers and oversized results — one test, an hour to write.

---

Next: [common mistakes](/learn/mcp/mcp-debugging-common-mistakes) and [the debugging cheatsheet](/learn/mcp/mcp-debugging-cheatsheet).
