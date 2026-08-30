---
title: "The Multi-Agent Context Problem"
track: "context-engineering"
status: live
summary: "Splitting work across agents doesn't remove context problems, it multiplies them at every handoff."
duration: "6 min read"
---

An agent that tries to research, write, and verify a hundred-page report in one context window eventually drowns in its own transcript. Split that job across five agents instead, and the drowning doesn't stop — it just moves. Now it happens at the seams between agents, where it's harder to see and easier to ship without noticing.

## What it is

The multi-agent context problem is that decomposing a task into multiple agents doesn't divide up a single context problem — it creates a new instance of it at every boundary. Three things go wrong, and they compound:

- **Isolation.** Each agent's context window is its own; nothing "just carries over." If a fact isn't explicitly written into the next agent's input, it doesn't exist for that agent, no matter how obvious it was to the agent that discovered it.
- **Drift.** Without a shared, authoritative context, agents working on adjacent pieces of the same task can quietly develop different readings of it — different assumptions about scope, different versions of "done."
- **Lossy handoff.** Whatever crosses from one agent to the next is smaller than what produced it. That's the point — but if the compression drops the wrong thing, the receiving agent inherits a corrupted premise instead of a clean one.

None of these are exotic failure modes. They're the default outcome of splitting work across separate context windows unless you design against them on purpose.

## The mental model

Picture two architectures for the same job — say, auditing a codebase for a class of bug.

**One bloated agent.** Everything lives in a single, ever-growing window: every file it reads, every dead end, every retry. It works, until the window fills with enough of its own history that the signal-to-noise ratio collapses and it starts missing things it saw fifty tool calls ago — the failure mode covered in [Context Rot](/learn/context-engineering/context-rot).

**A coordinated set of agents, each holding a clean window.** An orchestrator delegates each subsystem to a worker. Each worker's window contains only what its slice needs — not the other workers' traces, not the orchestrator's running commentary. Done right, no single window ever approaches the bloated agent's size, because nothing in it is dead weight.

The second architecture is not automatically better. It only wins if the connective tissue between agents — what gets handed off, in what shape, with how much left out — is designed at least as carefully as each agent's own context. A multi-agent system with sloppy handoffs is worse than the single bloated agent: it has all the same noise, plus new information loss at every seam, and no single agent holds the whole picture to notice when a handoff went wrong.

## Why it works this way

Agents don't share memory. Between calls — and certainly between separate agents — the only thing that persists is what got written into text and passed along, the same fact that makes [Conversation Memory and State](/learn/context-engineering/conversation-memory-and-state) a design problem even for a single agent across turns. Multi-agent systems just have more of these boundaries, more often, with more independent parties on either side.

That's why handoff quality is the variable that makes or breaks a multi-agent architecture. You can staff every agent with the same strong model and still get a bad result if the payload between them drops the one constraint that mattered, or if a worker returns its scratch work instead of its answer. Conversely, a chain of agents with disciplined handoffs can outperform a single agent, because each one reasons inside a window that's actually shaped for its job.

## A concrete example (shown)

Task: "Audit this repo for a specific class of auth bug." An orchestrator delegates to three workers — auth flow, session handling, and input validation — then merges what comes back.

Bad handoff, worker to orchestrator:

```text
worker_auth_result = {
  "full_trace": "<22,000 tokens of file reads, greps, and reasoning>",
  "final_note": "found something in login.py, see above"
}
```

The orchestrator now has to re-read 22k tokens to find one sentence, and it has to do that three times, once per worker. Its own context fills with material it didn't need and can't act on directly.

Good handoff, same worker:

```json
{
  "task": "audit auth flow for the reported bug class",
  "findings": [
    {
      "file": "app/auth/login.py",
      "line": 84,
      "issue": "session token compared with == instead of a constant-time check",
      "severity": "high"
    }
  ],
  "ruled_out": ["password hashing (bcrypt, correctly salted)"],
  "open_questions": []
}
```

Same underlying work, a fraction of the tokens, and the orchestrator can act on it — or forward it to a fourth agent — without re-deriving anything.

## Where it shows up

- Coding agents that split "research the codebase" from "write the fix" from "verify the fix."
- Customer-support bots that triage into specialist agents (billing, technical, account).
- RAG pipelines with a retrieval agent feeding a synthesis agent.
- Any orchestrator/worker split, which is the general shape covered in [Orchestrator-Worker Context Flow](/learn/context-engineering/orchestrator-worker-context-flow).

## Watch out for

- **Isolation isn't free.** Cutting a worker off from the parent's context stops noise, but it also stops legitimate shared facts — constraints, prior decisions — from reaching it unless you add them back deliberately. See [Subagent Context Isolation](/learn/context-engineering/subagent-context-isolation) for where that tradeoff sits.
- **The orchestrator becomes the bloated agent by another route.** If it accumulates every worker's full output "just in case," you've rebuilt the single-window failure mode with extra hops and extra latency on top.
- **No provenance, no debugging.** A handoff that states a conclusion with no pointer back to its source is unverifiable — when it's wrong three hops later, nobody can tell why.

## Where next

Handoff design is the lever that decides which of these outcomes you get — start with [Context Handoff Between Agents](/learn/context-engineering/context-handoff-between-agents-deep) for what a handoff should actually carry, then [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design) for the concrete schema.

**Related:** [Context Rot](/learn/context-engineering/context-rot), [Context Handoff Between Agents](/learn/context-engineering/context-handoff-between-agents-deep), [Subagent Context Isolation](/learn/context-engineering/subagent-context-isolation), [Orchestrator-Worker Context Flow](/learn/context-engineering/orchestrator-worker-context-flow), [Designing a Handoff Payload](/learn/context-engineering/handoff-payload-design), [Conversation Memory and State](/learn/context-engineering/conversation-memory-and-state)
