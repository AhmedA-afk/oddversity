---
title: "Setting Per-Segment Budgets"
track: "context-engineering"
status: live
summary: "Turn a budget from a spec into code: a config object plus an enforcement function that runs before every call."
duration: "8 min read"
---

A budget you don't enforce is a comment. This lesson builds the enforcement: a config object with fixed and proportional caps, and a function that measures every segment, checks it against the config, and trims what doesn't fit — before the request ever reaches the model.

## What we're building

Aria's support agent from [What a Token Budget Actually Is](/learn/context-engineering/what-a-token-budget-is) has a 12,000-token working budget split across five segments. We'll encode that split as data, write a function that measures real token counts against it, and wire in a trim step for the one segment that varies the most per call: retrieved context.

## Setup

You need one real tokenizer call — not a character-count approximation, per [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice) — and Aria's segments already available as separate strings before you concatenate them into a single prompt:

```python
import tiktoken

def count_tokens(text: str, model: str = "gpt-4o") -> int:
    """Exact token count for `text` under `model`'s tokenizer."""
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))
```

### Build it

#### 1. Encode the budget as data

Fixed caps for segments that don't scale with the conversation; proportional caps (as a fraction of the total) for segments that do. Reply headroom is fixed and reserved first — see [Budget as a Zero-Sum Pie](/learn/context-engineering/the-budget-allocation-mental-model) for why the ordering matters.

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class SegmentBudget:
    name: str
    kind: str          # "fixed" or "proportional"
    value: float       # token count if fixed, percent-of-total (0-100) if proportional

BUDGET_TOTAL = 12_000

ARIA_BUDGET = [
    SegmentBudget("system_prompt",        "fixed",         700),
    SegmentBudget("tool_definitions",     "fixed",        1000),
    SegmentBudget("reply_headroom",       "fixed",        2000),
    SegmentBudget("retrieved_context",    "proportional", 31.67),  # of 12,000 -> 3,800
    SegmentBudget("conversation_history", "proportional",  37.5),  # of 12,000 -> 4,500
]

def resolve_caps(budget: list[SegmentBudget], total: int) -> dict[str, int]:
    caps = {}
    for seg in budget:
        caps[seg.name] = seg.value if seg.kind == "fixed" else round(total * seg.value / 100)
    return caps
```

> **Why this step?** Fixed and proportional caps behave differently as the window changes size. System prompt and tool definitions don't grow just because you swap to a bigger-window model — they stay fixed. Retrieval and history *should* grow proportionally so a larger window is used, not wasted. Mixing both kinds in one config lets each segment scale the way it actually behaves.

#### 2. Measure every segment for real

```python
def measure(segments: dict[str, str]) -> dict[str, int]:
    return {name: count_tokens(text) for name, text in segments.items()}
```

This is the same measurement discipline as [Measuring What Fills the Window](/learn/context-engineering/measuring-what-fills-the-window) — the difference here is we act on the numbers immediately instead of only logging them.

#### 3. Enforce the caps before assembly

```python
class BudgetExceeded(Exception):
    def __init__(self, segment: str, used: int, cap: int):
        self.segment, self.used, self.cap = segment, used, cap
        super().__init__(f"{segment}: {used} tokens over cap of {cap}")

def enforce_budget(segments: dict[str, str], caps: dict[str, int]) -> dict[str, int]:
    usage = measure(segments)
    for name, used in usage.items():
        cap = caps.get(name)
        if cap is not None and used > cap:
            raise BudgetExceeded(name, used, cap)
    total_cap = sum(caps.values())
    if sum(usage.values()) > total_cap:
        raise BudgetExceeded("total", sum(usage.values()), total_cap)
    return usage
