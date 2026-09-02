---
title: The five-day bootcamp format
phase: field
module: scoping-sows-and-bootcamps
kind: lesson
summary: A time-boxed week that takes a customer from raw data to a working demo and a go/no-go decision is the container most FDE engagements actually run in. This page gives the day-by-day structure, what each day must produce, and how to run it when you only have three days instead of five.
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Lay out a five-day bootcamp with a concrete deliverable due at the end of each day.
  - Name the one thing that must happen on Day 1 or the rest of the week is wasted.
  - Compress the format to three days without dropping the parts that make it work.
artifact: A day-by-day bootcamp plan for one of the practice-phase simulated customers, with the Day 5 demo script written out.
sources:
  - https://www.palantir.com/platforms/aip/bootcamp/
  - https://blog.pvmit.com/pvm-blog/palantir-platform-bootcamp-guide
  - https://getperspective.ai/blog/palantir-forward-deployed-engineering-playbook-anthropic-openai-copying
---

Most descriptions of Palantir's AIP bootcamps stop at "engineers embed for a week and build something". The structure underneath is more specific than that, it is documented by Palantir and by third parties who have watched the pattern repeat, and Palantir alone had reportedly run over a thousand of them by the end of 2024. It is also the shape most FDE work takes even outside Palantir: a fixed window, a real dataset, and a demo at the end that decides whether the engagement continues.

The format is not "sprint, but shorter". It is five specific days, each with one job.

## The five days

| Day | Job | What you must have by end of day |
|---|---|---|
| 0 (before the week) | Prep | Access requests filed, sample data requested, stakeholder list confirmed, decomposition run against what you know so far |
| 1 | Connect and model | Real data connected, however roughly, and the domain modelled — the entities, properties and relationships that actually exist in this business |
| 2-3 | Build | A working app or workflow against that model, iterating with users in the room, not in a spec document |
| 4-5 | Demo and decide | A live demo to the people who will use it, followed immediately by a decision: continue, change scope, or stop |

Day 0 is easy to skip and it is the day that determines whether Day 1 is real work or a stalled morning waiting for a CBS export that nobody requested until Monday. File the access request the week before. Confirm who is in the room on Day 1. Run the decomposition method cold against whatever you know already, so Day 1 starts from a plan instead of a blank page.

## Day 1: why data-and-model comes before anything that looks like a feature

The bootcamp's defining discipline is refusing to build an interface before the underlying data is connected and modelled. This is the same instinct behind the walking skeleton in [The decomposition method](/roles/forward-deployed-engineer/field/the-decomposition-method): touch every layer, including the ugliest one, before you polish any single layer. A beautiful screen over data you have not actually connected is a mockup, and everyone in the room will eventually notice.

Concretely, Day 1 output looks like:

- A real (not sample, not synthetic) extract connected, even if by hand.
- The entities named the way the business names them, not the way the database names them. If the branch calls it a "case", your model calls it a case, not a `record_id`.
- One relationship diagram, on a whiteboard or a page, that a domain expert in the room has corrected at least once. If nobody corrects it, you have not shown it to the right person yet.

## Days 2-3: build with users in the room, not a spec they signed off once

The bootcamp compresses design and build into the same room as the user because a spec written on Day 1 and built against silently for two days accumulates wrong assumptions invisibly. The fix is not more documentation, it is shorter feedback loops: show a rough version at the end of each half-day, not each day.

A practical rhythm that holds up across two days:

1. Morning: build against yesterday's corrections.
2. Midday: 15-minute check-in with whichever stakeholder is available, screen shared, no slides.
3. Afternoon: build against what that check-in surfaced.
4. End of day: write down, in one line, what changed because of today's conversation. If nothing changed, you were not really in the room.

## Days 4-5: the demo is not a status update

The demo on Day 4 or 5 is not "here is what we built". It is evidence for a decision the sponsor has to make: continue, change scope, or stop. Structure it around that.

- **Show it on the customer's own data**, ideally a case the person in the room recognises. A demo on synthetic data invites the question "does it actually work on ours", and you want that question answered before it is asked.
- **Let the end user drive, once.** A sponsor watching you click through your own tool learns less than a sponsor watching their own branch officer use it for thirty seconds and hesitate at the same step you hesitated at in testing.
- **State the decision you are asking for, out loud, before you finish.** "Based on this, I am asking for two more weeks to take this from one branch to three" is a request. "Any questions?" is not.

## Compressing to three days

Not every engagement gets five days. When you only have three, the day that survives compression is Day 1. Cutting data-and-model time to save build time is the single most common way a compressed bootcamp fails, because everything built on Days 2-3 inherits whatever was wrong in the model.

| Original | Compressed to 3 days |
|---|---|
| Day 0 prep | Unchanged — do it before Day 1 regardless of the week's length |
| Day 1: connect and model | Unchanged, non-negotiable |
| Days 2-3: build | Compressed to one day, narrower scope: fewer components, not a rushed version of the same components |
| Days 4-5: demo and decide | Compressed to the afternoon of Day 3 |

The scope cut belongs in the build days, agreed explicitly with the sponsor before the week starts, not discovered by running out of time on Day 3. "We will demo the extraction and matching, not the review queue, because three days does not fit both" is a sentence to say on Day 0, not Day 3.

## Practise this against a simulated customer

The practice phase runs this format against six fictional customers — Meridian Co-operative Bank, Arogya Hospital Group, SuryaTex Manufacturing, Northlake Wealth, Halden Logistics, and a district administration — each with a stakeholder cast and messy data of its own. [Bootcamp 02: Arogya Hospital Group](/roles/forward-deployed-engineer/practice/bootcamp-02-arogya-hospital-group) is a good first run of this format: a sponsor with a strong, wrong prior about what the problem is, which is exactly the situation Day 1's data-and-model discipline exists to correct.
