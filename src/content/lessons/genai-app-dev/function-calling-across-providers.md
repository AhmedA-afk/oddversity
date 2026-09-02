---
title: "Tool/Function Calling Across Providers"
track: "genai-app-dev"
status: live
summary: "Four ways providers expose tool-calling, where they genuinely disagree, and the one place your abstraction should stop normalizing."
duration: "8 min read"
---

The tool-call loop from [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop) reads as provider-agnostic — declare tools, get calls back, execute, feed results forward. It only stays that way if the adapter underneath it absorbs four real disagreements: schema format, where arguments arrive parsed vs. as a string, how parallel calls work, and how you force a specific tool. This lesson compares four approaches and marks the one spot that shouldn't be flattened.

## Anthropic (Claude): schema-native, forced-choice, parsed arguments

Tools are declared with a JSON Schema `input_schema`; the model's response contains one or more `tool_use` content blocks, each with `input` as an already-parsed object — no second parsing step. `tool_choice` takes `auto` (default), `any` (must call some tool), `tool` with a name (force this exact one), or `none`. Multiple `tool_use` blocks can appear in a single response for independent calls, which is what [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop)'s `Promise.allSettled` step is built to consume.

- **When it wins:** you want the smallest gap between "the API returned a tool call" and "you have a usable object" — no `JSON.parse` step, no string-escaping edge cases.
- **Failure mode:** arguments still need your own schema validation (see [Schema, Validation, and Auto-Repair](/learn/genai-app-dev/json-schema-and-validation)) — parsed doesn't mean valid, and a required field can still arrive as an empty string or a plausible-looking wrong value.
- **Relative cost:** low integration cost once you're using the native SDK or a thin `fetch` wrapper; the parsed-arguments shape removes one whole category of parsing bugs the other approaches have to handle.

## OpenAI: function-wrapped schema, string-encoded arguments

Tools are declared as `{type: "function", function: {name, description, parameters}}`, where `parameters` is JSON Schema. The response's `tool_calls` array gives each call's arguments as a JSON-*encoded string* (`function.arguments`), not a parsed object — every call site has to `JSON.parse` it before use. `tool_choice` supports `auto`, `none`, `required` (must call something), or an explicit `{type: "function", function: {name}}` to force one tool. Parallel calls are the default behavior and can be turned off per-request.

- **When it wins:** broad tooling and library support, and forcing "must call something" is a single named choice (`required`) rather than a values-based one.
- **Failure mode:** the string-arguments step is exactly the seam covered in [Writing Two Adapters Behind One Interface](/learn/genai-app-dev/provider-adapter-anthropic-openai) — forget the `JSON.parse`, and the rest of your pipeline silently receives a string where it expected an object.
- **Relative cost:** low, but with one more required step (parsing) than Anthropic's shape, and one more place a malformed string can throw before your own schema validation even runs.

## Google Gemini: OpenAPI-subset schema, mode-based forcing

Tools are declared as `functionDeclarations`, using a *subset* of OpenAPI schema — not full JSON Schema, so constructs like `$ref` or some format keywords may not translate directly and need to be flattened before you send them. The response carries `functionCall` parts with `args` as a parsed object, similar to Anthropic. Forcing behavior is a mode enum (`AUTO`, `ANY`, `NONE`) under `tool_config.function_calling_config`, and `ANY` mode can be further restricted to an allowed-name list rather than one exact tool.

- **When it wins:** already inside a Gemini-first stack, or a use case that benefits from restricting to a *subset* of tools (allowed-name list) rather than only "exactly one" — a middle ground the other three approaches here don't offer as directly.
- **Failure mode:** a schema authored against full JSON Schema (nested `$ref`, certain formats) can silently drop or reject constructs the OpenAPI subset doesn't support — this shows up as a malformed or rejected tool declaration, not a runtime tool-call error, so it's worth validating at registration time, not discovering in production.
- **Relative cost:** moderate — the schema-translation step is real integration work if your tool definitions were authored against full JSON Schema elsewhere in your stack.

## Prompt-based fallback (no native tool-calling API)

Some open-weight models, or a provider accessed through a raw completion endpoint with no tool-calling surface, have no structured mechanism at all. Tool schemas get embedded as text in the prompt, with instructions to respond in a specific JSON shape; your code extracts and parses that JSON from the free-text response, with no API-level guarantee it's even present.

- **When it wins:** the only option when the model or endpoint genuinely has no native tool-calling support — self-hosted inference on a base model, for instance.
- **Failure mode:** no forced-tool guarantee, no reliable parallel-call support, and no schema enforcement at the API level — the model can preface the JSON with commentary, wrap it in markdown fences, or omit a field entirely. The bounded repair loop from [Schema, Validation, and Auto-Repair](/learn/genai-app-dev/json-schema-and-validation) stops being an optional hardening step here and becomes load-bearing on every single call.
- **Relative cost:** highest — you're rebuilding, in your own prompt and parsing code, guarantees the other three approaches get from the API contract itself.

## Decision table

| Approach | Schema format | Arguments arrive | Forced-tool mode | Parallel calls |
|---|---|---|---|---|
| Anthropic | JSON Schema | Parsed object | `auto` / `any` / exact tool / `none` | Yes, multiple blocks per response |
| OpenAI | JSON Schema (function-wrapped) | JSON-encoded string | `auto` / `required` / exact tool / `none` | Yes by default, can disable |
| Gemini | OpenAPI subset | Parsed object | `AUTO` / `ANY` (+ allowed-name list) / `NONE` | Yes |
| Prompt-based fallback | Free-text instructions | Extracted from prose | Not guaranteed | Not reliable |

## How to choose

Default to whichever native tool-calling API your primary provider offers — all three real APIs above are reliable enough that "no native support" should be a last resort, reserved for models or endpoints that genuinely don't expose one. If you're building the normalized `LLMProvider` interface from [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts), normalize the three real disagreements — schema format translation, parsed-vs-string arguments, and the finish-reason mapping for "the model wants to call a tool" — the same way [Writing Two Adapters Behind One Interface](/learn/genai-app-dev/provider-adapter-anthropic-openai) does for text completion.

The one place *not* to flatten into that interface: provider-specific forcing granularity. Gemini's allowed-name-list mode, Anthropic's exact-tool force, and OpenAI's `required`-vs-named split aren't the same capability wearing different names — they're genuinely different amounts of control. Collapsing them into a single `forceTool: boolean` on your common interface throws away the allowed-list case entirely and gives every caller the illusion that "force one specific tool" is a universal, uniform feature. Where a feature genuinely diverges this much, expose it through the provider-specific escape hatch documented in [Provider Abstraction Leaks](/learn/genai-app-dev/provider-abstraction-leaks) rather than pretending it's the same primitive everywhere.

**Related:** [Implementing the Tool-Call Loop](/learn/genai-app-dev/implementing-a-tool-call-loop), [Writing Two Adapters Behind One Interface](/learn/genai-app-dev/provider-adapter-anthropic-openai), [Designing a Common Provider Interface](/learn/genai-app-dev/building-a-provider-interface-ts), [Provider Abstraction Leaks](/learn/genai-app-dev/provider-abstraction-leaks), [Schema, Validation, and Auto-Repair](/learn/genai-app-dev/json-schema-and-validation)
