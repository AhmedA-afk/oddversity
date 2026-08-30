---
title: "Cheatsheet: the AI literacy master reference"
track: "ai-literacy"
status: live
summary: "A single dense reference card compressing the whole track: what AI is, the four prompting levers, verification in brief, what never to paste, the green/yellow/red use-it buckets."
duration: "8 min read"
---

Everything else in this track boils down to six things you actually reach for mid-task. Bookmark this page — it's meant to replace the others once you've read them.

## What AI is, in one line

A large language model predicts the next chunk of text that statistically fits, based on patterns in what it was trained on. It has no separate fact-checking step, no memory of "true vs. false," and no idea whether it's guessing — confident phrasing is a writing style it learned, not a signal of accuracy. See [what AI actually is](/learn/ai-literacy/what-ai-actually-is), [pattern prediction, not thinking](/learn/ai-literacy/ai-as-pattern-prediction-not-thinking), and [why it sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident).

Everything below follows from that one fact.

## The four prompting levers

Vague input produces vague output because the model fills gaps with the statistically average answer, not the one you meant. Four levers close those gaps — pull whichever one your last prompt was missing.

| Lever | What it controls | Start here, then measure |
|---|---|---|
| **Context** | What the model has to work with | Paste the actual data or situation — not your summary of it |
| **Task** | What "done" looks like | Name the deliverable, the audience, and the one constraint that matters most |
| **Examples** | The shape and style you want | Show one sample of good output before asking for ten more |
| **Format** | How the answer should land | Ask explicitly: table, bullet list, word count, code block, tone |

Copy-paste skeleton for anything non-trivial:

```text
Context: [what's true right now — paste the data or situation, don't summarize it]
Task: [the one thing you want, and who it's for]
Examples: [one sample of the output shape, if you have one]
Format: [structure, length, or template for the answer]
```

> If the output is vague, the input was vague. Add the missing lever — don't just re-ask the same way louder.

Details and worked fixes: [how to ask AI clearly](/learn/ai-literacy/how-to-ask-ai-clearly), [turn a vague request into a clear one](/learn/ai-literacy/turn-a-vague-request-into-a-clear-one), [give AI context and examples](/learn/ai-literacy/give-ai-context-and-examples), [prompt patterns for everyday tasks](/learn/ai-literacy/prompt-patterns-for-everyday-tasks), full version: [everyday prompting cheatsheet](/learn/ai-literacy/everyday-prompting-cheatsheet).

## The verification checklist, in brief

This is the single most useful habit in the whole track — see [judging output](/learn/ai-literacy/the-single-most-important-skill-judging-output) for why it matters more than prompting skill. Run down this list before you act on anything that matters:

- [ ] **Stakes** — what actually breaks if this is wrong? Low stakes: skim it. Money, health, legal, or irreversible: verify before acting.
- [ ] **Source** — can you find where this came from, independent of the AI just restating it back to you?
- [ ] **Numbers** — recompute any math or statistic yourself. Never trust arithmetic on the model's word; see [when AI gets numbers wrong](/learn/ai-literacy/when-ai-gets-numbers-and-math-wrong).
- [ ] **Specificity** — is it a confident, specific claim (a name, a date, a citation) that you can't independently place? That combination is the shape of a hallucination — see [what a hallucination really is](/learn/ai-literacy/what-a-hallucination-really-is) and a [worked catch](/learn/ai-literacy/catch-a-hallucination-worked-example).
- [ ] **Contradiction** — does it conflict with something you already know, or with another source?
- [ ] **Recency** — is this the kind of fact that could have changed since the model's training, or that depends on right now? See [where AI's knowledge stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops).

Any box unchecked and stakes above "low" → don't act yet. Match the tactic to the task at [verification tactics by task type](/learn/ai-literacy/verification-tactics-by-task-type), and see the full walkthrough at [the verification checklist](/learn/ai-literacy/the-verification-checklist) and [how to verify facts and sources](/learn/ai-literacy/how-to-verify-facts-and-sources).

