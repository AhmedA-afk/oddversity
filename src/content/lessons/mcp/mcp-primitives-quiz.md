---
title: "MCP Primitives: Check Yourself"
track: "mcp"
status: live
summary: "Five scenarios distinguishing tools, resources and prompts, plus capability negotiation and tool-result sizing."
duration: "7 min read"
---

## 1. The oblique question

Your server exposes `get_style_guide()` as a tool. Asked "should headings be title case?", the model calls it and answers correctly. Asked "does this draft match our house style?", it critiques the draft from general knowledge without ever calling the tool.

- **A.** The tool description needs to mention drafts explicitly.
- **B.** The style guide is content the model should simply have — make it a resource so the decision to fetch disappears.
- **C.** Force the tool with a tool-choice setting on every request.
- **D.** The model is unreliable; add a system-prompt instruction to always call it first.

<details><summary>Answer</summary>

**Correct: B.** Making correctness depend on the model deciding to fetch something it always needs is the flaw. A resource is placed in context by the host, so there is no decision to get wrong. **A** improves the odds on phrasings you anticipated and leaves the class of failure intact. **C** forcing a specific tool on every request wastes a turn even when the guide is irrelevant. **D** a prompt instruction is a prior, and this is precisely a case where it is not reliably followed.

</details>

## 2. The instruction users never add

Your refund server exposes solid tools. Colleagues get inconsistent results: some answers cite the policy clause, some invent conditions when the policy is silent.

- **A.** Add "cite the clause" to every tool description.
- **B.** Ship a prompt that names the resource, requires the clause, and instructs the model to decline when the policy is silent.
- **C.** Fine-tune a model on your policy.
- **D.** Return the policy as part of every tool result.

<details><summary>Answer</summary>

**Correct: B.** A prompt is where a server encodes the right way to use itself, including the instructions users will not think to write. **A** descriptions govern selection, not output format, and would be sent on every request regardless. **C** enormous effort for a formatting-and-refusal problem, and fine-tuning teaches form rather than the current policy. **D** duplicates a large document into every result and still does not require the refusal behaviour.

</details>

## 3. Works here, silent there

Your server uses sampling to summarise a document before returning it. It works in your client. In a colleague's client the tool returns nothing and the assistant moves on.

- **A.** Their client is out of date; tell them to upgrade.
- **B.** Sampling is a negotiated capability — check whether it was announced and have a path when it was not.
- **C.** Sampling requires an HTTP transport.
- **D.** The summary exceeded the context window.

<details><summary>Answer</summary>

**Correct: B.** Capabilities are announced at initialisation because implementations differ. Using an unannounced one fails mid-task with no useful message. Check, and degrade — return the untruncated text, or do the summarising in code. **A** may be true and does not make your server correct. **C** sampling is transport-independent. **D** would produce an error or truncation, not silence in one client only.

</details>

## 4. The result that broke the conversation

A tool returns your upstream API's response verbatim — around 40,000 characters of JSON. After it runs, the model's answers become vague and it starts forgetting earlier parts of the conversation.

- **A.** The model is rate-limited after large responses.
- **B.** The result consumed most of the context window, pushing out earlier content and burying the fields that mattered.
- **C.** JSON is a poor format for tool results; use YAML.
- **D.** The tool schema is too large.

<details><summary>Answer</summary>

**Correct: B.** Tool results go into the context window. A 40,000-character result crowds out everything else, and the two useful fields are buried among hundreds. Return summarised rows with an explicit truncation note. **A** not a real mechanism. **C** the format is not the problem; the volume is. **D** schemas are sent every request and are worth trimming, but they would not cause a degradation that begins right after a call.

</details>

## 5. Tool or resource

Which of these is correctly a **tool** rather than a resource?

- **A.** `get_api_docs()` — returns your service's API documentation.
- **B.** `list_tables()` — returns the database schema, identical every time.
- **C.** `search_orders(customer_email, since)` — queries orders matching arguments the model must choose.
- **D.** `get_company_holidays()` — returns this year's holiday list.

<details><summary>Answer</summary>

**Correct: C.** There is a genuine decision in the arguments — which customer, what date range — and it depends on the conversation. **A**, **B** and **D** all return the same content regardless of context, so calling them spends a turn to learn something the host could have supplied. They are resources.

</details>

---

Next: [primitives, worked](/learn/mcp/mcp-primitives-worked-example) builds one capability all three ways, and [the cheatsheet](/learn/mcp/mcp-primitives-cheatsheet) has the decision table.
