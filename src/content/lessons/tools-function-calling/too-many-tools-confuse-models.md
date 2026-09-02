---
title: "Why More Tools Means Worse Choices"
track: "tools-function-calling"
status: live
summary: "Building intuition for why tool selection degrades as the registry grows, and why retrieval is the fix."
duration: "5 min read"
---

Six tools and two hundred tools aren't the same problem at different scale — they're different problems. This is the intuition for why, before the strategies for fixing it.

## The analogy

You walk into a restaurant with a six-item menu: burger, salad, soup, pasta, fish, steak. You read it in ten seconds and order the fish, confidently, because nothing else on the menu resembles it closely enough to cause hesitation.

Now hand that same person a 200-dish menu — sixty of which are variations on "chicken with X sauce," with names like "chicken supreme," "chicken royale," and "chicken deluxe" sitting three lines apart. The menu itself hasn't gotten harder to read line by line. But now the decision is harder: which chicken dish, exactly, matches what you wanted? People start picking the first plausible-sounding option, or the one they recognize a word in, rather than genuinely comparing all sixty.

A model choosing among 200 tools is that second diner, every single call. It's not that the model got dumber — the selection problem itself got harder, because the space of near-duplicate options grew faster than the space of genuinely distinct ones.

## The mental simulation

Walk through what actually happens inside one API call as the registry grows:

1. **6 tools.** The full schema block — names, descriptions, parameters — is short. The model reads all of it, holds it all in attention alongside the user's request, and the distinct-sounding names (`get_weather`, `send_email`, `search_docs`) make the right match obvious. Selection accuracy is close to ceiling.
2. **50 tools.** The schema block is now several thousand tokens, sitting between the system prompt and the actual user request. Several tools cluster by domain — three ways to search, four ways to notify a user. The model still usually gets it right, but you start seeing the wrong-but-adjacent pick: `notify_user` called where `send_email` was correct, because their descriptions overlap.
3. **200 tools.** The schema block can now be tens of thousands of tokens — see [The Token Cost of Tool Schemas](/learn/tools-function-calling/token-cost-of-tool-schemas) for why that's expensive on its own. Worse, tools near the middle or end of a long list get less careful consideration than ones near the top, the same [lost-in-the-middle](/learn/context-engineering/lost-in-the-middle) effect that degrades retrieval over long documents. Near-duplicates multiply — now there might be six chicken dishes, not three — and the model starts hallucinating plausible-sounding tool names that don't exist, a documented [tool-call hallucination](/learn/hallucinations/tool-call-hallucination) pattern that gets more common as the registry grows.

## The common wrong intuition — and the correction

**Wrong**: "If selection is getting worse, we need a smarter model, or a longer, more careful prompt explaining which tool to pick when."

**Why that's wrong**: the failure isn't that the model can't reason about the tools — it's that it's being asked to reason about far more candidates than any single request needs. A better system prompt adds even more tokens to a block that was already too long, and doesn't shrink the actual number of near-duplicate options competing for the model's pick. You can't out-prompt a menu problem; you have to hand the model a shorter menu.

**The correction**: the fix that actually works is architectural, not a smarter model or a longer prompt — reduce the *number of candidates the model considers on a given call*, not the quality of its reasoning about them. That's retrieval: instead of one waiter reciting all 200 dishes, someone pre-filters to the six that match what the diner said they wanted, and only those six get read aloud. [Selecting From Hundreds of Tools](/learn/tools-function-calling/tool-selection-at-scale-strategies) lays out that strategy space, and [Retrieval Over a 200-Tool Registry](/learn/tools-function-calling/rag-over-tools-retrieval) builds the retrieval version end to end.

## When the analogy breaks

The menu analogy assumes every dish is equally likely to be the right order — but tool relevance is often far more predictable than that. A calendar agent mid-conversation about scheduling a meeting doesn't need its 40 billing tools "read aloud" at all; the domain is already known from context, not from a query-time retrieval step. That's where [Progressive Disclosure and Namespacing](/learn/tools-function-calling/progressive-tool-disclosure-patterns) beats pure retrieval — you don't always need to *search* the menu when you already know which section you're in.

The analogy also undersells one real cost retrieval introduces that a human waiter doesn't have: a waiter who mishears never *removes* a dish from what's available, but bad retrieval can — under-retrieving means the one correct tool never makes it into context at all, a recall failure with no human analogue at a restaurant. [Tool Selection Mistakes at Scale](/learn/tools-function-calling/tool-selection-common-mistakes) covers that failure mode directly.

**Related:** [Selecting From Hundreds of Tools](/learn/tools-function-calling/tool-selection-at-scale-strategies), [Tool Selection at Scale](/learn/tools-function-calling/tool-selection-at-scale), [Token Cost of Tool Schemas](/learn/tools-function-calling/token-cost-of-tool-schemas), [Tool-Call Hallucination](/learn/hallucinations/tool-call-hallucination)
