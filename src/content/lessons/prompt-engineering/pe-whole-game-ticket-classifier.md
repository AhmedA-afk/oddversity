---
title: "The Whole Game: One Task From Vague Ask to Reliable Prompt"
track: "prompt-engineering"
status: live
summary: "Follow one support-ticket classifier from a one-line prompt that fails five ways to a versioned, evaluated production prompt."
duration: "9 min read"
---

Every technique in this course exists to fix a specific way prompts fail. The fastest way to see why any of them matter is to watch all of them fix the same small, real task, in order, on the same ten inputs.

## The big picture

The task: route incoming support tickets to `billing`, `technical`, or `account` so they land with the right team automatically. Here are the ten tickets we'll use throughout, with the label a human triager would give each one.

| # | Ticket | Correct label |
|---|---|---|
| 1 | "I was charged twice for my subscription this month, can someone fix this?" | billing |
| 2 | "App keeps crashing whenever I try to upload a profile photo." | technical |
| 3 | "How do I update the email address on my account?" | account |
| 4 | "I want to cancel my subscription and get a refund for the unused days." | billing |
| 5 | "Two-factor authentication codes never arrive by text." | account |
| 6 | "The invoice PDF from last month won't open, it just downloads blank." | billing |
| 7 | "Why was my plan downgraded to Free without me doing anything?" | billing |
| 8 | "I never received a receipt for my last payment." | billing |
| 9 | "Can you delete my account and all my data?" | account |
| 10 | "Login keeps failing even after I reset my password." | account |

