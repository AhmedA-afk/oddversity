---
title: "Capstone: run a real task end to end, verified"
track: "ai-literacy"
status: live
summary: "The track's capstone: pick one real task from your own life and run it through the full AI pipeline — fit, tool, prompt, privacy, verification, ownership — then score yourself agai."
duration: "60 min read"
---

Every other page in this track has been rehearsal. This one is the real thing: one genuine task from your actual life, run through an AI tool from decision to delivery, graded by nobody but the person who has to live with the result — you.

## The brief

Pick one task that's actually sitting in your life right now, not a hypothetical. It needs to be real enough that a bad answer would cost you something — money, time, an awkward email, a wrong turn on a trip. Three starting points, pick one or bring your own:

- **Draft and send a complaint or dispute letter** — a wrong charge, a broken product, a lease dispute, a chargeback request.
- **Plan a real trip on a real budget** — actual dates, an actual number in your bank account, actual constraints (kids, a dog, a bad knee, a hard return date).
- **Fact-check an article before you share or act on it** — something you were about to forward, cite in an argument, or use to make a decision.

The audience for the *final output* is whoever the task is actually for — the landlord, your travel companion, the group chat you almost misinformed. The audience for the *worksheet* is you: proof that you ran a defensible process, not a lucky guess.

You're producing three things:

1. **The real deliverable** — the letter, the itinerary, the fact-check verdict — good enough to actually use today.
2. **A filled-out worksheet** documenting the decisions you made along the way.
3. **A self-assessment** against the rubric at the end of this page, done honestly, including the parts that went badly.

### The worksheet

Copy this into a doc before you open any AI tool. Fill it in as you go, not after the fact — the value is in catching your own reasoning in real time.

```text
CAPSTONE WORKSHEET — [name your task]

1. THE TASK
   What do you actually need? (one sentence, plain language):
   Who is it for, and what happens if it's wrong?:

2. DOES AI FIT?
   One-off task or something you'll repeat?:
   What's the AI actually good at here, vs. what stays on you?:
   Tool you chose, and the one-sentence reason why:

3. THE PROMPT
   Context/role you gave it:
   Constraints (length, tone, format, must-nots):
   Paste your actual prompt text here:

4. SANITIZE
   Private or identifying data in the raw task:
   What you removed, replaced, or generalized before sending it:
   Anything you decided was safe to include, and why:

5. VERIFY
   Claims or numbers that matter if they're wrong (at least 2):
   Independent source you checked each one against:
   Result for each: confirmed / wrong / couldn't verify
   The one thing the AI got wrong, vague, or made up:

6. OWNERSHIP
   What you changed, in your own words, before finalizing:
   What you would NOT send or use as-is, and why:
   Final call: used it as-is / used it with edits / discarded and redid it myself
```

## Acceptance criteria

- [ ] You wrote down the task and who it's for *before* opening any AI tool.
- [ ] You can state in one sentence why AI fits this task (or which part of it) — see [task or automation](/learn/ai-literacy/task-or-automation).
- [ ] You picked a specific tool for a specific reason and can defend that choice against at least one alternative.
- [ ] Your prompt includes context, constraints, and a requested format — not just a bare question.
- [ ] You identified at least one piece of private or identifying information in the raw task and removed or generalized it before sending anything.
- [ ] You checked at least two load-bearing claims or numbers against a source outside the AI's own answer.
- [ ] You found and can name at least one thing the AI got wrong, vague, or unsupported.
- [ ] The final output is something you'd actually use or send today, with your own edits where it mattered.
- [ ] The worksheet is filled out completely, including the parts that didn't go well.

> If your verification step turned up nothing wrong, that's not a clean bill of health — it usually means you didn't check hard enough. Go back and test a claim you skipped the first time.

## Suggested stack

Nothing here should cost you anything:

- **One chat AI, chosen on purpose** — Claude, ChatGPT, or Gemini's free tier. Pick it for a stated reason, not out of habit; that reasoning is what [choosing the right AI system](/learn/ai-literacy/choose-the-right-ai-system) is actually about.
- **An independent way to check facts** — a search engine, the primary source's own site or PDF, or the actual portal involved (your bank, the airline, the retailer). Asking the same AI to double-check itself doesn't count as independent.
- **A plain doc or spreadsheet for the worksheet** — Google Docs/Sheets, a Notion free page, or a `.txt` file. The format doesn't matter; filling it in honestly does.
- **The primary source for anything time-sensitive** — prices, schedules, and availability go stale fast, and the model's training data has a cutoff. See [where AI knowledge comes from and stops](/learn/ai-literacy/where-ai-knowledge-comes-from-and-stops) before you trust a date or a fare.
- **Optional: a second AI tool**, used once, on the hardest single question in your task, purely to see where two tools disagree.

## Milestones

These are capabilities you can point to evidence of in your worksheet — not steps to execute in a fixed order.

