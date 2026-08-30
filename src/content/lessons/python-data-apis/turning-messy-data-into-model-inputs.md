---
title: "From Clean Table to Model-Ready Input"
track: "python-data-apis"
status: live
summary: "Worked-example lesson: takes six validated product reviews through five verified transformations — field assembly, PII stripping, context-window truncation, batching, and final JSO"
duration: "6 min read"
---

Your reviews table just passed validation — types are right, `rating` is in range, `review_id` is unique, nothing required is null. None of that means an LLM API can use it. The text still has a customer's email sitting in it, the reviews vary from one sentence to three paragraphs, and there's no batch structure at all. This lesson takes one real batch of validated reviews and turns it into the exact JSON that leaves your pipeline and lands in the API module's hands.

## The setup

Six reviews, already through schema validation in the previous step: correct types, `rating` between 1 and 5, no missing `review_text`. That's the table you're picking up from.

```python
import pandas as pd

reviews_df = pd.DataFrame([
    {
        "review_id": "R1001", "product_id": "P-204", "rating": 2,
        "review_text": "Battery died after 3 weeks of normal use. I emailed support twice (jane.doe@gmail.com) and never heard back. Really disappointed for a $200 charger.",
        "submitted_at": "2026-08-02T14:03:00Z",
    },
    {
        "review_id": "R1002", "product_id": "P-204", "rating": 5,
        "review_text": "Works exactly as advertised. Fast shipping, fast charging, no complaints.",
        "submitted_at": "2026-08-03T09:11:00Z",
    },
    {
        "review_id": "R1003", "product_id": "P-311", "rating": 1,
        "review_text": "If you want the full story, call me at 555-847-2210. My name is Marcus Webb, I bought this on July 14th and it caught fire on the counter. I want a refund and I want it now.",
        "submitted_at": "2026-08-03T22:47:00Z",
    },
    {
        "review_id": "R1004", "product_id": "P-118", "rating": 4,
        "review_text": "Solid product overall. I've used it daily for two months and it holds up well through commuting, a few drops, and constant sun exposure. Battery life beats the previous model. Only gripe: the companion app logs me out constantly.",
        "submitted_at": "2026-08-04T11:20:00Z",
    },
    {
        "review_id": "R1005", "product_id": "P-118", "rating": 3,
        "review_text": "It's fine. Does the job. Wish it came in more colors.",
        "submitted_at": "2026-08-05T16:32:00Z",
    },
    {
        "review_id": "R1006", "product_id": "P-311", "rating": 2,
        "review_text": "Order #48213-JP shipped 07/22, arrived 08/01 - 10 days for a 2-day product. Ticket #A-9931 still open. Tracking said 08/29, then 09/03, then nothing.",
        "submitted_at": "2026-08-06T08:15:00Z",
    },
])
```

The task: an LLM classifier will read each review and assign one label — `bug_report`, `shipping_complaint`, `safety_issue`, `praise`, `neutral`, or `other` — so support can route R1003 (a fire complaint) to someone today instead of finding it in a spreadsheet on Monday. Getting that review to the model fast, without leaking Marcus Webb's phone number to a third-party API in the process, is the whole point of this step.

By the end you'll have the literal JSON the API-calling module consumes — nothing upstream of that boundary is its problem anymore.

## Step by step

### Step 1 — Assemble the prompt fields

`reviews_df` has five columns. The classifier needs exactly two: something to identify the row, and the text to classify.

```python
def to_prompt_record(row):
    return {"id": row["review_id"], "text": row["review_text"]}

records = [to_prompt_record(row) for _, row in reviews_df.iterrows()]
records[0]
```

```json
{
  "id": "R1001",
  "text": "Battery died after 3 weeks of normal use. I emailed support twice (jane.doe@gmail.com) and never heard back. Really disappointed for a $200 charger."
}
```

`product_id`, `rating`, and `submitted_at` all stay behind in `reviews_df`. You'll rejoin them later using `id` once the classifier's labels come back — that's the whole reason `id` is in the record at all.

