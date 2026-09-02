---
title: "Tool Calling Across Providers"
track: "tools-function-calling"
status: live
summary: "Four providers, four message shapes for the same idea — OpenAI, Anthropic, Gemini, and open-weight models compared."
duration: "8 min read"
---

The concept behind tool calling is identical everywhere. The JSON is not. Port code between providers without checking the shape and you'll get a request that's silently ignored, or an API error, well before you get a chance to debug your actual logic.

## OpenAI (`tools` / `tool_calls`)

**How it works:** you declare tools as `{"type": "function", "function": {name, description, parameters}}`. A tool-wanting response sets `finish_reason: "tool_calls"` and puts one or more calls in `message.tool_calls`, each with an `id` and a `function.arguments` field that is a **JSON string**, not an object — you must `json.loads()` it yourself. You reply with a dedicated `role: "tool"` message per call, each carrying `tool_call_id`.

**When it wins:** broadest ecosystem support — most agent frameworks, tutorials, and third-party tools default to this shape, so it's the path of least friction if you're integrating with existing OpenAI-shaped tooling.

**Failure mode:** forgetting to parse the stringified `arguments`, or trying to string-match it instead of parsing — escaping inside that string (nested quotes, unicode) breaks naive matching in ways that don't show up until a user sends unusual input.

**Relative cost:** low integration overhead if you're already OpenAI-only; you inherit whatever rate limits and availability the platform has at a given moment.

## Anthropic (`tool_use` / `tool_result`)

**How it works:** tools are declared as `{name, description, input_schema}` (no wrapping `"function"` key). A tool-wanting response sets `stop_reason: "tool_use"` and includes one or more `tool_use` content blocks, each with an `id`, `name`, and `input` — already a parsed object, no string to decode. You reply with a `role: "user"` message containing `tool_result` blocks keyed by `tool_use_id`. See [Anatomy of a Tool Call](/learn/tools-function-calling/anatomy-of-a-tool-call) for the full JSON side by side.

**When it wins:** `input` arriving pre-parsed removes a whole class of parsing bugs; `strict: true` on a tool definition gives you decoding-level schema guarantees (see [How Models Learn to Emit Tool Calls](/learn/tools-function-calling/how-models-learn-to-call-tools)) without a separate structured-output pass.

**Failure mode:** interleaving — Anthropic models can emit `text` blocks *before or between* `tool_use` blocks in the same response, so code that assumes "the response is either all-text or all-tool-calls" and grabs `content[0]` will sometimes silently drop a tool call that came second. Iterate the full `content` list and check each block's `type`.

**Relative cost:** low overhead once you internalize the block-array response shape; the parsed-object arguments save you a validation step other providers require by hand.

## Google Gemini (function calling)

**How it works:** tools are declared inside a `function_declarations` array; a tool-wanting response includes a `functionCall` part with `name` and `args` (also delivered pre-parsed as an object, similar to Anthropic). You reply with a `functionResponse` part carrying the same function `name` and a `response` payload. Gemini's SDKs tend to wrap this part-based structure more heavily than Anthropic's or OpenAI's, so which exact message role carries the response can differ by SDK version — check the current client library rather than assuming it matches either dialect above.

**When it wins:** tight integration if you're already inside Google's ecosystem (Vertex AI, other Google Cloud services), and native multimodal input alongside tool calls in the same turn.

**Failure mode:** because responses are matched by function *name* rather than a unique call id in some SDK versions, a turn with two calls to the *same* tool needs extra care to route each result back to the right call — double-check your SDK's exact matching behavior before assuming call-id semantics identical to OpenAI or Anthropic.

**Relative cost:** moderate — the part-based content model is a bit more ceremony to construct by hand than a flat message array, though SDK helpers usually absorb most of it.

## Open-weight models (Llama, Qwen, and similar)

**How it works:** there is no single hosted API defining the shape — you're usually running the model yourself through a serving framework (vLLM, Ollama, text-generation-inference). The model's chat template embeds tool definitions into the prompt as text, and the model is trained to emit a call inside a specific marker in its raw output (for example, a JSON blob wrapped in a model-specific tag). The serving framework, not the model API, is what parses that raw text into a structured tool call your code can use — closer in spirit to [It's Still Text In, Text Out](/learn/tools-function-calling/tool-calling-still-text-in-text-out) than to a native API field.

**When it wins:** self-hosting, air-gapped or regulated environments where sending data to a third-party API isn't an option, and any setting where you need full control over the model version and serving stack.

**Failure mode:** because the "structured call" is really a text convention parsed by your serving layer, a mismatch between the chat template the model was fine-tuned on and the template your framework is actually applying produces malformed or unparseable tool calls that look like a model problem but are really a configuration problem.

**Relative cost:** highest integration and operational overhead — you own the serving infrastructure, the parsing layer, and the responsibility of keeping the chat template in sync with the model checkpoint. In exchange you own the deployment fully, with no per-token vendor pricing.

## Decision table

| Dimension | OpenAI | Anthropic | Gemini | Open-weight |
|---|---|---|---|---|
| Arguments arrive as | JSON string | parsed object | parsed object | raw text (framework-parsed) |
| Result message role | `tool` | `user` (with `tool_result` block) | SDK-dependent `functionResponse` part | framework-dependent |
| Call-to-result matching | `tool_call_id` | `tool_use_id` | function `name` (SDK-dependent) | framework-dependent |
| Schema enforcement option | structured outputs / strict mode | `strict: true` | schema-constrained generation | depends entirely on serving stack |
| Where parsing happens | your code | your code | your code / SDK | serving framework |
| Best fit | broad ecosystem compatibility | parsed-object convenience, interleaved reasoning | Google-ecosystem integration | self-hosted, regulated, offline |

## How to choose

Pick based on where the rest of your stack already lives, not on this table alone — mixing providers mid-project multiplies the number of shapes your code has to handle for no functional benefit. If you're starting from a blank slate, prioritize whichever provider gives you the schema-enforcement guarantee (`strict` mode, constrained decoding) you need for the riskiest tools in your system, since that removes an entire category of malformed-argument bugs before they happen — see [Validating Tool Arguments](/learn/tools-function-calling/validating-tool-arguments) for what you still need to check even with enforcement on. Reach for an open-weight model only when self-hosting is a hard requirement (data residency, cost at extreme volume, offline operation) — the operational overhead is real and worth avoiding otherwise.

**Related:** [Anatomy of a Tool Call](/learn/tools-function-calling/anatomy-of-a-tool-call), [How Models Learn to Emit Tool Calls](/learn/tools-function-calling/how-models-learn-to-call-tools), [It's Still Text In, Text Out](/learn/tools-function-calling/tool-calling-still-text-in-text-out), [Validating Tool Arguments](/learn/tools-function-calling/validating-tool-arguments), [Your First Tool Call, End to End](/learn/tools-function-calling/first-tool-call-walkthrough)
