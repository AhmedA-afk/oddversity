---
title: "The Whole Game: Build a Support-Reply Drafter End to End"
track: "genai-app-dev"
status: live
summary: "Speed-run one real GenAI feature end to end so every later lesson in this module has a spot on the map."
duration: "8 min read"
---

You're going to build a feature in the next few minutes: a "Draft reply" button on a support inbox. An agent opens a ticket, clicks the button, and a suggested reply streams in below the customer's message. It will not be production-hardened by the end of this page — no retries, no real auth, no eval suite. That's fine. The point of a whole-game pass is to touch every seam once, badly, so the rest of this module (and the ones after it) has somewhere to attach.

## The big picture

**1. Start from a spec, not a prompt.** "Draft a reply" is not buildable yet — you don't know the input shape, the output shape, or what "good" means. Write those down first:

```text
Input:    { ticketId, customerMessage, previousReplies[] }
Output:   { draftReply: string, tone: "neutral" | "apologetic" | "celebratory" }
Success:  agent accepts or lightly edits the draft >50% of the time
Latency:  first token in under 2s, full draft in under 8s
Failure:  show the raw ticket with drafting disabled, never a blank box
```

That's the whole job of turning a vague ask into a buildable spec — see [Turning a Vague Product Ask Into a Buildable Spec](/learn/genai-app-dev/from-product-ask-to-feature-spec) for the full version of this exercise.

**2. Assemble the prompt envelope.** The model doesn't see "draft a reply" — it sees an array of role-tagged messages you build from the spec:

```ts
const messages = [
  {
    role: "system",
    content:
      "You are a support reply drafter. Match the requested tone. " +
      "Output JSON only: {draftReply: string, tone: string}.",
  },
  {
    role: "user",
    content: `Customer message: ${customerMessage}\nPrior replies: ${previousReplies.join("\n")}`,
  },
];
```

The system message carries the standing contract; the user message carries this ticket's specifics. [System, User, Assistant: The Message Envelope](/learn/genai-app-dev/messages-roles-and-the-prompt-envelope) covers why that split matters and how it holds up across a multi-turn thread.

**3. Make the call, and stream it.** Waiting eight seconds for a blank screen to fill in one shot feels broken. Streaming gets tokens in front of the agent as they're generated:

```ts
const stream = await anthropic.messages.stream({
  model: "claude-sonnet-4-5",
  max_tokens: 512,
  temperature: 0.4,
  messages,
});

for await (const event of stream) {
  if (event.type === "content_block_delta") {
    res.write(event.delta.text ?? "");
  }
}
```

[Your First Call, Worked in TypeScript and Python](/learn/genai-app-dev/first-api-call-walkthrough-ts-python) walks the non-streaming version of this same call line by line if you want the request/response shape before adding streaming on top.

**4. Validate before you trust it.** The system prompt asked for JSON, but "asked for" is not "guaranteed." Once the stream ends, parse and check the shape before it reaches the UI:

```ts
const parsed = JSON.parse(fullText); // throws on malformed JSON
if (!["neutral", "apologetic", "celebratory"].includes(parsed.tone)) {
  throw new Error("unexpected tone value");
}
```

A real version of this uses a schema library instead of hand-rolled checks — that's a full module down the line, not this one.

**5. Check the bill before you check it in.** Every call has a token count sitting in the response's usage field. Multiply by your provider's per-token price and you have a per-draft cost; divide your latency budget by the tokens you're generating and you have a sanity check on `max_tokens`:

```text
usage: { input_tokens: 340, output_tokens: 180 }
cost  ≈ (340 × input_rate) + (180 × output_rate)
```

Real budgets, p95 latency, and what to do when a call blows past both are covered later — see [Latency Budgets for LLM Features](/learn/genai-app-dev/latency-budgets-for-llm-features) and [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking).

**6. Ship it behind a flag.** Nobody sees this in production until you flip a switch, and you can flip it back off in seconds if drafts start coming back wrong:

```ts
if (!flags.isEnabled("support-reply-drafter", { userId: agent.id })) {
  return renderTicketWithoutDrafting();
}
```

