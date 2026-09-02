---
title: "Selection Accuracy at 5, 50, and 200 Tools"
track: "tools-function-calling"
status: live
summary: "Build a small eval that measures tool-pick accuracy as the registry grows, then re-run it with retrieval to see the recovery."
duration: "7 min read"
---

"More tools makes selection worse" is intuitive — [Why More Tools Means Worse Choices](/learn/tools-function-calling/too-many-tools-confuse-models) argues why. But you shouldn't add retrieval on intuition alone; you should add it once your own eval shows your own registry needs it. This walks building that eval.

> The numbers in this lesson are illustrative results from a small hypothetical run, shown to demonstrate the *shape* of the eval and how to read it — not a published benchmark. Run this against your own registry and your own model before trusting a specific threshold.

## The setup

The eval needs three things: a set of test queries each with one known-correct tool, a way to run the model against registries of increasing size, and a scoring function that checks whether the model picked the right tool.

```python
test_cases = [
    {"query": "cancel my subscription", "expected_tool": "cancel_subscription"},
    {"query": "what's my account balance", "expected_tool": "get_balance"},
    {"query": "move my 3pm meeting to friday", "expected_tool": "reschedule_event"},
    # ... 30-50 cases covering the registry's real domains
]
```

To simulate registry growth, we build three tool lists that all contain the same 20 "target" tools (the ones our test cases point at) plus an increasing number of distractor tools with plausible, overlapping names and descriptions — this mirrors the real failure mode, not just raw list length:

```python
def build_registry(target_tools, distractor_pool, size):
    n_distractors = max(0, size - len(target_tools))
    distractors = distractor_pool[:n_distractors]
    return target_tools + distractors

registries = {
    5:   build_registry(target_tools, distractor_pool, 5),
    50:  build_registry(target_tools, distractor_pool, 50),
    200: build_registry(target_tools, distractor_pool, 200),
}
```

## Step by step

### Step 1 — run the baseline (no retrieval) at each size

```python
def eval_registry(registry, test_cases, tool_choice="auto"):
    correct = 0
    for case in test_cases:
        response = call_model(
            messages=[{"role": "user", "content": case["query"]}],
            tools=registry,
            tool_choice={"type": tool_choice},
        )
        called = response.tool_calls[0].name if response.tool_calls else None
        if called == case["expected_tool"]:
            correct += 1
    return correct / len(test_cases)

results = {size: eval_registry(reg, test_cases) for size, reg in registries.items()}
```

> **Why this step?** This measures exactly the number the retrieval decision should be based on: not "does more tools cost more tokens" (it obviously does — see [Token Cost of Tool Schemas](/learn/tools-function-calling/token-cost-of-tool-schemas)) but "does it change whether the model gets it *right*." Those are different questions, and only the second one tells you whether retrieval is worth the engineering cost.

### Step 2 — read the shape, not the exact numbers

One illustrative run looked like this:

```
Registry size   Accuracy (no retrieval)
5    tools      ~98%   ████████████████████
50   tools      ~88%   █████████████████░░░
200  tools      ~61%   ████████████░░░░░░░░
```

> **Why this step?** The trend is what matters, and it's a plausible one given the mechanism from [Why More Tools Means Worse Choices](/learn/tools-function-calling/too-many-tools-confuse-models): a small, distinct registry is close to a ceiling; a large one with overlapping distractors degrades meaningfully. The specific numbers will vary by model, by how similar your distractors are, and by how good your descriptions are (a well-written [tool description](/learn/tools-function-calling/writing-tool-descriptions-models-follow) resists degradation better than a lazy one) — that's exactly why you run this on your own registry rather than trusting a number from a lesson.

### Step 3 — re-run with retrieval enabled

```python
def eval_with_retrieval(full_registry, test_cases, k=15):
    tool_index = ToolIndex()
    tool_index.build(full_registry)
    correct = 0
    for case in test_cases:
        retrieved = retrieve_tools(tool_index, case["query"], k=k)
        response = call_model(
            messages=[{"role": "user", "content": case["query"]}],
            tools=retrieved,
            tool_choice={"type": "auto"},
        )
        called = response.tool_calls[0].name if response.tool_calls else None
        if called == case["expected_tool"]:
            correct += 1
    return correct / len(test_cases)

retrieval_results = {size: eval_with_retrieval(reg, test_cases) for size, reg in registries.items()}
```

> **Why this step?** This is the actual A/B: same test cases, same underlying registry, only the injection strategy changes. See [Retrieval Over a 200-Tool Registry](/learn/tools-function-calling/rag-over-tools-retrieval) for how `retrieve_tools` and `ToolIndex` are built.

Extending the illustrative run:

```
Registry size   No retrieval   With retrieval (k=15)
5    tools      ~98%           ~98%   (no room to improve — nothing to filter out)
50   tools      ~88%           ~94%   (mild recovery)
200  tools      ~61%           ~90%   (retrieval earns its keep)
```

### Step 4 — find the threshold

> **Why this step?** The 5-tool row shows retrieval buys nothing when the registry is already small — there's no crowding to remove. The gap between the two lines at 50 and 200 is what you're actually looking for: the registry size where the no-retrieval line has dropped enough (by whatever margin matters for your product — a support bot misrouting 1-in-10 tickets is a different bar than a coding agent) that the retrieval line's improvement justifies the pipeline cost from [Retrieval Over a 200-Tool Registry](/learn/tools-function-calling/rag-over-tools-retrieval). For most registries built from real, somewhat-overlapping tools, that threshold tends to land somewhere in the tens of tools, not the hundreds — but the only way to know yours is to run this eval, not to assume it.

## Where it breaks (+ fix)

- **Breaks when**: your distractor pool isn't representative — random unrelated tool names inflate accuracy at every size because nothing actually competes with the right answer. Real registries at 200 tools have real near-duplicates; your distractor pool needs them too, or the eval understates the problem.
- **Fix**: build distractors from actual near-misses in your domain (three tools that all "search" something, several that all "notify" someone) rather than arbitrary padding.
- **Breaks when**: you only test single-tool-correct queries. Real traffic includes ambiguous queries where two tools are both reasonable — those need a different scoring rule (partial credit, or a human-reviewed "acceptable set") rather than exact-match.

## Takeaways

Build this eval before you build retrieval, not after — it tells you whether your registry has actually crossed the point where retrieval pays for itself, and it gives you the same harness to validate that retrieval, once built, actually recovered the accuracy it promised. [Tool Selection Mistakes at Scale](/learn/tools-function-calling/tool-selection-common-mistakes) covers what typically shows up once you start reading the misses instead of just the aggregate score.

**Related:** [Why More Tools Means Worse Choices](/learn/tools-function-calling/too-many-tools-confuse-models), [Retrieval Over a 200-Tool Registry](/learn/tools-function-calling/rag-over-tools-retrieval), [Benchmarking Tool Use](/learn/tools-function-calling/benchmarking-tool-use), [Building a Tool-Use Eval Harness](/learn/tools-function-calling/building-a-tool-use-eval-harness)
