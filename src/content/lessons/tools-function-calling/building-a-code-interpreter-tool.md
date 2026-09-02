---
title: "Building a Sandboxed Code Interpreter"
track: "tools-function-calling"
status: live
summary: "Wire a run_python tool into a real container sandbox and watch the model fix its own traceback without help."
duration: "8 min read"
---

A code-execution tool is only as good as the boundary around it. This lesson builds the whole thing: schema, container execution, result formatting, and a live example of the model debugging its own code from a returned traceback.

## What we're building

A `run_python` tool backed by a real sandbox (a container, per [Sandboxing Tool Execution](/learn/tools-function-calling/sandboxing-tool-execution)), wired into a normal tool-call loop, that returns stdout/stderr/traceback to the model — plus a demonstration of the model reading its own error and correcting the code without you intervening.

## Setup

Assume a working tool-call loop already exists (see [The Tool Call Loop](/learn/tools-function-calling/the-tool-call-loop) if not), Docker or an equivalent container runtime is available, and there's a directory the container can mount read-only for input data. We'll shell out to a locked-down container for clarity here — swap in a managed microVM sandbox provider for production; the tool-call contract is identical either way.

### Step 1: Define the tool schema

```json
{
  "name": "run_python",
  "description": "Execute Python 3.11 in an isolated sandbox with pandas and numpy preinstalled. No network access. 30 second time limit. stdout is truncated at 4000 characters.",
  "input_schema": {
    "type": "object",
    "properties": {
      "code": { "type": "string", "description": "Python source to execute." }
    },
    "required": ["code"]
  }
}
```

> **Why this step?** The description does real work: it tells the model exactly what's available (pandas, numpy) and exactly what isn't (network), so it doesn't burn a call discovering the sandbox's limits the hard way.

### Step 2: Run the code inside a locked-down container

```python
import subprocess, tempfile, os

def run_python_sandboxed(code: str, data_dir: str) -> dict:
    with tempfile.TemporaryDirectory() as scratch:
        script_path = os.path.join(scratch, "script.py")
        with open(script_path, "w") as f:
            f.write(code)

        result = subprocess.run(
            [
                "docker", "run", "--rm",
                "--network", "none",              # no network, full stop
                "--memory", "512m", "--cpus", "1",
                "--read-only",
                "-v", f"{scratch}:/workspace:ro",
                "-v", f"{data_dir}:/data:ro",      # input data, read-only
                "--workdir", "/workspace",
                "python:3.11-slim",
                "python", "script.py",
            ],
            capture_output=True, text=True, timeout=30,
        )
        return {
            "stdout": result.stdout[:4000],
            "stderr": result.stderr[:4000],
            "exit_code": result.returncode,
        }
```

> **Why this step?** Every flag here is a boundary, not an optimization: `--network none` closes exfiltration, `--memory`/`--cpus` cap runaway resource use, `--read-only` plus a read-only mount means the script can't persist anything outside the container, and the `timeout=30` on the Python side backstops a container that ignores its own limits.

### Step 3: Feed the result back into the loop

```python
import json

def handle_tool_call(tool_call, data_dir):
    if tool_call.name == "run_python":
        try:
            result = run_python_sandboxed(tool_call.input["code"], data_dir)
        except subprocess.TimeoutExpired:
            result = {"stdout": "", "stderr": "Execution timed out after 30s.", "exit_code": -1}
        return {
            "type": "tool_result",
            "tool_use_id": tool_call.id,
            "content": json.dumps(result),
        }
```

> **Why this step?** Return the traceback as-is in `stderr` rather than collapsing it to `"execution failed"` — see [Returning Tool Results to the Model](/learn/tools-function-calling/returning-tool-results-to-the-model). A traceback is the single most useful piece of context the model can get for fixing its own code.

### Step 4: Let it self-correct

Give it a task with a deliberately tricky column name and watch it recover:

```
Turn 1 — model writes:
    df = pd.read_csv("/data/orders.csv")
    print(df["revenue"].sum())

Tool result:
    stderr: "KeyError: 'revenue'"

Turn 2 — model writes:
    df = pd.read_csv("/data/orders.csv")
    print(df.columns.tolist())

Tool result:
    stdout: "['order_id', 'total', 'region', 'customer']"

Turn 3 — model writes:
    df = pd.read_csv("/data/orders.csv")
    print(df["total"].sum())

Tool result:
    stdout: "48213.55"

Model: "Total revenue across all orders is $48,213.55."
```

No human intervened between turns 1 and 3 — the traceback alone was enough for the model to probe the real schema and correct its assumption. This is [self-correction](/learn/tools-function-calling/self-correction-on-bad-tool-calls) working as intended, and it's a big part of why code-execution tools are so effective: the failure mode (a traceback) is legible to the model in a way a generic `"tool failed"` string never is.

## Run it

Wire the loop: send the schema, get a `run_python` call back, execute it with `handle_tool_call`, append the result, call the model again, repeat until it stops calling tools. Cap iterations (see [Infinite Loops and Retry Caps](/learn/tools-function-calling/infinite-loop-and-retry-caps)) so a script that keeps failing doesn't run forever.

## Harden it

- Drop `--read-only` only for a designated `/output` mount if the tool needs to produce files, and size-check or scan anything written there before treating it as an artifact reference.
- Pin the base image and package versions — an interpreter that silently upgrades between runs makes bugs unreproducible.
- Log every `code` string and its result the same way you'd log any tool call — see [Debugging With Trace Logging](/learn/tools-function-calling/debugging-with-trace-logging). Code-execution transcripts are the highest-value ones to have when something goes wrong.
- Never mount your actual working directory. Copy in only the specific files the task needs.

## Extend it

- Return a stable reference (an id, not raw bytes) for generated artifacts like plots, and let the model ask for a rendered preview on a follow-up call instead of dumping binary data into context — see [Formatting Large Tool Results](/learn/tools-function-calling/formatting-large-tool-results).
- Preload a small allowlisted package set per session rather than installing on demand, so execution time stays predictable.
- If you need to scale past a handful of concurrent users, look at a managed microVM sandbox provider instead of raw Docker — see [Sandboxing With Containers](/learn/tools-function-calling/sandboxing-with-containers) for the comparison.

**Related:** [Sandboxing Tool Execution](/learn/tools-function-calling/sandboxing-tool-execution), [Self-Correction on Bad Tool Calls](/learn/tools-function-calling/self-correction-on-bad-tool-calls), [Code Execution as a Tool](/learn/tools-function-calling/code-execution-as-a-tool), [Debugging With Trace Logging](/learn/tools-function-calling/debugging-with-trace-logging)