> **Why this step?** This is where you draw a line between "what we know about this review" and "what leaves the process." Treat it like the [data contract](/learn/python-data-apis/data-contracts-and-validation) it is: only fields on an explicit allowlist cross the boundary. Skip this and it's easy to `row.to_dict()` the whole record into a prompt — and now `rating` (a number you wanted the model to *predict*, not read) is quietly leaking into its input, and every extra field is tokens you're paying for on every single call.

### Step 2 — Strip PII

Two of these reviews carry customer contact info in plain text. Catch the ones with recognizable shapes with regex, before anything leaves your process.

```python
import re

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_RE = re.compile(r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b")

def strip_pii(text):
    text = EMAIL_RE.sub("[EMAIL]", text)
    text = PHONE_RE.sub("[PHONE]", text)
    return text

for r in records:
    r["text"] = strip_pii(r["text"])
```

R1001, before and after:

```
before: Battery died after 3 weeks of normal use. I emailed support twice (jane.doe@gmail.com) and never heard back. Really disappointed for a $200 charger.
after:  Battery died after 3 weeks of normal use. I emailed support twice ([EMAIL]) and never heard back. Really disappointed for a $200 charger.
```

R1003, before and after:

```
before: If you want the full story, call me at 555-847-2210. My name is Marcus Webb, I bought this on July 14th and it caught fire on the counter. I want a refund and I want it now.
after:  If you want the full story, call me at [PHONE]. My name is Marcus Webb, I bought this on July 14th and it caught fire on the counter. I want a refund and I want it now.
```

The phone number's gone. Hold that thought — there's still a name sitting in that string, and regex isn't going to find it. More on that shortly.

> **Why this step?** Redaction has to happen inside your own process, before the text crosses the network to a third-party API. Once a request is sent, you can't un-send it — it may sit in provider logs, retry queues, or a debugging trace you don't control. "Strip PII" isn't a nice-to-have data-quality step here; it's the difference between a customer complaint and a customer complaint plus a new incident.

### Step 3 — Truncate to fit the context window

Every review in a batch shares one [context window](/learn/llm-foundations/context-window-mechanics) with your system prompt and every other review alongside it. Cap each one deterministically, and cut on a word boundary so you're not slicing a word in half:

```python
MAX_CHARS = 160

def truncate(text, max_chars=MAX_CHARS):
    if len(text) <= max_chars:
        return text
    cutoff = text.rfind(" ", 0, max_chars)
    if cutoff == -1:
        cutoff = max_chars
    return text[:cutoff].rstrip() + " ..."

for r in records:
    r["text"] = truncate(r["text"])
```

R1004 was the longest review at 229 characters:

```
before (229 chars): Solid product overall. I've used it daily for two months and it holds up well through commuting, a few drops, and constant sun exposure. Battery life beats the previous model. Only gripe: the companion app logs me out constantly.

after (163 chars):  Solid product overall. I've used it daily for two months and it holds up well through commuting, a few drops, and constant sun exposure. Battery life beats the ...
```

R1003 (168 chars post-redaction) got trimmed too, down to 159. Final lengths across the batch:

```
R1001 137   R1002 73   R1003 159
R1004 163   R1005 53   R1006 149
```

> **Why this step?** If you don't cap length upstream, you don't find out you're over budget until the API call fails on a batch you already built — or worse, some providers just quietly drop the tail of an oversized prompt instead of erroring, and you never notice the model was reasoning over half a review. Truncating deterministically, one record at a time, means the failure (if any) shows up here, in code you can inspect, not three services downstream.

### Step 4 — Group into batches

One request per review wastes the system prompt's overhead on every single call; one request for all six risks blowing the context window and means a single bad row fails the whole thing. [Batching](/learn/python-data-apis/batching-llm-calls-for-throughput) is the tradeoff between those two failure modes — pick a size and chunk:

