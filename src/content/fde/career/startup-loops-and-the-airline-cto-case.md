---
title: Startup loops, and the "you are the CTO of an airline" case
phase: career
module: the-loops
kind: lesson
summary: Startup FDE loops compress the same signal into fewer rounds, an ownership-testing recruiter screen, a fast online assessment, live coding, and a case-study round played out as a live conversation with a stakeholder, then either an offer or, in one documented case, an offer rescinded over location.
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Walk through the ElevenLabs FDE loop stage by stage, including the airline case-study prompt and how it was answered well.
  - Name what an FDE case-study round is actually testing versus what it looks like it is testing.
  - Explain why "40% pass rate" and similar circulating numbers should not change how you prepare.
artifact: A written answer to the airline case-study prompt in your own words, timed to ten minutes, kept in your prep notes.
sources:
  - https://www.tryexponent.com/experiences/eleven-labs-solutions-architect-interview-ce0689
  - https://www.tryexponent.com/blog/forward-deployed-engineer-interview-the-definitive-2026-guide-fde
  - https://www.glassdoor.com/Interview/Scale-Forward-Deployed-Engineer-Interview-Questions-EI_IE1656849.0,5_KO6,31.htm
  - https://www.teamblind.com/post/scale-ai-constrained-optimization-case-study-1pm1puks
  - https://getperspective.ai/blog/forward-deployed-engineer-interview-questions-2026-prep-guide
---

Startups do not run five-week loops with a pool of possible onsite rounds. They run three to five stages, fast, and they lean hard on one round that plays out like a real customer conversation rather than a whiteboard problem. The best documented account of this shape is a first-person ElevenLabs FDE loop, hosted by Exponent, and it is worth reading closely because it shows both what a strong answer sounds like and how a strong loop can still end badly.

## The ElevenLabs loop, stage by stage

1. **Recruiter screen.** The candidate reports the screen pressed hard on individual ownership: "be specific about what you built yourself." This is not a throwaway courtesy question at a startup FDE loop; it is the first filter.
2. **Timed online assessment.** Three questions, about an hour, which the candidate describes as "more like a sanity check" than a difficulty gate.
3. **Live coding, in a shared Google Doc, in Python.** The prompt: design a file-system permission model with user and group inheritance. No IDE, no autocomplete, reasoning visible the whole time.
4. **The case study.** Framed as a live scenario: "Imagine I'm the CTO of an airline. When planes break or schedules change, our operators reschedule everything manually."
5. **A CTO round.**

## What the airline case is actually testing

Read the prompt again. It does not ask you to design an AI scheduling system. It describes a customer's pain in the customer's language and stops. The candidate's own takeaway, in hindsight, is the whole lesson: "don't jump straight to some shiny AI answer. Ask how the customer solves it today." A strong 45-minute decomposition of that prompt starts by establishing what "reschedule everything manually" concretely means: who does it, on what system, how often, how they decide priority when two flights conflict for the same aircraft, and what "wrong" currently costs them, before any tool or model gets mentioned. An interviewer playing the CTO in this round is grading whether you ask that question first, not whether you can name the right agent framework.

This is the same instinct the FDE-DIGEST names as the single most common industry-wide rejection pattern: solving before scoping. A startup case-study round compresses the Decomposition round you would see at Palantir or Databricks into a live, adversarial, single conversation, and it rewards the same behaviour.

Notice, too, what the round is not testing. It is not testing whether you can name the current state of the art in scheduling optimisation or agent orchestration. A candidate who opens with "we'd use a multi-agent system with a constraint solver" before asking a single question about how dispatchers currently make the call has skipped the only part of the round that separates a real FDE answer from a generic AI-engineering answer. The airline's operators are the domain experts in this scenario, not you, and the first job in the room is finding out what they actually know that you do not.

## How the ElevenLabs loop actually ended

The candidate received a verbal yes, then had the offer rescinded. Their own account of why: "they decided they only want to hire in SF... they saw some immigration risks." The candidate had been willing to relocate. This is covered in full, with what to do about it, in the next module's page on visa and relocation; the short version here is that a strong performance across every round did not protect against a location and visa decision made late in the process. The candidate's own advice, in hindsight, was to "force clarity on" location and visa status early rather than assuming it will sort itself out once an offer is verbally extended.

## Other startups run the same shape

Exponent's broader guide states that Databricks, Scale AI, ElevenLabs, Ramp, and Sierra "all run variations with a case study and a client-simulation round," which means the ElevenLabs account is a reasonable template for what to expect elsewhere, not a one-off.

Scale AI's process, per a Glassdoor summary, runs three to four rounds across six to seven interviews, opening with a 30-minute recruiter call and a 45-minute engineer call that includes live coding, and is described there as "not too difficult technically, but you need to be adaptable and consistent." A Blind thread from December 2023 (for a non-SDE Scale role, but instructive for the format) describes a "Constrained Optimization Case Study" round, billed by the recruiter as assessing "thought process, problem solving, analytical thinking, and scaling solutions" against a general operational problem, the same shape as the airline prompt: a real-sounding operational mess with no obviously correct answer.

## The "40% pass rate" number, and why to ignore it

Several interview-prep sites, including at least one guide aimed specifically at FDE candidates, quote a roughly 40% pass rate for the case-study round, sometimes paired with a claim that it carries about 30% of the total weight. None of these sites shows where the number comes from, and Exponent's own detailed guide, which does cite Glassdoor data elsewhere, contains no pass-rate statistics at all for this round. Treat "40%" as folklore circulating among prep-guide writers, not as a data point that should change your preparation. The useful preparation is not calibrating against a rumoured odds ratio; it is being able to ask "how do they do it today" before you say anything else, in under a minute, under pressure, out loud.

Prepare for one of these rounds the same way you prepare for a decomposition drill in this path's practice phase: read the one-paragraph prompt, set a short timer, and force yourself to spend the first third of it entirely on questions, out loud, before you sketch a single system. If you find yourself reaching for an architecture diagram before you have named who does the work today and what it costs them when it goes wrong, stop and go back to questions. That discipline, not familiarity with any particular AI stack, is what a case-study round like the airline one is actually built to surface.
