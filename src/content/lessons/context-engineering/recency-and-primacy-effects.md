---
title: "Recency and Primacy Effects"
track: "context-engineering"
status: live
summary: "Primacy anchors the system prompt, recency dominates the last message — and long sessions let recency quietly win."
duration: "8 min read"
---

Two different biases shape how a model weighs a long conversation, and they pull in opposite directions. Primacy makes the system prompt sticky. Recency makes the last few turns louder than everything before them. Most of the frustrating "the agent forgot my instruction" bugs are really this interaction going unmanaged.

## Optional depth: the two effects, separated

**Primacy** is the advantage early content gets from sitting at a position every later token attends back through — the mechanism covered in [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained). A system prompt placed at the very start of a session benefits from this: every subsequent turn's attention computation has that content available at a privileged, early position, and training data reinforces the idea that early content (topic sentences, headers, setup) tends to matter.

**Recency** is the opposite advantage: content close to the generation point is cheap to route attention to and dominates because it's freshest in the sequence the model is actually continuing. The last user message, the last tool result, the last assistant turn — these carry outsized weight simply by virtue of being *right before* the next token gets generated.

In a short exchange, these two effects barely compete — the system prompt is close enough to "recent" that both biases point the same way. The problem shows up specifically as a conversation grows: the system prompt stays exactly as primacy-advantaged as it always was, but the sheer volume of turns between it and the generation point means recency's pull on the model's actual next-token decision keeps growing relative to it. Primacy doesn't get weaker in absolute terms — it gets *outweighed*, turn by turn, by more and more recent content competing for the same attention.

## The interaction, precisely

This isn't "primacy fades." The system prompt's tokens sit exactly where they always sat, and the structural advantage of being early is unchanged. What changes is the *ratio*: at turn 2, the system prompt is a large fraction of everything in context and close enough to "recent" to double-count. At turn 40, the system prompt is a small fraction of a much longer sequence, and forty turns of intervening content — much of it more topically relevant to whatever's happening *right now* — is competing for the exact same attention budget that used to be uncontested. The instruction hasn't degraded. It's been diluted and outcompeted.

This is a sharper, agent-specific case of the general shape covered in [Context Ordering and Recency Effects](/learn/context-engineering/context-ordering-and-recency-effects): early content and late content both get privileged, but only one of those advantages compounds as the session runs long, and it isn't the one guarding your original instructions.

## Watching an agent forget an early constraint

Take a coding agent given one instruction at session start: "never modify files under `/vendor`." For the first several turns, this holds easily — the instruction is both early *and* effectively recent, since nothing has pushed it far away yet.

By turn 25, the agent has read a dozen files, run several tool calls, and is deep into a refactor. The user asks it to "fix the broken import path across the whole module," and the fix happens to touch a re-exported file that lives under `/vendor`. The instruction from turn 1 is still, technically, sitting in context. But it's now separated from the generation point by 24 turns of tool output, file contents, and back-and-forth — all of it more recent, all of it competing for the attention that would need to surface "don't touch `/vendor`" at exactly the moment it matters. The agent edits the vendored file. Nothing was deleted from context; the constraint simply lost the attention competition against everything that came after it.

## The fix: restate near the end, don't just rely on the start

The practical response isn't to abandon system-prompt placement — primacy is still real and still worth using for foundational framing. It's to stop treating "stated once at the top" as sufficient for anything safety-critical, and instead give critical constraints a second placement that benefits from recency too:

- **Restate hard constraints just before generation**, not only once at session start — a short reminder appended right before the next turn's instruction costs a handful of tokens and recovers most of the recency advantage.
- **Escalate restatement frequency with session length.** A constraint stated once at turn 1 and never again is progressively weaker as turns accumulate; restating it every N turns (or whenever a tool call touches a sensitive boundary) keeps it competitive.
- **Use structure to make the constraint easy to re-surface**, not just re-say — a labeled `<constraints>` block that a wrapper can literally re-inject verbatim near the tail is more reliable than trusting the model to recall prose from forty turns back. See [Structured Context Injection](/learn/context-engineering/structured-context-injection) for the pattern.

Compare the two setups directly: instruction-at-top-only degrades measurably as the transcript grows, because primacy alone isn't enough to compete with an ever-growing pile of more-recent content; instruction-at-top-plus-repeated-near-the-tail stays close to its original adherence rate turn over turn, because the restated copy gets recency's benefit fresh, every time, regardless of how long the session has run. The gap between those two setups is the entire practical payoff of understanding this interaction rather than just knowing "recency exists."

## Watch out for

- **Assuming one placement is enough forever.** Primacy protects short sessions; it doesn't scale with session length on its own.
- **Restating everything, diluting the restatement itself.** If every turn ends with a wall of re-stated rules, the truly critical ones lose their own signal-to-noise — restate the few things that are genuinely non-negotiable, not your entire system prompt.
- **Confusing "in context" with "in effect."** An instruction can be technically present and functionally outcompeted — this is the same distinction [Lost in the Middle](/learn/context-engineering/lost-in-the-middle) draws between presence and usable context.

**Related:** [Context Ordering and Recency Effects](/learn/context-engineering/context-ordering-and-recency-effects), [Lost in the Middle, Explained](/learn/context-engineering/lost-in-the-middle-explained), [Structured Context Injection](/learn/context-engineering/structured-context-injection), [Placing Instructions So They Stick](/learn/context-engineering/placing-instructions-for-adherence)
