---
title: "Where the LLM Boundary Belongs in Your Architecture"
track: "genai-app-dev"
status: live
summary: "The model call belongs behind your server, not in the browser — here's the architecture reasoning, not just the rule."
duration: "6 min read"
---

It takes about ten minutes to get a GenAI feature working by calling the provider straight from the browser. It takes about one leaked API key to understand why that was the wrong ten minutes to save.

## What it is

The "LLM boundary" is the line in your architecture where client-controlled code stops and server-controlled code starts — and the rule for this course is simple: the model call sits on the server side of that line, always, with one deliberate exception covered later. Everything the client does is *ask your server* to make a model call on its behalf; the client never holds the credentials or makes the call directly.

```text
[ Browser ]  →  [ Your server ]  →  [ Model provider ]
   no key           holds the key         never sees the browser directly
```

This is the same boundary that already exists in every app with a database — the browser doesn't hold your database credentials and query it directly either. A GenAI feature doesn't get an exception to that rule just because the thing behind the boundary is a model instead of a table.

## The mental model

Think of your API key as a blank check with your name on it, denominated in real money per token. Anyone holding it can spend against your account, at whatever rate they choose, until you notice and revoke it. A key embedded in client-side JavaScript — even "hidden" in a bundled file, even fetched at runtime from a config endpoint — is visible to anyone who opens their browser's network tab or reads the bundle. It is not a secret once it has shipped to a browser; it's public, whether or not anyone has found it yet.

Your server, by contrast, is a boundary you control: you decide who gets to trigger a call, how often, and under what constraints — before your key is ever spent.

## Why it works this way

Two concrete failure modes make this concrete rather than theoretical:

**A leaked key.** If the key lives in client code, it ships to every visitor's browser on every page load. One person extracting it from the bundle — trivial, it's plaintext in a JS file — can now make calls against your account from anywhere, with no rate limit you control, until you rotate the key and ship a new build. Compare that to a key that never leaves your server: there's no bundle to extract it from in the first place.

**No rate limiting you control.** Even without malice, a client-side call means every user's browser talks to the provider directly, so you have no single point to enforce "this user gets 20 calls an hour" or "reject this request, the input is empty." Put the call behind your own route, and that route becomes the natural place to check auth, apply a rate limit, validate input, and log what happened — the same jobs a server already does for every other kind of request in the app.

## A concrete example

Map this onto a standard three-tier app — client, application server, and a backing service (here, the model provider standing in for what would otherwise be a database):

```text
Client (browser/mobile)
   ↓ authenticated request, no provider credentials
Application server (your API routes)
   ↓ holds the key, applies rate limits, validates input/output
Model provider (external API)
```

A "draft reply" button follows exactly this shape: the browser calls `POST /api/draft-reply` with a ticket ID, your server looks up the ticket, assembles the prompt, calls the provider with a key that exists only in server environment variables, validates what comes back, and returns the drafted text. At no point does the browser see the provider's URL, key, or raw response — it only ever talks to your own route.

## Where it shows up

This boundary is why [Anatomy of a GenAI Feature](/learn/genai-app-dev/anatomy-of-a-genai-feature) puts "backend" between client and provider as a non-optional piece, and it's the architectural fact that [Handling API Keys and Secrets](/learn/genai-app-dev/handling-api-keys-and-secrets) builds real key-management practice on top of — that lesson assumes you've already decided the key lives server-side, and covers how to store, rotate, and scope it once it's there.

There is exactly one deliberate exception in this course: [Client-Side Inference](/learn/genai-app-dev/client-side-inference), where a model runs *in* the browser or device rather than being called over the network — no API key or network hop involved at all, because there's no remote call to protect. That's a different architecture solving a different problem (offline capability, latency, privacy of the input itself), not a loophole in this rule — it doesn't call a keyed API from the client, it removes the remote call entirely.

## Watch out for

- **"It's just for prototyping."** Prototype code has a way of shipping. If a demo works by calling the provider from the browser, the fix is a five-minute API route before it goes anywhere near a real user — not a mental note to fix it later.
- **Hiding the key instead of removing it.** Obfuscating, base64-encoding, or fetching the key from a config endpoint at runtime doesn't change that it's still reachable from the browser. The fix is architectural (move the call server-side), not cryptographic.
- **Forgetting the boundary also gates *output*, not just the key.** Once the call is server-side, that same route is your one chance to validate what came back before it reaches the client — skip that and you've kept the key safe while still shipping unchecked model output straight to users.

## Where next

This boundary is a precondition for real secret handling, which gets its own full treatment in [Handling API Keys and Secrets](/learn/genai-app-dev/handling-api-keys-and-secrets). It's also the reason every scaffold in this course — see [Scaffolding a GenAI Project From Zero](/learn/genai-app-dev/scaffolding-a-genai-project) — puts the model call inside an API route from the very first line of code, not as a later refactor.

**Related:** [Anatomy of a GenAI Feature](/learn/genai-app-dev/anatomy-of-a-genai-feature), [Handling API Keys and Secrets](/learn/genai-app-dev/handling-api-keys-and-secrets), [Client-Side Inference](/learn/genai-app-dev/client-side-inference), [Scaffolding a GenAI Project From Zero](/learn/genai-app-dev/scaffolding-a-genai-project)
