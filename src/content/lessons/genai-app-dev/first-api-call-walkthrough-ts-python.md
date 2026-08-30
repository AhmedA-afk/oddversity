---
title: "Your First Call, Worked in TypeScript and Python"
track: "genai-app-dev"
status: live
summary: "The same chat completion call, built line by line in TypeScript and Python, with the response read all the way through."
duration: "7 min read"
---

Same task, two languages, side by side: turn a paragraph of release notes into a one-sentence changelog entry, and print both the result and what it cost in tokens.

## The setup

Input, fixed for the whole walkthrough:

```text
"We shipped a redesigned settings page this week, moved billing into its
own tab, and fixed the bug where notification preferences reset after
password changes."
```

Target output: one sentence, plus the token usage for the call that produced it. Both languages need an API key in the environment (`ANTHROPIC_API_KEY`) and a package installed — `npm install @anthropic-ai/sdk` or `pip install anthropic`.

## Step by step

### 1. Construct the client

```ts
// TypeScript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
```

```python
# Python
import anthropic

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env
```

> **Why this step?** Both SDKs default to reading the key from the environment rather than a constructor argument. That's not an accident — it keeps the key out of source code by default, which matters the moment this snippet becomes a real file in a real repo. See [Where the LLM Boundary Belongs in Your Architecture](/learn/genai-app-dev/where-the-llm-boundary-lives) for why that boundary matters even more once this call moves behind a server route.

### 2. Build the message array

```ts
const releaseNotes =
  "We shipped a redesigned settings page this week, moved billing into " +
  "its own tab, and fixed the bug where notification preferences reset " +
  "after password changes.";

const messages = [
  {
    role: "system" as const,
    content: "Summarize the input as exactly one sentence for a changelog.",
  },
  { role: "user" as const, content: releaseNotes },
];
```

```python
release_notes = (
    "We shipped a redesigned settings page this week, moved billing into "
    "its own tab, and fixed the bug where notification preferences reset "
    "after password changes."
)

messages = [
    {"role": "user", "content": release_notes},
]
system_prompt = "Summarize the input as exactly one sentence for a changelog."
```

> **Why this step?** The instruction ("summarize as one sentence") and the data (the release notes) are kept in separate roles rather than concatenated into one string. [System, User, Assistant: The Message Envelope](/learn/genai-app-dev/messages-roles-and-the-prompt-envelope) covers why that separation holds up better as the feature grows — for now, notice the Python SDK takes the system prompt as its own top-level argument rather than a message with `role: "system"`; check your SDK's signature rather than assuming the shape is identical across languages.

### 3. Make the call

```ts
const response = await client.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 60,
  messages,
});
```

```python
response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=60,
    system=system_prompt,
    messages=messages,
)
```

> **Why this step?** `max_tokens` is required, not optional, in both SDKs — it's a hard ceiling, not a target the model aims for. Sixty tokens is generous for one sentence; too low a ceiling truncates the reply mid-word rather than erroring.

### 4. Read the result all the way through

```ts
const text = response.content
  .filter((block) => block.type === "text")
  .map((block) => block.text)
  .join("");

console.log(text);
console.log(response.usage); // { input_tokens, output_tokens }
```

```python
text = "".join(
    block.text for block in response.content if block.type == "text"
)

print(text)
print(response.usage)  # Usage(input_tokens=..., output_tokens=...)
```

Both print something like:

```text
Redesigned the settings page, split billing into its own tab, and fixed
notification preferences resetting after password changes.

{ input_tokens: 46, output_tokens: 28 }
```

> **Why this step?** `content` is an array in both languages, because a single response can carry more than one block (text, a tool call, a thinking block). Code that assumes `response.content` is a string works right up until a response comes back with more than one block in it, and then breaks in a way that's confusing to debug later. Filtering by `type === "text"` is the habit that survives that day.

## Where it breaks

- **Omit `max_tokens`.** Both SDKs reject the request outright — this field has no default, unlike `temperature`.
- **Concatenate `content` as if it were a string** (`response.content[0]` and stop there). Works today, breaks silently the day a response includes a second block — you'll print half the answer with no error to tell you why.
- **Reuse `messages` across the two languages verbatim.** The Python SDK expects `system` as a separate keyword argument, not a `{"role": "system"}` message in the list — passing it the TypeScript shape throws a validation error from the SDK, not a network error, so check the exception message before assuming the API itself is rejecting you.
- **Hardcode a model name from an old tutorial.** Provider model names get retired; an unrecognized `model` string returns a 404-style error from the provider, not a helpful "did you mean" — always check the provider's current model list.

## Takeaways

- The request shape — a model name, a hard token ceiling, and a role-tagged message list — is identical across languages; only SDK ergonomics differ (Python's separate `system` argument versus a `system`-role message).
- `content` is always an array. Write the loop once, correctly, and reuse it — don't index `[0]` and move on.
- `usage` comes back on every response for free. Read it now, before you need it for a budget — [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking) is where that number turns into a dollar figure.
- For deeper Python-specific patterns — async clients, retry wrapping, batching many calls — see [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) in the Python Data Apps track; this lesson only needed the synchronous, single-call version.

**Related:** [Your First LLM API Call](/learn/genai-app-dev/your-first-llm-api-call), [System, User, Assistant: The Message Envelope](/learn/genai-app-dev/messages-roles-and-the-prompt-envelope), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking), [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python)
