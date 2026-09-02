---
title: "Handling API Keys and Secrets Safely"
track: "genai-app-dev"
status: live
summary: "A leaked key is someone else's bill on your account — the fix is keeping secrets out of git, off the client, and rotatable without a redeploy."
duration: "6 min read"
---

[Handling API Keys and Secrets Safely](/learn/genai-app-dev/handling-api-keys-and-secrets) covers the two rules that stop the worst outcomes: never let a key touch the browser, never let one land in git. This lesson is about the layer underneath those rules — the threat model that makes them non-negotiable, and the build-time/runtime split that determines what your storage implementation actually needs to support.

## What it is

A provider API key is a bearer credential: whoever holds the string can spend against your account, with no further proof of identity required. There's no partial version of "safe to expose" — a key printed in a client bundle, a CI log, or a Slack message is exactly as compromised as one posted publicly, because you have no way to know who has copied it once it left a system you control.

That framing has one practical consequence for how you build a provider layer: **every adapter in this module should resolve its key through one accessor, never through a direct environment read**, so that where and how that key is stored is a decision you make once, not per call site.

```ts
// what every adapter in this module actually calls:
const key = await getSecret("ANTHROPIC_API_KEY");

// not this, scattered across N adapter files:
const key = process.env.ANTHROPIC_API_KEY;
```

[Storing Secrets: Env, Vault, and KMS Patterns](/learn/genai-app-dev/secret-storage-env-vault-kms) builds that `getSecret()` accessor; this lesson establishes why it needs to exist and what it has to satisfy.

## The mental model

Split every secret's lifecycle into two separate questions, because they have different failure modes and different fixes:

**Where does it live at rest?** — a `.env` file, a platform's environment-variable store, a dedicated vault. This is the question [handling-api-keys-and-secrets](/learn/genai-app-dev/handling-api-keys-and-secrets) already answers: never in git, never in a client bundle.

**When does it get materialized into a running process?** — this is the build-time vs. runtime split, and it's the part most teams get wrong first. A **build-time** secret is baked into an artifact — a Docker image layer, a static site bundle, a compiled binary — at the moment that artifact is built. A **runtime** secret is fetched fresh when the process starts, or on each request, from wherever it's stored.

The difference matters because of what happens when a key needs to rotate. A runtime secret rotates by updating the store — every new process picks up the new value on its next fetch, no redeploy required. A build-time secret is frozen into every copy of that artifact until the artifact itself is rebuilt and redeployed — and worse, if that artifact is a Docker image, the old key is sitting in an image layer in your registry indefinitely, exactly the same durability problem as a key committed to git.

## Why it works this way

The asymmetry is really about blast radius over time. A key that's only ever materialized at runtime, from a store you control, has a lifecycle you can end instantly: revoke it in the provider dashboard, and every future fetch fails closed. A key baked in at build time has copies you may not even be tracking — every image tag ever pushed, every cached build layer, every artifact a CI system archived "just in case." Revoking the key in the provider dashboard still stops it from working, but the string itself remains recoverable from those artifacts for as long as they exist, which is a real problem the moment any of them is stored somewhere less locked-down than your primary deploy target.

This is why the `getSecret()` indirection is worth the extra function call: it forces every secret to be a runtime fetch, which is the only version of "stored somewhere" that a rotation can actually reach everywhere at once.

## A concrete example (shown)

Two ways to get a key into a containerized service, same key, very different exposure:

Build-time (baked in — avoid this):

```dockerfile
# Dockerfile
ARG ANTHROPIC_API_KEY
ENV ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
# now this key is a permanent layer in every image built from this Dockerfile,
# in your registry, in anyone's local `docker history` output, forever —
# rotating the key in your provider dashboard does nothing to these copies
```

Runtime (fetched at process start or per-request):

```ts
// no ARG, no ENV baked into the image at all
// the running container calls this on startup, or per-call:
const key = await getSecret("ANTHROPIC_API_KEY");
// getSecret() reads from whatever backing store this environment uses —
// see secret-storage-env-vault-kms for the three escalating implementations
```

The image built from the second approach is identical whether the key rotates hourly or never — nothing about the artifact changes, because the artifact never held the secret in the first place.

## Where it shows up

This distinction becomes urgent the first time a key needs emergency rotation — a teammate's laptop is compromised, a key shows up in a security scanner's report, a former contractor's access needs revoking today. If every service resolves its key at runtime, rotation is: update the store, done, every process picks it up within its cache TTL. If any service baked the key in at build time, rotation also requires finding and redeploying every artifact that has a copy — and you need to know that list exists before the emergency, not during it.

## Watch out for

- **CI/CD pipelines that log environment variables during build.** A build step that echoes its environment for debugging, or a CI system that prints failed-step context, can put a runtime-intended secret into build logs — which are often retained longer and access-controlled more loosely than the secret store itself.
- **Treating a scoped key as low-risk enough to bake in.** Even a key limited to a cheap model or a low spend cap shouldn't end up in an image layer — "low risk" is a reason to prioritize other keys first for a vault migration, not a reason to skip runtime resolution for this one.
- **A single shared key across every environment.** Dev, staging, and prod sharing one key means a leak anywhere forces rotation everywhere, and you can't tell which environment's usage pattern is the anomalous one when the bill spikes. Scope keys per environment from the start.

## Where next

The threat model says: runtime resolution, one accessor, environment-scoped keys, rotation that doesn't require a redeploy. The next lesson builds `getSecret()` against three backends that actually satisfy those requirements as your app moves from local dev to production.

**Related:** [Handling API Keys and Secrets Safely](/learn/genai-app-dev/handling-api-keys-and-secrets), [Storing Secrets: Env, Vault, and KMS Patterns](/learn/genai-app-dev/secret-storage-env-vault-kms), [Writing Two Adapters Behind One Interface](/learn/genai-app-dev/provider-adapter-anthropic-openai), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking)
