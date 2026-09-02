---
title: Finding the champion and the blocker
phase: field
module: stakeholders-and-saying-no
kind: lesson
summary: Every engagement has someone who will fight for it when you are not in the room and someone who can stop it without ever saying no directly. Finding both in week one, and treating them differently, is a skill no engineering course teaches.
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Distinguish a sponsor from a champion, and explain why the difference matters.
  - Name three behavioural signals that identify a champion inside the first week.
  - Identify the three common blocker types and the opening move for each.
artifact: A stakeholder map for one engagement with the champion and the blocker named, the signal that identified each, and your first move for the blocker.
sources:
  - https://conikeec.substack.com/p/the-forward-deployed-engineer-playbook
  - https://vibeengines.com/roadmap/forward-deployed-engineer
  - https://job-boards.greenhouse.io/anthropic/jobs/5302966008
---

The stakeholder table from [The decomposition method](/roles/forward-deployed-engineer/field/the-decomposition-method) tells you who wants what and who can veto. It does not tell you who will defend the project in a room you are not in, or who can quietly starve it without ever saying no. Those two people rarely have "champion" or "blocker" in their job title, and finding them is treated as a distinct skill in accounts of what makes the role work, described as relationship formation that happens in parallel with, not after, the technical work.

Anthropic's own posting for the role names this directly: the ability to "navigate ambiguity present in complex organizations" is listed alongside the technical bar, not below it.

## The champion is not the sponsor

The sponsor signed the SOW and controls the budget. The champion is the person who will say "I've seen this work, let's keep going" in a meeting you were not invited to. They are frequently not the same person, and confusing them is a common first-week mistake.

**Signals that someone is becoming a champion, in roughly the order they appear:**

1. They ask a question that assumes the project continues. "When this is live, will it also cover the second branch?" is a bigger signal than any compliment.
2. They correct you in front of others, not just privately. Correcting you privately is politeness. Correcting you in a meeting means they have enough stake in the outcome to want it right.
3. They bring someone else to the next session unprompted. A branch officer who invites a colleague to watch the next demo has decided this is worth their colleague's time.
4. They use the tool, or ask to, before you have asked them to. Early, unrequested use is the strongest signal there is.
5. They defend the project to someone else, and you hear about it secondhand. This is the one you cannot manufacture; you only find out it happened.

Do not wait for all five. One or two by the end of week one is enough to invest specifically in that relationship: check in with them more often than the SOW requires, and make sure they see progress before the sponsor does, not after.

## The champion is often not senior

The most common mistake is looking for the champion among the people in the room with titles. In the Meridian case, the strongest champion candidate is a branch officer, not the Head of Branch Operations who sponsored the SOW. A sponsor wants the project to succeed because they own it. A champion wants it to succeed because it removes a real pain from their day, and that motivation survives budget cycles and management changes in a way sponsorship does not.

## Blockers, and the three kinds

A blocker is not the person who says no in the meeting. Those are rare and, in a strange way, easy — you know exactly what you are dealing with. The blocker who matters is the one who can stop the project without ever appearing to.

| Type | How they block | What they actually want | Opening move |
|---|---|---|---|
| The security or IT blocker | Slow-walks access requests, cites a policy without a document, asks for "one more review" | Not to be blamed if something goes wrong on their system | Bring them in during discovery, not after a design is fixed. Ask what has gone wrong before, specifically. |
| The threatened-process owner | Agrees in meetings, then the work "doesn't get prioritised" by their team | To not have their existing process, and their competence, implicitly criticised | Frame the change as extending what they already own, not replacing it. Credit their current process for what it does well. |
| The quiet non-adopter | Says yes to everything, keeps using the old workaround | To not be blamed for a tool that does not actually fit their day | Watch usage, not sentiment. Ask what would make them stop using their spreadsheet, specifically — this is the question from [the discovery lab](/roles/forward-deployed-engineer/field/discovery-lab-interview-the-simulated-customer) that most reliably finds this person. |

The IT-and-security type is the one most engineers recognise, because it looks like a technical obstacle. It is very rarely purely technical. [IT, security, and the business owner: three conversations](/roles/forward-deployed-engineer/field/it-security-and-the-business-owner-three-conversations) covers that one at length. The other two are political, not technical, and they are the ones a purely engineering background does not prepare you to see.

## Do not treat a blocker as an obstacle to route around

The instinct with a blocker is to escalate past them to the sponsor. This works exactly once and it makes every future blocker in every future engagement harder, because word travels. The better move, in most cases, is to find out what the blocker actually needs to say yes — a written data-processing agreement, a named point of contact for incidents, a guarantee their team is consulted before the next phase — and get it for them. A blocker who is given what they asked for becomes, in a meaningful number of cases, the person who tells the next customer this vendor is trustworthy.

## The map to keep

Update this alongside your decomposition stakeholder table, not instead of it.

```text
CHAMPION: [name, role]
  Signal that identified them:
  How I am investing in this relationship:

BLOCKER: [name, role]
  Type (IT/security, threatened process owner, quiet non-adopter):
  What they actually need to say yes:
  My first move:
```

Fill it by the end of week one. If you cannot name a champion by then, that is itself a finding worth raising with the sponsor: an engagement with no champion is an engagement that depends entirely on you being in the room, indefinitely.
