---
title: "One Prompt, One Job"
track: "prompt-engineering"
status: live
summary: "The well-factored-function analogy for why each prompt call should have exactly one responsibility."
duration: "6 min read"
---

A function called `handle_request` that reads a file, validates it, transforms it, and emails the result is miserable to maintain — not because any single step is hard, but because when something breaks, you get one crash at the bottom and four candidate causes. A prompt has the same failure shape, and the same fix.

## The analogy: the function that does everything

Picture two versions of the same logic.

**Version A**, one big function:

```python
def handle_ticket(raw_text):
    # 40 lines: parse the ticket, decide a category,
    # pull out an order ID, decide resolve-or-escalate,
    # compose a reply, and return it
    ...
```

**Version B**, factored:

```python
def classify(raw_text) -> str: ...
def extract_fields(raw_text) -> dict: ...
def decide_action(category, fields) -> str: ...
def compose_reply(category, fields, action) -> str: ...

def handle_ticket(raw_text):
    category = classify(raw_text)
    fields = extract_fields(raw_text)
    action = decide_action(category, fields)
    return compose_reply(category, fields, action)
```

Nothing about *what* gets computed changed. What changed is that each function in version B has one job it can be named after, one thing to test in isolation, and one place to look when its output is wrong. A prompt is the same kind of unit — instructions and examples in, a completion out — and it degrades exactly the way an unfactored function does when you keep adding responsibilities to it.

## Walking the simulation: where the bug hides

Say the final reply in `handle_ticket` recommends a refund for a ticket that should have been escalated to a specialist team instead. Walk both versions looking for the bug.

**Version A (one prompt, one call):** You have one input and one output. The wrong action could be a misread category, a missed field, a wrong policy judgment, or the reply-writing step overriding a correct decision because it "sounded better" to resolve than escalate. You cannot see which of those happened — you can only re-run the whole thing with more logging and hope you can spot it in the wall of text, and even then you're inferring, not observing.

**Version B (four calls, one job each):** You print the output of each stage. `classify` said `technical`, correct. `extract_fields` found the order ID, correct. `decide_action` returned `resolve`, and that's the bug — the policy step made the wrong call. You fix `decide_action`'s prompt, alone, and every other stage is untouched and already known-good.

The second version didn't get you a better answer through cleverness. It got you a better answer through *visibility* — the same reason unit tests exist. You can't unit-test a monolith; you can only integration-test it and guess at the internals.

## The wrong intuition: more instructions equals more control

The natural instinct when a prompt's output is wrong is to add another instruction to the same prompt — a clarifying sentence, an extra example, a stronger "make sure to." This works for a while and then stops working, because you're adding more objectives to a call that already has several, and each new instruction has to compete with the ones already there for the model's attention rather than replacing anything.

Control doesn't come from stacking more instructions into one call. It comes from narrowing what each call is responsible for until "make sure to" has nothing left to compete with. A four-line prompt whose only job is "extract these three fields, or say null" is more controllable than a forty-line prompt with an extraction paragraph buried in the middle of a reply-writing task, even though the second one contains strictly more words about extraction. See [Prompt Anti-Patterns](/learn/prompt-engineering/prompt-anti-patterns) for other cases where "add another instruction" is the wrong reflex.

## When the analogy breaks

Software factoring has near-zero marginal cost per function call. Prompt factoring doesn't: every extra stage is a real network round trip, a re-send of whatever context that stage needs, and another chance for a stage to silently misfire. Split too eagerly and you've traded one hard-to-debug call for five expensive, error-compounding ones — that failure mode gets its own lesson in [Over-Decomposition](/learn/prompt-engineering/over-decomposition), and the actual cost math is in [Pipeline vs. Single Call](/learn/prompt-engineering/pipeline-vs-single-call-tradeoffs).

The analogy also breaks when two "jobs" genuinely need to see the same evidence to be coherent — translating a sentence while matching its tone, say. Force those into separate calls and you can lose the thing that made the single pass work: one step choosing words without knowing what constraint the other step is about to apply. [When to Split a Prompt](/learn/prompt-engineering/when-to-split-a-prompt) has the signals for telling a real seam from a false one, so you're factoring functions apart, not amputating one function into two useless halves.

**Related:** [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt), [Worked Example: Refactoring a Resume Screener Into Stages](/learn/prompt-engineering/monolith-to-pipeline-worked), [Over-Decomposition](/learn/prompt-engineering/over-decomposition), [Pipeline vs. Single Call: Cost, Latency, Reliability](/learn/prompt-engineering/pipeline-vs-single-call-tradeoffs)
