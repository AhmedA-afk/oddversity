---
title: "XML vs Markdown vs JSON Delimiters"
track: "context-engineering"
status: live
summary: "Same payload, three formats — compared on parseability, robustness to embedded content, and token overhead."
duration: "7 min read"
---

You have the same context to inject — a handful of documents, a profile, some constraints — and three plausible ways to fence it off. None of them is universally right. Here's what actually changes when you pick one over another, run on the same payload.

## The payload, held constant

Two short documents, injected three different ways:

```text
Doc A (refund-policy.md): "Refunds are issued within 5-7 business days for damaged items."
Doc B (shipping-faq.md): "International orders may take 10-14 days in transit."
```

## XML-style tags

```xml
<document id="doc_a" source="refund-policy.md">
Refunds are issued within 5-7 business days for damaged items.
</document>
<document id="doc_b" source="shipping-faq.md">
International orders may take 10-14 days in transit.
</document>
```

**How it works.** Named opening and closing tags carry both an identity and an explicit boundary. Nesting is unambiguous — a tag closes exactly where it says it closes, regardless of what's inside it, including content that itself contains angle brackets in prose (as long as it doesn't contain an actual matching tag name).

**When it wins.** Untrusted or user-generated content going into the prompt, where a hard, unambiguous boundary matters most — a stray markdown `#` in a pasted document can be mistaken for a real heading, but a closing `</document>` tag is far less likely to appear by accident in prose. Also wins when you need attributes alongside content (`source`, `page`, `confidence`) without inventing a side-channel.

**Failure mode.** Verbose — every block pays for an opening and closing tag, and attributes add more. A prompt with twenty small documents accumulates real token overhead just in punctuation and tag names.

**Relative cost.** Highest token overhead of the three for large numbers of small blocks; the cost is roughly fixed per block regardless of content length, so it matters most when you have many short items.

## Markdown headers

```markdown
### Document: refund-policy.md (id: doc_a)
Refunds are issued within 5-7 business days for damaged items.

### Document: shipping-faq.md (id: doc_b)
International orders may take 10-14 days in transit.
```

**How it works.** A heading marks where a section starts; the next heading (or end of text) marks where it ends implicitly. No explicit closing marker.

**When it wins.** A human is going to read the raw prompt too — markdown renders cleanly and is the most readable format at a glance, which matters for prompts that get logged, reviewed, or hand-edited during development. Also cheaper than XML per block, since there's no closing tag to pay for.

**Failure mode.** The implicit boundary is the weak point: if injected content itself contains a `###` line (a pasted document with its own markdown headers, for instance), the model can misread where one section ends and the next begins, or misattribute content to the wrong document. There's also no clean place to attach structured metadata beyond what you can cram into the heading text itself.

**Relative cost.** Cheapest of the three per block — a heading line is a handful of tokens versus a tag pair.

## JSON

```json
[
  {"id": "doc_a", "source": "refund-policy.md", "text": "Refunds are issued within 5-7 business days for damaged items."},
  {"id": "doc_b", "source": "shipping-faq.md", "text": "International orders may take 10-14 days in transit."}
]
```

**How it works.** Content and metadata live in one machine-parseable structure with unambiguous field boundaries — quotes and braces, not conventions the model has to infer.

**When it wins.** The prompt is assembled entirely by code from data that already exists as objects — your retrieval layer already returns a list of dicts, so serializing to JSON avoids hand-formatting a string at all, and it's the natural choice when the *response* also needs to be structured, keeping the whole exchange in one consistent shape.

**Failure mode.** Multi-line prose with unescaped quotes, newlines, or special characters has to be properly JSON-escaped or the structure breaks — a document containing a literal `"` needs `\"`, and a naive string-concatenation build (rather than an actual JSON serializer) is a common way to silently corrupt the payload. It also reads worse to a human skimming the raw prompt than either of the other two.

**Relative cost.** Moderate — cheaper than XML's tag pairs, more expensive than markdown's bare headings, with overhead scaling with how much metadata each object carries.

## A fourth option: plain delimited prose

```text
=== refund-policy.md ===
Refunds are issued within 5-7 business days for damaged items.
=== shipping-faq.md ===
International orders may take 10-14 days in transit.
```

**How it works.** An arbitrary, visually distinct separator string marks boundaries — no formal syntax at all.

**When it wins.** The absolute cheapest option token-wise, and fine for a small number of low-stakes, trusted sections where citation and metadata don't matter — a quick internal tool, not something serving untrusted input.

**Failure mode.** Weakest boundary of the four — a separator string this arbitrary is the most likely to appear by coincidence in injected content, and it carries no identity or metadata at all, so there's nothing to cite back to.

## Decision table

| Format | Boundary strength | Token cost | Best for |
|---|---|---|---|
| XML tags | Strongest (explicit close, supports attributes) | Highest | Untrusted content, need for metadata/attributes, citation-heavy answers |
| Markdown headers | Moderate (implicit, breaks on nested headers) | Low | Human-readable prompts, trusted content, dev-time debugging |
| JSON | Strong (structural, if properly escaped) | Moderate | Code-assembled prompts from existing objects, structured request/response pairs |
| Plain delimiters | Weakest | Lowest | Small, trusted, low-stakes sections only |

## How to choose

Default to **XML-style tags** when the content is retrieved, user-supplied, or otherwise untrusted, or when the model needs to cite a specific source — the explicit close and the attribute slot earn their token cost, and this is consistent with why [Structured Context Injection](/learn/context-engineering/structured-context-injection-patterns) leans on tags for exactly this case. Switch to **markdown** when a human is the primary reader of the raw prompt and the content is trusted — internal system prompts, dev-time templates, documentation-style context. Switch to **JSON** when the prompt is built entirely by code from objects that already exist in that shape, especially if the response needs to match. Reach for **plain delimiters** only for quick, trusted, low-stakes cases where neither citation nor robustness against embedded formatting matters.

The one thing to avoid is mixing formats inconsistently within the same prompt — a model parsing three XML-tagged documents and then one markdown-headed one has to context-switch its own parsing strategy mid-prompt, which is friction you don't need to add.

**Related:** [Structured Context Injection](/learn/context-engineering/structured-context-injection-patterns), [Structured Context Injection](/learn/context-engineering/structured-context-injection), [Placing Instructions So They Stick](/learn/context-engineering/placing-instructions-for-adherence), [Token Budgeting Strategies](/learn/context-engineering/token-budgeting-strategies)
