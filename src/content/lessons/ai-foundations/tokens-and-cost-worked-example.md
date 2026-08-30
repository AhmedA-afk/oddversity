---
title: "Counting Tokens and Pricing a Call"
track: "ai-foundations"
status: live
summary: "Worked-example lesson: traces one real support-ticket triage call through BPE tokenization (including how 'unbelievable' fragments), exact input/output token counts via count_token"
duration: "2 min read"
---

Our system prompt burns 62 tokens before the customer ever says a word, the ticket itself burns another 84, and the model's JSON reply burns 55 more — a full round trip for under a tenth of a cent. That arithmetic is the whole point of this page: not the concept of a token (see [tokens-context-cost](/learn/ai-foundations/tokens-context-cost) for that), but what happens when you actually run the numbers on one real call, and what happens to those numbers when nobody's watching the system prompt.

## The setup (specific)

You're building a support-ticket triage feature on **Claude Sonnet 5**. Every incoming ticket gets one API call: a fixed system prompt with instructions, the customer's raw message as the user turn, and a structured JSON reply as the output.

System prompt (fixed, sent on every call):

```
You are a support-ticket triage assistant. Read the customer's message, assign
a priority (low, medium, high, or urgent), pick one category from: billing,
bug, feature-request, account, other. Then draft a two-sentence reply
acknowledging the issue. Respond as JSON with keys: priority, category, reply.
```