Notice that four of these (#2, #3, #8, #9) are unambiguous, and six are genuinely tricky: they mention money and access, or a broken feature and a billing document, at the same time. That mix is deliberate — real ticket queues look exactly like this.

### Stage 0: the one-line prompt

```text
Classify this support ticket: {{ticket}}
```

Run this against all ten and you get something like:

| # | v0 behavior |
|---|---|
| 1 | "This looks like a billing problem — the customer was double-charged." (label buried in a sentence) |
| 4 | "This could be billing or account, hard to say." (hedges, no single label) |
| 5 | Labels it `technical` on one run, `account` on the next — flips between rerolls |
| 6 | Labels it `technical` — fixates on the broken file, misses that it's an invoice |
| 7 | Labels it `account` — reads "my plan" as an account setting rather than a billing change |
| 10 | Labels it `technical` — treats it as an app bug, misses that it's a login/access issue |

The other four come back clean. If you'd only tried #2, #3, #8, and #9 in your first pass, you'd have shipped this. That's the trap — see [Reliability Beats Cleverness](/learn/prompt-engineering/reliability-over-clever-tricks).

### Stage 1: give it a shape it can't dodge

The prose-vs-label inconsistency in #1 and the hedge in #4 are an output-contract problem, not a knowledge problem. Nothing in v0 tells the model what shape a valid answer has, so it defaults to the shape most text takes: a sentence. Fix: name the exact output and show it, don't just ask for it. See [Structured Output](/learn/prompt-engineering/structured-output) and [Delimiters and Formatting](/learn/prompt-engineering/delimiters-and-formatting).

### Stage 2: stop letting chance decide

#5's flip between reruns isn't the model "changing its mind" — it's sampling variance on a genuinely close call. Before you can fix an ambiguous case, you need to stop it from being randomly ambiguous on top of being substantively ambiguous. Fix: turn temperature down so the same input gives the same output, which turns "sometimes wrong" into "consistently wrong" — a bug you can actually see and fix. See [Prompting Is Not Programming](/learn/prompt-engineering/prompting-is-not-deterministic-programming) and [Temperature for Prompt Engineers](/learn/prompt-engineering/temperature-and-determinism-for-prompters).

### Stage 3: name the tie-breaks

#6, #7, and #10 are wrong for the same underlying reason: v0 never told the model which category wins when a ticket touches two at once. "Billing" and "technical" both plausibly describe a broken invoice PDF; "account" and "technical" both plausibly describe a 2FA failure. This is a [task framing](/learn/prompt-engineering/task-framing) gap — the acceptance criteria were never made explicit — and the fix is a short, ordered rule set:

1. If it's about signing in, passwords, verification codes, or deleting/changing account identity — `account`, even if an app bug is described.
2. Else if it mentions a charge, invoice, refund, receipt, or plan/price — `billing`, even if a technical delivery problem is also described.
3. Otherwise — `technical`.

### Stage 4: show it, don't just tell it

Rules in prose are easy to skim past. Pairing each rule with one worked example locks it in — the model pattern-matches new tickets against the closest example far more reliably than it applies an abstract instruction. See [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting) and [Instructions, Context, Examples](/learn/prompt-engineering/instructions-context-examples).

### Stage 5: assemble the production prompt

```text
SYSTEM:
You are a support-ticket triage classifier for Acme Cloud. You assign exactly
one category so the ticket can be routed automatically. You do not answer the
customer or explain anything to them.

TASK:
Read the ticket in <ticket> and assign exactly one label:
- billing    — charges, refunds, invoices, receipts, subscription price or tier
- account    — login, password, 2FA/verification codes, account identity,
               deleting or transferring an account
- technical  — a feature or the app not working, where money and account
               access are not the issue

TIE-BREAKS (apply in order):
1. Signing in, passwords, verification codes, or account identity -> account,
   even if an app bug is described.
2. A charge, invoice, refund, receipt, or plan/price -> billing, even if a
   technical delivery problem is also described.
3. Otherwise -> technical.

EXAMPLES:
<ticket>The invoice PDF from last month won't open, it downloads blank.</ticket>
{"label": "billing"}

<ticket>Login keeps failing even after I reset my password.</ticket>
{"label": "account"}

<ticket>App keeps crashing whenever I try to upload a profile photo.</ticket>
{"label": "technical"}

OUTPUT FORMAT:
Return only this JSON object, nothing else:
{"label": "billing" | "account" | "technical"}

<ticket>{{customer_ticket}}</ticket>
```

Run this at temperature 0 against all ten tickets, three times each. The tie-break rules are explicit and each has a matching example, so #6, #7, and #10 should now land on the category the rules define rather than whichever one the model guessed that day — and because temperature is 0, a rerun shouldn't change any of the ten. That's the bar: not "it got the demo right," but "it got the same answer three times on the ones that used to flip."

### Stage 6: when it's still wrong, diagnose, don't guess

Suppose after this you still see one wrong label. The instinct is to add another paragraph of instructions. Instead, ask which specific region of the prompt should have prevented that exact output — the label set, a tie-break, the example set, or the format — and fix only that region. See [Diagnosing Why a Prompt Failed](/learn/prompt-engineering/reading-a-model-failure).

### Stage 7: prove it, don't assume it

Ten hand-picked tickets are a start, not a finish line. Before this ships, it needs a held-out set the prompt author didn't write the rules against, and a re-run whenever the prompt or the underlying model changes. See [Prompt Evaluation Basics](/learn/prompt-engineering/prompt-evaluation-basics) and [Building an Eval Dataset](/learn/prompt-engineering/building-an-eval-dataset).

### Stage 8: freeze it and track it

Once this version passes eval, it gets a version number, a changelog entry, and a rollback path — the same way a code change would, because a "small wording tweak" can silently regress the tie-break cases you just fixed. See [Prompt Versioning and Reuse](/learn/prompt-engineering/prompt-versioning-and-reuse) and [Prompt Versioning and Change Management](/learn/prompt-engineering/prompt-versioning-and-change-management).

### The map, end to end

| Problem observed in v0 | What fixed it | Lesson |
|---|---|---|
| Label buried in a sentence | Explicit output contract | [Structured Output](/learn/prompt-engineering/structured-output) |
| Flips between reruns on close calls | Temperature 0 | [Temperature for Prompt Engineers](/learn/prompt-engineering/temperature-and-determinism-for-prompters) |
| Wrong on tickets that touch two categories | Explicit ordered tie-breaks | [Task Framing](/learn/prompt-engineering/task-framing) |
| Rules ignored in practice | Worked examples per rule | [Few-Shot Prompting](/learn/prompt-engineering/few-shot-prompting) |
| A wrong label survives a "fix" | Diagnose by region, not by instinct | [Diagnosing Why a Prompt Failed](/learn/prompt-engineering/reading-a-model-failure) |
| "It worked on my ten tickets" | A held-out eval set | [Prompt Evaluation Basics](/learn/prompt-engineering/prompt-evaluation-basics) |
| A later edit quietly breaks tie-breaks | Versioned, reviewed changes | [Prompt Versioning and Reuse](/learn/prompt-engineering/prompt-versioning-and-reuse) |

## What trips people up

| Idea | Confusion | Where to learn it |
|---|---|---|
| "It got the label right" | Confusing one correct run with a working prompt | [Reliability Beats Cleverness](/learn/prompt-engineering/reliability-over-clever-tricks) |
| "Just tell it to return JSON" | Assuming an instruction alone guarantees the shape, without an example | [Structured Output](/learn/prompt-engineering/structured-output) |
| "It's being inconsistent" | Blaming the model for what's actually unset temperature | [Prompting Is Not Programming](/learn/prompt-engineering/prompting-is-not-deterministic-programming) |
| "The rules are all there, it should know" | Assuming stated rules are applied as reliably as demonstrated ones | [Anatomy of a Production Prompt](/learn/prompt-engineering/anatomy-of-a-production-prompt) |
| "I fixed it" after one rerun | Not distinguishing a real fix from sampling luck | [Diagnosing Why a Prompt Failed](/learn/prompt-engineering/reading-a-model-failure) |

## A reading path

1. Finish this module in order — it's the mental model everything else assumes: [Why Prompting Works](/learn/prompt-engineering/why-prompts-steer-next-token-prediction), [What Prompting Cannot Fix](/learn/prompt-engineering/what-prompting-cannot-fix), [The Anatomy of a Production Prompt](/learn/prompt-engineering/anatomy-of-a-production-prompt).
2. Structure and formatting — how the regions in Stage 5's prompt actually get separated: [Sectioning a Prompt Into Blocks](/learn/prompt-engineering/sectioning-a-prompt-into-blocks).
3. Examples and in-context learning — picking and ordering the examples from Stage 4: [Few-Shot Example Selection](/learn/prompt-engineering/few-shot-example-selection).
4. Roles and steering — where a system prompt like Stage 5's earns its place: [System vs. User Message Roles](/learn/prompt-engineering/system-vs-user-message-roles).
5. Evaluation and shipping — turning Stage 7 into a repeatable habit: [Why Eval Before You Ship](/learn/prompt-engineering/why-eval-before-ship).

**Related:** [What Prompting Cannot Fix](/learn/prompt-engineering/what-prompting-cannot-fix) · [The Anatomy of a Production Prompt](/learn/prompt-engineering/anatomy-of-a-production-prompt) · [The Five Mistakes Every Beginner Makes](/learn/prompt-engineering/beginner-prompting-mistakes) · [First-Principles Prompting Cheatsheet](/learn/prompt-engineering/prompt-first-principles-cheatsheet)
