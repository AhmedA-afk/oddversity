---
title: "Turning a Vague Product Ask Into a Buildable Spec"
track: "genai-app-dev"
status: live
summary: "Walk 'make it summarize tickets' through five questions until it's an actual spec you can hand to yourself and start coding."
duration: "6 min read"
---

"Make it summarize tickets" is not a spec. It's five specs wearing a trenchcoat, and which one you build depends entirely on questions nobody asked yet.

## The setup

The ask, verbatim, from a product conversation: *"Can we make it summarize tickets? Support agents are spending too long reading through long threads."* That's the whole brief. Everything below turns it into something you could actually open an editor and start building.

## Step by step

### 1. The ask, as given

```text
"Make it summarize tickets."
```

> **Why this step?** Write the ask down exactly as received, before touching it. It's tempting to jump straight to an interpretation — you'll lose track of which parts were actually said versus assumed if you don't anchor to the original wording first.

### 2. Pin down the input

*Question: one ticket at a time, or a whole queue? A single message, or the full thread?*

```text
Answer (from the PM): one ticket, full thread, at the moment an agent opens it.
```

```text
inputs: { ticketId: string, messages: { author: "customer"|"agent", body: string, ts: string }[] }
```

> **Why this step?** "A ticket" is ambiguous between one message and an entire back-and-forth. The two inputs are wildly different sizes and call for different prompt strategies — you cannot write the prompt, pick a context-window strategy, or estimate cost until this is resolved.

### 3. Pin down the output shape

*Question: a paragraph an agent reads, or structured data the UI can render distinctly (a badge, a sentiment icon)?*

```text
Answer: structured — the UI team wants to show priority as a colored badge, not parse it out of prose.
```

```json
{ "summary": "string, 1-3 sentences", "priority": "low" | "medium" | "high", "openQuestion": "string | null" }
```

> **Why this step?** "Summarize" alone tells you nothing about whether downstream code parses a string or reads typed fields. Nailing the shape now is what makes [structured output validation](/learn/genai-app-dev/structured-output-in-apps) buildable later — you can't validate a shape nobody specified.

### 4. Pin down success

*Question: how will you know this is actually helping, not just shipping?*

```text
Answer: an agent should be able to act on a ticket without opening the full
thread more than half the time.
```

> **Why this step?** Without a success criterion, "summarize tickets" can never be judged done — it can only be judged shipped. This is also the number a later eval or A/B test measures against, so write it down now even though you won't build the eval until much later in this course.

### 5. Pin down the ceiling

*Question: what's too slow, and what's too expensive, per summary?*

```text
Answer: agents open ~40 tickets/day each; anything over ~3s per summary
feels like a wait, and the team's rough budget is a small fraction of a
cent per ticket, not per agent-day.
```

> **Why this step?** These numbers don't need to be precise on day one, but they need to exist — a feature with no latency or cost ceiling can't be evaluated against real usage, and "make it fast and cheap" isn't a number anyone can build against. [Latency Budgets for LLM Features](/learn/genai-app-dev/latency-budgets-for-llm-features) and [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking) are where these ceilings get turned into actual guardrails in code.

### 6. Pin down the failure behavior

*Question: what does the agent see if the call fails, times out, or comes back malformed?*

```text
Answer: show the full thread with summarization disabled for that ticket —
never a blank panel, never a spinner with no timeout.
```

> **Why this step?** This is the question first features skip most often, and it's the one whose absence is most visible in production — a feature with no defined failure behavior doesn't fail gracefully, it fails as a blank screen or a hang. [Antipatterns in Your First GenAI Feature](/learn/genai-app-dev/first-genai-feature-antipatterns) is built entirely around gaps like this one.

### 7. Assemble the spec

```text
FEATURE: Ticket Summary
Input:    { ticketId, messages: {author, body, ts}[] }, full thread, on ticket open
Output:   { summary: string (1-3 sentences), priority: low|medium|high, openQuestion: string|null }
Success:  agent acts without opening full thread on >50% of tickets
Latency:  <3s per summary
Cost:     small fraction of a cent per ticket (confirm exact ceiling with finance)
Failure:  fall back to full thread view, summarization silently disabled;
          never a blank panel or unbounded spinner
```

That block is the whole deliverable of this exercise — five one-line answers, assembled into something you could hand to yourself next sprint and start building from immediately.

## Where it breaks

- **Skipping the failure-behavior question because "it'll probably just work."** This is the single most common gap, and it's invisible until the first timeout or malformed response in production — at which point the fix is a scramble instead of a design decision. Fix: never let a spec leave this step without an explicit failure answer, even a rough one.
- **Treating "structured output" as decided once you've picked a shape, without checking it against the UI's real needs.** A shape chosen in isolation from the team that renders it gets renegotiated mid-build. Fix: confirm the output shape with whoever consumes it before writing the prompt around it.
- **Leaving latency and cost as "we'll see."** Without a ceiling, there's no way to tell a 3-second call that costs a fraction of a cent from a 12-second call that costs ten times as much — both will "work" in a demo. Fix: write down a number, even a rough one; refine it once you have real usage data.

## Takeaways

- A vague ask decomposes into five concrete questions: input shape, output shape, success criterion, latency/cost ceiling, failure behavior. Answer all five before opening an editor.
- The assembled spec in step 7 is a reusable template — the same five fields apply to nearly any GenAI feature, not just ticket summarization, and this is the template the module's capstone-style project work reuses.
- This spec is the input to everything else in this module: the [message envelope](/learn/genai-app-dev/messages-roles-and-the-prompt-envelope) you build follows from the input/output shape, and the [checklist](/learn/genai-app-dev/genai-feature-starter-checklist) at the end of this module assumes a spec like this one already exists.

**Related:** [The Whole Game: Build a Support-Reply Drafter End to End](/learn/genai-app-dev/the-whole-game-genai-feature-tour), [Structured Output in Apps](/learn/genai-app-dev/structured-output-in-apps), [Latency Budgets for LLM Features](/learn/genai-app-dev/latency-budgets-for-llm-features), [Antipatterns in Your First GenAI Feature](/learn/genai-app-dev/first-genai-feature-antipatterns)