The ticket (this call's actual payload):

```
I've been using your app for three weeks and it's been mostly great, but
yesterday's update broke my export button — it's honestly unbelievable that
a change this small slipped through testing. Can someone look into this
before Friday? I have a client presentation and I need the CSV export
working again.
```

As of this writing, Anthropic's per-token pricing looks like this (check current docs before you rely on it — these numbers move):

| Model | Input $/MTok | Output $/MTok |
|---|---|---|
| Claude Haiku 4.5 | $1.00 | $5.00 |
| Claude Sonnet 5 | $2.00 | $10.00 |
| Claude Opus 5 | $5.00 | $25.00 |

Everything below traces this one ticket from raw text to a dollar figure, then breaks it on purpose.

## Step by step

### Step 1 — Watch BPE fragment the words

Byte-pair encoding doesn't tokenize by word or by morpheme — it merges whatever byte pairs showed up most often in its training data, and it stops merging wherever frequency runs out. You can watch this happen on words from this exact prompt using `tiktoken`, a BPE tokenizer library you can install and inspect locally:

```python
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")

for word in ["unbelievable", "feature-request", "CSV"]:
    ids = enc.encode(word)
    pieces = [enc.decode([i]) for i in ids]
    print(f"{word!r}: {len(ids)} tokens -> {pieces}")
```

Run it and you'll see something close to this:

```text
'unbelievable': 2 tokens -> ['un', 'believable']
'feature-request': 3 tokens -> ['feature', '-', 'request']
'CSV': 1 tokens -> ['CSV']
```

`unbelievable` splits right at the morpheme boundary — but that's a coincidence of frequency, not a grammar rule. `un-` shows up as a prefix in hundreds of common words (*unhappy, unable, undo, unlock*), so the merge algorithm learned it as a standalone piece early; `believable` is common enough on its own to have earned its own merged token too. `feature-request` splits around the hyphen because punctuation rarely merges with the words around it. And `CSV` stays whole — not because it's short, but because three-letter tech acronyms are common enough in training text to merge into a single token, same as `PDF` or `API`. Token count tracks corpus frequency, not word length or how important the word feels to you. For the mechanics of *how* those merges get learned in the first place, see [byte-pair-encoding](/learn/llm-foundations/byte-pair-encoding).

> **Why this step?** If you estimate cost by counting words, `unbelievable` looks like one unit and `CSV` looks like one unit — same weight. They're not. A prompt full of rare or hyphenated compounds can cost noticeably more than the same word count in common vocabulary, and you'd never see it coming from a word count alone.

### Step 2 — Count what Claude will actually bill you for

`tiktoken` is GPT's tokenizer, not Claude's — useful for building intuition about BPE, wrong for pricing a Claude call. For that, call the endpoint built for it:

```python
import anthropic

client = anthropic.Anthropic()

system_prompt = "You are a support-ticket triage assistant. ..."  # full text above
ticket = "I've been using your app for three weeks ..."           # full text above

count = client.messages.count_tokens(
    model="claude-sonnet-5",
    system=system_prompt,
    messages=[{"role": "user", "content": ticket}],
)
print(count.input_tokens)
```

Say that prints **146**. That's the number that actually gets billed, not an estimate. If you want a rough sense of how much of that is the fixed instructions versus this specific ticket, count the system prompt alone as if it were a user turn — it's an approximation (the real `system` field tokenizes slightly differently than a message), but it's close enough to see where the weight sits: roughly 60 tokens of fixed instructions, roughly 85 of this particular customer's words.

> **Why this step?** `count_tokens` is free and doesn't run the model — call it before you ship, not after the first invoice surprises you. And never substitute a different vendor's tokenizer for the real one: two providers can tokenize the same string into different counts, so an OpenAI-tokenizer estimate of a Claude bill is a guess wearing a number.

### Step 3 — Make the call, read the output count off the response

You don't need a second counting call for output tokens — every response carries its own usage:

```python
response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=200,
    system=system_prompt,
    messages=[{"role": "user", "content": ticket}],
)

print(response.usage.input_tokens, response.usage.output_tokens)
```

Say that prints `146 55` — matching the count from Step 2, plus 55 output tokens for a reply like:

```json
{
  "priority": "high",
  "category": "bug",
  "reply": "Thanks for flagging this, and I'm sorry it's landed right before your client presentation. I'm escalating the broken export to engineering now and will follow up before Friday."
}
```

One customer complaint went in; a priority, a category, and a drafted reply came out. That transformation is the entire product.

### Step 4 — Turn tokens into dollars

At Sonnet 5's rates ($2.00 / $10.00 per million):

```
input:  146 tokens × ($2.00 / 1,000,000)  = $0.000292
output:  55 tokens × ($10.00 / 1,000,000) = $0.000550
                                    total  = $0.000842
```

Under a tenth of a cent. Notice output is priced 5x input here — a system prompt that asks for a longer reply (a paragraph instead of two sentences) hits you on both axes: more output tokens, at a higher per-token rate.

> **Why this step?** A per-call cost by itself tells you almost nothing about whether a design is cheap. $0.000842 sounds negligible right up until the next step.

### Step 5 — Multiply by the volume you'll actually run

Say this feature triages 50,000 tickets a month:

```
50,000 × $0.000842 = $42.10 / month
```

Forty-two dollars for a fully automated triage layer on fifty thousand tickets is a genuinely good trade. Keep that number — it's the baseline the next section breaks. For a broader feel of how these small per-token differences add up across model choices and call patterns, see [inference-cost-and-latency-intuition](/learn/ai-foundations/inference-cost-and-latency-intuition).

## Where it breaks

Three months in, someone on the team wants replies to sound more consistently on-brand, so they paste the entire product FAQ, style guide, and forty example tickets into the `system` field "just to be safe." The system prompt grows from ~60 tokens to, say, **11,000 tokens**. Nothing else about the request changes — same ticket, same 55-token output.

New per-call input: 11,000 + 84 (this ticket) ≈ **11,084 tokens**.

```
input:  11,084 tokens × ($2.00 / 1,000,000) = $0.022168
output:     55 tokens × ($10.00 / 1,000,000) = $0.000550
                                       total  = $0.022718
```

At the same 50,000 tickets/month:

```
50,000 × $0.022718 = $1,135.90 / month
```

That's a **27x** increase — from $42.10 to $1,135.90 — for a feature whose actual behavior (priority, category, two-sentence reply) barely moved. Nobody decided to spend an extra thousand dollars a month; someone pasted a document into a text field. And cost isn't the only thing that scaled: those 11,000 tokens are now consumed on *every single call*, permanently reducing how much room is left for conversation history or retrieved context before you hit the ceiling — see [context-window-mechanics](/learn/llm-foundations/context-window-mechanics) for what happens when that room runs out. A model with a very large context window absorbs this easily; one with a smaller window feels the squeeze far sooner.

**The fix, in two layers.** The mechanical layer: if that 11,000-token block is genuinely static across calls, mark it for prompt caching instead of paying full price every time. The first call pays a small premium to write it to cache (roughly 1.25x the standard input rate); every call after that, within the cache's lifetime (minutes by default), reads it at roughly a tenth of the normal input price:

```
cached (11,000 @ ~0.1x): 11,000 × ($2.00/1,000,000) × 0.1 = $0.0022
uncached (84 tokens):        84 × ($2.00/1,000,000)        = $0.000168
output (55 tokens):           55 × ($10.00/1,000,000)       = $0.00055
                                                      total  = $0.002918
```

```
50,000 × $0.002918 = $145.90 / month
```

Caching cuts the bloated version by about 87% ($1,135.90 → $145.90) — real money saved for a one-line change. But notice it doesn't get you back to $42.10. You're still shipping 11,000 mostly-irrelevant tokens on every call; caching just makes that bad habit cheaper, it doesn't fix it. The deeper layer is deciding what actually belongs in a system prompt that runs on every call versus what should be looked up only when relevant — which is exactly the problem retrieval-based approaches exist to solve; see [what-is-rag-and-when-to-use-it](/learn/rag/what-is-rag-and-when-to-use-it) if your "just in case" context keeps growing. For the actual client code and request shape behind every example above, see [calling-llm-apis-in-python](/learn/python-data-apis/calling-llm-apis-in-python).

## Takeaways

- **BPE splits by frequency, not by meaning.** You can't predict a token count by eyeballing word length or complexity — `CSV` is one token, `feature-request` is three. Measure, don't guess.
- **Never price one provider's tokens with another provider's tokenizer.** Use `tiktoken` (or similar) to build intuition about how BPE fragments text; use the provider's own counting endpoint (`count_tokens` for Claude) for anything you're going to bill against.
- **Output tokens are usually priced higher than input tokens.** A prompt that asks for a longer answer costs you twice — more tokens, at a worse rate per token.
- **A per-call cost means nothing until you multiply by real volume.** $0.0008 and $0.023 both look like rounding errors until you multiply by 50,000 calls a month and watch one turn into the other.
- **Static content that repeats across every call is a caching problem, not a fixed cost.** But caching a bloated prompt is a bandage — the actual fix is deciding what earns a permanent seat in the system prompt versus what should be fetched only when it's relevant.

**Related:** [tokens-context-cost](/learn/ai-foundations/tokens-context-cost) · [byte-pair-encoding](/learn/llm-foundations/byte-pair-encoding) · [context-window-mechanics](/learn/llm-foundations/context-window-mechanics) · [choosing-a-model-decision-framework](/learn/ai-foundations/choosing-a-model-decision-framework) · [calling-llm-apis-in-python](/learn/python-data-apis/calling-llm-apis-in-python)
