---
title: Demoing to the people who will use it
phase: field
module: scoping-sows-and-bootcamps
kind: lesson
summary: A demo to the sponsor and a demo to the person who will use the tool every day are different presentations with different failure modes. This page gives a script for each, a checklist for when the demo breaks live, and the case for shipping something demoable by day three.
duration: 11 min
updated: "2026-09-02"
outcomes:
  - Run a demo to an end user that surfaces friction the sponsor's demo never would.
  - Recover a live demo failure without losing the room.
  - Explain why "working by day three" is the target, not an aspiration.
artifact: A written demo script for one bootcamp, with a separate five-minute version for the end user and a fifteen-minute version for the sponsor.
sources:
  - https://getperspective.ai/blog/palantir-forward-deployed-engineering-playbook-anthropic-openai-copying
  - https://vibeengines.com/roadmap/forward-deployed-engineer
---

There are two demos in every engagement and they are not the same presentation with a shorter version cut for time. The sponsor's demo answers "should we keep funding this". The end user's demo answers "will I actually use this on Tuesday". Confusing them is why systems that demo well to executives sometimes get abandoned within a month by the people who were supposed to use them.

## Why day three, not week six

Accounts of how the pattern works at Palantir and companies that have copied it converge on the same claim: a working application by day three is the norm, not a stretch goal. A separate account of the wider field describes teams running "48-hour demos" as standard practice. The reasoning is not about speed for its own sake. A demo on day three, however rough, is the first point where you find out whether the write-back actually works, whether the login the IT team promised exists, and whether the sponsor's mental model of the workflow matches reality. Every one of those things is cheaper to be wrong about on day three than in week six.

This is also why the walking skeleton described in [The decomposition method](/roles/forward-deployed-engineer/field/the-decomposition-method) is built end to end before any single layer is polished — it exists specifically to be demoable early, on real data, even when the middle of it is crude.

## Demo one: the sponsor

The sponsor's demo is fifteen minutes and it is not a tour of features. It is evidence for a decision.

**Structure:**

1. **State the number you set out to move**, in one sentence, before you show anything. "We said we'd get overnight rework under 3 cases a day. Here is where we are after five days."
2. **Show the case they already know.** Pick a real case from the sample the sponsor recognises — a specific branch, a specific date, a specific complaint. Not a synthetic example built to look clean.
3. **Show the path end to end, including the ugly part.** If the write-back is a file drop that runs once daily, say so and show it, rather than hiding the seam and hoping nobody asks.
4. **Name what you deliberately did not build**, and why, before they ask. "This is a spreadsheet, not a proper review screen, because the question this week was whether the write-back works at all."
5. **Ask for the decision, explicitly.** "Based on this, I'm asking for two more weeks and access to a second branch." Not "any questions" — a specific ask.

## Demo two: the end user

The end user's demo is five minutes of watching them use it, not you. This is the demo most vendors skip, and it is the one that predicts adoption.

**Structure:**

1. **Hand over the mouse or the phone in the first minute.** If you are still driving after minute two, you are demoing to yourself.
2. **Give them a real case from their own queue**, not a curated one. If Sunita's queue has a messy pre-2019 case with no scan, that is the case to hand her, not the clean one from last Tuesday.
3. **Say nothing while they work**, and write down every place they hesitate, click the wrong thing, or ask "wait, where's the...". Every hesitation is a finding, not a user error.
4. **Ask one question at the end**: "What would stop you using this tomorrow?" Not "did you like it" — that gets a polite answer. This gets the actual blocker, which in the Meridian case is likely to be some version of "I still have to key it into CBS after", the exact thing already flagged in discovery.
5. **Do not explain or defend.** If they misread the screen, that is a design finding about the screen, not a training gap in the user.

## What to do when it breaks live

It will, eventually. The response that keeps the room is different from the instinct.

- **Do not debug in front of the sponsor.** Say what happened in one sentence — "this is pulling from a stale cache, give me thirty seconds" — and either fix it fast or move to the next case while it resolves in the background.
- **Have a second real case ready.** A demo with only one path through it has no fallback when that path fails. Prepare two.
- **Narrate the failure as information, not apology.** "This is exactly the kind of gap five days is supposed to find" is true, and said with confidence it reads as competence rather than as a setback.
- **Never fake it.** A demo that quietly falls back to a hardcoded answer and gets caught later costs more trust than a demo that visibly breaks and gets fixed in front of the room.

## The order matters

Run the end-user demo before the sponsor's, when you can arrange it. Whatever friction Sunita finds in her five minutes is friction you can fix or at least name before the sponsor sees it. A sponsor who watches a smooth demo and only later hears from the branch officer that it is unusable has learned that your demos cannot be trusted. A sponsor who hears "we found this in the end-user pass and here's the fix" has learned the opposite.
