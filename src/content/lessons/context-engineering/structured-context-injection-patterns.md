---
title: "Structured Context Injection"
track: "context-engineering"
status: live
summary: "Build an injection layer that tags every source with an ID and boundary, so the model can cite what it actually used."
duration: "7 min read"
---

A model that answers correctly but can't tell you which of five injected sources it used hasn't given you a debuggable answer — it's given you a plausible one. This lesson builds the injection layer that fixes that: labeled, bounded blocks instead of a prose blob, wired so the model's citations are checkable.

## What we're building

A small assembly function that takes three different kinds of context — retrieved documents, a user profile, and active constraints — and injects each as its own clearly delimited, labeled block, rather than concatenating everything into one undifferentiated wall of text. We'll verify the payoff directly: ask the model to cite its source, and check that the citation actually resolves to a real block.

## Setup

Assume three inputs already exist, from wherever your pipeline sources them: filtered documents (post-[relevance filtering](/learn/context-engineering/relevance-filtering)), a profile dict, and a list of active constraint strings.

```python
documents = [
    {"id": "doc_1", "source": "refund-policy.md", "text": "Refunds are issued within 5-7 business days for damaged items."},
    {"id": "doc_2", "source": "shipping-faq.md", "text": "International orders may take 10-14 days in transit."},
]
profile = {"user_id": "u_4471", "plan": "pro", "region": "EU"}
constraints = ["Never quote exact dollar amounts without the currency symbol.", "Do not offer refunds beyond policy without escalation."]
```

## Build it

### Step 1: wrap each document in a bounded, identified block

```python
def render_documents(documents: list[dict]) -> str:
    blocks = []
    for doc in documents:
        blocks.append(
            f'<document id="{doc["id"]}" source="{doc["source"]}">\n'
            f'{doc["text"]}\n'
            f'</document>'
        )
    return "\n\n".join(blocks)
```

> **Why this step?** An unlabeled wall of retrieved text gives the model no handle to reference. `id="doc_1"` gives it something concrete to cite, and gives you something to grep for afterward to check whether the citation is real — this is the mechanical fix underneath [Structured Context Injection](/learn/context-engineering/structured-context-injection).

### Step 2: render the profile and constraints as their own labeled sections

```python
def render_profile(profile: dict) -> str:
    fields = "\n".join(f"- {k}: {v}" for k, v in profile.items())
    return f"<user_profile>\n{fields}\n</user_profile>"

def render_constraints(constraints: list[str]) -> str:
    items = "\n".join(f"- {c}" for c in constraints)
    return f"<constraints>\n{items}\n</constraints>"
```

> **Why this step?** Profile data and constraints answer completely different questions than retrieved documents do — "who is this for" and "what's off-limits" versus "what's the source material." Keeping them in separate labeled sections means the model isn't left to infer, from an undifferentiated blob, that a `region: EU` line is metadata about the user rather than a fact from a retrieved document.

### Step 3: assemble in a fixed, labeled order

```python
def assemble_prompt(documents, profile, constraints, question: str) -> str:
    return (
        f"{render_constraints(constraints)}\n\n"
        f"{render_profile(profile)}\n\n"
        f"<retrieved_documents>\n{render_documents(documents)}\n</retrieved_documents>\n\n"
        f"<question>{question}</question>\n\n"
        "Answer the question using only the retrieved documents. "
        "Cite the document id(s) you used, in the form [doc_id]."
    )
```

> **Why this step?** Order here is also a placement decision, not just an organizational one — constraints go early because they're foundational framing (primacy, see [Recency and Primacy Effects](/learn/context-engineering/recency-and-primacy-effects)), and the explicit citation instruction sits right before generation, where recency gives it the best chance of being followed.

## Run it

Assembling the example inputs above and asking "How long do refunds take for a damaged item, and what's my region?" produces a response that can cite `[doc_1]` for the refund timing and reference the profile block for the region — because the model has clean handles for both, not one undifferentiated paragraph it has to mentally re-segment. You can then check the citation mechanically:

```python
import re

def verify_citations(answer: str, valid_ids: set[str]) -> list[str]:
    cited = set(re.findall(r"\[(doc_\d+)\]", answer))
    return [c for c in cited if c not in valid_ids]  # any bad citation

bad = verify_citations(model_answer, {"doc_1", "doc_2"})
# bad == [] means every citation resolved to a real, injected document
```

That check is the actual payoff of structuring the injection this way: with a prose blob, there's nothing to run `verify_citations` against — a claimed source is just a sentence, unfalsifiable without a human reading both the answer and the raw context side by side. With bounded IDs, a citation is either real or it isn't, mechanically.

## Harden it

- **Don't let tags leak into user-visible output.** If your model is prone to echoing raw XML tags in its answer, strip them post-generation or instruct explicitly that tags are structural, not part of the response.
- **Keep tag names stable across a session.** If `doc_1` in turn 3 refers to a different document than `doc_1` in turn 7 (because retrieval reran), citations from earlier turns become misleading if quoted back — use session-unique IDs if documents get re-fetched turn over turn.
- **Match delimiter choice to your actual constraints.** XML-style tags aren't the only option — see [XML vs. Markdown vs. JSON Delimiters](/learn/context-engineering/xml-vs-markdown-vs-json-delimiting) for when a markdown heading or a JSON object is the better fit for the same bounding job.

## Extend it

Combine this with the placement pass from [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention) — structure tells the model *what* a block is; ordering decides *where* it sits. Neither substitutes for the other: a perfectly labeled block buried in a noisy middle position is still working against the model's attention, per [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained).

**Related:** [Structured Context Injection](/learn/context-engineering/structured-context-injection), [XML vs. Markdown vs. JSON Delimiters](/learn/context-engineering/xml-vs-markdown-vs-json-delimiting), [Ordering Context for Attention](/learn/context-engineering/ordering-context-for-attention), [Recency and Primacy Effects](/learn/context-engineering/recency-and-primacy-effects)
