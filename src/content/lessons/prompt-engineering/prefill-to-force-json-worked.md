---
title: "Worked Example: Prefilling to Guarantee JSON"
track: "prompt-engineering"
status: live
summary: "An extraction prompt that sometimes wraps its JSON in prose, fixed by prefilling the opening brace — walked through failure by failure."
duration: "7 min read"
---

[Prefilling: Starting the Assistant's Answer for It](/learn/prompt-engineering/prefilling-the-assistant-turn) explains why a prefill is a structural guarantee rather than a polite request. Here's that guarantee earning its keep on a task that breaks in a completely ordinary way: a data-extraction prompt feeding a parser that has zero tolerance for anything besides valid JSON.

## The setup

The task: pull structured fields out of a support ticket for a pipeline that calls `json.loads()` on whatever comes back, no cleanup step.

```
Extract the customer's name, email, and plan from this support ticket
as JSON with keys name, email, plan.

Ticket: "Hi, this is Alicia Chen (alicia.chen@example.com), I'm on the
Pro plan and my export keeps failing."
```

The extraction itself isn't hard — the model can find these three fields reliably. The fragility is entirely about what surrounds them.

## Step by step

### 1. Run it without a prefill, across ten inputs (illustrated)

This is a worked illustration, not a measured benchmark — the point is the *shape* of the failure, not a claimed real-world rate. Ten plausible raw completions for ten different tickets, run through the same prompt template:

| # | First ~20 characters of the completion | Parses cleanly? |
|---|---|---|
| 1 | `{"name": "Alicia Ch` | Yes |
| 2 | `Here's the extracted` | No — prose preamble |
| 3 | `{"name": "Marcus Oy` | Yes |
| 4 | ` ```json\n{"name": "` | No — wrapped in a code fence |
| 5 | `{"name": "Priya Rao` | Yes |
| 6 | `{"name": "Devon Park` | Yes |
| 7 | `Sure, here is the JS` | No — prose preamble |
| 8 | `{"name": "Yuki Tanak` | Yes |
| 9 | `{"name": "Lena Novak` | Yes |
| 10 | `{"name": "Sam Idowu` | Yes |

In this illustration, 7 of 10 parse cleanly and 3 fail — not because the model got the *extraction* wrong in any of the ten, but because 3 of them wrapped a correct JSON object in something the parser wasn't told to expect.

> **Why this step?** This establishes what's actually broken. It isn't "the model doesn't understand JSON" — every one of the ten found the right three fields. It's that the *opening* of the response is genuinely contested between "start the object" and "acknowledge the request first," and that contest doesn't resolve the same way on every call.

### 2. Add the prefill

```python
response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=200,
    messages=[
        {"role": "user", "content": extraction_prompt},
        {"role": "assistant", "content": "{"},
    ],
)

json_text = "{" + response.content[0].text
```

> **Why this step?** The completion now starts one token past an opening brace it did not choose to produce. Every failure class from step 1 was a token sequence that does *not* begin with `{` — "Here's the extracted...", "Sure, here is...", a code-fence backtick. All three are now structurally unreachable at that position, the same way "Sure! Here are three prime numbers" was unreachable once the assistant turn already opened with `1.` in [the concept lesson this extends](/learn/prompt-engineering/prefilling-the-assistant-turn).

### 3. Run the same ten inputs again (illustrated)

| # | Parses cleanly? |
|---|---|
| 1 | Yes |
| 2 | Yes |
| 3 | Yes |
| 4 | Yes |
| 5 | Yes |
| 6 | Yes |
| 7 | Yes |
| 8 | Yes |
| 9 | Yes |
| 10 | Yes |

> **Why this step?** This confirms the mechanism, not just the outcome. Each of the two specific failure classes from step 1 — a leading prose sentence, a wrapping code fence — is individually eliminated for the same structural reason, not because the model tried harder to comply. That distinction matters for what comes next.

## Where it breaks (+fix)

The prefill fixes the *opening*. It says nothing about the closing side. A completion can still add a trailing sentence after a valid closing brace ("...\n\n}\n\nLet me know if you need anything else formatted differently."), and nothing about prefilling `{` prevents that, because the contested territory there is a different token position entirely.

The fix is to treat the prefill as narrowing the failure surface, not closing it: pair it with a stop sequence on the closing brace, or a strict parse-then-repair step for whatever slips through — see [the validation and repair loop](/learn/prompt-engineering/validation-and-repair-loop) and [fixing malformed JSON output](/learn/prompt-engineering/fixing-malformed-json-output) for the other half of this problem, which a prefill was never going to solve on its own.

## Takeaways

- A prefill converts a probabilistic formatting request into a structural guarantee for exactly the part of the output it fixes — the opening — and nothing more.
- Concatenate the prefilled text back onto the completion before parsing. It's real output content the model continued, not a prompt artifact to discard.
- Don't let one fixed failure class hide another. Closing-side leaks need their own guard, whether that's a stop sequence, a stricter parser, or a repair loop.

**Related:** [Prefilling: Starting the Assistant's Answer for It](/learn/prompt-engineering/prefilling-the-assistant-turn), [Structured Output](/learn/prompt-engineering/structured-output), [Validation and Repair Loop](/learn/prompt-engineering/validation-and-repair-loop), [Fixing Malformed JSON Output](/learn/prompt-engineering/fixing-malformed-json-output)
