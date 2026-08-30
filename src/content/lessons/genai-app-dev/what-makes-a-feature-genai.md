---
title: "The Deterministic Shell Around a Probabilistic Core"
track: "genai-app-dev"
status: live
summary: "A GenAI feature is ordinary, testable code wrapped around one nondeterministic function call."
duration: "6 min read"
---

Ask ten engineers what makes a feature "AI" and most will point at the model call. That's the smallest part of the system, and treating it as the whole system is where first features go wrong.

## What it is

A GenAI feature is a normal application — routes, auth, a database, a UI — with one function inside it that behaves differently from every other function you've written: given the same input twice, it can return two different outputs. Everything else in the feature exists to make that one unreliable piece safe to depend on.

Picture it as two layers. The **core** is the model call itself: you send tokens in, a probability distribution over next tokens drives generation, and tokens come out. It's genuinely nondeterministic — even at fixed settings, you're sampling from a distribution, not evaluating a formula. The **shell** is everything wrapped around that core: the code that builds the input, the code that decides what to do with the output, and the code that renders it. The shell is code you already know how to write. It's testable, deterministic, and version-controlled exactly like the rest of your app.

## The mental model

Draw the feature as three concentric layers:

```text
[ UI / rendering ]
   [ validation, retries, fallback ]
      [ the model call — nondeterministic ]
   [ prompt assembly, context, parameters ]
[ auth, storage, routing ]
```

The nondeterministic core sits in the middle. Nothing about the layers around it changes — they're regular software engineering. What changes is that those layers now have a new job: contain the variance coming out of the middle so it never reaches the user unfiltered. See [Anatomy of a GenAI Feature](/learn/genai-app-dev/anatomy-of-a-genai-feature) for the five concrete pieces (client, backend, prompt, provider call, guardrails) that fill in this shell in a real app.

## Why it works this way

A traditional CRUD feature — save a comment, load a profile — is built from deterministic operations end to end. Given the same request and the same database state, you get the same response, every time. That's what makes a fixed test suite meaningful: you assert the exact output and it either matches or it doesn't.

A model call breaks that assumption at exactly one point. You can't assert `output === "the correct reply"`, because there isn't one correct reply — there's a distribution of acceptable ones and a much larger set of unacceptable ones. So the engineering discipline shifts from *"assert the exact value"* to *"constrain the space of acceptable values and validate that the output landed inside it."* That shift — from equality checks to boundary checks — is the single biggest habit change moving from normal app code into GenAI features.

## A concrete example

Compare a "load user profile" endpoint to a "summarize this ticket" endpoint:

```text
GET /profile/42
→ deterministic DB read
→ same JSON back every time
→ test: assert response === fixture

POST /summarize  { ticketId: 42 }
→ deterministic: load ticket from DB
→ nondeterministic: model call over ticket text
→ deterministic: validate summary length + shape, log, return
→ test: assert response matches a *schema*, not a fixture
```

What changed is exactly one hop in the middle. The auth check before it and the validation after it are unchanged in kind from any other endpoint you've built — they're just now defending against a different failure shape.

## Where it shows up

This shell-vs-core split explains why the topics later in this course exist at all:

- Retries and timeouts (shell) exist because the core call can hang or fail — see [error handling for LLM calls](/learn/genai-app-dev/error-handling-for-llm-calls).
- Output validation (shell) exists because the core can return well-formed but wrong output — see [structured output in apps](/learn/genai-app-dev/structured-output-in-apps).
- Cost and latency budgets (shell) exist because the core's runtime and price both vary per call — see [cost budgets and usage tracking](/learn/genai-app-dev/cost-budgets-and-usage-tracking).

None of those are "AI problems" in the sense of needing ML expertise. They're ordinary reliability engineering, applied to a function that happens to be a model instead of a database query.

## Watch out for

- **Treating the whole feature as unpredictable.** Only the core is nondeterministic. If your validation logic or your database write is behaving inconsistently, that's a normal bug — don't blame the model for it.
- **Skipping tests because "the output is random."** You can't assert exact text, but you can and should assert shape, length bounds, required fields, and forbidden content — the same way you'd test any function with a wide but bounded output space.
- **Letting the core's variance leak past the shell.** A missing validation step, or a `try/catch` that swallows errors and forwards raw model text anyway, defeats the entire point of having a shell. See [Antipatterns in Your First GenAI Feature](/learn/genai-app-dev/first-genai-feature-antipatterns) for the concrete versions of this mistake.

## Where next

This shell-vs-core frame is the lens the rest of the module uses. [Tracing One Request Through Eight Hops](/learn/genai-app-dev/request-lifecycle-mental-model) zooms into the shell's individual hops, and [Where the LLM Boundary Belongs in Your Architecture](/learn/genai-app-dev/where-the-llm-boundary-lives) covers where in that shell — client or server — the core call is allowed to sit.

**Related:** [Anatomy of a GenAI Feature](/learn/genai-app-dev/anatomy-of-a-genai-feature), [Tracing One Request Through Eight Hops](/learn/genai-app-dev/request-lifecycle-mental-model), [Antipatterns in Your First GenAI Feature](/learn/genai-app-dev/first-genai-feature-antipatterns), [Structured Output in Apps](/learn/genai-app-dev/structured-output-in-apps)