```python
def batchify(records, batch_size=2):
    return [records[i:i + batch_size] for i in range(0, len(records), batch_size)]

batches = batchify(records, batch_size=2)
# batch 0: ['R1001', 'R1002']
# batch 1: ['R1003', 'R1004']
# batch 2: ['R1005', 'R1006']
```

`batch_size=2` is small on purpose so you can see all three batches on one screen. A real batch size comes from a token budget and your provider's rate limits, not a round number picked for looks.

> **Why this step?** Batch size is a knob you're deliberately choosing, not a default you inherit. Too small and you pay the fixed cost (system prompt, network round trip) over and over. Too large and one malformed row — or one review that slipped past truncation — takes the whole batch down with it. Size batches to your actual token ceiling, with headroom, not to a guess.

### Step 5 — Emit the payload

This is what leaves the step. Each batch becomes one JSON object: an id, the task name, the label set the model should choose from, and the cleaned, truncated items.

```python
import json

LABELS = ["bug_report", "shipping_complaint", "safety_issue", "praise", "neutral", "other"]

def build_payload(batch, batch_index):
    return {
        "batch_id": f"batch-{batch_index:04d}",
        "task": "classify_review",
        "labels": LABELS,
        "items": batch,
    }

payloads = [build_payload(b, i) for i, b in enumerate(batches)]
print(json.dumps(payloads[0], indent=2))
```

```json
{
  "batch_id": "batch-0000",
  "task": "classify_review",
  "labels": [
    "bug_report",
    "shipping_complaint",
    "safety_issue",
    "praise",
    "neutral",
    "other"
  ],
  "items": [
    {
      "id": "R1001",
      "text": "Battery died after 3 weeks of normal use. I emailed support twice ([EMAIL]) and never heard back. Really disappointed for a $200 charger."
    },
    {
      "id": "R1002",
      "text": "Works exactly as advertised. Fast shipping, fast charging, no complaints."
    }
  ]
}
```

If this is crossing a process boundary — written to disk, picked up by a separate worker — write it as [JSONL](/learn/python-data-apis/json-and-jsonl-files), one batch per line, so the API module can stream it instead of loading every batch into memory at once:

```python
with open("reviews.batches.jsonl", "w") as f:
    for p in payloads:
        f.write(json.dumps(p) + "\n")
```

Notice what's *not* in this payload: no `product_id`, no `rating`, no raw phone numbers, no review over budget for the context window. The API module doesn't need to know any of that happened — it just needs `task`, `labels`, and `items`. That's the contract.

## Where it breaks

### Break 1: regex catches shapes, not meaning

R1003 — the fire complaint, the one review you most need to handle carefully — still has a problem after Step 2 and Step 3:

```
If you want the full story, call me at [PHONE]. My name is Marcus Webb, I bought this on July 14th and it caught fire on the counter. I want a refund and I ...
```

The phone number's redacted. The name isn't. `EMAIL_RE` and `PHONE_RE` match structured shapes — an `@`, a run of digits — but "Marcus Webb" is just two capitalized words next to each other, indistinguishable from any other pair of English words unless you know what a name looks like in context.

The tempting fix is a broader regex:

```python
NAME_HINT_RE = re.compile(r"\b([A-Z][a-z]+ [A-Z][a-z]+)\b")
NAME_HINT_RE.findall(records[2]["text"])
# ['Marcus Webb']
```

Run across all six records, it happens to fire cleanly here — R1003 only:

```python
for r in records:
    print(r["id"], NAME_HINT_RE.findall(r["text"]))
# R1001 []   R1002 []   R1003 ['Marcus Webb']
# R1004 []   R1005 []   R1006 []
```

Don't trust that it'll stay this clean. The same pattern matches "New York," a sentence-initial "Battery Life," any brand name with two capitalized words. It's not accurate enough to auto-redact with — but it's cheap enough to auto-*flag* with. The fix is a gate, not a smarter regex: hold anything suspicious for review instead of shipping it.

