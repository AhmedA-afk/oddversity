---
title: "Scaling Tools Cheatsheet"
track: "tools-function-calling"
status: live
summary: "A quick reference mapping registry size to technique, plus which tool_choice mode to reach for in common situations."
duration: "4 min read"
---

The fast lookup for two questions you'll ask repeatedly: how many tools is too many for this call, and which `tool_choice` mode fits this turn.

## Registry size → technique

**Start here, then measure** — these are defaults, not laws. Confirm your own threshold with the eval in [Selection Accuracy at 5, 50, and 200 Tools](/learn/tools-function-calling/measuring-selection-accuracy-vs-count) before investing in the next tier.

| Registry size | Default approach | Why |
|---|---|---|
| Under ~15 | Send all, every call | Below the range where selection degrades meaningfully; a selection layer would cost more than it saves. |
| ~15–50 | Tighten descriptions, group by namespace | Cheapest fix first — most accuracy loss at this size comes from ambiguous wording, not raw count. See [Writing Tool Descriptions Models Follow](/learn/tools-function-calling/writing-tool-descriptions-models-follow). |
| ~50+ | Add retrieval (embedding or BM25 top-k) | Namespacing alone stops being enough once any one domain itself holds dozens of tools. Build: [Retrieval Over a 200-Tool Registry](/learn/tools-function-calling/rag-over-tools-retrieval). |
| ~100+ | Add hierarchical disclosure on top of retrieval | A flat top-k cut across a very large, multi-domain registry starts missing cross-domain nuance; layer category-level structure above it. See [Router Tools and Grouped Dispatch](/learn/tools-function-calling/tool-namespacing-and-grouping). |

These compose, not replace each other — by 100+ tools you typically have namespacing *and* retrieval *and* possibly a meta-tool, not one technique picked in isolation. Full strategy map: [Selecting From Hundreds of Tools](/learn/tools-function-calling/tool-selection-at-scale-strategies).

## tool_choice quick picks

| Situation | Mode | Why |
|---|---|---|
| A step must always run a specific tool | Named (`{"type": "tool", "name": "..."}`) | Removes the "model chats instead" failure entirely — see [Forcing extract_invoice Every Time](/learn/tools-function-calling/forcing-a-specific-tool-worked). |
| An action is required, but which one depends on the turn | `any` / `required` | Forces a call without hardcoding which tool. |
| The model should judge whether a tool is even needed | `auto` | The default for a reason — preserves "no tool needed" as a legitimate answer. |
| You want a plain-text answer this turn, tools defined but unused | `none` | Stops over-eager calling on a wrap-up or clarification turn without removing the tools from the schema entirely. |
| Extracting structured output every time, no exceptions | Named, with a status/escape-hatch field in the schema | Forcing without an escape hatch turns "doesn't apply" into silent bad data — see the worked example in [Forcing extract_invoice Every Time](/learn/tools-function-calling/forcing-a-specific-tool-worked). |

Full mode reference: [Tool Choice: auto, required, none, and Named](/learn/tools-function-calling/tool-choice-modes). Full decision framework: [When to Force and When to Let It Decide](/learn/tools-function-calling/when-to-force-vs-auto).

## Snippets

**Named tool choice (Anthropic-style):**
```json
{"tool_choice": {"type": "tool", "name": "extract_invoice"}}
```

**Named tool choice (OpenAI-style):**
```json
{"tool_choice": {"type": "function", "function": {"name": "extract_invoice"}}}
```

**Minimal top-k retrieval call:**
```python
tools_for_this_turn = retrieve_tools(tool_index, user_message, k=15)
response = call_model(messages=conversation, tools=tools_for_this_turn, tool_choice={"type": "auto"})
```

**Meta-tool expansion (`load_toolset` pattern):**
```json
{"tools": [{"name": "load_toolset", "input_schema": {"properties": {"category": {"enum": ["billing", "calendar", "incident_response"]}}}}]}
```

## Rules of thumb

- **Measure before you build.** Retrieval and hierarchical disclosure are real engineering — vector store, top-k tuning, cache-prefix effects. Confirm the size threshold with an eval before committing to either.
- **Fix descriptions before adding infrastructure.** A large fraction of selection errors below ~50 tools trace back to ambiguous or overlapping descriptions, not raw count — see [Tool Selection Mistakes at Scale](/learn/tools-function-calling/tool-selection-common-mistakes).
- **Under-retrieval is worse than over-sending.** If you must err, err toward a wider k — a missed correct tool causes a wrong or hallucinated call, while a slightly larger candidate set only costs tokens.
- **`load_toolset`-style meta-tools grow monotonically within a session** to protect prompt-cache hit rate — don't evict a loaded category just to keep the list small. Detail: [Router Tools and Grouped Dispatch](/learn/tools-function-calling/tool-namespacing-and-grouping).

**Related:** [Selecting From Hundreds of Tools](/learn/tools-function-calling/tool-selection-at-scale-strategies), [Tool Choice: auto, required, none, and Named](/learn/tools-function-calling/tool-choice-modes), [Tool Selection Mistakes at Scale](/learn/tools-function-calling/tool-selection-common-mistakes), [Token Cost of Tool Schemas](/learn/tools-function-calling/token-cost-of-tool-schemas)
