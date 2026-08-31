---
title: "GenAI Feature Starter Checklist"
track: "genai-app-dev"
status: live
summary: "The message envelope shape, default params, the server-side boundary rule, and the minimum viable validation, in one screen."
duration: "5 min read"
---

Print this before you start your next GenAI feature. Everything on it is covered in depth elsewhere in this module — this page exists so you don't have to go find those lessons mid-build.

## The message envelope shape

Every call is an array of role-tagged messages, not a single string:

```ts
const messages = [
  { role: "system", content: "<the standing contract: persona, format, constraints>" },
  { role: "user", content: "<this request's specific input>" },
  // assistant turns accumulate here in a multi-turn conversation
];
```

**Start here, then measure:** system message holds anything true for every call this feature makes; user message holds anything specific to this one request. If you're tempted to put per-request data in the system message, it belongs in the user message instead. Full reasoning: [System, User, Assistant: The Message Envelope](/learn/genai-app-dev/messages-roles-and-the-prompt-envelope). Once turns start piling up across a session, see [Session, State, and Multi-Turn](/learn/genai-app-dev/session-state-multi-turn) and [Trimming Conversation History](/learn/genai-app-dev/trimming-conversation-history).

## Default params per feature type

| Feature type | temperature | Why |
|---|---|---|
| Extraction, classification, structured JSON | 0–0.2 | One correct shape exists; you want the same answer twice |
| Summarization, drafting, rewriting | 0.3–0.5 | Some variety helps phrasing, but drift should stay small |
| Brainstorming, creative copy, naming | 0.7–1.0 | Variety is the point; determinism would defeat it |

**Start here, then measure:** pick the row that matches your task, ship it, then watch real outputs before tuning further. Set `max_tokens` to roughly the longest reasonable output plus headroom — not to the model's max, which just delays a truncation failure into a latency problem. Worked comparison: [Temperature, top_p, and max_tokens in Practice](/learn/genai-app-dev/tuning-sampling-params-in-an-app); the theory underneath: [Sampling: Temperature and top_p](/learn/llm-foundations/sampling-temperature-top-p).

## The server-side boundary rule

**The model call happens on your server, never in the browser.** No exception until you've deliberately read the tradeoffs in [Client-Side Inference](/learn/genai-app-dev/client-side-inference) and decided you actually want the exception.

```text
Browser → your API route → provider          ✓ key stays server-side
Browser → provider directly                  ✗ key ships in the JS bundle
```

Why this isn't optional: [Where the LLM Boundary Belongs in Your Architecture](/learn/genai-app-dev/where-the-llm-boundary-lives). Where the key lives once it's server-side: [Handling API Keys and Secrets](/learn/genai-app-dev/handling-api-keys-and-secrets).

## Minimum viable validation + timeout

Every call needs both of these before it reaches a user, no matter how small the feature:

```ts
// 1. explicit timeout, shorter than anything above it in the stack
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 8_000);

// 2. shape check on the output before it's trusted, not just JSON.parse
const parsed = OutputSchema.safeParse(JSON.parse(result.text));
if (!parsed.success) return fallbackResponse();
```

**Start here, then measure:** an 8-second timeout and a schema check are the floor, not the finished version. Full treatment: [Structured Output in Apps](/learn/genai-app-dev/structured-output-in-apps) for validation, [Error Handling for LLM Calls](/learn/genai-app-dev/error-handling-for-llm-calls) for what happens when the timeout fires.

## Pre-ship checklist

- [ ] Spec written before code: input/output shape, success criteria, latency and cost ceiling, failure behavior — see [Turning a Vague Product Ask Into a Buildable Spec](/learn/genai-app-dev/from-product-ask-to-feature-spec)
- [ ] System vs. user content split correctly, per the envelope shape above
- [ ] `temperature` set explicitly, not left on the SDK default
- [ ] API key lives server-side only
- [ ] Every call has an explicit timeout
- [ ] Output is validated against a schema, not just checked for parseability
- [ ] Failure path shows something sane, never a blank box — see [Antipatterns in Your First GenAI Feature](/learn/genai-app-dev/first-genai-feature-antipatterns)
- [ ] Shipped behind a flag you can turn off in seconds — see [Feature Flagging AI Features](/learn/genai-app-dev/feature-flagging-ai-features)

For the full walkthrough this checklist compresses, start at [The Whole Game: Build a Support-Reply Drafter End to End](/learn/genai-app-dev/the-whole-game-genai-feature-tour), then take [Quiz: The GenAI Request Lifecycle](/learn/genai-app-dev/quiz-genai-foundations) to confirm it stuck.

**Related:** [The Whole Game: Build a Support-Reply Drafter End to End](/learn/genai-app-dev/the-whole-game-genai-feature-tour), [Antipatterns in Your First GenAI Feature](/learn/genai-app-dev/first-genai-feature-antipatterns), [Where the LLM Boundary Belongs in Your Architecture](/learn/genai-app-dev/where-the-llm-boundary-lives), [Turning a Vague Product Ask Into a Buildable Spec](/learn/genai-app-dev/from-product-ask-to-feature-spec)
