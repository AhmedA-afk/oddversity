---
title: "A Decision Framework for Picking a Model"
track: "ai-foundations"
status: live
summary: "A one-screen, gate-by-gate decision tree (privacy, open weights, task difficulty, context length, latency/cost) for narrowing model choice to a shortlist, with a worked cost/latenc"
duration: "14 min read"
---

[choosing-a-model](/learn/ai-foundations/choosing-a-model) lays out *what to weigh*. This page is the thing you actually run in a meeting: five gates, in order, that narrow "which model" down to a shortlist before you spend a single dollar on evals.

## The one-screen tree

Walk top to bottom. Each gate either fixes a constraint or narrows the field — don't skip ahead to "which model is smartest," that question comes last, not first.

```text
GATE 1 — Privacy / on-prem
  Must the data (and ideally the weights) stay inside your network —
  regulatory requirement, contract clause, air-gapped environment?
    YES → open-weight, self-hosted. Lock this in, then keep reading.
    NO  → continue.

GATE 2 — Open weights for a non-privacy reason
  Do you need to fine-tune deeply, avoid vendor lock-in, or run at a
  volume where per-token API pricing stops making sense?
    YES → open-weight (hosted or self-hosted).
    NO  → closed API is fine, and usually faster to ship.

GATE 3 — Task difficulty
  Multi-step planning, tool use, ambiguous judgment calls, long
  reasoning chains?
    YES → frontier / reasoning tier.
    NO  → classification, extraction, templated replies, short chat?
           YES → small / fast tier — start here, then measure.
           NO  → mid tier general-purpose chat model.

GATE 4 — Context length, worst case
  System prompt + history + retrieved chunks, at the longest realistic turn.
    < 8K tokens   → no special handling, any tier above works.
    8K–100K       → confirm the model's window with real headroom to spare.
    > 100K        → that's a retrieval problem, not a context-window
                    problem — see below before reaching for a
                    long-context model as your only lever.

GATE 5 — Latency and cost at YOUR volume
  Narrows the shortlist from "a tier" to "a specific model" — see the
  math further down.
```

The gates are ordered by how hard they are to undo later. Privacy and open-weights decisions lock in your entire deployment shape (self-hosted GPUs vs. an API key); task-difficulty and context decisions you can revisit every sprint.

## Gate-by-gate defaults

| Gate | Signal | Start here, then measure |
|---|---|---|
| 1. Privacy | Data must never leave your infra | Smallest open-weight model that clears your quality bar you can actually serve — see [open-weight-vs-closed-models](/learn/ai-foundations/open-weight-vs-closed-models) |
| 2. Open weights | No privacy constraint, but volume is huge or you need deep fine-tuning | Stay on a closed API until volume math (Gate 5) says otherwise — self-hosting has real GPU/ops cost, it isn't "free" |
| 3. Difficulty | Classification, extraction, short replies, retrieval-grounded answers | Your provider's smallest/cheapest model in the *current* generation, not last year's flagship |
| 3. Difficulty | Multi-step reasoning, agentic tool use, open-ended judgment | Your provider's top reasoning-tier model — see [agents-vs-chatbots-worked-example](/learn/ai-foundations/agents-vs-chatbots-worked-example) for where the line actually sits |
| 4. Context | Retrieval-augmented, chunks under ~8K tokens | Any modern model — don't over-engineer this |
| 4. Context | Routinely need >100K tokens of grounding | Fix retrieval first — see [what-is-rag-and-when-to-use-it](/learn/rag/what-is-rag-and-when-to-use-it) — then pick a long-context model if you still need one |
| 5. Latency/cost | Sub-1s time-to-first-token required | Small/fast tier only, streamed — frontier-tier latency won't get there no matter how you prompt it |
| 5. Latency/cost | Very high monthly volume | Cascade: cheap model by default, escalate on demand (worked below) |

"Start here, then measure" means exactly that — these are sane defaults to prototype against, not a verdict. Build a small eval set on your own inputs before you commit; see [building-an-eval-set-worked-example](/learn/ai-foundations/building-an-eval-set-worked-example) and [benchmarks-and-what-they-miss](/learn/ai-foundations/benchmarks-and-what-they-miss) for why published leaderboard numbers won't tell you this.

Context math and headroom mechanics are covered in [context-window-mechanics](/learn/llm-foundations/context-window-mechanics) — worth reading before Gate 4 if you haven't already.

## Worked walkthrough: a high-volume support bot

**The brief:** an e-commerce company wants a chatbot for order-status, returns, and general FAQ, handling roughly 50,000 conversations/month, with a chat UI where users expect a reply to start within a second or two.

**Gate 1 — privacy.** Customer data (order numbers, emails) is involved, but there's no HIPAA/finance-style regulatory bar and no contract clause forcing on-prem. → **No**, closed API is allowed.

**Gate 2 — open weights for another reason.** Not yet needed to fine-tune, and 50K conversations/month isn't (yet) the volume where self-hosting pays for its own GPU bill. → Stay on a closed API, but note this as a re-check if volume grows an order of magnitude.

**Gate 3 — task difficulty.** Looking at real ticket logs (not guessing): ~90% are order-status lookups, return-policy questions, and other retrieval-answerable FAQ. ~10% are multi-step troubleshooting, angry customers needing careful tone, or edge cases the bot should hand to a human. That's not one difficulty level — it's two. → **Split**: small/fast tier for the bulk, frontier tier for the tail.

**Gate 4 — context.** Each turn needs a system prompt, a few turns of history, and one or two retrieved KB snippets — worst case around 6–8K tokens. → Comfortably inside any modern context window. No long-context architecture needed, standard retrieval is enough.

