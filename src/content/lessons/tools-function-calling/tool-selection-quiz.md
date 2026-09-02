---
title: "Tool Selection Quiz"
track: "tools-function-calling"
status: live
summary: "Six questions on tool_choice modes, diagnosing near-duplicate tool confusion, and when retrieval earns its complexity."
duration: "5 min read"
---

Six questions covering both halves of this module: controlling tool choice on a known-size registry, and keeping selection accurate once that registry grows.

## Questions

**1. An OCR pipeline must always return a structured invoice object — never prose, never a refusal. Which `tool_choice` mode fits, and what's the one thing you must add to the tool's schema to use it safely?**

A. `auto`, with a well-written description telling the model to always call the tool
B. Named choice forcing the extraction tool, with a status field (like `is_invoice`) so "doesn't apply" is representable as data
C. `none`, since you want the model to just describe the document
D. `any`/`required`, so the model can pick between the extraction tool and a fallback tool

<details><summary>Answer</summary>

**Correct: B.** Forcing the named tool guarantees a parseable call every time, but without an escape-hatch field, non-invoice or malformed inputs get silently forced into a call with empty or garbage fields instead of a clear "not applicable" signal — exactly the failure walked through in [Forcing extract_invoice Every Time](/learn/tools-function-calling/forcing-a-specific-tool-worked).

- A is wrong: descriptions are guidance, not a constraint — `auto` still lets the model decline or answer in prose, which is exactly the unreliability this pipeline can't tolerate.
- C is wrong: `none` removes the ability to call the tool at all, the opposite of what a structuring pipeline needs.
- D is wrong: `any` still requires *a* tool call but doesn't guarantee it's the extraction tool specifically, unless "fallback tool" is itself always correct to call, which just reframes the same problem.

</details>

**2. A support agent keeps calling `find_account` when `lookup_user` was correct, and vice versa — both tools do almost the same thing with similar descriptions. What's the right first fix?**

A. Force one of the two with `tool_choice` so the model can't pick wrong
B. Add a third, even more specific tool to disambiguate further
C. Merge them into one tool with a discriminating parameter, or make each description explicitly state when to prefer it over the other
D. Switch to `tool_choice: "none"` until the confusion is resolved

<details><summary>Answer</summary>

**Correct: C.** This is the near-duplicate-tools mistake from [Tool Selection Mistakes at Scale](/learn/tools-function-calling/tool-selection-common-mistakes) — the fix is removing the ambiguity at the source (merge, or cross-referencing descriptions), not working around it downstream.

- A is wrong: forcing one tool doesn't fix the confusion, it just removes the model's ability to ever correctly call the other one — a different bug, not a fix.
- B is wrong: adding a third overlapping tool makes the near-duplicate problem worse, not better.
- D is wrong: `none` disables both tools entirely, which breaks legitimate calls to either one — it doesn't address why the model confuses them.

</details>

**3. Your registry is 12 tools today and you're deciding whether to build retrieval now, before it grows. What does [Selection Accuracy at 5, 50, and 200 Tools](/learn/tools-function-calling/measuring-selection-accuracy-vs-count) suggest you do?**

A. Build retrieval now — it's cheap insurance against future growth
B. Run the accuracy eval at your current size and realistic future sizes first; a 12-tool registry likely doesn't need retrieval yet, and the eval is what tells you when it will
C. Skip evaluation — the [Scaling Tools Cheatsheet](/learn/tools-function-calling/scaling-tools-cheatsheet) thresholds are exact, so just build to match your projected size today
D. Add `tool_choice: "any"` instead, since forcing a call is a substitute for retrieval

<details><summary>Answer</summary>

**Correct: B.** At 12 tools you're comfortably under the "send all" range from the cheatsheet, and the whole point of the eval-first approach is to confirm the actual threshold on your registry rather than pre-building infrastructure for a problem you don't have yet.

- A is wrong: retrieval has real ongoing cost (a vector store, re-embedding on registry changes, recall tuning) — building it before you need it is pure overhead with nothing to show for it yet.
- C is wrong: the cheatsheet thresholds are explicitly starting points ("start here, then measure"), not exact cutoffs — your own eval is the source of truth.
- D is wrong: `tool_choice` and retrieval solve different problems — forcing a call doesn't make the *right* call more likely among a crowded candidate set.

</details>

**4. A retrieval pipeline is in place at k=15 over a 200-tool registry. A user's phrasing doesn't closely match the correct tool's description, so it scores 18th and gets cut. What just happened, and what's the fix?**

A. This is a precision failure — the fix is lowering k
B. This is a recall failure — the correct tool never made it into context at all; fix by widening k, blending in keyword matching, or pinning the tool
C. This is expected and requires no fix — the model will ask a clarifying question instead
D. This means retrieval should be replaced with `tool_choice: "none"`

