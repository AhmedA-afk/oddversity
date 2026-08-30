---
title: "Adapt prompts across modalities and languages"
track: "prompt-engineering"
status: live
summary: "Changing an input from text to image, audio, or another language changes what the system can observe, misunderstand, and omit."
duration: "3 min read"
---

## The short answer

Changing an input from text to image, audio, or another language changes what the system can observe, misunderstand, and omit. Keep the task and acceptance criteria stable, but test modality-specific quality, translation ambiguity, accessibility, and privacy instead of assuming a text prompt transfers unchanged.

## A transfer checklist

Specify what the system should inspect, what it must not infer, how uncertainty is
reported, and what output structure is shared across variants. Name whether the
input is a source of facts, a noisy signal, or an instruction.

## Four examples

### Example A: image extraction

Ask for the table rows and mark unreadable cells as `null`. A crop or low-
resolution photo should not produce invented values.

### Example B: audio support note

Transcribe, separate speakers when possible, summarize only the transcript, and
flag uncertain words. Do not treat a guessed name as verified identity.

### Example C: localization variation

A refund policy may use a date format or politeness convention that differs by
locale. Test currency, decimal separators, idioms, and whether the requested tone
still preserves the policy.

### Counterexample: translate after answering

Generating a policy answer in one language and translating it later can lose a
qualification. Prefer evaluating the final localized answer against the source
policy and a local reviewer when the decision matters.

## An illustrative story

A photo assistant performed well on clean product images but failed on crumpled
receipts. The missing behavior was not solved by a stronger instruction alone; the
team added image-quality detection and a “retake or manual entry” path.

## Two ways to see it

### Prompt view

Preserve the task, constraints, and output contract across variants.

### Inclusion view

Ask who is least represented by the modality, language, accent, device, or
accessibility need, and add a test slice for that group.

## Hands-on

Choose one text task. Create text, image, and localized fixtures—or document why a
variant is not safe to support. Compare what each system can observe, what it
guesses, and what it should abstain from.

## Checkpoint

- [ ] Inputs have modality and locale metadata.
- [ ] Unreadable, ambiguous, and sensitive inputs have explicit behavior.
- [ ] Quality is evaluated on the final user-visible output.

## What this does not solve

Prompt adaptation cannot remove bias in the underlying data or guarantee equal
performance across languages and modalities.

## Continue, go deeper, apply it

- Continue: Prompt evaluation
- Go deeper: Privacy, fairness, and accessibility
- Apply it: add a modality or locale slice to a prompt evaluation set.
