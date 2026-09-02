---
title: "Storing Secrets: Env, Vault, and KMS Patterns"
track: "genai-app-dev"
status: live
summary: "Build one getSecret() accessor over three escalating backends — .env, a platform store, and a rotating vault — plus a pre-commit guard."
duration: "9 min read"
---

Every adapter in this module calls `getSecret("ANTHROPIC_API_KEY")` and never `process.env` directly — that indirection was the requirement set up in [Handling API Keys and Secrets Safely](/learn/genai-app-dev/secrets-and-key-management). This lesson builds it, against three backends that escalate with your app's stage: local `.env`, a platform secret store for staging, and a vault/KMS pattern with rotation for production.

## What we're building

One `getSecret(name: string): Promise<string>` function whose implementation swaps by environment, plus a caching layer that makes rotation-without-redeploy actually work, plus a git pre-commit hook that catches a key before it's committed in the first place — cheaper than catching it after.

## Setup

```bash
mkdir -p src/secrets
touch src/secrets/index.ts src/secrets/providers.ts
```

No new runtime dependencies for the env and platform-store backends. The vault backend in Step 3 assumes a managed vault (HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager) reachable over HTTPS from your runtime — the code below is written against a generic HTTP shape so it isn't tied to one vendor's SDK; substitute your vault's actual client where noted.

### Step 1 — Define the accessor interface

```ts
// src/secrets/providers.ts
export interface SecretProvider {
  get(name: string): Promise<string>;
}
```

One method, deliberately. Every backend below implements exactly this, which is what lets you swap backends by environment without touching a single adapter that calls `getSecret()`.

> **Why this step?** This mirrors the `LLMProvider` interface from [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts) on purpose — same shape of problem (many implementations, one call site), same fix (a narrow interface).

### Step 2 — The `.env` backend, for local dev

```ts
// src/secrets/env-provider.ts
import type { SecretProvider } from "./providers";

export class EnvSecretProvider implements SecretProvider {
  async get(name: string): Promise<string> {
    const value = process.env[name];
    if (!value) throw new Error(`Missing local secret: ${name} (check your .env file)`);
    return value;
  }
}
```

```bash
# .env — gitignored, never committed
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

```bash
# .env.example — committed, placeholders only
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

> **Why this step?** This backend exists purely for local development speed — it's a direct read with a clearer error message than an undefined `process.env` access buried three files deep. It's also exactly the risk surface [handling-api-keys-and-secrets](/learn/genai-app-dev/handling-api-keys-and-secrets) already covers: confirm `.gitignore` excludes `.env` before the first commit of a new project, not after.

### Step 3 — The platform/vault backend, with a rotation-aware cache

Staging and production both fetch from a remote store instead of a local file. The part that matters for rotation-without-redeploy is the cache: fetch once, hold the value for a bounded TTL, refetch after — so a rotated secret propagates to every running process within that TTL window, with no deploy required.

```ts
// src/secrets/remote-provider.ts
import type { SecretProvider } from "./providers";

interface CacheEntry {
  value: string;
  fetchedAt: number;
}

export class RemoteSecretProvider implements SecretProvider {
  private cache = new Map<string, CacheEntry>();

  constructor(
    private readonly fetchFromStore: (name: string) => Promise<string>,
    private readonly ttlMs: number = 5 * 60 * 1000, // 5 min: rotation propagates within this window
  ) {}

  async get(name: string): Promise<string> {
    const cached = this.cache.get(name);
    if (cached && Date.now() - cached.fetchedAt < this.ttlMs) {
      return cached.value;
    }
    const value = await this.fetchFromStore(name);
    this.cache.set(name, { value, fetchedAt: Date.now() });
    return value;
  }
}
```

The `fetchFromStore` function is where a specific backend plugs in. For a platform-native store (Vercel/Netlify env vars refreshed via their API, AWS Secrets Manager, GCP Secret Manager), it's a call to that provider's API:

```ts
// src/secrets/index.ts
import { RemoteSecretProvider } from "./remote-provider";
import { EnvSecretProvider } from "./env-provider";

async function fetchFromVault(name: string): Promise<string> {
  // real code: call your vault's SDK/API here, e.g. AWS Secrets Manager's
  // GetSecretValueCommand or GCP's accessSecretVersion — shown generically:
  const res = await fetch(`${process.env.VAULT_ADDR}/v1/secret/data/${name}`, {
    headers: { "X-Vault-Token": process.env.VAULT_BOOTSTRAP_TOKEN! },
  });
  if (!res.ok) throw new Error(`Vault fetch failed for ${name}: ${res.status}`);
  const body = await res.json();
  return body.data.data.value;
}

const provider: SecretProvider =
  process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging"
    ? new RemoteSecretProvider(fetchFromVault)
    : new EnvSecretProvider();

export async function getSecret(name: string): Promise<string> {
  return provider.get(name);
}
```