That's the whole loop: spec → envelope → streamed call → validation → budget check → guarded rollout. Nothing above is hardened — the validation is one `if`, the budget check is a comment, the flag has no percentage rollout. That's deliberate. Each gap is a lesson with your name on it later in the course.

## What trips people up

| Idea | Common confusion | Where to learn it |
|---|---|---|
| "Building the feature" | Assuming the prompt *is* the feature, not one piece wrapped in ordinary code | [The Deterministic Shell Around a Probabilistic Core](/learn/genai-app-dev/what-makes-a-feature-genai) |
| System vs. user message | Treating them as interchangeable, or putting per-request data in the system prompt | [System, User, Assistant: The Message Envelope](/learn/genai-app-dev/messages-roles-and-the-prompt-envelope) |
| Temperature | Believing 0.4 is "safe" for everything, or leaving the default on a structured extraction task | [Temperature, top_p, and max_tokens in Practice](/learn/genai-app-dev/tuning-sampling-params-in-an-app) |
| The provider call | Not realizing eight distinct hops (and eight distinct failure points) sit between a click and a rendered token | [Tracing One Request Through Eight Hops](/learn/genai-app-dev/request-lifecycle-mental-model) |
| Where the call lives | Calling the provider straight from the browser because it's faster to prototype | [Where the LLM Boundary Belongs in Your Architecture](/learn/genai-app-dev/where-the-llm-boundary-lives) |
| "It worked in my test" | Shipping the happy path and discovering the failure modes in production | [Antipatterns in Your First GenAI Feature](/learn/genai-app-dev/first-genai-feature-antipatterns) |

## A reading path

If you want the deep version of each stage above, in the order this module presents them:

1. [The Deterministic Shell Around a Probabilistic Core](/learn/genai-app-dev/what-makes-a-feature-genai) — what actually makes this different from a CRUD feature
2. [Tracing One Request Through Eight Hops](/learn/genai-app-dev/request-lifecycle-mental-model) — the spatial map of the whole request
3. [Your First Call, Worked in TypeScript and Python](/learn/genai-app-dev/first-api-call-walkthrough-ts-python) and [What Actually Happens Over the Wire](/learn/genai-app-dev/what-happens-over-the-wire) — the call itself, then what's underneath it
4. [System, User, Assistant: The Message Envelope](/learn/genai-app-dev/messages-roles-and-the-prompt-envelope) and [Temperature, top_p, and max_tokens in Practice](/learn/genai-app-dev/tuning-sampling-params-in-an-app) — shaping the request
5. [SDK vs Raw API vs Framework: Choosing Your Layer](/learn/genai-app-dev/sdk-vs-raw-api-decision) and [Scaffolding a GenAI Project From Zero](/learn/genai-app-dev/scaffolding-a-genai-project) — the code around the call
6. [Where the LLM Boundary Belongs in Your Architecture](/learn/genai-app-dev/where-the-llm-boundary-lives) — the security posture that carries into every later module
7. [Turning a Vague Product Ask Into a Buildable Spec](/learn/genai-app-dev/from-product-ask-to-feature-spec), [Antipatterns in Your First GenAI Feature](/learn/genai-app-dev/first-genai-feature-antipatterns), and [GenAI Feature Starter Checklist](/learn/genai-app-dev/genai-feature-starter-checklist) — closing the loop before you build for real
8. [Quiz: The GenAI Request Lifecycle](/learn/genai-app-dev/quiz-genai-foundations) — check it stuck

From there, the streaming, validation, and cost checks you did by hand above each become their own module: real [streaming to the UI](/learn/genai-app-dev/streaming-responses-to-the-ui), real [structured output](/learn/genai-app-dev/structured-output-in-apps), and real [provider abstraction](/learn/genai-app-dev/provider-abstraction-layers) once one model and one happy path stop being enough.

**Related:** [The Deterministic Shell Around a Probabilistic Core](/learn/genai-app-dev/what-makes-a-feature-genai), [Tracing One Request Through Eight Hops](/learn/genai-app-dev/request-lifecycle-mental-model), [Turning a Vague Product Ask Into a Buildable Spec](/learn/genai-app-dev/from-product-ask-to-feature-spec), [Antipatterns in Your First GenAI Feature](/learn/genai-app-dev/first-genai-feature-antipatterns)
