---
title: "Choose the right AI system"
track: "ai-literacy"
status: live
summary: "Choose the system by the shape of the task, not by the most fashionable model."
duration: "5 min read"
---

## The short answer

Choose the system by the shape of the task, not by the most fashionable model. Use rules for stable logic, predictive ML for repeated decisions with examples, retrieval for evidence lookup, generative models for reviewed transformation, and agents only when several bounded steps genuinely need coordination.

## Why this matters

“AI” names several different mechanisms. A search system, a classifier, a language
model, and an agent do not fail in the same way or require the same controls. If
you choose the wrong category, you may spend time tuning a model when the actual
problem is missing data, unclear policy, or an unnecessary sequence of actions.

The choice is also reversible. Begin with the least complex system that could
meet the acceptance test. Add model capability only when a measured limitation of
the baseline justifies the extra uncertainty and operating cost.

## How it works

Use four questions:

1. **Is the transformation explicit?** If yes, start with a rule or ordinary
   automation.
2. **Is there a repeated prediction?** If yes, ask whether you have examples,
   labels, and a decision where errors can be measured.
3. **Must the output be grounded in known material?** If yes, use search or
   retrieval and preserve source evidence.
4. **Does the output need open-ended generation or multiple tool steps?** If yes,
   consider a generative model or bounded workflow, with review and stop rules.

Do not confuse a model with the surrounding system:

| Need | Smallest candidate | What it does not guarantee |
| --- | --- | --- |
| Calculate or validate | rule/automation | handling an unanticipated meaning |
| Assign a known category | classifier | fairness or correct labels |
| Find known information | search/retrieval | that the corpus is current or permitted |
| Rewrite, summarize, or draft | generative model | truth or policy compliance |
| Coordinate bounded actions | workflow/agent | safe autonomy without authority limits |

## Worked examples and variations

### Example A: invoice processing

The input is a structured export. A rule validates fields and calculates totals.
If a vendor changes the column name, the system should fail clearly and leave the
invoice unprocessed. A language model may help extract fields from a scanned
invoice, but the extracted values still need schema validation and a human review
for high-value transactions.

### Example B: support-message routing

A rule handles known tags. A classifier handles recurring free-text categories.
A generative model can draft a reply, but it should not silently choose a refund
policy. A good system may combine all three: rule for known cases, classifier for
routing, and draft-only generation for language.

### Example C: internal knowledge question

If the answer must come from a changing internal corpus, retrieval is the key
mechanism. Generation is optional: a search result with passages may be safer
than a fluent synthesis. Add a model only if it improves comprehension while
preserving citations and permission checks.

### Boundary case: “make this decision for me”

The user may actually want a recommendation, not an autonomous action. Separate
the suggestion from the decision. The system can rank options, show evidence, and
ask the user to confirm. Do not grant write access merely because a model can name
the next step.

### Counterexample: agent by default

An agent that reads a ticket, searches a policy, drafts a response, updates a CRM,
and sends an email may look efficient. If the workflow has predictable steps, a
state machine with explicit approvals is easier to inspect and recover. Agency is
justified when the steps or choices genuinely vary—not because “agent” is a better
label.

### Production example: the compound system

A useful AI feature often has a layered design:

```text
validate input → retrieve permitted evidence → generate draft
              → check format and policy → human approval → act
```

Each layer can reject the result. This is more honest than claiming that one model
is “smart enough” to own the whole workflow.

## An illustrative story

A team replaced a deterministic triage form with a chatbot because the chatbot
handled natural language well. Users liked the demo, but operations lost the
structured fields needed for reporting. The better design kept the form for
required fields and added a model only to translate free-text context into a
reviewable suggestion.

This is illustrative. The transferable lesson is to preserve the data contract
that downstream work actually needs.

## Two ways to see it

### Builder view

Pick a mechanism that makes the acceptance test easy to observe. Compose systems
when composition reduces uncertainty; do not compose components just to sound
advanced.

### User and operations view

The user experiences a promise, not a model. They need to know what the system
knows, what it guessed, what it can change, and how to correct it. The operations
team needs logs, owners, budgets, and a recovery path.

## Hands-on

Use one support-message task and design four versions:

1. a deterministic rule;
2. a classifier or ranking system;
3. a retrieval-grounded assistant;
4. a bounded workflow with a model and one approved tool.

For each, write the input, output, acceptance test, likely failure, required
permission, and fallback. Then choose one version and explain why the other three
are worse for this task. Your failure fixture is an input that is missing a key
field or contains conflicting policy text. A passing design detects that condition
and asks, abstains, or routes to review.

## Checkpoint

- [ ] You can distinguish rules, prediction, retrieval, generation, and agents by
  mechanism rather than by product label.
- [ ] You can explain why a simpler baseline is insufficient before adding a model.
- [ ] You can name the authority boundary and failure path for a composed system.
- [ ] Your chosen design has an acceptance test that does not depend on “it feels helpful.”

## What this does not solve

The right system category does not tell you whether the data, labels, source
permissions, or business policy are good. It also does not make a high-impact
decision safe. Those require deeper evaluation, governance, and domain review.

## Continue, go deeper, apply it

- Continue: How language models produce text
- Go deeper: Agents versus workflows
- Apply it: Prompting
