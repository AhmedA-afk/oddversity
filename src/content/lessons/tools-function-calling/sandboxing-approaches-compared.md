---
title: "Subprocess vs. Container vs. microVM vs. WASM"
track: "tools-function-calling"
status: live
summary: "Four isolation levels for tool execution, compared on isolation strength, startup latency, and operational cost."
duration: "7 min read"
---

"Sandbox it" isn't one decision — it's a choice between mechanisms with genuinely different tradeoffs. Picking a heavier one than you need burns latency and ops effort for no security benefit; picking a lighter one than you need leaves a real gap for untrusted code.

## A locked-down subprocess

Running the tool's code as a plain OS process, but constrained: a restricted environment, a dedicated non-root user, `seccomp`/AppArmor profiles limiting syscalls, `ulimit` for memory and CPU, and a scoped working directory.

**How it works:** you launch the process with an intentionally minimal environment and OS-level restrictions instead of full isolation — no separate kernel, no separate filesystem namespace by default.

**When it wins:** the code being executed is code *you wrote and control* — a formatting script, a report generator, an internal utility — not arbitrary model- or user-submitted code. Startup is effectively free (no image pull, no VM boot), which matters when a tool gets called many times per session.

**Failure mode:** shares the host kernel. A kernel-level exploit, a misconfigured `seccomp` profile, or a forgotten `ulimit` and the isolation is gone — there's no second layer behind it. Not a safe default for code you don't trust.

**Relative cost:** lowest. No extra infrastructure, near-zero cold start, but the highest engineering burden to get the restrictions actually complete and correct.

## A container

Docker or a hardened container runtime (gVisor, Kata Containers) — filesystem and process namespace isolation, `--network none`, capability dropping, and resource limits, as built in [Sandboxing a Tool in a Container](/learn/tools-function-calling/sandboxing-with-containers).

**How it works:** namespaces isolate the process's view of the filesystem, network, and process table; cgroups enforce resource ceilings. Still shares the host kernel by default (plain Docker/runc), unless you're on a hardened runtime like gVisor that intercepts syscalls in userspace.

**When it wins:** the common default for tool execution — internal code-execution tools, data-processing tools, most "run this script" needs where the code isn't fully adversarial but you still want a real boundary. Good balance of isolation and operational maturity; the tooling ecosystem (image registries, orchestration, logging) is mature.

**Failure mode:** container escapes are rarer than casual conversation implies, but real — a kernel bug or a misconfigured capability (forgetting `--cap-drop ALL`, mounting `/var/run/docker.sock`) can break out to the host. Plain Docker/runc shares the kernel, so a kernel-level vulnerability affects every container on the box.

**Relative cost:** moderate. Image pulls and container startup add meaningfully more startup latency than a bare subprocess (often on the order of hundreds of milliseconds or more, depending on image size and cold vs. warm start); needs image management and periodic base-image updates as ongoing maintenance.

## A microVM

Firecracker or Cloud Hypervisor — each execution gets its own lightweight virtual machine with its own kernel. This is what sandboxed code-execution services like E2B and Modal build on.

**How it works:** true hardware-level virtualization, but stripped down and optimized for fast boot (no BIOS, minimal device model) instead of general-purpose VM emulation — the design goal is VM-grade isolation at close to container-grade speed.

**When it wins:** genuinely untrusted, arbitrary code — a "run any code the model or a random user submits" feature, a multi-tenant code-execution product, anything where you have to assume some fraction of submissions are actively adversarial. The isolation doesn't depend on kernel-level correctness the way containers do, because each microVM has its own kernel.

**Failure mode:** a VM escape is a much higher bar to pull off than a container escape, but the infrastructure to run microVMs well (a fleet manager, snapshot/restore for fast cold starts, careful resource bin-packing) is nontrivial to build or operate yourself — most teams reach for a managed provider rather than running Firecracker directly.

**Relative cost:** highest to operate well, though modern implementations get cold-start latency down to roughly the same order of magnitude as a container when snapshotting is used. Usually the right call to buy (a managed sandbox service) rather than build.

## A WASM sandbox

Compiling the tool's logic to WebAssembly and running it in a WASM runtime (Wasmtime, WasmEdge) with a capability-based interface — the code gets exactly the host functions you explicitly expose, nothing else by default.

**How it works:** WASM's execution model has no ambient access to the filesystem, network, or host process — every capability (a file handle, a network socket) has to be explicitly granted by the embedder through something like WASI. No syscalls to isolate because there's no syscall interface at all unless you build one.

**When it wins:** compute-only tools — data transforms, calculations, parsing, templating — that don't need real filesystem or network access at all. Startup is near-zero (microseconds, not milliseconds), which makes it attractive for high-frequency, latency-sensitive tool calls.

**Failure mode:** most WASM runtimes and the ecosystem of libraries compiled to WASM are less mature than container tooling, so language/library support for whatever the tool needs to do can be a real constraint, not a security one — the isolation model itself is strong specifically because it grants nothing by default.

**Relative cost:** low once you've done the work of compiling the tool to WASM; that porting cost is the real overhead, not runtime cost.

## Decision table

| Approach | Isolation strength | Startup latency | Operational cost | Best for |
|---|---|---|---|---|
| Locked-down subprocess | Low (shares kernel, no namespace isolation) | Near-zero | Low infra, high correctness burden | Your own trusted internal scripts |
| Container | Moderate–high (namespaces + cgroups; higher with gVisor/Kata) | Tens–hundreds of ms | Moderate (image + orchestration) | Default for most internal code-execution tools |
| microVM | Very high (separate kernel per execution) | Low with snapshotting, otherwise higher | High to self-operate, low if managed | Untrusted/arbitrary code, multi-tenant execution |
| WASM | Very high for what it exposes (capability-based, nothing ambient) | Near-zero | Low runtime cost, porting effort upfront | Compute-only tools, high call frequency |

## How to choose

Start from what the tool needs to touch, not from a general sense of caution. A tool that only needs to run a pure calculation belongs in WASM or a subprocess with `seccomp` — no filesystem, no network, nothing to isolate beyond CPU time. A tool that needs a real filesystem and maybe a network allowlist, running code you or your team wrote, belongs in a container — it's the default for a reason: mature tooling, adequate isolation, reasonable latency. A tool that runs code submitted by end users or by the model acting on untrusted input, where you have to assume some submissions are adversarial, belongs in a microVM — reach for a managed provider before building your own fleet manager. And regardless of which layer you pick, none of it replaces the argument validation from [Never Trust the Model's Arguments](/learn/tools-function-calling/validating-tool-arguments) or the authorization checks from [The Confused-Deputy Problem](/learn/tools-function-calling/the-authority-problem) — isolation bounds the damage of a bad call; it doesn't make bad calls acceptable to let through.

**Related:** [Sandboxing Principles](/learn/tools-function-calling/sandboxing-execution-principles), [Sandboxing a Tool in a Container](/learn/tools-function-calling/sandboxing-with-containers), [Code Execution as a Tool](/learn/tools-function-calling/code-execution-as-a-tool), [Sandboxing Tool Execution](/learn/tools-function-calling/sandboxing-tool-execution), [Computer Use and Browser Tools](/learn/tools-function-calling/computer-use-and-browser-tools)
