---
title: Handover that leaves capability behind
phase: field
module: communication-and-adoption
kind: lesson
summary: A handover that leaves behind a document is not a handover, it is an archive. This page gives a checklist and a shadow-then-solo method for leaving the customer's own team able to run, debug, and extend what you built after you are gone.
duration: 11 min
updated: "2026-09-02"
outcomes:
  - Distinguish a handover document from demonstrated handover, and know which one you actually delivered.
  - Run a shadow-then-solo handover session that proves the customer's team can operate the system without you.
  - Write a "who to call" and known-issues page that survives the first incident after you leave.
artifact: A handover pack for one engagement — a runbook, a known-issues page, and a record of the customer's own person running the system solo, once, while you watched.
sources:
  - https://newsletter.pragmaticengineer.com/p/forward-deployed-engineers
---

OpenAI's head of FDE is reported to hold a specific, uncomfortable standard for the role: if an FDE is needed again for the same problem, the initial solution was incomplete. That standard applies as much to handover as it does to the build itself. A system that only you can operate has not actually been delivered, whatever the SOW's acceptance criteria say — it has been rented, with you as the ongoing dependency, and it will surface as a support ticket with your name on it the first time it breaks after you leave.

## Documentation is not handover

A runbook that nobody has read while the system was working is a document the customer's team will open for the first time during an incident, under pressure, and discover it assumes context they do not have. Handover is not the artifact, it is the demonstrated ability, in the customer's team, to operate without you. The artifact supports that ability; it does not substitute for it.

## The shadow-then-solo method

Run this over two sessions, ideally a week apart, with the person or people who will actually own the system after you leave — not their manager, the person who will be paged.

**Session one: they shadow you.**

- You operate the system for a real, current task — restart the extraction job after a failure, re-run last night's batch, check why a case did not route correctly.
- Narrate every decision, including the ones that feel obvious to you. "I'm checking this log first because it's the one that shows whether the batch even started" is exactly the sentence a runbook cannot fully replace.
- Let them ask questions mid-task, not just afterward. The question they ask in the moment is the one that will actually recur.

**Session two: you shadow them.**

- They operate the system for a comparable real task, from the runbook, with you watching and saying nothing unless they are about to do something destructive.
- Every place they hesitate, check something not in the runbook, or ask you a question, is a gap in the document, not a gap in them. Fix the document, not the person.
- If they complete the task without needing you, that is the actual evidence of handover. A signature on a document is not.

## The handover pack

Four documents, not one. A single combined document tends to bury the two most-used pieces — known issues and who to call — inside pages of architecture that only get read once.

| Document | What it contains | Who reads it, and when |
|---|---|---|
| Runbook | Step-by-step operating procedures for the tasks the team will actually do — restart, re-run, check status, roll back | Whoever is on call, during a routine task or a minor incident |
| Known issues | Every limitation you know about, stated plainly, with the workaround | Whoever hits the limitation, before they conclude the system is broken |
| Who to call | Named contacts (yours and the customer's), what each is for, and what happens after your support window ends | Whoever is escalating something the runbook does not cover |
| Architecture and decisions | Why it is built this way, what was considered and rejected, and what the fragile points are | Whoever extends or debugs the system six months from now, not during an incident |

### The known-issues page is the one people skip, and the one that matters most

Every system you hand over has limitations you know about and the customer's team does not yet. In the Meridian case, an honest known-issues page includes: extraction accuracy on pre-2019 scans is not reliable, the CBS write-back is a once-daily file drop with no immediate confirmation, and the confidence threshold in component D was set from a small sample and may need adjusting as more cases run through it. Writing these down before you leave turns a limitation the team discovers under pressure, and may read as a hidden defect, into a limitation they already knew about and can explain to their own stakeholders calmly.

### Who to call needs an expiry date

"Call me" without a stated end date quietly becomes permanent, which is the opposite of what a handover is for. State explicitly how long your support window runs, what happens after it ends, and who owns the system once it does — this is the same discipline as the change-control clause in [Writing a statement of work](/roles/forward-deployed-engineer/field/writing-a-statement-of-work): a fixed process instead of an open-ended informal arrangement that neither side ever revisits.

## Definition of done for a handover

- The customer's named owner has operated the system solo, once, on a real task, while you watched and did not intervene.
- The known-issues page lists every limitation you are aware of, in plain language, with a workaround for each.
- The who-to-call page has an expiry date on your own availability.
- You can answer, honestly: if this system breaks next month and you never hear about it, does the customer's team have what they need to fix it? If the honest answer is no, the handover is not done, whatever the SOW's acceptance section says.

## How this connects to the loop that makes the role legitimate

A good handover is also the raw material for the product-facing side of the work: what the customer's own team struggled with in session two is exactly the kind of specific, reproducible finding that belongs in [the "what I learned from customers" document](/roles/forward-deployed-engineer/product/what-i-learned-from-customers-this-week), and a limitation that shows up in three different customers' known-issues pages is a strong candidate for the [generalise-or-one-off memo](/roles/forward-deployed-engineer/product/generalise-or-one-off-the-memo). The handover you write for one customer and the pattern you feed back to product are drawn from the same notes, if you take them carefully.
