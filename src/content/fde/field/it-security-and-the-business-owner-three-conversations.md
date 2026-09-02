---
title: "IT, security, and the business owner: three conversations"
phase: field
module: stakeholders-and-saying-no
kind: lesson
summary: The business owner wants the outcome, IT wants nothing to break, and security wants a documented lawful basis before either of them gets it. Treating these as one stakeholder conversation is the most common way an engagement stalls in week two.
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Run three separate conversations with three different goals, instead of one meeting that satisfies nobody.
  - Ask the questions that get a security or data-protection blocker to become a source of information rather than an obstacle.
  - Recognise when a business owner's request and IT's constraint are actually compatible, once translated.
artifact: Three one-page conversation briefs for one engagement — business owner, IT/infrastructure, and security or data protection — each with the specific question you have not yet gotten an answer to.
sources:
  - https://conikeec.substack.com/p/the-forward-deployed-engineer-playbook
  - https://vibeengines.com/roadmap/forward-deployed-engineer
  - https://job-boards.greenhouse.io/anthropic/jobs/5302966008
---

A common early mistake is running one "stakeholder alignment" meeting with the business owner, IT, and security in the same room, hoping to settle everything at once. It rarely works, because the three have different vocabularies, different things they are measured on, and — this is the part that causes the real damage — different things they are afraid of. Put them in one room before you understand each position separately and the loudest fear in the room, usually security's, ends up shaping a decision that should have been the business owner's.

Run three conversations. Combine them only once you know what each side actually needs.

## Conversation one: the business owner

**Their goal:** the outcome, on their timeline, at an acceptable cost to their team's attention.

**What they are afraid of, and rarely say:** that this becomes another project their team has to babysit without seeing the benefit, or that IT will slow it down for reasons that have nothing to do with the business problem.

**What to ask:**

- "If this took twice as long because of a security review, would that change whether it's worth doing?" — this tells you their real time pressure, separate from the one stated in the kickoff.
- "Has IT slowed down something like this before? What happened?" — a business owner who has been burned by IT delay will tell you exactly what to avoid repeating.
- "What would you need to be able to tell your own boss if this stalls for a month?" — this surfaces what they are actually accountable for, which is often narrower than the full project.

**What not to do:** promise a timeline that depends on IT or security approvals you have not yet had. A business owner who hears "two weeks" and then watches security take five will remember the two weeks, not the reason for the delay.

## Conversation two: IT or infrastructure

**Their goal:** nothing they own breaks, and they are not the one explaining an incident to their own management later.

**What they are afraid of, and rarely say:** being asked to support a system they did not choose, did not architect, and will inherit operational responsibility for once the vendor leaves.

**What to ask:**

- "If this goes wrong at 2am, whose phone rings?" — the honest answer to this question determines how much resistance you will get, and asking it directly usually earns you credit for having asked.
- "What's the smallest access you could give me that would let me start?" — offering to start smaller than what you actually want is often what unblocks the first meeting.
- "What has a vendor done before that made this harder for your team?" — nearly every IT team has a story. Getting it early tells you exactly what not to repeat.

**What not to do:** treat a slow IT response as obstruction by default. In the Meridian case from [Finding the champion and the blocker](/roles/forward-deployed-engineer/field/finding-the-champion-and-the-blocker), the honest constraint — file-drop-only write-back, no inbound API — was real, discoverable in week one, and became a design input rather than a fight once asked about directly.

## Conversation three: security or data protection

**Their goal:** a documented, defensible answer to "why was this allowed" if anyone ever asks, including a regulator.

**What they are afraid of, and rarely say:** being the one who signed off on the vendor that got it wrong, especially if a previous vendor already burned them.

**What to ask, precisely, not generally:**

- "Where does the data actually run, and does any of it leave [region]?"
- "What happens to the data after the pilot ends, specifically — deleted, retained, anonymised, and by when?"
- "Could an individual be identified from the output, even indirectly?"

This is the pattern used with Katrin Sørensen, the Halden Logistics data protection officer, in [the discovery lab](/roles/forward-deployed-engineer/field/discovery-lab-interview-the-simulated-customer): she becomes a source of critical information, including a requirement (a works council) the interviewer did not know existed, only once the interviewer is specific and honest about what they do not yet know. A vague answer gets you a "I cannot sign off, put it in writing." A specific, honestly-uncertain answer gets you the information that saves the engagement weeks later.

**What not to do:** claim more than you know. "We anonymise it" said without being able to explain the method is the exact sentence that triggered Katrin's worst prior experience with a previous vendor — one that said data stayed in-region and did not. Answer "I don't know yet, here's how I'll find out" instead, every time.

## Combining them, once you know each position

Bring the three together only after each conversation has happened separately, and frame the combined meeting around what is now compatible, not what is still contested.

```text
COMBINED BRIEF (fill after all three conversations)

Business owner wants:            [outcome, timeline pressure, what they are accountable for]
IT constraint:                   [the real one, not the assumed one]
Security requirement:            [the specific document or answer needed to sign off]

Where these are ALREADY compatible:
  [e.g. "File-drop write-back satisfies IT's no-inbound-API rule and
  doesn't change the business owner's timeline, because the write-back
  was never on the critical path."]

Where these genuinely conflict, and who decides:
  [name the tradeoff and the person with authority to make it —
  usually the business owner, once security's requirement is a fixed
  cost rather than an open question]
```

The combined meeting should feel like reporting back, not negotiating live. Negotiating live, with all three in the room and none of them briefed, is how a security concern that could have been a documented answer becomes a stalled project instead.