```

> **Why this step?** Per-segment caps catch a single segment ballooning (a tool schema someone forgot to trim). The total check catches the case where every segment is individually fine but the *sum* still overflows — which happens more than you'd expect once several segments each creep up a little.

#### 4. Trim instead of just rejecting

Raising an exception is correct for system prompt or tool definitions — those shouldn't silently change shape. Retrieved context is different: it's expected to sometimes come back larger than its cap, and the right response is to cut it down, not fail the call.

```python
def trim_retrieval(chunks: list[str], cap: int) -> list[str]:
    """Keep highest-ranked chunks first, drop from the tail once over cap."""
    kept, used = [], 0
    for chunk in chunks:  # assumed pre-sorted by relevance, highest first
        n = count_tokens(chunk)
        if used + n > cap:
            break
        kept.append(chunk)
        used += n
    return kept
```

> **Why this step?** This is where [relevance filtering](/learn/context-engineering/relevance-filtering) and budgeting meet — the budget decides *how many tokens* retrieval gets, ranking decides *which* tokens survive the cut. Trim on rank, never on arrival order.

#### 5. Wire it together

```python
def assemble_request(raw_segments: dict[str, str], retrieval_chunks: list[str]):
    caps = resolve_caps(ARIA_BUDGET, BUDGET_TOTAL)
    retrieval_text = "\n\n".join(retrieval_chunks)

    if count_tokens(retrieval_text) > caps["retrieved_context"]:
        retrieval_chunks = trim_retrieval(retrieval_chunks, caps["retrieved_context"])
        retrieval_text = "\n\n".join(retrieval_chunks)

    segments = {**raw_segments, "retrieved_context": retrieval_text}
    usage = enforce_budget(segments, caps)
    return segments, usage
```

## Run it

A query comes back with 7 retrieved chunks totaling 5,100 tokens against a 3,800-token cap:

```
retrieval requested: 5100 tokens (7 chunks)
trim_retrieval -> kept 5 chunks, 3760 tokens (under 3800 cap)
enforce_budget -> all segments within cap, total 11,760 / 12,000
```

Two chunks got cut, the call proceeds, and — because chunks were pre-ranked — the two dropped were the least relevant ones, not just the two that happened to arrive last.

## Harden it

- **Zero-chunk edge case.** If even the single highest-ranked chunk is larger than the entire retrieval cap, `trim_retrieval` returns an empty list. Decide explicitly whether that means "answer with no retrieved context" or "reject the call" — don't let it fail silently.
- **Caps that don't sum to the total.** `resolve_caps` doesn't currently guard against fixed + proportional caps summing to more than 100%. Add an assertion at startup, not at request time — you want this to fail in CI, not in production.
- **Tokenizer drift across models.** A cap tuned against one model's tokenizer can be meaningfully wrong for another — see [Tokens Are Not Words](/learn/context-engineering/tokens-are-not-words). Re-measure whenever you change models.
- **Mid-structure truncation.** `trim_retrieval` here cuts on whole chunks, which is deliberate — never truncate a chunk mid-sentence or mid-JSON. More on why in [Budgeting Mistakes That Bite Later](/learn/context-engineering/budgeting-common-mistakes).

## Extend it

This static split works until query patterns stop being uniform — a fact-heavy question and a chit-chat message shouldn't get the same retrieval-versus-history split. That's [Reallocating the Budget on the Fly](/learn/context-engineering/dynamic-budget-reallocation). For a comparison of this fixed/proportional approach against priority-based allocation, see [Fixed, Proportional, and Priority Budgets](/learn/context-engineering/budgeting-strategies-compared). To track what `usage` looks like over a whole session instead of one call, see [A Per-Turn Token Ledger](/learn/context-engineering/token-accounting-per-turn-ledger).

**Related:** [What a Token Budget Actually Is](/learn/context-engineering/what-a-token-budget-is), [Counting Tokens in Practice](/learn/context-engineering/counting-tokens-in-practice), [Relevance Filtering](/learn/context-engineering/relevance-filtering), [Fixed, Proportional, and Priority Budgets](/learn/context-engineering/budgeting-strategies-compared)
