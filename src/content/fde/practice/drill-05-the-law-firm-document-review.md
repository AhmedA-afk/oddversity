---
title: "Drill 05: the law firm document review"
phase: practice
module: decomposition-drills
kind: drill
summary: A law firm wants an AI system to review four hundred thousand discovery documents before a deadline. Forty-five minutes to discover that the real document set sits behind ethical walls and a client contract nobody has read yet.
duration: 45 min
updated: "2026-09-02"
outcomes:
  - Locate the real access boundary around a dataset before proposing a tool to process it.
  - Read a client contract's data-handling terms as a hard constraint, not paperwork to handle later.
  - Propose a walking skeleton proven on a small, already-cleared subset of data.
artifact: A one-page decomposition memo in your drill log, scored against the five-criterion rubric.
---

Read the brief and the room. Then set a timer for 45 minutes and work before you read any further. The method and the rubric are on [how to run a decomposition drill](/roles/forward-deployed-engineer/practice/how-to-run-a-decomposition-drill).

## The brief, as stated

Harlow Whitfield LLP is a 300-lawyer litigation and corporate firm with offices in London and New York. You are the FDE embedded with the litigation technology team, engaged by the firm to speed up document review on a live antitrust matter. The lead partner opens the kickoff:

> "We have four hundred thousand documents to get through before the meet-and-confer in six weeks, and the client is capping review spend at a fraction of what a fully staffed contract-attorney review would cost. I want an AI system that reads every document, flags privilege, flags responsiveness to the sixty-two document requests, and gets us to a defensible production. Build it against our document set and let's see it work by Friday."

You're given credentials to "the document set" — which turns out to mean a folder of 40,000 documents someone exported for you as a sample.

## The room

**Miles Okafor, lead litigation partner.** Owns the matter and the client relationship.

> "The client's GC has told me flatly: if this review costs what the last one did, we lose the engagement. I need speed and I need a number I can defend to opposing counsel if they challenge our production."

**Priya Chandrasekaran, firm General Counsel and risk partner.** Not on the matter team; has veto power over any tool touching client data.

> "We represent three other clients in the same industry as this one, on unrelated matters, and two of them are commercially adverse to each other. Every matter in this firm sits behind an ethical wall for a reason. I have not approved any AI tool to touch privileged material, and this client's outside counsel guidelines — which we signed — specifically prohibit sending their documents to a third-party processor without written consent."

**Dana Whitcombe, senior associate, running the review day to day.**

> "I'm the one who signs the privilege log, personally, to the court. If your tool marks something non-privileged and it turns out to be a communication with in-house counsel, that's a waiver the client can never get back, and it's my name on the filing. I need to know exactly what a human is still checking before I'll put my name near this."

## Run the drill first

Forty-five minutes. Do not read on.

## What is actually going on

The 40,000-document "sample" you were handed is not the real access boundary — it is what someone was able to export by hand in an afternoon. The real 400,000-document set lives inside the firm's matter-management system, where every document is tagged to a specific matter and access is enforced by the same ethical-wall system Priya described. You do not currently have access to the actual matter workspace, and getting it requires a conflicts and ethical-screen check that Priya's office runs, not a request you can make to IT.

The client's outside counsel guidelines — a contract the firm signed before the matter started — are more restrictive than firm policy: no third-party processing of client data without written, matter-specific consent, and in some clauses, no offshore processing at all. That rules out sending documents to a general-purpose hosted model without either a specific carve-out negotiated with the client or a self-hosted deployment that never sends data outside the firm's environment. Nobody has asked the client for that carve-out yet, and asking takes time Miles's six weeks may not have.

A meaningful share of the "document set" is not text at all: scanned faxes, native spreadsheets with formulas, and email threads pulled from archives under litigation hold, where the custody chain — who touched the file, when — is itself evidence and has to be preserved through whatever tool processes it.

Miles's Friday demo request assumes the data access problem is already solved. It is the actual first project.

## What a strong decomposition covers

- **Where the real document set lives and who controls access to it**, as distinct from the sample folder you were handed — the matter-management system, the ethical-wall system, and the fact that access itself requires a formal clearance you have not been through.
- **The outside counsel guidelines as a hard constraint**, read before any tool is chosen, since they may forbid the exact category of solution — hosted third-party AI — that seems fastest.
- **Privilege as a legal, not statistical, category.** Dana's exposure is personal and professional; any tool output on privilege needs a human sign-off step, always, not as a later refinement.
- **Chain of custody** for documents under litigation hold — whatever pipeline touches them has to preserve, not obscure, who accessed what and when.
- **The decomposition**, in order: confirm access and consent (client carve-out or self-hosted deployment), then responsiveness triage (lower-stakes, easier to automate with review), then privilege flagging (highest-stakes, human-reviewed always), then production formatting.
- **The walking skeleton**: on a small, already-cleared subset — documents the client has explicitly consented to process this way — build the full pipeline end to end: ingest, responsiveness flag, privilege flag, human review screen, export. Prove the pipeline on data you are actually allowed to touch before scaling it to 400,000 documents you are not yet cleared to see.

## A model 45 minutes

- **0 to 8.** How does document review happen today, start to finish, and where does a document currently sit when it's marked privileged.
- **8 to 15.** Miles's budget and deadline, Priya's ethical-wall veto, Dana's personal liability on the privilege log.
- **15 to 23.** Where the 400,000 documents actually live, who grants access, and what the outside counsel guidelines say about third-party processing — read them before designing anything.
- **23 to 33.** Access and consent first; responsiveness triage second; privilege flagging with mandatory human sign-off third.
- **33 to 40.** A pipeline proven end to end on a small, already-consented subset, not a demo against the sample export.
- **40 to 45.** Risk: no client consent for third-party processing means the tool choice changes entirely. What you won't promise: a Friday demo against real matter data you don't yet have clearance to touch.

## The trap in this one

**Ignoring data access.** The instinct, given a folder of 40,000 documents and a Friday deadline, is to start building against what's in front of you — write the extraction pipeline, wire up a model, show a working demo. That demo will work, on the sample. It proves nothing about the actual engagement, because the actual 400,000 documents sit behind an access-control system built for a real legal reason, guarded by a client contract you have not read, and touching them wrong is not a bug, it is a possible privilege waiver or an ethical-wall breach that ends the firm's engagement.

The FDE version treats "can I actually get to this data, and am I allowed to" as the first technical question, before the extraction pipeline, before the model choice, before the demo. On this drill, the honest week-one deliverable is a memo to Priya and the client's GC laying out exactly what data the pipeline needs to touch and under what safeguards, not a working prototype.

## The rubric, applied

A weak attempt builds an extraction and classification pipeline against the sample folder, demos it Friday, and never asks who controls access to the other 360,000 documents. That is 1/1/1/0/1.

A pass reads the outside counsel guidelines before proposing a tool, names the ethical-wall clearance as a blocking dependency, treats privilege flagging as human-sign-off-always rather than an accuracy target, and proves the pipeline on a small consented subset instead of the full sample. That is 2/3/2/3/3.

Criterion 4 carries the weight here: a zero is the candidate who assumes the data is available because a folder was placed in front of them, and a three is the candidate who asks, unprompted, "what does the outside counsel agreement say about processing this data with a third-party tool?"
