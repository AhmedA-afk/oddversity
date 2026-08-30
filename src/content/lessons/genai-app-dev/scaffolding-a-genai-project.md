---
title: "Scaffolding a GenAI Project From Zero"
track: "genai-app-dev"
status: live
summary: "Build the minimal repo skeleton — typed client wrapper and a health-check route — that every later lesson in this course builds on."
duration: "8 min read"
---

Every feature in this course needs the same three things before it needs anything feature-specific: a project that runs, a typed wrapper around the provider call, and one route that proves the call actually works. Build that once here.

## What we're building

A minimal skeleton, in both TypeScript/Next.js and Python/FastAPI, with:

- a typed client wrapper around the provider SDK
- a `/api/health` (or `/health`) route that makes one real call and reports success
- an environment-variable placeholder for the API key, with real secret handling deliberately deferred

Nothing here is feature logic. It's the scaffolding every implementation lesson after this one assumes already exists.

## Setup

You need a provider API key available as an environment variable, and one runtime installed — Node 18+ for the TS path, Python 3.10+ for the FastAPI path. You don't need both; pick the one matching your stack, or build both if you want the side-by-side reference.

```bash
# TypeScript path
npx create-next-app@latest genai-scaffold --typescript --app
cd genai-scaffold
npm install @anthropic-ai/sdk

# Python path
mkdir genai-scaffold && cd genai-scaffold
python -m venv .venv && source .venv/bin/activate
pip install fastapi uvicorn anthropic
```

## Build it

### 1. A placeholder for the key

```bash
# .env.local (TS)  /  .env (Python) — add to .gitignore immediately
ANTHROPIC_API_KEY=sk-ant-...
```

This is intentionally the least interesting part of this lesson. A `.env` file is fine for local development and nowhere near sufficient for production — real rotation, vaulting, and client/server separation get a full lesson in [Handling API Keys and Secrets](/learn/genai-app-dev/handling-api-keys-and-secrets). For now, the only rule that matters: this file is never committed, and the key is never read anywhere the browser can see it.

### 2. The typed client wrapper

```ts
// lib/llm.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type Usage = { inputTokens: number; outputTokens: number };
export type LLMResult = { text: string; usage: Usage };

export async function callModel(prompt: string): Promise<LLMResult> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  return {
    text,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}
```

```python
# llm_client.py
import os
from anthropic import Anthropic
from dataclasses import dataclass

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

@dataclass
class LLMResult:
    text: str
    input_tokens: int
    output_tokens: int

def call_model(prompt: str) -> LLMResult:
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    text = "".join(b.text for b in response.content if b.type == "text")
    return LLMResult(text, response.usage.input_tokens, response.usage.output_tokens)
```

Every later implementation lesson in this course imports a function shaped like `callModel` rather than reaching for the SDK client directly. That's the point of the wrapper: one place to add retries, logging, or a swapped provider later, instead of every route in the app touching the SDK's raw surface.

### 3. The health-check route

```ts
// app/api/health/route.ts
import { callModel } from "@/lib/llm";

export async function GET() {
  try {
    const result = await callModel("Reply with exactly: ok");
    return Response.json({ status: "ok", modelSaid: result.text, usage: result.usage });
  } catch (err) {
    return Response.json({ status: "error", message: String(err) }, { status: 500 });
  }
}
```

```python
# main.py
from fastapi import FastAPI
from llm_client import call_model

app = FastAPI()

@app.get("/health")
def health():
    try:
        result = call_model("Reply with exactly: ok")
        return {"status": "ok", "model_said": result.text,
                "usage": {"input": result.input_tokens, "output": result.output_tokens}}
    except Exception as err:
        return {"status": "error", "message": str(err)}
```

This route makes exactly one real call and reports what came back — no UI, no streaming, no validation logic yet. It exists to answer one question: is the key valid and is the call path wired correctly, end to end, before any feature code depends on it.

## Run it

```bash
# TS
npm run dev
curl localhost:3000/api/health

# Python
uvicorn main:app --reload
curl localhost:8000/health
```

Expect back something like:

```json
{ "status": "ok", "modelSaid": "ok", "usage": { "inputTokens": 12, "outputTokens": 5 } }
```

If you get `"status": "error"` instead, the message string tells you which of the [eight hops](/learn/genai-app-dev/request-lifecycle-mental-model) failed — usually an unset or malformed API key at this stage, which shows up as an authentication error before the call ever reaches generation.

## Harden it

This route is deliberately thin, and two gaps in it are worth naming rather than leaving invisible:

- **No timeout.** A hung call to the provider will hang this route indefinitely. Real timeout handling is a full lesson — [Error Handling for LLM Calls](/learn/genai-app-dev/error-handling-for-llm-calls) — but even here, wrapping the call in `AbortController` (TS) or a client-level timeout (Python) costs a few lines and is worth adding before this route sees any real traffic.
- **No secret rotation or vaulting.** A `.env` file is a starting point, not an ending point — treat `handling-api-keys-and-secrets` as required reading before this skeleton leaves your laptop.

## Extend it

This skeleton is the base every other implementation lesson in this course assumes exists. From here, the natural next additions are:

- swap `callModel`'s single response for a streamed one, and consume it on the client — [Streaming Responses to the UI](/learn/genai-app-dev/streaming-responses-to-the-ui)
- add a real feature route that uses `callModel` with a purpose-built prompt, following the shape from [Turning a Vague Product Ask Into a Buildable Spec](/learn/genai-app-dev/from-product-ask-to-feature-spec)
- put a feature flag around any new route before it's user-visible — [Feature Flagging AI Features](/learn/genai-app-dev/feature-flagging-ai-features)

**Related:** [SDK vs Raw API vs Framework: Choosing Your Layer](/learn/genai-app-dev/sdk-vs-raw-api-decision), [Handling API Keys and Secrets](/learn/genai-app-dev/handling-api-keys-and-secrets), [Error Handling for LLM Calls](/learn/genai-app-dev/error-handling-for-llm-calls), [Where the LLM Boundary Belongs in Your Architecture](/learn/genai-app-dev/where-the-llm-boundary-lives)
