---
title: "Tool Selection Mistakes at Scale"
track: "tools-function-calling"
status: live
summary: "Five real ways large tool registries break selection, each with the symptom that reveals it and the fix that actually works."
duration: "7 min read"
---

Most of these show up the same way: aggregate accuracy quietly drops as you add tools, and the fix that seems obvious (a longer prompt, a smarter model) doesn't move it. Here's what's actually going wrong in each case.

### The mistake: near-duplicate tools with overlapping descriptions

Two or three tools that do almost — but not quite — the same thing, described in language similar enough that even a careful reader would hesitate: `search_customers`, `find_account`, `lookup_user`.

**Why it's wrong:** the model has to disambiguate at call time based on wording alone, and wording that's similar enough to confuse a human is similar enough to confuse a model — the underlying vectors (embedded or attended-to) sit close together, so small phrasing differences in the user's query tip the pick either way.

**Symptom:** the model picks a *plausible* wrong tool, not a nonsense one — this is different from hallucination, and it's why it's easy to miss in spot-checks. You only see it in an aggregate eval or in downstream errors ("why did this get routed to `find_account`, we wanted `lookup_user`").

**Fix:** merge near-duplicates into one tool with a discriminating parameter where possible (`search_customers(by: "name" | "email" | "account_id")` instead of three tools). Where you can't merge, make the descriptions state the difference explicitly and mutually — "use this instead of `lookup_user` when..." — rather than each description standing alone as if the other tool doesn't exist. See [Writing Tool Descriptions Models Follow](/learn/tools-function-calling/writing-tool-descriptions-models-follow) and [Good vs. Bad Tool Descriptions](/learn/tools-function-calling/good-vs-bad-tool-descriptions).

### The mistake: dumping the entire registry on every call

No selection strategy at all — every tool your app has ever defined goes into `tools` on every request, regardless of what the turn is about.

**Why it's wrong:** it's the direct cause of the degradation walked through in [Why More Tools Means Worse Choices](/learn/tools-function-calling/too-many-tools-confuse-models) — every irrelevant schema is both a token cost paid for nothing and a distractor competing for the model's pick.

**Symptom:** selection accuracy drops as the registry grows even though nothing about the *queries* changed — measurable directly with the eval in [Selection Accuracy at 5, 50, and 200 Tools](/learn/tools-function-calling/measuring-selection-accuracy-vs-count). Token spend on tool schemas also grows linearly with total registry size instead of with what any given turn actually needs.

**Fix:** add a selection layer once you're past the threshold your own eval finds — start with the cheapest option (tighten descriptions, group by namespace) before reaching for retrieval; the full strategy space is in [Selecting From Hundreds of Tools](/learn/tools-function-calling/tool-selection-at-scale-strategies).

### The mistake: retrieval that omits the one needed tool (recall failure)

A retrieval layer is in place, but the top-k cut sometimes drops the actually-correct tool — it scored k+1 or lower on a query that phrased things differently than the tool's description anticipated.

**Why it's wrong:** this is worse than sending too many tools, not better. A model given the wrong candidate set doesn't say "the tool I need isn't here" — it either calls the nearest wrong match or hallucinates a call to a tool name that sounds right but doesn't exist, a variant of [tool-call hallucination](/learn/hallucinations/tool-call-hallucination). The failure is silent unless you're specifically logging for it.

**Symptom:** the model calls a tool that's close-but-wrong, or emits a call to a name not present in your registry at all. In an eval, this shows up as a drop in *recall@k* specifically, distinct from the model simply picking badly among tools it was actually shown.

**Fix:** widen k, blend embedding similarity with keyword/BM25 matching (queries with exact keyword overlap with a tool's name are cheap wins embeddings sometimes miss), and pin safety-critical or frequently-needed tools outside the similarity cutoff entirely. Log every retrieval alongside the tool actually needed so misses are visible — the hardening steps in [Retrieval Over a 200-Tool Registry](/learn/tools-function-calling/rag-over-tools-retrieval) cover this in detail.

### The mistake: categories the model can't tell apart

A namespacing or two-stage disclosure scheme where the top-level categories themselves overlap — "account" vs. "billing" vs. "subscription" might all plausibly hold "cancel my plan."

**Why it's wrong:** you've moved the near-duplicate problem up a level instead of removing it. The model now has to disambiguate at the category stage with even less information (a short category description, no parameters yet) than it would have had picking directly among tools.

**Symptom:** the model calls `load_toolset("account")` when the tool it needed was under `billing`, then has to backtrack — burning a round trip and sometimes never finding the right tool if the model doesn't realize its category guess was wrong. See [Router Tools and Grouped Dispatch](/learn/tools-function-calling/tool-namespacing-and-grouping) for the mechanics of that round trip.

**Fix:** design categories around how users actually phrase requests, not around your internal system architecture — run a batch of real queries through the category picker alone and check the distribution matches your intent before shipping the two-stage flow. Where a request genuinely straddles two categories, either duplicate the tool's *pointer* into both categories or fold both into one broader category rather than forcing a hard boundary.

### The mistake: treating retrieval as a one-time build instead of a maintained system

Retrieval gets built, ships, and is never revisited — descriptions get edited over time without re-embedding, new tools get added without checking they surface correctly, and nobody's watching recall in production.

**Why it's wrong:** retrieval quality is a function of the embeddings matching the current registry. A registry drifts constantly — descriptions get clarified, tools get renamed, new ones get added weekly — and stale embeddings degrade silently, with no error to alert you.

**Symptom:** a newly added tool never gets called even when it's clearly the right answer, because it was never embedded, or was embedded with a placeholder description that doesn't match how users ask for it.

**Fix:** tie re-embedding to your registry's deploy process, not to a manual step someone remembers. Keep the eval from [Selection Accuracy at 5, 50, and 200 Tools](/learn/tools-function-calling/measuring-selection-accuracy-vs-count) running as a regression check, not a one-time report.

## Pre-flight checklist

- [ ] Any two tools whose descriptions could plausibly describe the same user request — merged, or explicitly cross-referenced?
- [ ] Is the tool list injected per-request scoped to what that request needs, or is it the full registry every time?
- [ ] If retrieval is in place, do you log retrieved-vs-actually-needed so recall misses are visible, not silent?
- [ ] If namespacing/categories are in place, have real user phrasings been run through the category picker and checked for the intended split?
- [ ] Is there a process (not a memory) that re-embeds or re-checks selection whenever the tool registry changes?

**Related:** [Why More Tools Means Worse Choices](/learn/tools-function-calling/too-many-tools-confuse-models), [Selecting From Hundreds of Tools](/learn/tools-function-calling/tool-selection-at-scale-strategies), [Retrieval Over a 200-Tool Registry](/learn/tools-function-calling/rag-over-tools-retrieval), [Tool-Call Hallucination](/learn/hallucinations/tool-call-hallucination)
