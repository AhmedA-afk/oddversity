---
title: "XML vs Markdown vs JSON: Choosing a Prompt Format"
track: "prompt-engineering"
status: live
summary: "A four-way comparison of plain prose, Markdown, XML, and JSON prompt formats, with a decision table sorted by task type."
duration: "6 min read"
---

[XML tags vs. Markdown](/learn/prompt-engineering/xml-tags-vs-markdown) settles that comparison. In practice you're usually choosing from four options, not two — plain prose is often the right call, and JSON belongs in the mix the moment a prompt is assembled by code instead of typed by a person.

## Plain prose

How it works: no explicit structure at all. The instruction and the data are just sentences, the way you'd type a question into a chat box.

```text
Summarize this article in three bullet points: [article text follows]
```

When it wins: a short, single-purpose ask with one piece of content and no examples. If there's only one "thing" in the prompt, there's no boundary to lose track of.

Failure mode: the moment a second thing enters — an example, a second document, a constraint that needs to survive contact with a long pasted document — prose has no seam to keep them apart, which is exactly the instruction-bleed risk [delimiters that actually help](/learn/prompt-engineering/delimiters-that-actually-help) walks through on an adversarial input.

Relative cost: lowest token overhead and lowest authoring effort by far. The cost is entirely deferred risk, paid later as ambiguity.

## Markdown headers

How it works: `##` and `###` headers, bullets, and bold labels — the formatting conventions of any document you've ever read.

```text
## Task
Summarize the reviews below in two sentences. Mention both positive
and negative themes.

## Reviews
- "Great battery life but the app crashes weekly."
- "Solid build, wish it came in more colors."
```

When it wins: prompts a human will read and edit regularly — system prompts, prompts with a handful of clearly separated sections, anything living in a doc or a config file someone will glance at before shipping. It's the natural choice when the audience for the *prompt itself* includes people, not just the model.

Failure mode: a header marks where a section starts, not where it ends. If the content inside a section contains something that looks like a header, or two sections sit back-to-back with no blank line, the boundary is inferred rather than guaranteed — the exact gap [XML tags vs. Markdown](/learn/prompt-engineering/xml-tags-vs-markdown) covers.

Relative cost: cheap in tokens, easy to scan and edit by hand. Reliability degrades as the prompt grows more sections or needs real nesting, which Markdown has no native way to express.

## XML tags

How it works: named, paired tags with an explicit open and close, nestable to any depth.

```text
<instructions>Summarize the reviews in two sentences. Mention both
positive and negative themes.</instructions>
<reviews>
<review>Great battery life but the app crashes weekly.</review>
<review>Solid build, wish it came in more colors.</review>
</reviews>
```

When it wins: multiple distinct sections that must stay separated, genuinely nested data (examples containing sub-fields, several documents that shouldn't blur together), and untrusted or user-submitted content that needs a hard fence — see [sectioning a prompt into blocks](/learn/prompt-engineering/sectioning-a-prompt-into-blocks) for the four-block shape this pairs with by default.

Failure mode: overhead. Wrapping a one-line answer in three levels of tags is friction for no reliability gain, and reaching for tags everywhere leads to the over-fencing habit covered in [formatting anti-patterns](/learn/prompt-engineering/formatting-anti-patterns). Tags also aren't literally enforced the way real XML parsing would be — a model can still be confused by content engineered to fake a closing tag.

Relative cost: more tokens than Markdown or prose for the same content. Worth it once a prompt has enough moving parts that ambiguity is the more expensive problem.

## JSON-structured prompts

How it works: the prompt (or the part of it carrying data) is a JSON object with named keys — `task`, `context`, `examples`, `output_schema` — rather than hand-written prose.

```json
{
  "instructions": "Summarize the reviews in two sentences. Mention both positive and negative themes.",
  "reviews": [
    "Great battery life but the app crashes weekly.",
    "Solid build, wish it came in more colors."
  ]
}
```

When it wins: when your own code is building the prompt from objects that already exist — a list of examples pulled from a database, a schema your pipeline already defines. Serializing a Python list or dict to JSON is one line and can't misplace a delimiter; hand-formatting the same list into prose risks a stray character breaking the boundary. It's also the natural choice when you want [structured output](/learn/prompt-engineering/structured-output) that mirrors a well-typed input, or you're passing state between stages of a pipeline that already speaks JSON, as in [JSON schema in prompts](/learn/prompt-engineering/json-schema-in-prompts).

Failure mode: JSON is a machine format wearing a human-readable font. Long free-text fields need real escaping — embedded quotes and newlines inside a JSON string are exactly the naive-interpolation risk covered in [escaping user content in templates](/learn/prompt-engineering/escaping-user-content-in-templates) — and instructions expressed as a JSON string value read stiffly to a model that's used to prose instructions, so responses can come back oddly formatted if you don't also spell out the expected reply shape.

Relative cost: highest overhead to hand-author correctly (escaping, quoting, nested brackets), lowest overhead to *generate* correctly from code that already has the data as real objects rather than a string you're assembling by hand.

## Decision table

| Task type | Best format | Why |
|---|---|---|
| Quick one-off question, no embedded data | Plain prose | Nothing to lose track of |
| Human-authored system prompt, edited by teammates | Markdown | Scannable, cheap, matches how people already read docs |
| Nested or multi-part data (documents, examples with sub-fields) | XML tags | Explicit, nestable, named boundaries |
| Untrusted content that must not be read as instructions | XML tags | Explicit close plus a stated rule about what's inert |
| Prompt assembled programmatically from existing objects | JSON | The data is already a dict or list — serialize it, don't restring it |
| Output must be machine-parsed downstream | Match the output format to the contract | The instruction's format and the output's format are separate decisions |

## How to choose

Start from what's already true, not from a rule you memorized. Is a person going to read and edit this prompt directly — lean Markdown or prose. Does the prompt carry more than one distinct section, or content you don't trust — reach for XML. Is the prompt itself generated by code from data structures you already have — serialize to JSON rather than hand-assembling text, since that's the format your code already speaks. Most real prompts end up mixing two of these — Markdown-readable prose instructions wrapped around an XML-fenced data block is a common and reasonable combination, not a compromise you should feel bad about.

**Related:** [XML Tags vs. Markdown](/learn/prompt-engineering/xml-tags-vs-markdown), [Sectioning a Prompt into Blocks](/learn/prompt-engineering/sectioning-a-prompt-into-blocks), [JSON Schema in Prompts](/learn/prompt-engineering/json-schema-in-prompts), [Structured Output](/learn/prompt-engineering/structured-output), [Delimiters That Actually Reduce Errors](/learn/prompt-engineering/delimiters-that-actually-help)
