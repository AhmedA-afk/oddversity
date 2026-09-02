---
title: Restraint, now that building is cheap
phase: craft
module: calibration-and-restraint
kind: lesson
summary: When an AI coding tool can produce the configurable version almost as fast as the simple one, the calibration call from the previous lesson gets harder, not easier, and restraint becomes the skill that decides whether you ship the right thing or just the fast thing.
duration: 11 min
updated: "2026-09-02"
outcomes:
  - Explain why cheaper code generation makes over-building more likely, not less, without deliberate restraint.
  - Recognise the specific temptation an AI coding assistant introduces at the moment of a calibration decision.
  - Apply a restraint check before accepting a generated solution that is bigger than the request required.
artifact: A short journal entry logging one moment this week where an AI tool offered you the bigger version of something, what you actually needed, and which one you shipped.
sources:
  - https://finance.biggo.com/podcast/25bf3c9c39d661d1
  - https://decagon.ai/blog/how-decagon-is-redefining-forward-deployment
---

Sunny Rekhi, who leads forward deployed engineering at Decagon, said it plainly at an AI Engineer conference talk: "the scarce skill now that AI coding is so good, the scarce skill is actually exercising restraint." That sentence is worth sitting with, because it inverts an intuition most engineers carry: that better tools make good judgement matter less. Rekhi's claim is the opposite. Better tools make judgement the whole bottleneck, because the tools themselves no longer are.

## Why cheaper building makes over-building more likely

[Script or architecture: the calibration call](/roles/forward-deployed-engineer/craft/script-or-architecture-the-calibration-call) covered the classic version of the calibration mistake: a customer asks for one thing, an engineer builds a general platform for it, because building the general version felt like the more thorough, more professional choice, even though it cost two weeks instead of an afternoon.

An AI coding assistant changes the economics of that mistake without changing whether it is still a mistake. Ask an assistant for "a script that deduplicates these records" and it will often hand back something closer to a configurable deduplication module, complete with a rules engine, a plugin interface, and a config file, because that is a more impressive and more complete-looking answer, and it cost you almost nothing in typing time to get it. The two-week cost from the original story has partly disappeared. What has not disappeared is the cost of the wrong thing existing: more surface area to test, more code a customer's team has to understand at handover, more places a bug can hide, and more time spent reviewing output you did not have to write but still have to be responsible for.

The restraint Rekhi names is not about the tool. It is about the human decision that has to happen at the exact moment the tool hands you something bigger than you asked for: do you ship what it gave you, because it works and it was free, or do you cut it down to what the request actually needed.

## The specific temptation

The moment to watch for is subtle. You ask an assistant to solve a narrow problem. It returns something broader, functioning, well-structured, even genuinely good code. Accepting it feels like getting more for free. What you are actually accepting is more to maintain, more to explain at handover, and more surface area for exactly the kind of bug that only shows up on a code path nobody asked for and nobody is testing.

This is a different failure mode from the classic over-engineering story, where the engineer chose to build big. Here, the tool defaults to big, and the engineer has to actively choose to cut it down. That is a harder discipline to maintain, because it requires deleting or rejecting something that already exists and already works, which feels wasteful in a way that never building it in the first place never does.

## A restraint check before you accept generated code

Before accepting an AI-generated solution larger than the request, ask the same two questions from the calibration lesson, applied specifically to what is in front of you right now:

1. **Does this generated version solve cases nobody has asked for yet?** If yes, cut those cases out, even though they already work, even though deleting working code feels wrong. Unused generality is not free; it is untested surface area waiting for a bug report.
2. **Would a stranger at handover understand why each part exists?** A configuration option with no current use case is a question mark at handover: "what is this for?" If the honest answer is "the assistant added it," that is not a good enough reason for it to stay.

## Restraint is not suspicion of the tool

None of this argues for writing everything by hand out of caution. The tools are genuinely good, and using them to move fast on the parts of a request that are actually well-scoped is exactly right. The discipline is narrower than "be careful with AI tools": it is noticing the specific moment where the tool's output is bigger than the request, and treating that moment as a calibration decision, not a free upgrade.

Decagon's own account of restructuring its forward deployed model describes the same instinct at a team level, not just an individual one: its Agent Development Managers rework custom engineering requests into scoped changes, and the account describes reworking a promotional policy that would once have taken a full sprint into an afternoon's work once the model of what the customer actually needed was tight enough. The tooling made the afternoon possible. Someone still had to decide the afternoon version was the right one.

## Do this now

This week, the next time an AI coding assistant hands you a solution broader than what you asked for, do not ship it as given. Write down, in one paragraph: what you asked for, what it gave you, what you cut, and why. This is a small habit, and it is the entire skill Rekhi is naming: not refusing the tool's help, but refusing to let "it already works" substitute for "this is what was actually needed."
