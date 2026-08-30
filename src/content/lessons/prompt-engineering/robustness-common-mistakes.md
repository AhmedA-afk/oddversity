---
title: "Robustness Mistakes: Assuming Clean, Friendly Input"
track: "prompt-engineering"
status: live
summary: "Six ways prompts break in production by assuming clean, friendly, well-formatted input, each with the defensive fix that catches it."
duration: "8 min read"
---

Every mistake below passes code review and a demo cleanly, then breaks the first week real users actually touch it.

### The mistake: no handling for empty or garbage input

**Why it's wrong.** A prompt built and tested against realistic sample inputs implicitly assumes there's always something meaningful to work with. Production doesn't guarantee that — a form field submits empty, a file upload fails silently and passes through a zero-byte string, a user pastes a screenshot's worth of unreadable OCR noise.

**Symptom.** The model doesn't error — it produces a confident-looking answer about nothing: a summary of an empty document, a sentiment label for a blank review, a JSON blob describing a receipt that was actually a photo of a wall. The output validates structurally, so it slips past a shape-only check.

**Fix.** Validate input shape — non-empty, minimum length, minimum information content — before the model ever sees it, and give it a defined branch.

```python
if not ticket_text or len(ticket_text.strip()) < 5:
    return {"status": "insufficient_input", "reason": "input too short or empty"}
```

### The mistake: trusting retrieved or ingested text as reviewed

**Why it's wrong.** Text your system fetched — a document, a scraped page, a tool's return value — never passed through a person the way your own prompt did. Treating it with the same trust as your instructions is the same exposure covered in [Prompt Injection: When the Input Fights Your Instructions](/learn/prompt-engineering/prompt-injection-basics), but it shows up as an ordinary robustness bug even without an actual attacker: a retrieved FAQ page that happens to contain an example complaint written in imperative voice can nudge behavior nobody intended.

**Symptom.** Output occasionally follows something that was clearly quoted or embedded content rather than your task — instructions leak through, tone shifts to match a retrieved document's voice, or the model answers a question that was never asked, just present in the source text.

**Fix.** Delimit and label every piece of fetched content as data, and restate the actual task after it — see the layered approach in [Defense in Depth: Delimiters, Roles, and Trust Boundaries](/learn/prompt-engineering/defending-with-delimiters-and-roles).

### The mistake: assuming the demo language and format generalize

**Why it's wrong.** A prompt tuned and evaluated against English, well-formatted, single-language input tells you nothing about what happens on mixed-language input, a different script, or a locale with different date and number conventions — see [Adapting Prompts Across Languages](/learn/prompt-engineering/adapting-prompts-across-languages).

**Symptom.** Constraints that held reliably in the demo — a word count, a required tone, "respond in the user's language" — quietly stop holding for a slice of real traffic, often invisibly, because nobody is reading the non-English outputs by hand.

**Fix.** Build an eval slice that matches your actual production language and format mix, not just the language you happened to write the demo in.

### The mistake: no fallback when output is unparseable

**Why it's wrong.** Any prompt promising structured output — JSON, a fixed label set, a delimiter-separated format — is making a probabilistic claim, not a guarantee. Code that calls `json.loads()` and lets it throw is treating a probabilistic claim as a contract.

**Symptom.** A crash, or worse, a silent partial parse, whenever the model wraps JSON in prose ("Here's the JSON you asked for:"), truncates on a long input, or drops a field it decided wasn't relevant.

**Fix.** Add a repair attempt — strip known wrapper text, retry once with a stricter instruction, or fall back to a regex extraction — before giving up.

```python
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    raw = strip_markdown_fences(raw)
    data = json.loads(raw)  # one repair attempt, then let it raise
```

See [Fixing Malformed JSON Output](/learn/prompt-engineering/fixing-malformed-json-output) for the full pattern.

### The mistake: no cap on input size before it reaches the prompt

**Why it's wrong.** Nothing stops a user from pasting a 50,000-word document into a field designed for a paragraph. Past a certain size, context can be silently truncated depending on how your pipeline handles overflow, and cost scales with every token sent whether or not it was useful.

**Symptom.** Inconsistent behavior on long inputs that has nothing to do with content — task instructions that reliably worked on a short input silently stop being followed once enough tokens precede them, or a retry loop on a failed call reprocesses the same huge input every time, quietly multiplying cost.

**Fix.** Check and cap input length before the main call; chunk or pre-summarize oversized input rather than hoping it fits, and budget for it explicitly — see [Cost and Token Budgets for Prompts](/learn/prompt-engineering/cost-and-token-budget-for-prompts).

### The mistake: no plan for a legitimate request getting refused

**Why it's wrong.** Pipelines are usually built assuming every model call returns a usable answer. Occasionally a benign request trips a safety heuristic anyway — ambiguous phrasing, an overly broad system-prompt rule — and the response comes back as a decline instead of the expected output; see [Handling Refusals and Safety Boundaries](/learn/prompt-engineering/handling-refusals-and-safety-boundaries).

**Symptom.** The refusal text gets shipped to the end user as if it were the answer, or downstream code that expects JSON crashes on a paragraph explaining why the model can't help.

**Fix.** Detect refusal-shaped responses, retry once with clarified or narrower phrasing, and escalate to a human or a logged failure path rather than looping or shipping the refusal verbatim.

## Pre-flight checklist

- [ ] Empty, minimal, and garbage inputs have a defined, tested branch.
- [ ] Every piece of fetched or retrieved content is delimited and never treated as an instruction source.
- [ ] The eval set includes the actual language and format mix of production traffic, not just the demo language.
- [ ] A parse failure on structured output triggers one repair attempt, not a crash.
- [ ] Input length is checked and capped before the main call.
- [ ] A refusal-shaped response is detected and handled, not shipped or silently retried forever.

**Related:** [Prompt Injection: When the Input Fights Your Instructions](/learn/prompt-engineering/prompt-injection-basics) · [Defense in Depth: Delimiters, Roles, and Trust Boundaries](/learn/prompt-engineering/defending-with-delimiters-and-roles) · [Adapting Prompts Across Languages](/learn/prompt-engineering/adapting-prompts-across-languages) · [Fixing Malformed JSON Output](/learn/prompt-engineering/fixing-malformed-json-output) · [Cost and Token Budgets for Prompts](/learn/prompt-engineering/cost-and-token-budget-for-prompts) · [Handling Refusals and Safety Boundaries](/learn/prompt-engineering/handling-refusals-and-safety-boundaries)
