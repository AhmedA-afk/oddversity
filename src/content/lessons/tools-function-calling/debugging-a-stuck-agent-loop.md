---
title: "Debugging a Stuck Agent"
track: "tools-function-calling"
status: live
summary: "A real trace of an agent looping on a failing search call, diagnosed to its actual cause and fixed with two small changes."
duration: "6 min read"
---

The support-log excerpt below is unremarkable to look at — six calls to the same tool, six failures — which is exactly why it's worth tracing carefully. Nothing here looks catastrophic one call at a time.

## The setup

A research agent has a `search` tool over an internal knowledge base. A user asks: *"Find our refund policy for enterprise customers."* Here's what the trace log actually shows, six calls in, before someone notices the turn has been running for 40 seconds and pages an engineer.

```
call 1:  search(query="refund policy enterprise")           → {"error": "no_results"}
call 2:  search(query="enterprise refund policy")            → {"error": "no_results"}
call 3:  search(query="refund policy for enterprise plans")  → {"error": "no_results"}
call 4:  search(query="enterprise customer refunds")         → {"error": "no_results"}
call 5:  search(query="refund policy enterprise tier")       → {"error": "no_results"}
call 6:  search(query="enterprise refund terms")             → {"error": "no_results"}
```

## Step by step

**Read the calls, not just the count.** Six failed calls looks like a candidate for a hard iteration cap — and a cap would eventually stop it — but the cap alone doesn't explain *why* it happened, and a cap that just cuts the agent off after call 12 produces a worse outcome for the user than fixing the actual cause. Look at what's varying between calls: the query text, rephrased six different ways. Nothing else changes. That's the tell.

**Check what didn't vary: the error.** Every one of the six results is the identical `{"error": "no_results"}`. Cross-reference against [A Taxonomy of Tool-Calling Failures](/learn/tools-function-calling/taxonomy-of-tool-failures): this is being returned as an *error*, but it's actually describing a class-6 failure — empty or ambiguous result — dressed up as one of the model-fixable classes. The tool didn't fail. It ran fine and legitimately found nothing.

**Find the actual cause.** The model is doing something completely reasonable given what it's been told: it's been informed six times that its query "failed," so it keeps trying to phrase a better query, because that's the correction a search-failure error implies. But rephrasing was never going to work — the knowledge base genuinely has no document matching any reasonable phrasing of "enterprise refund policy," because the actual document is titled `"Billing Adjustments — Tier 3 Accounts"` and doesn't contain the word "refund" at all. No amount of query rephrasing was ever going to find it; the fix isn't a better query, it's a different approach (browsing a category, or telling the user honestly that nothing matched).

**Confirm with the guard that should have caught it, and didn't.** Checking the harness config: there's a max-call cap set to 12, so this loop would have run six more times before the cap even fired. There's no identical-call detection — but it wouldn't have helped here anyway, since every query was worded differently. And there's no distinction in the tool's error handling between "the search infrastructure failed" and "the search ran and matched nothing." That's the actual root cause: an empty result was surfaced through the same channel as a real error, which handed the model a false signal that retrying with different phrasing was the correct move.

## Where it breaks (+ fix)

Two changes, addressing two different layers of the problem.

**Fix 1 — stop mislabeling an empty result as an error.**

```python
# Before: empty results and real failures look identical to the model
def search(query: str) -> dict:
    results = kb.query(query)
    if not results:
        return {"ok": False, "error": "no_results"}
    return {"ok": True, "results": results}

# After: empty is a valid, non-error outcome
def search(query: str) -> dict:
    results = kb.query(query)
    return {
        "ok": True,
        "results": results,
        "count": len(results),
        "note": "No matches. Consider a broader query or a different search "
                 "approach (browsing by category) rather than narrower rephrasing."
                 if not results else None,
    }
```

The second version tells the model something it can actually act on: this wasn't a failure to recover from, it's a legitimate "nothing here" that calls for a different *strategy*, not a synonym for the same query. This is the same distinction [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries) draws between an error result and a correct-but-empty one — collapsing them is what created this loop in the first place.

**Fix 2 — add identical-*intent* loop detection, not just identical-argument.**

A literal identical-call check (from [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps)) wouldn't have caught this trace, since every query string differed. What does catch it is counting *consecutive calls to the same tool with no successful result*, regardless of argument variation:

```python
def check_tool_streak(tool_name, ok, streak_state, max_streak=3):
    if tool_name == streak_state.get("tool") and not ok:
        streak_state["count"] = streak_state.get("count", 0) + 1
    else:
        streak_state["tool"], streak_state["count"] = tool_name, (0 if ok else 1)

    if streak_state["count"] >= max_streak:
        return (
            f"'{tool_name}' has failed {streak_state['count']} times in a row "
            f"with varied arguments. Rephrasing further is unlikely to help — "
            f"try a different approach or tell the user nothing was found."
        )
    return None
```

Three failed searches in a row — regardless of query wording — triggers a message that names the actual pattern (varied arguments, same tool, no success) and suggests the real fix (stop rephrasing) instead of a generic "you've made too many calls."

## Before/after

**Before:** six calls, six rephrased queries, would have continued to call 12 before the hard cap forced a stop — and the user still gets a bad outcome either way, because nothing in the loop ever pointed at the actual cause (the document wouldn't match on the word "refund" no matter how it was phrased).

**After:** call 1 returns the honest `{"ok": true, "results": [], "note": "..."}`. Call 2 tries a genuinely different strategy — a category browse — instead of a query synonym, because the note said rephrasing wasn't the fix. Call 3 either finds the right document or the streak guard fires after three non-results and the model tells the user directly: *"I searched the knowledge base a few different ways and didn't find a documented enterprise refund policy — want me to check with the billing team instead?"* That's a worse-case outcome than finding the document, but a strictly better one than call 12 of an unbounded rephrasing loop.

## Takeaways

- A loop that varies its arguments every call defeats identical-call detection — the guard that catches it has to key on *outcome streaks*, not argument equality.
- The root cause here wasn't a missing guard, it was a mislabeled result: an empty search was reported through the same channel as a real failure, which handed the model a signal ("this failed, try again") that was actively wrong for what had actually happened.
- Trace the *content* of repeated calls, not just the count, before reaching for a bigger hammer. A hard cap would have stopped this loop eventually, but it wouldn't have explained why it started, and wouldn't have produced a better outcome for the user than the streak guard did.

**Related:** [Stopping Runaway Loops](/learn/tools-function-calling/infinite-loop-and-retry-caps), [A Taxonomy of Tool-Calling Failures](/learn/tools-function-calling/taxonomy-of-tool-failures), [Handling Tool Errors and Retries](/learn/tools-function-calling/handling-errors-and-retries), [Returning Errors the Model Can Act On](/learn/tools-function-calling/returning-actionable-errors)
