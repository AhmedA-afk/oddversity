---
title: "Counting Tokens in Practice"
track: "context-engineering"
status: live
summary: "Build a reusable token-counting helper against a real tokenizer and see exactly how far character-based estimates drift."
duration: "7 min read"
---

Every lesson in this track that mentions a token count assumes you actually know how to get one. Here's the small helper this track reuses from here on, built against a real tokenizer instead of a guess.

## What we're building

Two small functions: `count_tokens(text)`, which returns an exact token count for one string, and `segment_report(segments)`, which takes a dict of labeled context segments — system prompt, tool defs, history, and so on — and prints a table of token counts and percentages, the same shape of breakdown used in [Dissecting a Live Context Payload](/learn/context-engineering/dissecting-a-live-context-payload). Along the way we compare those real counts against the naive "characters divided by four" estimate from [Tokens Are Not Words](/learn/context-engineering/tokens-are-not-words) to see exactly how much that estimate drifts.

## Setup

```bash
pip install anthropic
export ANTHROPIC_API_KEY=your-key-here
```

The token count for a piece of text is **model-specific** — different model families tokenize differently, so a count is only meaningful paired with the model it's for. Don't reach for a generic tokenizer library here: something like `tiktoken` is OpenAI's tokenizer, and it can undercount Claude tokens noticeably on typical English text, and by more on code or non-English input. For a real count against a Claude model, use the API's own counting endpoint.

## Build it

### Step 1: a single-segment counter

```python
from anthropic import Anthropic

client = Anthropic()
MODEL = "claude-opus-5"

def count_tokens(text: str, model: str = MODEL) -> int:
    """Exact token count for one string, against a specific model."""
    resp = client.messages.count_tokens(
        model=model,
        messages=[{"role": "user", "content": text}],
    )
    return resp.input_tokens
```

This wraps the `count_tokens` endpoint (`POST /v1/messages/count_tokens`), which counts a would-be request without actually running inference on it — it's a lightweight way to ask "how big is this" before you ever send it for a real completion.

### Step 2: a naive estimate, for comparison

```python
def estimate_tokens_naive(text: str) -> int:
    """The ~4-characters-per-token rule of thumb. English prose only."""
    return len(text) // 4
```

Keep this around deliberately — the whole point of this lesson is to see where it diverges from the real count, not to use it as a substitute.

### Step 3: a segment report

```python
def segment_report(segments: dict[str, str], model: str = MODEL) -> None:
    """Print token count, naive estimate, and % of total for each segment."""
    real_counts = {name: count_tokens(text, model) for name, text in segments.items()}
    naive_counts = {name: estimate_tokens_naive(text) for name, text in segments.items()}
    total = sum(real_counts.values())

    print(f"{'Segment':<28}{'Real':>8}{'Naive est.':>12}{'Error':>10}{'% of total':>12}")
    for name in segments:
        real = real_counts[name]
        naive = naive_counts[name]
        error_pct = (naive - real) / real * 100 if real else 0
        share = real / total * 100 if total else 0
        print(f"{name:<28}{real:>8}{naive:>12}{error_pct:>+9.0f}%{share:>11.1f}%")
    print(f"{'TOTAL':<28}{total:>8}")
```

### Step 4: run it against a real payload

Reuse the support transcript and duplicated invoice JSON from [Dissecting a Live Context Payload](/learn/context-engineering/dissecting-a-live-context-payload):

```python
segments = {
    "system_prompt": SYSTEM_PROMPT_TEXT,
    "tool_definitions": json.dumps(TOOL_SCHEMAS),
    "conversation_history": "\n".join(m["content"] for m in history_messages),
    "invoice_json": json.dumps(invoice_result),
    "current_message": "so is that getting refunded or not?",
}
segment_report(segments)
```

## Run it

The shape of what comes out (illustrative numbers, from a payload similar to the one in [Dissecting a Live Context Payload](/learn/context-engineering/dissecting-a-live-context-payload)):

```text
Segment                         Real  Naive est.     Error  % of total
system_prompt                    640         610       -5%        6.5%
tool_definitions                2180        1740      -20%       22.3%
conversation_history            6300        5980       -5%       64.4%
invoice_json                     540         710      +31%        5.5%
current_message                  130         128        -2%        1.3%
TOTAL                           9790
```

Two things worth noticing. First, the naive estimate is close on plain-prose segments (system prompt, current message) and badly wrong on the structured ones: `tool_definitions` — dense JSON schema with lots of punctuation and few common words — comes in 20% smaller in reality than the character count predicted, while `invoice_json` overshoots the other direction because of how its specific field names and short numeric values happen to tile. Second, the percentages — the thing you actually act on — barely move between the naive and real columns for the biggest segment. That's the case for measuring exactly: sometimes the rough estimate would have led you to the same conclusion, and you don't find out which case you're in until you count for real.

## Harden it

- **Count messages, not just raw strings, when the payload has structure.** `count_tokens` accepts the same `messages` and `system` shape as a real request — count the actual request object you're about to send, tool definitions and all, rather than reconstructing an approximation of it.
- **Cache counts for content that doesn't change.** A system prompt or tool schema block only needs recounting when its text changes — don't burn a call recomputing a constant on every request.
- **Re-baseline after a model change.** Tokenization is model-specific; a count taken against one model isn't valid for another, and this includes tokenizer changes between model generations, not just between vendors.

## Extend it

Wire `segment_report` into request logging so every real production call gets measured, not just the ones you happen to inspect by hand — that's the difference between a one-off audit and the standing discipline covered in [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting) and [Token Accounting: A Per-Turn Ledger](/learn/context-engineering/token-accounting-per-turn-ledger). Once you're tracking real counts per segment over time, you have what you need to set and enforce the kind of per-segment budget covered next in [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies).

**Related:** [Tokens Are Not Words](/learn/context-engineering/tokens-are-not-words) · [Dissecting a Live Context Payload](/learn/context-engineering/dissecting-a-live-context-payload) · [Context Observability and Token Accounting](/learn/context-engineering/context-observability-and-token-accounting) · [Token Accounting: A Per-Turn Ledger](/learn/context-engineering/token-accounting-per-turn-ledger)
