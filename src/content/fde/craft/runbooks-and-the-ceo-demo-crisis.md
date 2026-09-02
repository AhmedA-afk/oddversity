---
title: Runbooks, and staying calm during the CEO demo crisis
phase: craft
module: reliability-and-observability
kind: lesson
summary: A runbook is not documentation you write for compliance. It is the thing that lets you, or someone who has never touched your service, fix a live failure in the ten minutes before a demo starts, without panicking.
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Write a runbook entry that a stranger can execute under pressure, not one that only makes sense to the person who wrote it.
  - Separate the fix from the fallback, and build a fallback into any demo that depends on a live system.
  - Describe, calmly and specifically, what you would say to a customer's leadership if the system failed mid-demo.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
---

Vinoo Ganesh names staying calm under pressure as one of the traits he trains into engineers before Palantir sends them into the field, and tells what he calls the "CEO demo crisis" as the story that makes the point: the moments that test an FDE most are not the two-week sprint, they are the ten minutes where a system that has worked for a month breaks in front of the one audience the whole engagement's future depends on.

That framing is worth taking seriously even before you know the specifics of any one story, because the structural fact behind it is true on every engagement: the highest-stakes failure and the highest-visibility audience tend to arrive at the same time. A pilot that has run quietly for weeks gets its first real scrutiny the day someone senior finally watches it. This lesson covers the two things that determine what happens next: whether a runbook exists, and whether the person following it can stay calm enough to use it.

## What a runbook actually needs

A runbook is not a wiki page describing the architecture. It is a short, specific sequence that gets someone from "something is wrong" to "it is fixed or safely routed around," written for a reader who is stressed, has ten minutes, and may not be you.

A usable runbook entry has four parts, in this order:

1. **Symptom.** What the person actually sees: an error message, a blank screen, a specific alert name. Written as what appears, not as what you believe is happening underneath.
2. **Check.** One or two commands or dashboard views that confirm which failure this actually is, because the same symptom often has more than one cause.
3. **Fix.** The exact steps, copy-pasteable, not "restart the service" but the actual command, including where to run it and what credentials it needs.
4. **Escalation.** Who to contact and how, if the fix does not work within a stated time limit, and what to tell them in the first sentence.

```markdown
## Symptom: /triage returns 503, "upstream_unavailable"

**Check:** `curl -s https://internal.example.com/rules-service/healthz`
  - If this times out, the rules service is down. Continue below.
  - If this returns 200, the problem is elsewhere; see "Symptom: /triage returns 500" instead.

**Fix:**
  1. `ssh ops@customer-vm-3`
  2. `sudo systemctl restart triage-rules`
  3. Re-run the check above. Expect 200 within 30 seconds.

**Escalation:** If step 3 does not return 200 within 3 minutes, message Ahmed on the
customer's Slack `#triage-pilot` channel and say: "Rules service down, restart didn't
recover it, investigating, ETA unknown." Do not wait to have a fix before saying so.
```

Notice the escalation script includes exact words to say. Under pressure, composing an honest, non-alarming status update is harder than it sounds, and having it pre-written removes one more decision from a moment that already has too many.

## The fix and the fallback are different things

A runbook entry describes how to fix the underlying problem. A demo fallback describes what happens on stage while the fix is in progress, and the two should never be the same plan.

If a demo depends on a live call to a system that has ever, even once, been flaky, build a fallback path into the demo itself before the day arrives: a cached response for the specific scenario you are about to show, a pre-recorded screen capture of the exact flow as a backup slide, or a second environment that does not share the live system's failure mode. The fallback is not dishonest as long as you are transparent that it exists and why; a wealth management pilot that has been running for six weeks in production does not need to risk that credibility on a live network connection during the one meeting that decides whether it gets renewed.

## A worked scenario

The following is an illustrative, fictional example built for this lesson, not an account of any real engagement.

You are demoing a claims-triage service to a hospital chain's leadership, ten minutes in, when the service starts returning 500s. The room includes the CFO, who approved the pilot budget and has said nothing yet about renewing it.

The wrong response is to keep clicking, hoping it resolves, while the room watches your face. The composed response looks like this: you say, out loud, in plain language, "we've hit an issue with a live dependency, give me thirty seconds to check the runbook rather than guess." You open the runbook entry for the symptom on screen, run the check, and narrate what it tells you. If the fix is fast, you fix it live and the room sees exactly the debugging discipline covered earlier in this phase, which is not a bad thing for a room full of decision-makers to watch. If it is not fast within your stated time limit, you switch to the fallback you built in advance, say so plainly ("we'll switch to the recorded run of this exact scenario from this morning, and I'll follow up today with the root cause"), and keep the meeting moving.

What makes this work is entirely preparation, not improvisation: the runbook existed, the fallback existed, and the decision about how long to try the live fix before switching was made calmly beforehand, not under the room's gaze.

## Why interviewers ask about this

Composure under a visible failure is difficult to fake and easy to test for, which is why it shows up in FDE interview loops as a behavioural question, not just a technical one. The honest answer is rarely "nothing ever went wrong." It is a specific story about a real failure, what you did in the first sixty seconds, and what changed afterward so the same failure could not repeat. If you cannot yet tell that story from your own experience, build one: the labs in this phase are designed to eventually produce a failure worth having a real answer for.

## Do this now

Write one runbook entry, in the four-part format above, for the most likely failure in a service you have already built in this phase. Then write the exact sentence you would say to a room if that failure happened mid-demo. Keep both in the same file as the service's README, not in a separate document nobody opens under pressure.