## The never-paste list

Never paste these into an AI chat, even one that looks private, unless your organization's policy explicitly clears it:

- Passwords, API keys, tokens, private keys
- Government IDs — SSNs, passport or license numbers
- Full financial account or card numbers
- Health records or diagnoses — yours or anyone else's
- Other people's personal information without their consent
- Employer confidential material, trade secrets, anything under NDA
- Unreleased legal, financial, or strategic documents
- Children's personal information

> Default rule: if you'd hesitate to post it publicly, don't paste it somewhere you don't control the retention policy of.

Background on why: [what happens to what you type](/learn/ai-literacy/what-happens-to-what-you-type), [your data can be the price](/learn/ai-literacy/your-data-can-be-the-price), full list with edge cases: [what not to paste into AI](/learn/ai-literacy/what-not-to-paste-into-ai), and org-level rules: [data privacy, provenance, and policy](/learn/ai-literacy/data-privacy-provenance-and-policy).

## When to use AI: green / yellow / red

### Green — use it freely
First drafts and brainstorming, rewriting or tone edits, explaining a concept you can sanity-check against what you roughly already know, summarizing a document you have open in front of you, boilerplate code and repetitive text transforms.

### Yellow — use it, then verify before you act
Research claims, statistics, and citations. Any math feeding a real decision. Code that touches real data or ships to users. Learning a brand-new domain, where you can't yet tell right from wrong on your own.

### Red — don't let it be the final word
Legal, medical, or financial advice *as the decision itself*. Anything involving someone else's sensitive data. High-stakes, hard-to-reverse calls. Anything you genuinely can't verify, where being wrong would be expensive.

Worked decisions and edge cases: [when AI helps and when it hurts](/learn/ai-literacy/when-ai-helps-and-when-it-hurts), [should I use AI for this?](/learn/ai-literacy/should-i-use-ai-for-this-worked-decisions), and the deeper split between a single task and a standing automation: [task or automation](/learn/ai-literacy/task-or-automation). If you're unsure a task is even worth the effort: [is AI worth it for this task](/learn/ai-literacy/is-ai-worth-it-for-this-task) and [what using AI actually costs](/learn/ai-literacy/what-using-ai-actually-costs).

## The tool-choice questions

Ask these in order — each answer narrows the field before you open a tab:

1. **Does this need current or live information?** Yes → you need retrieval/browsing built in, not a closed model answering from memory alone.
2. **Does it need to take actions for you** (send, book, edit files, call other tools)? Yes → you need an agent, not a plain chatbot. See [agents vs. chatbots](/learn/ai-foundations/ai-agents-vs-chatbots).
3. **Is this one-off or something you'll repeat?** One-off → just chat. Recurring → worth setting up once as a saved workflow — see [task or automation](/learn/ai-literacy/task-or-automation).
4. **Does the task need more than a free tier gives you** — longer context, higher limits, stronger reasoning? Check before assuming: [free vs. paid, what you actually get](/learn/ai-literacy/free-vs-paid-ai-what-you-get).
5. **What's this task worth to you**, weighed against the time it saves and the cost of it being wrong? That's the whole tradeoff this module is about — see [the real limits of AI today](/learn/ai-literacy/the-real-limits-of-ai-today) and [expecting too much or too little](/learn/ai-literacy/expecting-too-much-or-too-little).

Full decision framework: [matching the AI tool to the job](/learn/ai-literacy/matching-the-ai-tool-to-the-job) and [choose the right AI system](/learn/ai-literacy/choose-the-right-ai-system).

---

**Related:** [What AI can and can't do — overview](/learn/ai-literacy/what-ai-can-and-cant-do-overview) · [Uncertainty and verification](/learn/ai-literacy/uncertainty-and-verification) · [Cost and limits quiz](/learn/ai-literacy/cost-and-limits-quiz) · [Run a real task end to end, with verification](/learn/ai-literacy/run-a-real-task-end-to-end-with-verification)
