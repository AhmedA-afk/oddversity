---
title: "Temperature, top_p, and max_tokens in Practice"
track: "genai-app-dev"
status: live
summary: "Run the same extraction prompt at two temperatures and watch determinism trade off against variance in real output."
duration: "7 min read"
---

Same prompt, same model, same input — the only thing that changes below is one number. Watch what it does to whether you can trust the output's shape.

## The setup

The task: extract `{vendor, amount, date}` as JSON from one line of free-text bookkeeping notes:

```text
Input: "Paid Riverside Print Co $340 on the 14th for the flyer batch"
```

We'll run this extraction three times at `temperature: 0`, then three times at `temperature: 0.9`, and see what changes. For the theory of what temperature and `top_p` are actually doing to the model's next-token distribution, see [Sampling: Temperature and top_p](/learn/llm-foundations/sampling-temperature-top-p) — this lesson only covers what to do with that knob once you're inside an app.

## Step by step

### 1. The prompt, held constant

```json
[
  { "role": "system", "content": "Extract {vendor, amount, date} as JSON. amount is a number, no currency symbol. date is ISO 8601." },
  { "role": "user", "content": "Paid Riverside Print Co $340 on the 14th for the flyer batch" }
]
```

> **Why this step?** Everything about the request is fixed except one parameter. If you change the prompt *and* the temperature between runs, you can't tell which one caused a difference in output — isolate the variable you're actually testing.

### 2. Three runs at temperature 0

```json
{"vendor": "Riverside Print Co", "amount": 340, "date": "2024-XX-14"}
{"vendor": "Riverside Print Co", "amount": 340, "date": "2024-XX-14"}
{"vendor": "Riverside Print Co", "amount": 340, "date": "2024-XX-14"}
```

(The year is genuinely ambiguous from the input — that's the model doing its best with missing information, not sampling variance. Illustrative output; your exact strings will differ.)

> **Why this step?** At `temperature: 0`, the model always picks the single highest-probability next token, so runs converge on the same answer — for a task with one clearly correct output shape, that consistency is exactly what you want. Note that "near-deterministic" is more accurate than "guaranteed identical every time" — some providers reserve the right to introduce tiny variation even at 0. Don't build logic that depends on byte-for-byte reproducibility.

### 3. Three runs at temperature 0.9

```json
{"vendor": "Riverside Print Co", "amount": 340, "date": "2024-01-14"}
{"vendor": "Riverside Print Company", "amount": 340.00, "date": "January 14"}
{"vendor": "Riverside Print Co", "amount": "340", "date": "2024-01-14"}
```

> **Why this step?** Higher temperature spreads probability mass across more plausible next tokens, so the model now sometimes expands "Co" to "Company," sometimes emits `340` as a string instead of a number, sometimes ignores the ISO-8601 instruction outright. Every one of these is a "reasonable" completion in isolation — the problem is that your downstream code expects exactly one shape, and now it isn't getting it reliably.

### 4. The same knob, a different task

Swap the task to something with no single correct answer — three ad taglines for a coffee shop — and run it at both temperatures again:

```text
temperature 0:   "Great coffee, every time." (all three runs, nearly identical)
temperature 0.9: "Great coffee, every time." / "Your morning, brewed right." /
                  "Small cups. Big mornings."  (three genuinely different options)
```

> **Why this step?** This is the flip side of step 3, and it's the whole reason temperature is a dial and not a bug to route around. The exact same variance that broke your JSON extraction is the *product* when the task is generating options for a human to choose from. The parameter isn't "good" or "bad" — it's matched or mismatched to whether the task has one correct shape.

## Where it breaks

- **Assuming `temperature: 0` means zero risk.** It's low-variance, not schema-guaranteed — the model can still omit a field, misjudge a date, or wrap the JSON in a sentence of preamble. Fix: validate the output's shape regardless of temperature; see [Structured Output in Apps](/learn/genai-app-dev/structured-output-in-apps).
- **Leaving default temperature on a structured task.** Most SDKs default to something in the 0.7–1.0 range, tuned for conversational feel, not extraction accuracy. Fix: explicitly set `temperature: 0` (or close to it) any time the output feeds a parser, a database column, or another program — never rely on the default matching your task.
- **Tuning both `temperature` and `top_p` at once.** They're two different ways of narrowing or widening the same sampling distribution, and changing both makes it impossible to reason about which one caused a shift in behavior. Fix: leave `top_p` at its default and use `temperature` as your primary dial; only touch `top_p` separately if you have a specific reason and you're doing it deliberately, not alongside a temperature change.
- **Setting `max_tokens` from the largest output you've seen in testing.** A ceiling set at exactly your largest observed case leaves no headroom, and a real user's longer input can quietly get truncated. Fix: budget `max_tokens` from the *worst plausible case* for the task, not the cases you happened to try.

## Takeaways

Concrete starting points, not universal laws — measure against your own task before trusting these numbers as final:

| Feature type | Temperature | Why |
|---|---|---|
| Extraction / classification / anything schema-bound | 0–0.2 | One correct shape; variance is pure risk |
| Summarization | 0.2–0.4 | Mostly convergent, slight room for phrasing |
| Conversational assistant | 0.5–0.7 | Natural-sounding without drifting off-task |
| Brainstorming / creative copy | 0.8–1.0 | Variance across options is the point |

`max_tokens` is a safety ceiling, not a target — set it from the longest reasonable output for the task, and treat a response that hits the ceiling (`stop_reason: "max_tokens"`) as truncated, not finished. All of this lives in the same request as the [message envelope](/learn/genai-app-dev/messages-roles-and-the-prompt-envelope) — role placement shapes *what* the model attends to, sampling parameters shape *how much it varies* in producing the response.

**Related:** [Sampling: Temperature and top_p](/learn/llm-foundations/sampling-temperature-top-p), [System, User, Assistant: The Message Envelope](/learn/genai-app-dev/messages-roles-and-the-prompt-envelope), [Structured Output in Apps](/learn/genai-app-dev/structured-output-in-apps), [GenAI Feature Starter Checklist](/learn/genai-app-dev/genai-feature-starter-checklist)
