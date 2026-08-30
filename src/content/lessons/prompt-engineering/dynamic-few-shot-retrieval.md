---
title: "Retrieving Few-Shot Examples at Runtime"
track: "prompt-engineering"
status: live
summary: "Embed a bank of labeled examples and pull the k most similar to each incoming input, instead of shipping the same fixed shots every call."
duration: "8 min read"
---

A fixed three-shot prompt can only cover the boundaries you knew about when you wrote it. Once your traffic is diverse enough that no fixed handful of examples covers everything real users send, the fix stops being "pick better examples by hand" and becomes "pick examples per request" — the same retrieve-then-use pattern behind [RAG](/learn/rag/what-is-rag-and-when-to-use-it), pointed at labeled examples instead of document chunks.

## What we're building

A retrieval step that, given a growing bank of labeled examples and one incoming message, embeds the message, finds the k most similar examples in the bank, and assembles a few-shot prompt from just those — so every request gets the examples most relevant to it, not the same static set every time.

## Setup

You need three things: a bank of labeled examples (the bigger and more diverse it gets over time, the more this approach pays off relative to a fixed set), a way to turn text into a comparable vector, and cosine similarity to rank by closeness. In production you'd use a real embedding model; here, scikit-learn's TF-IDF vectorizer stands in as a runnable, dependency-light approximation of "how similar is this new input to each example" — it only catches lexical overlap rather than deeper semantic similarity, which is called out in *Harden it* below.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
```

## Build it

### 1. Define the example bank

```python
EXAMPLE_BANK = [
    {"text": "I was charged twice this month.", "label": "billing"},
    {"text": "My invoice shows the wrong plan tier.", "label": "billing"},
    {"text": "I upgraded to remove ads but I'm still seeing them.", "label": "billing"},
    {"text": "The export button does nothing when I click it.", "label": "bug"},
    {"text": "Every time I upload a CSV over 10MB the page freezes.", "label": "bug"},
    {"text": "The app crashed right after I logged in.", "label": "bug"},
    {"text": "Could you add dark mode?", "label": "feature_request"},
    {"text": "It would be great if I could export to Notion.", "label": "feature_request"},
]
```

The bank should be bigger and more varied than any fixed few-shot set you'd hand-write for a single prompt — that's the entire payoff of retrieval: more coverage across the bank than you could ever fit into one static prompt, with only k of them actually spent on any given call.

### 2. Embed the bank once, offline

```python
vectorizer = TfidfVectorizer().fit([e["text"] for e in EXAMPLE_BANK])
bank_vectors = vectorizer.transform([e["text"] for e in EXAMPLE_BANK])
```

This runs once, when the bank is built or updated — not on every incoming request. The expensive part (turning every example into a vector) is amortized across every future call that reuses this same bank.

### 3. Retrieve the k nearest examples for a new input

```python
def retrieve_examples(query: str, k: int = 3):
    query_vec = vectorizer.transform([query])
    sims = cosine_similarity(query_vec, bank_vectors)[0]
    top_k_idx = sims.argsort()[::-1][:k]
    return [EXAMPLE_BANK[i] for i in top_k_idx]
```

This is standard nearest-neighbor retrieval — the exact mechanism [RAG](/learn/rag/what-is-rag-and-when-to-use-it) uses to find relevant document chunks, applied here to labeled examples instead.

### 4. Build the prompt from the retrieved examples

```python
def build_prompt(query: str, k: int = 3) -> str:
    examples = retrieve_examples(query, k)
    shots = "\n".join(
        f'Ticket: "{e["text"]}"\nLabel: {e["label"]}\n' for e in examples
    )
    return f'{shots}\nTicket: "{query}"\nLabel:'
```

That's the whole pipeline — under 40 lines including the bank definition, none of it specific to any one query.

## Run it

```python
print(build_prompt("My card was billed for a plan I already cancelled."))
```

With this query, TF-IDF similarity on shared vocabulary ("billed," "plan") pulls in both billing examples plus, depending on overlap, one other — different from what a fixed, hand-picked three-shot set (one per class, chosen once) might have included, which may never have shown a cancellation-flavored billing case at all. That's the practical difference: the fixed set gives you whatever you thought to write down in advance; retrieval gives you whatever's actually closest to *this* input, out of everything in the bank.

## Harden it

- **Cache the bank's embeddings, not just compute them once.** Recompute only when the bank changes — adding a new labeled example, correcting a mislabeled one — not on a schedule or per request.
- **Deduplicate near-identical retrieved examples.** Two paraphrases of the same complaint retrieved together add cost without adding coverage — see [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection) for why a boundary-covering example is worth more than a redundant one.
- **Guard against retrieving an accidentally one-label result set.** If the bank happens to be lopsided toward one class near a given query, naive top-k retrieval can hand back k examples that are all the same label — reproducing the exact failure covered in [When Your Examples Teach the Wrong Thing](/learn/prompt-engineering/few-shot-format-leakage) and [Label Bias, Recency Bias, and Majority Labels](/learn/prompt-engineering/label-bias-and-majority-label), just generated automatically instead of by hand. A simple mitigation: retrieve more than k candidates, then select the top-scoring example per label before filling any remaining slots by score.
- **Log which examples got retrieved per request.** When an output looks wrong, knowing exactly which three examples the model saw is the fastest way to tell whether the retrieval step or the model's completion is at fault.
- **Swap TF-IDF for a real embedding model in production.** TF-IDF only catches shared vocabulary — "won't turn on" and "doesn't power up" score as dissimilar despite meaning the same thing. A proper embedding model closes that gap; the retrieval logic above doesn't change, only what produces `bank_vectors` and `query_vec`.

## Extend it

- **Add a similarity floor.** If the best match's cosine similarity falls below a threshold, the incoming input may not resemble anything in your bank well enough for any retrieved example to help — fall back to a plain [zero-shot](/learn/prompt-engineering/zero-shot-when-its-enough) instruction rather than forcing in weakly-related examples that could mislead more than they guide.
- **Still control k and order deliberately.** Retrieval decides *which* examples to use; you still choose how many to retrieve and should still shuffle their order in the assembled prompt, for the same reasons covered in [How Many Shots, and In What Order](/learn/prompt-engineering/example-count-and-ordering) — retrieval doesn't make ordering effects go away, it just changes which examples they apply to.
- **Grow the bank from real misses.** Every production misclassification you catch and correct is a natural candidate to add back into the bank — this is the retrieval-based version of the manual swap in [Worked Example: A Three-Shot Intent Classifier](/learn/prompt-engineering/three-shot-classifier-worked), just scaled to run automatically on every future request instead of once by hand.

**Related:** [What Is RAG and When to Use It](/learn/rag/what-is-rag-and-when-to-use-it) · [Choosing Which Examples to Show](/learn/prompt-engineering/few-shot-example-selection) · [When Your Examples Teach the Wrong Thing](/learn/prompt-engineering/few-shot-format-leakage) · [Label Bias, Recency Bias, and Majority Labels](/learn/prompt-engineering/label-bias-and-majority-label) · [Zero-Shot: When You Don't Need Examples](/learn/prompt-engineering/zero-shot-when-its-enough)
