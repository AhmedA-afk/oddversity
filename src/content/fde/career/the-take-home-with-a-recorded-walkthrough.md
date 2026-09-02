---
title: The take-home with a recorded walkthrough
phase: career
module: proof-of-work
kind: lesson
summary: OpenAI's FDE loop asks for a week of elapsed time, about five hours of work, working code, a running app, and a recorded walkthrough defending your customer-facing decisions. Build one of your own capstones to that exact spec before you ever get the real assignment.
duration: 15 min
updated: "2026-09-02"
outcomes:
  - State what OpenAI's take-home requires you to submit and why the recording matters as much as the code.
  - Turn any capstone from this path into a five-hour, recorded, defensible submission.
  - Structure a ten-minute recorded walkthrough that survives a live follow-up interview.
artifact: One recorded walkthrough, ten minutes or under, of a system you already built in this path, saved alongside its repository.
sources:
  - https://www.tryexponent.com/guides/openai-forward-deployed-engineer-interview
  - https://fde.directory/articles/forward-deployed-engineer-openai/
  - https://deepengineering.net/p/forward-deployed-engineer-jobs-hiring
  - https://www.iit.edu/blog/forward-deployed-engineer
  - https://hashnode.com/blog/a-complete-2026-guide-to-the-forward-deployed-engineer
---

Practise for this now, before you need it, because the version you build under exam pressure with a recruiter's clock running is worse than the version you build once, calmly, as a rehearsal. This page walks through exactly what OpenAI's take-home asks for and gives you a spec to build against using work you have already done in this path.

## What OpenAI actually asks for

Per Exponent's guide to the loop, the take-home is roughly a week of elapsed calendar time and roughly five hours of actual work. You submit three things: working code, a running application someone else can open and use, and a recorded walkthrough. A later live session has you defend the customer-facing decisions you made, under follow-up questions, in real time. fde.directory's read on what OpenAI is actually screening for with this stage is blunt: "customer-deployment scar tissue" and "one real system on the API with evals," over credentials. The take-home is not a coding test with extra steps. It is a compressed version of the actual job: build something that works, for an implied customer, and then explain your decisions to someone who can push back.

Read the two failure modes in the previous module's page on what interviewers look for again: the engineer who freezes when questioned, and the consultant who cannot ship. The take-home plus its live defence is built to catch both in one pass. Code that works but that you cannot defend fails the same way as a defence with no working code behind it.

## What to build

Do not invent a new toy project for this. Take a capstone you have already shipped in this path, one with a domain-expert eval, a deployment story, and a rollback plan already attached, and rebuild its submission to this exact spec. If you have not reached a capstone yet, the specification below still tells you what to build toward.

The system must have, at minimum:

- **A stated customer problem, in one sentence, in the customer's language.** Not "a RAG system." "A cooperative bank's compliance team spends four hours a day manually cross-referencing KYC documents against a sanctions list."
- **A running application.** Something a stranger can start with one command and actually use, not a notebook that only runs on your machine.
- **An eval.** At minimum, a labelled set of examples and a metric that tells you whether the system is good enough, matching the eval-first practice from earlier in this path.
- **A rollback story.** What happens, concretely, if this breaks in production. Deep Engineering's frame for exactly this kind of proof-of-work names the requirement directly: a shipped improvement "with evaluation, observability, and rollback."
- **One defensible trade-off.** A decision you made that a reasonable person could disagree with, and your reason for making it anyway.

This lines up with the IIT career blog's summary of what actually signals competence for this role: "the highest-signal proof is a deployed, well-documented portfolio project with explicit trade-offs and, for AI systems, rigorous evaluations." A demo with no eval and no stated trade-off is not proof of work by this standard, however polished it looks.

## Recording the walkthrough

Ten minutes, no longer. Structure it in five parts, in this order:

1. **The problem, thirty seconds.** State the customer's problem in their language before you show a single line of code or a single screen.
2. **The architecture, ninety seconds.** A whiteboard or a diagram, walked through top to bottom: where data comes in, what happens to it, where the model or logic sits, what comes out.
3. **The live demo, three to four minutes.** Run the actual application. Show a real input and a real output. If it fails on an edge case, say so on camera rather than cutting around it; a candid "and here is where this breaks" is a stronger signal than a silently curated happy path.
4. **One hard trade-off, defended, two minutes.** Pick the decision you are least sure about, the one you flagged in your generalise-or-one-off memo if you wrote one for this project, and argue for it out loud, including the alternative you rejected and why.
5. **Known limitations and rollback, ninety seconds.** What does not work yet, and what you would do if this broke at 2 a.m. in the customer's environment. Naming your own weaknesses before a reviewer finds them is a stronger position than hoping they will not notice.

Record your screen and your voice together, not a silent screen capture with text captions. The evaluator is judging how you explain a decision under a follow-up, and voice carries that signal in a way text does not. Rahman's guide to the role describes the kind of task these loops set as, in one example, "here's a messy 1GB JSON file, parse it, clean it, and expose an API to query it," which is a reasonable proxy for how unglamorous and specific your chosen problem should feel. Do not pick something that looks impressive in the abstract. Pick something that looks like a real Tuesday on a customer site.

## Rehearsing the live defence

Before you submit anything for real, have someone play the interviewer and ask you three questions cold: why this architecture and not a simpler one, what would break first at ten times the load, and what you would change if you had another week. If you cannot answer any of the three without notes, the walkthrough is not ready, no matter how clean the recording looks.