**Gate 5 — latency and cost, with the numbers.** This is where "split by difficulty" earns its keep. The arithmetic below uses made-up round numbers to show the *shape* of the tradeoff — swap in real pricing from your provider before you act on it:

```text
Volume:            50,000 conversations/month
Calls/conversation: 4 bot replies avg
Total calls:        50,000 x 4 = 200,000 calls/month

Avg tokens/call:    1,500 in + 150 out = 1,650 tokens
Total tokens:       200,000 x 1,650 = 330,000,000 tokens/month

Split (from Gate 3):
  90% easy  -> 180,000 calls -> 297,000,000 tokens
  10% hard  -> 20,000 calls  ->  33,000,000 tokens

Illustrative unit cost (NOT real pricing — check your provider):
  small-fast tier:  1 unit per 1M tokens
  frontier tier:   15 units per 1M tokens

All-frontier cost:   330M tokens x 15 units/1M = 4,950 units
Cascade cost:        (297M x 1) + (33M x 15)
                   =  297        + 495
                   =  792 units

Cascade is roughly 6x cheaper than routing everything to the tier
you'd only need for 1 ticket in 10.
```

Even with placeholder numbers, the pattern holds directionally: paying frontier-tier rates for FAQ-grade turns is the single most common way teams overspend on inference — see [inference-cost-and-latency-intuition](/learn/ai-foundations/inference-cost-and-latency-intuition) for the general version of this argument.

**Landing spot:** a **small/fast-tier closed-API chat model** as the default responder for the ~90% of turns that are retrieval-answerable FAQ, with a lightweight triage step that escalates the remaining ~10% — angry sentiment, repeated failed attempts, explicit escalation language — to a **frontier-tier reasoning model** from the same provider (keeps the calling code and auth identical). Revisit Gate 2 if volume grows enough that self-hosting a small open-weight model for the bulk tier starts to beat API pricing.

The triage doesn't need to be another LLM call — a cheap heuristic or a small classifier is enough, and it's the part that actually makes the cost math work:

```python
# Route cheap/fast by default; escalate only on real signals.
# The routing decision itself should be near-free — don't spend an
# LLM call deciding whether to spend an LLM call.

ESCALATE_KEYWORDS = {"lawsuit", "cancel my account", "fraud", "unacceptable"}

def needs_escalation(ticket_text: str, sentiment_score: float, turn_count: int) -> bool:
    text = ticket_text.lower()
    if any(word in text for word in ESCALATE_KEYWORDS):
        return True
    if sentiment_score < -0.5:   # very negative, e.g. from a cheap sentiment model
        return True
    if turn_count > 4:           # the small model has already tried a few times
        return True
    return False

def choose_model(ticket_text: str, sentiment_score: float, turn_count: int) -> str:
    if needs_escalation(ticket_text, sentiment_score, turn_count):
        return "frontier-tier"      # swap in your provider's top reasoning model
    return "small-fast-tier"        # swap in your provider's smallest capable model

# Elsewhere, in the actual request path:
# model_name = choose_model(ticket_text, sentiment_score, turn_count)
# response = call_llm_api(model_name, messages=conversation_history)
```

For the `call_llm_api` part, see [calling-llm-apis-in-python](/learn/python-data-apis/calling-llm-apis-in-python).

## Shortlist by scenario

A few common shapes, so you can sanity-check your own answer against a similar one:

| Scenario | Gate 1/2 | Gate 3 | Gate 4 | Landing tier |
|---|---|---|---|---|
| High-volume support bot | Closed API | Split: FAQ vs. escalation | Short, RAG-grounded | Small-fast default + frontier escalation (cascade) |
| Regulated internal doc Q&A (health/finance) | Open-weight, self-hosted | Mid — mostly retrieval | Medium, RAG-grounded | Mid-size open-weight model you can serve in-house |
| Coding assistant / agent | Closed or open, either | Frontier — multi-step, tool use | Medium-long (repo context) | Frontier/reasoning tier, near-always |
| Batch document summarization (async, no user waiting) | Either | Mid | Long per doc | Mid tier, latency budget relaxed — optimize cost per token instead |
| Prototype / internal tool, low volume | Closed API | Whatever the task needs | Whatever it needs | Don't over-optimize — pick the best model you can afford to babysit less |

## Common mistakes

- **Defaulting to the flagship for everything.** Every trivial classification turn pays a "reasoning tax" it didn't need — the walkthrough above is the fix, not an exception.
- **Choosing on demo vibes, not your own data.** A model that nails your five test prompts can still fail on the long tail of real tickets. Build the eval set first.
- **Treating open weights as automatically cheaper.** Self-hosting swaps an API bill for a GPU bill plus the engineering time to run it — that's a real tradeoff, not a free win. See [open-vs-closed-and-hardware-tradeoffs](/learn/ai-foundations/open-vs-closed-and-hardware-tradeoffs).
- **Filling the context window to the edge.** A model rated for a huge window doesn't use all of it equally well — leave headroom, don't treat the max as a budget to spend.
- **No escalation path.** One static model dies at both ends: too expensive for the bulk, too shallow for the tail. A cascade (or at minimum a human-handoff trigger) fixes both.
- **Re-deciding by gut the next time a new model ships.** Rerun the same eval set, not a fresh vibe check — that's the only way "measure" in "start here, then measure" actually means anything.

**Related:** [tokens-context-cost](/learn/ai-foundations/tokens-context-cost) · [what-is-rag-and-when-to-use-it](/learn/rag/what-is-rag-and-when-to-use-it) · [benchmarks-and-what-they-miss](/learn/ai-foundations/benchmarks-and-what-they-miss) · [open-weight-vs-closed-models](/learn/ai-foundations/open-weight-vs-closed-models) · [agents-vs-chatbots-worked-example](/learn/ai-foundations/agents-vs-chatbots-worked-example)
