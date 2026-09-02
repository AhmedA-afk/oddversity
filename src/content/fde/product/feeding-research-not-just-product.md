---
title: Feeding research, not just product
phase: product
module: the-feedback-loop-in-practice
kind: lesson
summary: Some field failures are application bugs and some are model behaviour. The second kind is worth more, travels differently, and has to arrive as labelled data rather than an opinion. Here is how to tell them apart and how to package the second kind.
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Classify a field failure as application, prompt, retrieval, or model behaviour before you escalate it.
  - Package a model-behaviour failure as a labelled, reproducible set a researcher can score against.
  - Explain, with public examples, how field work has changed a shipped API or framework.
artifact: A labelled failure set of at least 20 cases from your own project, with inputs, expected outputs, observed outputs, and a one-line hypothesis per case.
sources:
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
  - https://openai.com/careers/forward-deployed-engineer-(fde)-sf-san-francisco/
  - https://newsletter.eng-leadership.com/p/inside-openais-forward-deployed-engineer
  - https://newsletter.pragmaticengineer.com/p/forward-deployed-engineers
  - https://www.theforwarddeployed.io/engagements/john-deere
  - https://finance.biggo.com/podcast/a5f316b781abb2dc
  - https://job-boards.greenhouse.io/anthropic/jobs/5302966008
---

Most of what you send home is product feedback: a missing setting, an integration that assumes an identity provider nobody in this market uses, a screen that is wrong for a branch office. Some of it is not. Some of it is the model doing something the model should not do, and that has a different destination.

OpenAI's Forward Deployed Engineer posting names both directions: share field feedback that helps Research *and* Product understand where the models succeed. Anthropic's posting asks FDEs to codify repeatable deployment patterns and contribute insights back to Product and Engineering. If you route everything to product, the research signal is lost, because a product team cannot fix a model and will correctly close your ticket as "won't fix".

## First, classify the failure

Before it goes anywhere, take a failure through four questions in order. Stop at the first yes.

1. **Is it our code?** Wrong field mapped, timezone bug, retry that eats the error, cache serving yesterday's answer. Application bug. Fix it yourself, note it, move on.
2. **Is it retrieval?** The right passage was never in the context. This is nearly always your pipeline: chunking, permissions filtering, an embedding model that does not know the customer's vocabulary, a document that never got indexed because it was a scanned image. Retrieval bug. Yours.
3. **Is it the prompt or the tool surface?** The right context was present, the instruction was ambiguous, the tool schema allowed a nonsense call. Yours again, and the cheapest to test: change one thing, re-run the set.
4. **Is it the model?** Context correct, instruction unambiguous, tools well-specified, and the behaviour is still wrong, consistently, across rephrasings, at low temperature. Now you have something for research.

Being disciplined about this order is most of the value. An FDE who forwards every disappointing output as "the model can't do tables" burns the channel. An FDE who has already ruled out the first three levels gets read.

## What research can actually use

An opinion is not usable. A set is. The unit that travels is a labelled collection of cases, each with the input, the expected output, the observed output, and a hypothesis.

The public case studies show the shape. In the European semiconductor debug-triage engagement described in Colin Jarvis's talk, the eval material was labelled sets of expert action sequences, roughly twenty debugging actions captured from engineers who actually do the work. That is a research artifact, not a bug report: it encodes what correct looks like in a domain nobody at the vendor understands.

A minimal usable format:

```jsonl
{"id":"inv-011","domain":"gst-invoice-extraction","input_ref":"s3://.../inv-011.pdf","expected":{"igst":18000,"cgst":0,"sgst":0},"observed":{"igst":0,"cgst":18000,"sgst":0},"hypothesis":"header wrap splits the tax table; model binds the value to the visually nearest header","repro":"temp=0, prompt v7, 5/5 runs","label_source":"customer tax lead, 2026-08-12"}
```

Four things make this worth a researcher's time.

- **It reproduces.** State the temperature, the prompt version, and how many of how many runs.
- **It is labelled by someone who knows.** `label_source` names the human who said what correct is. In a regulated setting that person's name is also what makes the label defensible later.
- **It is a set, not a case.** Twenty cases with the same hypothesis is a phenomenon. One case is an anecdote.
- **It carries a hypothesis you are willing to be wrong about.** Researchers will disagree with your explanation and use your data anyway. That is a good outcome.

## Getting the data out of the building

The hard part is usually not analysis. It is that the failing inputs are the customer's confidential documents and you cannot take them home.

Plan for this before you need it. Three approaches, in order of preference:

1. **Synthesise a matched case.** Reproduce the failure on a document you construct with the same structural property. If the failure is caused by a wrapped table header, you do not need their invoice; you need a wrapped table header. This is the version that ships without a legal conversation.
2. **Redact in place.** Keep the structure, replace the entities. Works for most extraction and routing failures. Verify the failure still reproduces after redaction; if it does not, the entity was the cause and you have learned something.
3. **Ask, properly.** Some customers will approve sharing a small set under an existing data-processing agreement, especially if the fix benefits them. Ask through whoever owns the contract, not in a hallway, and write down what was approved.

Under India's DPDP Act 2023, and equally under GDPR, "I only sent twenty examples" is not a defence. Decide the route on day one of the engagement and record it in the runbook.

## What this loop has produced in public

Three examples you can cite without overclaiming.

**Klarna and T-Mobile, customer-service policy scaling.** Hand-writing prompts for 400-plus policies did not scale, so the field work produced parameterised instructions with an eval set per intent, and an internal framework called Swarm. Swarm was open-sourced, validated at T-Mobile at higher complexity, and later became OpenAI's Agents SDK. Field constraint to internal tool to shipped product is the whole loop in one line.

**John Deere, voice guidance.** OpenAI's account of the engagement includes an FDE travelling to Iowa, building voice-quality evals, scaling data labelling, and states that the work improved the Realtime API for every customer. Be careful with the numbers attached to this case: the widely repeated "70% reduction in chemical usage" is OpenAI's own marketing claim, and the See and Spray system it refers to is Blue River and Deere's own computer-vision product, with independent university trials reporting a different range. Cite the API improvement, which is a statement about the vendor's own product; do not cite the 70% as a measured outcome of the AI deployment.

**Cognition.** Its deployed-engineering lead describes the team as the source of the highest-fidelity evaluation set the company has, because it comes from real customer codebases. That is a research contribution that never looks like one on a roadmap.

## How to send it

Short cover note, then the data. Not a deck.

```markdown
Subject: 22 labelled failures — tax-field binding on wrapped table headers

What: extraction binds a value to the visually nearest header when a
tax-table header wraps to two lines. 22 cases, 5/5 reproduction at
temp 0 on prompt v7. Labels from the customer's tax lead.

Ruled out: our field mapping (unit tests attached), retrieval (single
document, full page in context), prompt (tested 4 rewordings, v7 is
the best of them; all 4 fail the same way).

Attached: failures.jsonl (22), synthetic-repro.pdf (5 constructed
documents that reproduce without customer data), prompts-v4-v7.md.

Ask: is this a known layout-binding behaviour, and is there a
recommended mitigation we should ship rather than a workaround we
invent?
```

That last question matters. You are not filing a defect; you are asking whether the field should work around it or wait. Either answer lets you plan.

## The habit

Every capstone in this path ends with an eval set. Keep the failures out of it in a separate file rather than deleting them once you fix the prompt. By the end of the path you will have a few hundred labelled cases across domains, which is both a genuinely useful artifact and, in an interview, the most concrete possible evidence that you understand where an application ends and a model begins.
