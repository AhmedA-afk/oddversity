---
title: "The evidence portfolio: every module leaves an artifact"
phase: orientation
module: how-this-path-works
kind: lesson
summary: "No course can manufacture production experience. This path is designed so that every module leaves behind something checkable instead: a deployed service, an eval report, an SOW, a decision memo, an incident write-up, a first-person case study, or a recorded walkthrough. Here is what each one is, and why a claim without one of these behind it does not count."
duration: 10 min
updated: "2026-09-02"
outcomes:
  - Name the seven artifact types this path produces and match each to the kind of module that generates it.
  - Explain, in one sentence, why "I did think about it" scores zero on every rubric in this path.
  - Start your own portfolio index today, before you have anything to put in it.
artifact: An index file in your journal or repository, one line per artifact type, that you will fill in as each one is produced over the next nine months.
sources:
  - https://www.theforwarddeployed.io/
  - https://fde.directory/articles/forward-deployed-engineer-openai/
  - https://vinvashishta.substack.com/p/what-skills-do-you-need-to-get-a
  - https://www.iit.edu/blog/forward-deployed-engineer
  - https://deepengineering.net/p/forward-deployed-engineer-jobs-hiring
  - https://www.tryexponent.com/experiences/eleven-labs-solutions-architect-interview-ce0689
---

An independent site built specifically for people trying to break into this role states its own limit plainly: it "cannot manufacture production evidence for you." Nobody can. There is no simulation that produces the thing a hiring manager actually wants, which is proof you have shipped inside a system you did not build, under a deadline you did not set, and survived contact with a customer's actual data.

What a well-built path can do is make sure that every week you spend produces something that stands in for that proof, checkable by someone other than you. That is this path's whole design premise, stated once here so you can hold every module to it: **if a module does not leave an artifact, it should not exist.**

## The seven artifact types

**Deployed service.** Something running somewhere that is not your laptop — a container behind a VPC, a service on a customer-managed Kubernetes cluster, an install on an air-gapped VM. The IIT career blog's line on what actually separates candidates: "the highest-signal proof is a deployed, well-documented portfolio project with explicit trade-offs and, for AI systems, rigorous evaluations." Every lab in the Foundations and Deploy phases and every capstone in Phase 09 produces one of these.

**Eval report.** A labelled set, a scorer, a baseline, and a table showing where your system beat the baseline and where it did not, including at least one number that got worse. This is the artifact every capstone treats as a hard gate, and it is the one candidates most often skip, because it is tedious and because a system that "seems to work" feels like enough until someone asks you to prove it.

**SOW (statement of work).** A written scope: what you will build, what you will not, the success criteria both sides agreed to before work started, and what happens if the criteria are not met. Phase 06 teaches you to write one; the bootcamps in Phase 09 are where you actually write one against a live-feeling, ambiguous ask instead of a clean specification.

**Decision memo.** A short, structured argument for a call you made under ambiguity: what you built for this customer specifically, what any three customers would need, what should become a configuration option rather than code, and a recommendation with a cost attached. Every capstone ends with one of these. It is the artifact that proves you can do the thing that actually separates an FDE from a contractor — extracting the reusable pattern, not just shipping the one-off.

**Incident write-up.** What broke, how you found it, what you changed, and what would have caught it sooner. Phase 02's reliability module gives you the template; you will use it for real the first time something you built in Phase 09 breaks during a bootcamp or a capstone, and the write-up from that real failure is worth more than a practice one.

**First-person case study.** A short, honest account of one deployment, written as "I," never "we," with your own numbers from your own harness, including the run that went worse. Both the recruiting-guide research behind this path and a real, documented interview account converge on the same point: a candidate who was pushed hard in an ElevenLabs solutions-architect interview specifically for saying "we" instead of "I" is the concrete version of a pattern that shows up across the research on what gets candidates rejected. Phase 08 teaches the form directly; the content comes from what Phase 09 produced.

**Recorded walkthrough.** Five to eight minutes, screen and voice, unedited, showing a failing case first and then the fix, with you narrating the decisions out loud. This is not an invented requirement: OpenAI's own Forward Deployed Engineer loop asks for exactly this as part of its take-home, and the live round that follows it is you defending those same decisions to a person. Every capstone requires one; the take-home lesson in Phase 08 is where you learn to make it good instead of just present.

## How the path produces them

You do not have to remember to make these happen. The path is sequenced so they fall out of doing the work as assigned.

| Artifact | Where it mainly comes from |
|---|---|
| Deployed service | Foundations labs, the Deploy phase, every capstone |
| Eval report | Every capstone's mandatory eval-before-build gate |
| SOW | Phase 06's scoping module, rehearsed in the bootcamps |
| Decision memo | The end of every capstone, and Phase 07's dedicated module |
| Incident write-up | Phase 02's reliability module, used for real when something breaks later |
| First-person case study | Written in Phase 08, built from material Phase 09 produced |
| Recorded walkthrough | Every capstone; practised properly in Phase 08 |

Notice that Phase 09, the practice phase, is where most of these actually get generated. That is not an accident. Orientation and Foundations teach you the moves; the practice phase, running from week 8 onward, is where the moves turn into dated files in a repository.

## What counts, and what does not

The bar is the same one Capstone grading uses, stated here so it applies everywhere: if you cannot name the file, the commit, or the timestamp that backs a claim, the claim does not count. Deep Engineering's 30/90-day frame, aimed at exactly this transition, puts it as a spec: a baseline and a success metric inside 30 days, a shipped improvement "with evaluation, observability, and rollback" after that, and field lessons converted into a reusable asset by day 90. That is a portfolio spec disguised as career advice, and it is the same shape as this page.

One useful discipline, coined by a research summary on what separates a strong AI-engineer application from a weak one: build something with real evals, ship it into a real environment, and treat the write-up as a case study rather than a resume line, because "one real system on the API with evals" is repeatedly what beats a longer list of credentials.

## Start now

Create the index today — one line per artifact type, empty for now. Every capstone, bootcamp, and lab in this path tells you exactly what to drop into that line and where. By week 32 the index should be full, and by week 36 you will be pulling from it directly for the take-home, the case study, and the portfolio review that Phase 08 puts you through before your first real loop.