> **Why this step?** Notice `getSecret()` — the function every adapter actually imports — never branches on environment itself. The branching happens once, at module load, when `provider` is constructed. Every call site stays identical across dev, staging, and prod.

### Step 4 — A git pre-commit guard

Catch a key before it's committed, not after — removing a line in a later commit doesn't remove it from git history, so prevention is the only real fix at this layer.

```bash
#!/usr/bin/env bash
# .git/hooks/pre-commit (make executable: chmod +x .git/hooks/pre-commit)

PATTERNS='sk-ant-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]+PRIVATE KEY-----'

MATCHES=$(git diff --cached -U0 | grep -E "^\+" | grep -Ev '^\+\+\+' | grep -E "$PATTERNS")

if [ -n "$MATCHES" ]; then
  echo "pre-commit: possible API key or private key in staged changes:"
  echo "$MATCHES"
  echo "If this is a false positive, use git commit --no-verify to override."
  exit 1
fi
```

> **Why this step?** This is a pattern-match, not a proof — it catches the common vendor key shapes (`sk-ant-...`, `sk-...`, AWS access keys, PEM-format private keys) and misses anything that doesn't match one of those patterns. Treat it as a cheap first line of defense, not a substitute for a real secret scanner in CI (see Harden it).

## Run it

```ts
import { getSecret } from "./secrets";

const key = await getSecret("ANTHROPIC_API_KEY");
// dev: read from .env
// staging/prod: fetched from the vault, cached for 5 minutes
```

Every adapter from [Writing Two Adapters Behind One Interface](/learn/genai-app-dev/provider-adapter-anthropic-openai) already calls exactly this function — nothing in those adapters changes when you move from the `.env` backend to the vault backend.

### A zero-downtime rotation drill

Walk through what actually happens when `ANTHROPIC_API_KEY` needs to rotate, in order:

1. **Issue a new key** in the provider dashboard, without revoking the old one — most providers let multiple keys be active simultaneously for exactly this reason.
2. **Write the new value into the vault**, under the same secret name.
3. **Wait out the cache TTL** (5 minutes in the example above). Every running process refetches on its next `get()` call after its cache expires and starts using the new key — no redeploy, no restart.
4. **Confirm no traffic is using the old key**, via the provider's per-key usage dashboard if it offers one, or by watching your own request logs for the old key's identifying prefix if you log that safely.
5. **Revoke the old key** in the provider dashboard, once step 4 confirms nothing is still using it.

The zero-downtime part is steps 1–3: because both keys are valid simultaneously and the cache TTL bounds how long any process can be running stale, there's no window where a request fails because the key it holds was already revoked.

## Harden it

- **A pre-commit hook can be bypassed** with `git commit --no-verify` — that's by design, for legitimate false positives, but it means the hook alone isn't sufficient. Run a real secret scanner (gitleaks or equivalent) as a required CI check on every push, not just locally.
- **Never log a resolved secret value**, even at debug level — a `console.log(key)` left in during development is a common way a key ends up in a log aggregator that's far less access-controlled than the vault it came from.
- **Cache TTL is a tradeoff, not a free parameter.** Shorter means faster rotation propagation but more calls to your vault (which usually has its own rate limits); longer means slower propagation. Five minutes is a reasonable default to start from — measure your vault's request volume before tuning it further.
- **Scope the bootstrap credential** (`VAULT_BOOTSTRAP_TOKEN` above) as narrowly as the vault allows — it's the one credential that still can't go through `getSecret()`, because it's what `getSecret()` needs to reach the vault at all. Treat it with the same discipline the vault protects everything else with.

## Extend it

Managed vaults (AWS Secrets Manager, GCP Secret Manager) offer automated rotation — a scheduled function that generates a new provider key via the provider's own API (where supported), writes it to the vault, and revokes the old one after a grace period, with no human running the drill above by hand. That's worth building once manual rotation happens often enough to be worth automating — start manual, automate the parts that repeat.

**Related:** [Handling API Keys and Secrets Safely](/learn/genai-app-dev/secrets-and-key-management), [Writing Two Adapters Behind One Interface](/learn/genai-app-dev/provider-adapter-anthropic-openai), [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking)
