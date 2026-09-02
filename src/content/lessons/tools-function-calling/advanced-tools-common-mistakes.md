---
title: "Advanced-Tools Mistakes"
track: "tools-function-calling"
status: live
summary: "The highest-stakes errors in this module: unsandboxed execution, no eval before shipping, and trusting a benchmark as proof."
duration: "6 min read"
---

Every mistake in this track costs something. These five cost the most, because code execution and computer use are the two tools in the whole track with the largest blast radius when something goes wrong.

### The mistake: running code execution unsandboxed

**Why it's wrong:** a `run_python` tool without isolation is arbitrary code execution on whatever machine hosts it. There's no version of "the model is usually well-behaved" that makes this safe — a single prompt injection in a tool result, or a single bad instruction from an untrusted user, is enough.

**Symptom:** the tool works fine in every demo, because demos don't include an adversarial input. The first sign of trouble is often a machine that starts behaving strangely — high CPU, unexpected outbound connections, files appearing where they shouldn't — with no obvious tool-level error to point at.

**Fix:** run every code-execution call inside a container or microVM with no network by default, capped CPU/memory/time, and a filesystem the process can't escape — see [Sandboxing Tool Execution](/learn/tools-function-calling/sandboxing-tool-execution) and [Building a Sandboxed Code Interpreter](/learn/tools-function-calling/building-a-code-interpreter-tool). Treat "add the sandbox later" as equivalent to "ship it broken."

### The mistake: running computer use against a real, unscoped environment

**Why it's wrong:** a computer-use tool can click anything the screen allows, not just what you intended it to reach — a payment form in another tab, a logged-in admin panel, a file it wasn't supposed to see. Unlike a function-calling tool, its authority isn't bounded by a schema; it's bounded by whatever's on screen.

**Symptom:** the agent completes its actual task correctly, and also does something nobody asked for along the way — because nothing stopped it from navigating there.

**Fix:** run it in a disposable browser profile or VM scoped to exactly the task, with a domain allowlist and a step cap — see [Building a Browser-Control Loop](/learn/tools-function-calling/building-a-browser-tool-loop). Gate any consequential final action (a purchase, a submit) behind an [approval step](/learn/tools-function-calling/approval-gates-for-sensitive-tools).

### The mistake: deploying a tool-using agent with no eval at all

**Why it's wrong:** "it worked when I tried it" tests a handful of prompts you happened to think of. It says nothing about the requests you didn't think of, which are most of what real users send.

**Symptom:** the agent regresses silently after a prompt tweak, a schema change, or a model upgrade — nobody notices until a user complains, by which point you have no record of what changed or when.

**Fix:** build a labeled eval set from realistic queries and grade selection and argument correctness on every change that touches a tool or prompt — see [Building Your Own Eval Harness](/learn/tools-function-calling/building-a-tool-use-eval-harness). It doesn't need to be large to be worth having; a few dozen labeled cases catch most regressions.

### The mistake: testing only the happy path

**Why it's wrong:** the happy path is the easiest case to get right and the least representative of what breaks in production. Malformed arguments, tools that time out, and results the model has to react to are where real agents actually fail.

**Symptom:** unit tests are all green, the eval score looks fine, and the agent still falls over the first time a downstream API returns a 500 or a user gives an ambiguous request.

**Fix:** deliberately write test cases for missing fields, wrong types, empty results, and tool errors — see [Unit-Testing Handlers and Replaying Traces](/learn/tools-function-calling/unit-testing-tool-handlers). Pull the ugliest real inputs from [trace logs](/learn/tools-function-calling/debugging-with-trace-logging) rather than inventing edge cases from imagination alone.

### The mistake: trusting a BFCL score as proof the agent works

**Why it's wrong:** a public benchmark measures general tool-calling competence against its own reference tools — not your schemas, your prompts, or your error handling. A model can top the leaderboard and still underperform on requests shaped like the ones your actual users send.

**Symptom:** you pick the highest-scoring model for a model swap, ship it, and see selection accuracy on your own tools go down instead of up.

**Fix:** use BFCL as a first-pass filter, never the final check — run your own [eval harness](/learn/tools-function-calling/building-a-tool-use-eval-harness) before any model change ships, and read category-level scores rather than the aggregate — see [Reading BFCL Scores Critically](/learn/tools-function-calling/reading-bfcl-leaderboard).

## Pre-flight checklist

- [ ] Every code-execution call runs inside an isolated sandbox with no network by default, and resource/time limits enforced independently of the model's cooperation.
- [ ] Every computer-use session runs in a scoped, disposable environment with a domain allowlist and a step cap, and any consequential final action sits behind an approval gate.
- [ ] A labeled eval set exists and runs on every change to a tool schema, description, or model version — not just before major releases.
- [ ] Test cases cover malformed arguments, timeouts, and empty or error results — not only the case where everything goes right.
- [ ] Any benchmark score used to justify a model choice is read per-category, and confirmed against your own eval before the change ships.

**Related:** [Sandboxing Tool Execution](/learn/tools-function-calling/sandboxing-tool-execution), [Building Your Own Eval Harness](/learn/tools-function-calling/building-a-tool-use-eval-harness), [Reading BFCL Scores Critically](/learn/tools-function-calling/reading-bfcl-leaderboard), [Common Tool-Calling Failure Modes](/learn/tools-function-calling/common-tool-calling-failure-modes)
