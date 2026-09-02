---
title: "Launch-Day Antipatterns"
track: "genai-app-dev"
status: live
summary: "The five ways a GenAI launch goes wrong on day one, each with the incident it caused and the one-line prevention."
duration: "6 min read"
---

Every one of these has shipped somewhere, worked fine in staging, and turned into a 2 a.m. page within the feature's first day of real traffic. None of them are exotic — they're all a gate from [Shipping a GenAI Feature End to End](/learn/genai-app-dev/shipping-end-to-end) quietly skipped under launch-day time pressure.

### The mistake: no kill switch

**Why it's wrong:** Without a flag in the hot path, turning a feature off means a deploy — which, for most teams, is minutes to tens of minutes even on a fast pipeline. That gap is exactly the window where damage accrues fastest, right after launch, on the traffic pattern you've had the least time to observe.

**Symptom:** A bad output, a cost spike, or a loop that won't converge, and the fix is "we're pushing a hotfix now" instead of "flipped off, investigating." Every minute in between is more affected users, not fewer.

**Fix:** Every AI feature ships behind the flag from [Feature Flags and Gradual Rollout](/learn/genai-app-dev/feature-flags-and-gradual-rollout) before it reaches any external traffic — not as a follow-up ticket, as a launch blocker.

### The mistake: no cost alerts

**Why it's wrong:** LLM costs scale with input size, output length, and tool-call iterations — all of which can shift silently (a context-window bug, a tool loop that doesn't converge, a prompt that got verbose) without a single request erroring. Nothing about a cost spike trips a standard uptime or error-rate alert.

**Symptom:** The first signal is the monthly invoice, not a page — by which point the spike has been running for days, not minutes.

**Fix:** [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking) needs a live threshold wired to the auto-halt from [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout), checked on every request, not a dashboard someone checks weekly.

### The mistake: an unversioned prompt

**Why it's wrong:** A prompt edited directly in a database row, an admin dashboard, or inline in code has no diff, no history, and no way to say which version was live when a regression started — exactly the gap [Prompt Versioning and Safe Rollbacks](/learn/genai-app-dev/prompt-versioning-and-rollback) opens with.

**Symptom:** "It got worse sometime this week" is the most precise anyone can be, because nobody can answer "compared to what, and since when" without a version to point at.

**Fix:** Every prompt reaching a model call resolves through the registry pattern from [Versioning Prompts in Git and a Registry](/learn/genai-app-dev/versioning-prompts-in-git-and-registry) before launch — never a string edited in place.

### The mistake: missing traces

**Why it's wrong:** A GenAI request has real internal structure — prompt assembly, a provider call, maybe a tool loop, output validation — and a single "request succeeded, took 3.1s" log collapses all of it into a number that explains nothing when something looks wrong.

**Symptom:** A slow or wrong request on launch day, and the only available next step is trying to reproduce it by hand, because there's no trace showing which step actually took the time or what the model was actually asked.

**Fix:** [Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing) needs to be live and exporting *before* the canary cohort sees the feature, per the sequence in [Shipping a GenAI Feature End to End](/learn/genai-app-dev/shipping-end-to-end) — not bolted on after the first confusing ticket.

### The mistake: 100% rollout on day one

**Why it's wrong:** It skips every gate meant to catch a problem while the blast radius is still small — the canary cohort that would have caught an edge case, the percentage ramp that would have caught a distribution-dependent failure, the auto-halt that would have caught a cost spike before it touched everyone.

**Symptom:** Whatever would have surfaced at 1% now surfaces at 100%, at once, with every user affected simultaneously instead of a controlled and contained slice.

**Fix:** Follow the gated sequence in [Shipping a GenAI Feature End to End](/learn/genai-app-dev/shipping-end-to-end) — dark deploy, internal, canary, ramp, full — treating "just ship it to everyone, it tested fine" as the antipattern it is, not a shortcut earned by confidence.

## Pre-flight checklist

- [ ] A flag gates the feature, checked on every request, fails closed on error — [Feature Flags and Gradual Rollout](/learn/genai-app-dev/feature-flags-and-gradual-rollout)
- [ ] A cost-per-hour threshold triggers an automatic halt, not just an alert someone might see — [Canary and Percentage-Based Rollout](/learn/genai-app-dev/canary-and-percentage-rollout)
- [ ] Every prompt resolves through a versioned registry with a working rollback — [Versioning Prompts in Git and a Registry](/learn/genai-app-dev/versioning-prompts-in-git-and-registry)
- [ ] Traces are exporting for prompt assembly, the provider call, and any tool loop, tagged with prompt version — [Instrumenting Requests With Tracing](/learn/genai-app-dev/instrumenting-with-tracing)
- [ ] The rollout starts at internal or canary, not at 100%, with each stage's exit criteria written down in advance — [Shipping a GenAI Feature End to End](/learn/genai-app-dev/shipping-end-to-end)

**Related:** [Shipping a GenAI Feature End to End](/learn/genai-app-dev/shipping-end-to-end), [Feature Flags and Gradual Rollout](/learn/genai-app-dev/feature-flags-and-gradual-rollout), [Cost Budgets and Usage Tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking), [Prompt Versioning and Safe Rollbacks](/learn/genai-app-dev/prompt-versioning-and-rollback), [First GenAI Feature Antipatterns](/learn/genai-app-dev/first-genai-feature-antipatterns)