```python
def needs_review(text):
    return bool(NAME_HINT_RE.search(text))

clean_batch, held_for_review = [], []
for r in records:
    (held_for_review if needs_review(r["text"]) else clean_batch).append(r)

print([r["id"] for r in held_for_review])
# ['R1003']
```

R1003 gets pulled from the automated batch. A stronger redaction pass (a proper named-entity tool, or a human) clears it before it goes anywhere — the same "validate, and quarantine what fails" instinct from [data cleaning](/learn/python-data-apis/data-cleaning-workflow), just applied to what's allowed to leave the building instead of what's allowed into your dataframe.

### Break 2: character count is not token count

Look at two reviews that are almost the same length after Step 2 and Step 3 — R1001 at 137 characters, R1006 at 149:

```python
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")

for label, text in [("R1001", records[0]["text"]), ("R1006", records[5]["text"])]:
    n_chars = len(text)
    n_tokens = len(enc.encode(text))
    print(f"{label}: {n_chars} chars, {n_tokens} tokens, {n_chars/n_tokens:.2f} chars/token")

# R1001: 137 chars, 30 tokens, 4.57 chars/token
# R1006: 149 chars, 53 tokens, 2.81 chars/token
```

Twelve more characters, but 23 more tokens — nearly double the cost against the context window. R1006 is packed with order numbers, ticket IDs, and slashed dates; [byte-pair encoding](/learn/llm-foundations/byte-pair-encoding) gives common English words their own single token, but digits and punctuation runs like `#48213-JP` or `08/29` get split into several tokens each. `MAX_CHARS = 160` in Step 3 was never actually a token budget — it was a proxy that happens to hold for prose-like reviews and quietly fails for anything numeric or ID-heavy.

The fix is to stop guessing and measure the thing the model actually charges you for:

```python
def truncate_to_tokens(text, max_tokens, enc):
    tokens = enc.encode(text)
    if len(tokens) <= max_tokens:
        return text
    truncated = enc.decode(tokens[:max_tokens])
    return truncated.rstrip() + " ..."

truncate_to_tokens(records[5]["text"], max_tokens=20, enc=enc)
```

```
'Order #48213-JP shipped 07/22, arrived 08/01 - 10 ...'
```

That string re-encodes to 21 tokens, not 20 — decoding a raw token slice back to text and re-encoding it can shift by one token at the boundary. Treat a token budget as a target you leave headroom around, not a number you cut exactly to. (`pip install tiktoken` if you're following along; `cl100k_base` is one real, named encoding — swap it for whatever your model's tokenizer actually uses.)

## Takeaways

- **Assemble by allowlist, not by convenience.** `row.to_dict()` into a prompt is how internal fields — or fields you wanted the model to predict — end up as its input. Decide what crosses the boundary and keep an id to rejoin results afterward.
- **PII redaction is a validation gate, not a filter.** Regex catches structured shapes reliably and misses meaning-dependent PII (names, addresses in prose) reliably too. Flag what it can't confirm and hold it, rather than shipping a false negative.
- **Character counts are a convenience, not a budget.** Two reviews of nearly identical length can cost very different numbers of tokens depending on what's in them. If the context window is the real constraint, measure in tokens.
- **Batch size is a throughput/blast-radius tradeoff you choose deliberately**, sized to an actual token ceiling and rate limit — not a number that looks reasonable.
- **The payload is the contract.** Once it's `{task, labels, items}`, the API module doesn't need to know a dataframe, a regex, or a tokenizer was ever involved.

**Related:** [Validating dataframes with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) · [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) · [Context window mechanics](/learn/llm-foundations/context-window-mechanics) · [Batching LLM calls for throughput](/learn/python-data-apis/batching-llm-calls-for-throughput) · [Calling LLM APIs in Python](/learn/python-data-apis/calling-llm-apis-in-python) · [Structuring a Python AI service](/learn/python-data-apis/structuring-a-python-ai-service)
