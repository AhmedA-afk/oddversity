---
title: "Versioning Prompts in Git and a Registry"
track: "genai-app-dev"
status: live
summary: "Build a small prompt registry with per-environment pointers so shipping and rolling back a prompt never requires a redeploy."
duration: "8 min read"
---

[Prompt Versioning and Safe Rollbacks](/learn/genai-app-dev/prompt-versioning-and-rollback) laid out why a prompt needs an identity and a pointer instead of a hardcoded string. This lesson builds that registry — a working one, small enough to read in one sitting, that you can drop straight into a real app.

## What we're building

A `PromptRegistry` backed by plain files in git (so every content change is a normal, reviewable diff) plus a JSON manifest that tracks version metadata and an active-version pointer per environment. On top of it: `promote()` to ship a version, and `rollback()` to revert — the same underlying operation, run in opposite directions. We'll ship a bad version to production and roll it back without touching the deployed application at all.

## Setup

TypeScript, no dependencies beyond Node's built-in `fs` and `crypto`. The layout:

```
prompts/
  support-triage/
    v13.txt
    v14.txt
    v15.txt
  manifest.json
```

Each `.txt` file is the literal prompt text — nothing else — so `git diff` on it is a clean content diff, exactly the discipline [Prompt Versioning: Treating Prompts Like Code](/learn/prompt-engineering/prompt-versioning-and-change-management) argues for. `manifest.json` is the metadata and pointer layer this lesson adds on top.

## Build it

### Step 1: version identity and the manifest shape

```ts
import { readFileSync } from "fs";
import { createHash } from "crypto";

interface VersionEntry {
  version: string;
  hash: string;
  createdBy: string;
  createdAt: string;
}

interface PromptManifest {
  versions: VersionEntry[];
  active: Record<string, string>;   // environment -> version
  history: Record<string, string[]>; // environment -> past active versions, most recent last
}

function hashPromptFile(path: string): string {
  const content = readFileSync(path, "utf8");
  return createHash("sha256").update(content).digest("hex").slice(0, 8);
}
```

> **Why this step?** The hash is what catches drift between the manifest and the file on disk — if someone edits `v14.txt` in place instead of adding `v15.txt`, the recorded hash for `v14` stops matching, and a load-time check (Step 4) can refuse to serve it silently wrong.

### Step 2: registering a new version — writing, not releasing

```ts
function registerVersion(
  manifest: PromptManifest,
  promptDir: string,
  version: string,
  createdBy: string
): PromptManifest {
  const hash = hashPromptFile(`${promptDir}/${version}.txt`);
  return {
    ...manifest,
    versions: [...manifest.versions, { version, hash, createdBy, createdAt: new Date().toISOString() }],
  };
}
```

> **Why this step?** Registering a version and making it active are deliberately two different functions. A version can exist in the registry — reviewed, hashed, ready — for days before anything reads it. This is the same "code deployed, dark to traffic" separation [Feature Flags and Gradual Rollout](/learn/genai-app-dev/feature-flags-and-gradual-rollout) builds for whole features; here it's applied to one prompt.

### Step 3: promote and rollback — one operation, run backward

```ts
function promote(manifest: PromptManifest, env: string, version: string): PromptManifest {
  const exists = manifest.versions.some(v => v.version === version);
  if (!exists) throw new Error(`cannot promote unknown version '${version}'`);

  const prior = manifest.active[env];
  const history = { ...manifest.history, [env]: [...(manifest.history[env] ?? []), prior].filter(Boolean) };
  return { ...manifest, active: { ...manifest.active, [env]: version }, history };
}

function rollback(manifest: PromptManifest, env: string, stepsBack = 1): PromptManifest {
  const past = manifest.history[env] ?? [];
  const target = past[past.length - stepsBack];
  if (!target) throw new Error(`no version ${stepsBack} step(s) back for '${env}'`);
  return promote(manifest, env, target); // rollback is just promoting an older version
}
```

> **Why this step?** `rollback` calls `promote` rather than duplicating its logic — a revert is not a special case, it's promoting a version that happens to be older. Keeping a `history` array (not just "the one previous version") is what makes `rollback(manifest, "prod", 2)` possible when a regression surfaces after more than one promotion has already happened — the pitfall [Prompt Versioning and Safe Rollbacks](/learn/genai-app-dev/prompt-versioning-and-rollback) calls out directly.

### Step 4: resolving the active prompt at request time

```ts
function resolvePrompt(manifest: PromptManifest, promptDir: string, env: string): { text: string; version: string } {
  const version = manifest.active[env];
  const entry = manifest.versions.find(v => v.version === version);
  if (!entry) throw new Error(`active version '${version}' for '${env}' not found in manifest`);

  const text = readFileSync(`${promptDir}/${version}.txt`, "utf8");
  const liveHash = createHash("sha256").update(text).digest("hex").slice(0, 8);
  if (liveHash !== entry.hash) {
    throw new Error(`hash mismatch for '${version}' — file was edited outside the registry`);
  }
  return { text, version };
}
```

> **Why this step?** This is the only function the application calls at request time — it never reads `manifest.active` or a filename directly. Every model call logs `version` alongside its trace (see [Observability for GenAI Features](/learn/genai-app-dev/observability-for-genai)), which is what turns "a spike in bad outputs" into "the spike started exactly when v15 went active."

## Run it

```ts
let manifest = registerVersion(baseManifest, "prompts/support-triage", "v15", "raj");
manifest = promote(manifest, "prod", "v15");
console.log(resolvePrompt(manifest, "prompts/support-triage", "prod").version); // "v15"

// v15 is live for twenty minutes. Escalation rate on the observability
// dashboard triples. Someone runs:
manifest = rollback(manifest, "prod");
console.log(resolvePrompt(manifest, "prompts/support-triage", "prod").version); // "v14"
```

No file changed on the running server, no deploy ran, no container restarted. The next request after `rollback()` resolves `v14` because that's what `resolvePrompt` reads from the manifest — the whole revert is one JSON write.

## Harden it

- **Commit the manifest to git alongside the prompt files.** A `promote()` in production should itself be a reviewed pull request or a logged, attributed action — the manifest change is exactly as much a production change as a code deploy, and deserves the same trail.
- **Verify the hash on every read, not just on write.** Step 4's check is what catches a prompt edited directly on disk (or in a database row) without going through `registerVersion` — the single most common way a registry silently drifts from reality.
- **Keep more than one step of history per environment.** A regression sometimes surfaces after the input distribution shifts days later, not immediately — "current minus one" isn't always the safe rollback target by then.
- **Log the resolved version with every request**, not just at promotion time — this is the join key [Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing) and [Evals and Regression Testing for Prompts](/learn/genai-app-dev/evals-and-regression-testing) both depend on.

## Extend it

Swap the flat JSON manifest for a real config store — a database row, Redis, or a config service — so `promote()` can run from a dashboard instead of a file edit, and so multiple app instances read the same active pointer instantly instead of each holding a stale local copy. That's exactly the mechanism [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout) builds next — not for an all-or-nothing pointer, but for a percentage of traffic split between two versions at once.

**Related:** [Prompt Versioning and Safe Rollbacks](/learn/genai-app-dev/prompt-versioning-and-rollback), [Prompt Versioning and Safe Rollbacks](/learn/genai-app-dev/prompt-versioning-rollback), [Feature Flags and Gradual Rollout](/learn/genai-app-dev/feature-flags-and-gradual-rollout), [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout), [Prompt Versioning: Treating Prompts Like Code](/learn/prompt-engineering/prompt-versioning-and-change-management)