1. **Honest scoping.** You can say in one sentence why this task suits AI (or which slice of it does), and where a judgment call stays yours regardless of what the tool outputs.
2. **Deliberate tool choice.** You picked a specific tool for a specific reason, and you can name what you'd reach for instead if the task changed — became recurring, needed live data, or needed a human touch a chatbot can't fake.
3. **A prompt that does real work.** Your prompt carries context, constraints, and a format spec, following the patterns in [prompt patterns for everyday tasks](/learn/ai-literacy/prompt-patterns-for-everyday-tasks) — and it doesn't hand over anything it shouldn't, per [what not to paste into AI](/learn/ai-literacy/what-not-to-paste-into-ai).
4. **A verification pass that finds something.** You checked claims that matter against sources outside the AI itself, using the discipline in [the verification checklist](/learn/ai-literacy/the-verification-checklist), and you surfaced at least one real problem instead of rubber-stamping the draft.
5. **Ownership of the final artifact.** The thing you ship carries your edits and your judgment; you could explain and defend every sentence of it if someone asked you to, in the spirit of [using AI honestly and responsibly](/learn/ai-literacy/using-ai-honestly-and-responsibly).
6. **An honest retrospective.** You scored yourself against the rubric below without inflating it, and you can name one thing you'd do differently on the next real task.

## What good looks like

Take the trip-planning version. A weak run looks like: type "plan me a 4-day trip to Lisbon under $800," paste the answer into a doc, book the first hotel it names. A strong run looks like this instead.

The prompt states the actual dates, the actual budget after flights, and a constraint the AI can't infer — say, a connecting train that has to run on a Tuesday. The draft itinerary comes back clean and confident, including a recommended regional train between two cities. That confidence is exactly what you check, not what you trust: you pull up the rail operator's real timetable and find that train doesn't run on Tuesdays at all, only Thursdays through Sundays. That's not a stylistic nitpick — it breaks the whole middle of the itinerary, and it's precisely the kind of specific, checkable, wrong detail that a model can state fluently without it being true. See [why AI sounds so confident](/learn/ai-literacy/why-ai-sounds-so-confident) for why that happens by default, not by malfunction.

The worksheet entry for that catch is short and specific — "checked the Tuesday train against [operator]'s published timetable, it doesn't run that day, replaced with the Thursday option and rebuilt day 2" — not "verified, looks good." That specificity is what separates a real verification pass from a box-ticking one.

### Self-assessment rubric

Score yourself honestly. "Partly" is a legitimate answer — this is your first full run, not a certification exam.

| Skill area | Self-check | Yes / Partly / No |
|---|---|---|
| What AI is | Can you say what the tool mechanically did (predicted likely text) versus what it seemed to do (understand your situation)? | |
| Prompting | Did your prompt carry context, constraints, and a format — not just a bare question? | |
| Judging output | Did you find at least one real flaw, not zero? | |
| Deciding when/which AI | Can you name the tool or method you rejected, and why? | |
| Privacy | Did you sanitize before sending, not after noticing a problem? | |
| Bias and ethics | Did you consider whose situation, currency, or default the answer quietly assumed? | |
| Cost and limits | Do you know roughly what this run would cost on a paid tier, and whether it was worth it? | |

If most rows are "Yes," the pipeline held. If several are "Partly," that's your list for the next real task — not a reason to redo this one.

## Extensions

- **Run it through a second tool and compare** the two outputs on the same prompt, following [comparing AI tools for one real task](/learn/ai-literacy/compare-ai-tools-for-one-real-task) — the disagreements are usually more instructive than either answer alone.
- **If the task repeats, decide whether it should be automated** rather than re-prompted by hand each time, and be explicit about where that crosses from a task into an automation — see [task or automation](/learn/ai-literacy/task-or-automation).
- **Deliberately skip verification on a throwaway copy** of the same task and see what would have shipped. It's the fastest way to feel, rather than just know, why the checklist exists.
- **Redo the sanitize step as if you'd be audited** — if the task touched anyone else's information, revisit it against [data privacy, provenance, and policy](/learn/ai-literacy/data-privacy-provenance-and-policy).
- **Teach the pipeline to one other person** by having them run their own real task while you narrate your worksheet next to them. Explaining a judgment call out loud is where you find the ones you made on autopilot.

**Related:** [The verification checklist](/learn/ai-literacy/the-verification-checklist) · [Is AI worth it for this task](/learn/ai-literacy/is-ai-worth-it-for-this-task) · [Verification tactics by task type](/learn/ai-literacy/verification-tactics-by-task-type) · [What using AI actually costs](/learn/ai-literacy/what-using-ai-actually-costs) · [AI literacy master cheatsheet](/learn/ai-literacy/ai-literacy-master-cheatsheet) · [Your first AI workflow capstone](/learn/ai-literacy/first-ai-workflow-capstone)