<details><summary>Answer</summary>

**Correct: B.** This is the recall-vs-precision distinction: recall failures mean the right tool was excluded before the model ever saw it, which is worse than a precision failure (too many candidates shown) because the model has no way to recover — it'll pick the nearest wrong match or hallucinate a call. [Retrieval Over a 200-Tool Registry](/learn/tools-function-calling/rag-over-tools-retrieval) and [Tool Selection Mistakes at Scale](/learn/tools-function-calling/tool-selection-common-mistakes) both cover this.

- A is wrong: precision failures are about too many *irrelevant* tools being included, which is the opposite problem — lowering k would make this specific failure worse, not better, by cutting off even more borderline-scoring correct tools.
- C is wrong: the model has no way to know a tool it wasn't shown exists — it won't ask about something it can't see, it'll either misfire or hallucinate.
- D is wrong: `none` disables tool calling for the turn entirely, unrelated to fixing a retrieval recall gap.

</details>

**5. You've built a `load_toolset(category)` meta-tool over a 150-tool registry. Midway through a long conversation, the user moves from a billing topic to a calendar topic. Should your code evict the now-unused billing tools from `tools` to save context?**

A. Yes — always keep `tools` as small as possible on every turn
B. No — evicting a loaded category breaks the cached prefix on the next request, trading a small context savings for a full cache miss on the rest of the tool definitions; better to let the list grow and cap it with an LRU eviction only past a real limit
C. It doesn't matter — caching isn't affected by the contents of `tools`
D. Yes, but only if the user explicitly says they're done with billing

<details><summary>Answer</summary>

**Correct: B.** This is the caching interaction covered in [Router Tools and Grouped Dispatch](/learn/tools-function-calling/tool-namespacing-and-grouping) — most providers cache a request's prefix, and tool definitions typically live inside it, so shrinking `tools` between turns invalidates the cache on every subsequent call, not just the current one.

- A is wrong: this ignores the cache-stability cost, which is often larger than the token savings from a smaller list.
- C is wrong: prompt caching is prefix-based, and tool definitions are part of that prefix on most providers — changing them is exactly the kind of change that breaks a cache hit.
- D is wrong: even an explicit signal from the user doesn't change the mechanical fact that removing tools re-breaks the cached prefix; the right response is an eviction policy (like LRU past a cap), not eviction on every topic change.

</details>

**6. A 200-tool registry has no natural domain boundaries — it's a flat pool of independent third-party integrations with genuinely unpredictable, cross-cutting queries. Which strategy from [Selecting From Hundreds of Tools](/learn/tools-function-calling/tool-selection-at-scale-strategies) is the weakest fit here, and why?**

A. Retrieval — it assumes structure this registry doesn't have
B. Namespacing by domain — it assumes stable, nameable categories, which this registry explicitly lacks
C. `tool_choice: "auto"` on the full registry — it's always the wrong choice regardless of registry shape
D. A meta-tool with an `enum` of categories — it depends on the same stable categories namespacing needs

<details><summary>Answer</summary>

**Correct: B.** (D is also weak for the same underlying reason, but B is the most direct answer — see the discrimination below.) Namespacing's entire value proposition depends on domains being stable and nameable ahead of time; a flat, unpredictable pool of integrations has nothing for a namespace to organize around, which is exactly why [Progressive Disclosure and Namespacing](/learn/tools-function-calling/progressive-tool-disclosure-patterns) frames retrieval as the fit for this shape of registry instead.

- A is wrong as the "weakest fit": retrieval makes no assumption about domain structure at all — it works directly off query-to-description similarity, which is why it's the natural fit for exactly this registry shape.
- C is wrong: `auto` is a `tool_choice` mode, not a selection-at-scale strategy — it's compatible with any of the four strategies and isn't "always wrong"; the question is what's in `tools` when `auto` is evaluated, not whether `auto` itself is the problem.
- D is a reasonable second answer since `load_toolset`-style meta-tools do rely on an enumerable category list, same as namespacing — but B is the more direct and complete answer since namespacing is the baseline structural assumption the meta-tool pattern is built on top of.

</details>

**Related:** [Tool Choice: auto, required, none, and Named](/learn/tools-function-calling/tool-choice-modes), [Selecting From Hundreds of Tools](/learn/tools-function-calling/tool-selection-at-scale-strategies), [Tool Selection Mistakes at Scale](/learn/tools-function-calling/tool-selection-common-mistakes), [Scaling Tools Cheatsheet](/learn/tools-function-calling/scaling-tools-cheatsheet)
