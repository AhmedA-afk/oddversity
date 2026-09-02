---
title: "Execution Safety Mistakes"
track: "tools-function-calling"
status: live
summary: "The dangerous defaults in tool execution — eval, unsandboxed shells, over-broad credentials, leaky errors, cached writes — and their fixes."
duration: "7 min read"
---

Every mistake below shipped somewhere because it's the *easy* version of the correct thing — the code that runs on the first try, without the extra step that makes it safe. Recognizing the pattern is most of the fix.

### The mistake: eval-ing the model's output to dispatch a call

**Why it's wrong:** `eval(f"{tool_call.name}({tool_call.input})")`, or any variant of building an executable statement out of the model's text, collapses the entire boundary described in [From tool_call to Function Call](/learn/tools-function-calling/execution-authority-model) into a single line. There's no registry lookup to reject an unknown tool name, no validation step, no way to intercept the call before it runs — the model's text *is* the executed code.

**Symptom:** the system works fine in every demo, because the model reliably emits well-formed calls to real tools. It fails catastrophically the one time it doesn't — a hallucinated tool name that happens to collide with a builtin, or arguments crafted (via [injected content](/learn/tools-function-calling/tool-results-as-injection-vector)) to break out of the expected call shape entirely.

**Fix:** always dispatch through a registry lookup by name, with a typed handler and explicit argument validation — the pattern built in [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher). If you find yourself writing `eval`, `exec`, or string-formatting a shell command from model output anywhere in the dispatch path, that's the boundary failing, not an implementation detail.

### The mistake: an unsandboxed shell or code-execution tool

**Why it's wrong:** a `run_shell(command: str)` tool that calls `subprocess.run(args.command, shell=True)` directly on the host inherits the host's filesystem, network, and process privileges. Argument validation on the command string can catch patterns you thought of; it can't catch every way to reach something you didn't.

**Symptom:** works fine for the intended use ("list files in the working directory"), then one day a call reads `/etc/passwd`, or reaches an internal service over the network, or forks until the host runs out of memory — and the fix people usually reach for first (denylisting dangerous-looking strings) gets bypassed by the next creative phrasing.

**Fix:** run anything that executes code or touches the filesystem/network inside real isolation — a container at minimum, per [Sandboxing a Tool in a Container](/learn/tools-function-calling/sandboxing-with-containers), with no network, a read-only mount, dropped capabilities, and resource limits. Pick the isolation level to the trust level of the code, per [Subprocess vs. Container vs. microVM vs. WASM](/learn/tools-function-calling/sandboxing-approaches-compared) — but never "no isolation" for anything executing model- or user-influenced code.

### The mistake: one shared, full-scope credential for every tool

**Why it's wrong:** provisioning a single API key or database connection with admin rights, used by every tool regardless of what that specific tool needs, means the *agent's* authority is always the ceiling — and any authorization bug in a handler is a bug with admin-level blast radius, not a scoped one. This is the setup [The Confused-Deputy Problem](/learn/tools-function-calling/the-authority-problem) describes directly: broad agent authority plus a missed per-call check equals a deputy that can be steered past the end user's actual rights.

**Symptom:** a `get_account(account_id)` tool that forgets one ownership check doesn't fail loudly — it returns another user's data successfully, because the credential behind it was always capable of that read. Nothing errors; the bug is only visible in an audit, if you're looking for it.

**Fix:** scope credentials as tightly as the system allows — per tool, per action, ideally per user where the underlying system supports it (row-level security, scoped API tokens). Where a shared credential is unavoidable, make every handler check the *end user's* rights against your own source of truth, never a field the model supplied, as shown in the fixed example in [The Confused-Deputy Problem](/learn/tools-function-calling/the-authority-problem).

### The mistake: dumping a raw stack trace or exception into the tool result

**Why it's wrong:** an uncaught exception's `str(e)` can carry anything the underlying system chose to put in an error message — a database connection string, an internal hostname, a file path revealing your directory structure, sometimes literal credentials from a misconfigured client. That string goes straight into the model's context, and from there potentially into a user-facing response.

**Symptom:** a tool call fails, the model's next message to the user includes a fragment like `psycopg2.OperationalError: connection to server at "10.0.4.12" ... FATAL: password authentication failed for user "svc_orders"` — verbatim, because nothing sanitized it between the exception and the result block.

**Fix:** catch known exception types at the handler boundary and translate them into your own plain-language error strings, the way [Building a Registry and Dispatcher](/learn/tools-function-calling/building-a-tool-dispatcher) does — `except (LookupError, ValueError) as e: return f"error: {e}"` only where `e` is an exception *you* raised with a safe message. Never let a third-party library's raw exception text reach a [tool result](/learn/tools-function-calling/returning-results-to-the-model) unfiltered.

### The mistake: caching a side-effecting tool's result

**Why it's wrong:** as covered in [Caching Tool Results Across Calls](/learn/tools-function-calling/caching-tool-results), a cache hit is indistinguishable from a real call from the model's point of view. Caching `send_email` or `charge_card` means a repeated call can return a convincing "success" without the underlying action happening again — or, just as bad, silently happening only once when the model's transcript implies it happened every time it was called.

**Symptom:** intermittent, hard to reproduce — a customer reports they were charged once but the system's logic clearly called `charge_card` three times in the transcript (retries, a loop, a multi-step flow), and only one real charge exists, because the second and third calls hit the cache.

**Fix:** gate caching on tool tier, checked before any per-tool `cacheable` flag, exactly as shown in [Caching Tool Results Across Calls](/learn/tools-function-calling/caching-tool-results) — `write` and `irreversible` tiered tools never consult or populate a cache, full stop, regardless of how tempting the latency win looks.

## Pre-flight checklist

- [ ] Every dispatch path goes through a named registry lookup — no `eval`, `exec`, or string-built execution anywhere between the model's output and a real function call.
- [ ] Every tool that executes code, touches the filesystem, or hits the network runs inside real isolation, sized to the trust level of what it's running.
- [ ] Credentials are scoped as tightly as the system allows, and every handler checks the end user's actual rights against your own data — never a field the model supplied.
- [ ] Every error path returns a message you wrote, not a raw exception or stack trace, before it becomes a tool result.
- [ ] The cache layer checks tool tier before it checks anything else, and `write`/`irreversible` tools never touch it.

**Related:** [From tool_call to Function Call](/learn/tools-function-calling/execution-authority-model), [Sandboxing a Tool in a Container](/learn/tools-function-calling/sandboxing-with-containers), [The Confused-Deputy Problem](/learn/tools-function-calling/the-authority-problem), [Caching Tool Results Across Calls](/learn/tools-function-calling/caching-tool-results), [Returning Results the Model Can Use](/learn/tools-function-calling/returning-results-to-the-model)
