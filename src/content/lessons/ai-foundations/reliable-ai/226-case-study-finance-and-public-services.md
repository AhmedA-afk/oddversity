---
title: "Case Study: Finance and Public Services"
track: "ai-foundations"
order: 226
status: live
summary: "A rigorous, practice-led lesson on high-impact decisions, legal constraints, discrimination risk, and appealability for building AI systems that can be evaluated, challenged, and operated responsibly."
duration: "50–70 min"
updated: "2026-08-30"
---

# Case Study: Finance and Public Services

Reliable AI is not a property that a model possesses in isolation. It is a claim about a
specific system, a stated use, particular people, operating conditions, and the evidence
available when a decision is made. This lesson examines **high-impact decisions, legal constraints, discrimination risk, and appealability**. The goal is not to
memorise a compliance vocabulary; it is to make a defensible technical decision, record
its assumptions, and know when deployment should pause.

## What must be true before a claim is credible

Start by writing a claim that could be wrong: *for this user group, in this workflow,
under these conditions, the system produces this benefit while keeping this harm below
an agreed boundary.* A reliability claim has five parts: a target outcome, a population,
a context, a measurement procedure, and an owner. Remove any one of those and terms
such as “safe”, “fair”, “private”, or “accurate” become marketing language rather than
testable propositions.

The central design question is: **what could make an apparently successful aggregate
metric misleading here?** In this unit, the relevant mechanism is high-impact decisions, legal constraints, discrimination risk, and appealability. Treat it
as an engineering hypothesis. Define a control, an observable signal, a failure
threshold, and a response owner before examining results.

A useful decision record has a compact form:

```text
Claim: [measurable outcome] for [population] in [workflow].
Evidence: [dataset, test protocol, dates, slices, and uncertainty].
Boundary: do not deploy if [failure threshold] is crossed.
Response: [fallback / escalation / rollback] owned by [role].
```

This form stops an important category error: a model score is evidence about a test
set, not a guarantee about a person affected by a deployment.

## Technical model and worked calculation

Suppose a system receives (N) cases. Let (c_i=1) when the system's decision is
acceptable under the agreed protocol, and (c_i=0) otherwise. The observed reliability
on a defined slice is (hat r = sum_i c_i/N). That number is only meaningful when
the slice definition, reference standard, missing cases, and consequences of errors
are explicit. Compare two slices rather than only a pooled score. If group A has
(90/100) acceptable cases and group B has (72/100), the pooled result is 81%.
A release decision based on “81% is good” hides an 18-point disparity that may be
operationally decisive.

For case study: finance and public services, use the same discipline with the relevant signals:
harm-weighted error, appeal overturns, service denial duration, subgroup performance, and audit exceptions. Estimate uncertainty rather than treating one run as final. For a proportion,
a quick standard error is (sqrt{hat r(1-hat r)/N}); for low-volume or high-impact
slices, collect more evidence or route cases to review. A threshold is not neutral:
moving it changes who receives errors, workload, cost, and the model's apparent score.

## Three worked scenarios

### Scenario 1 — routine use

Consider a fraud-control system that blocks accounts and a public-benefits system that flags applicants. Begin with a narrow workflow map: who supplies an input, what
the system can infer or do, who consumes the output, and who is harmed when it is
wrong. Write down the no-model baseline. A model should improve a decision, not merely
produce an impressive-looking prediction. Test ordinary examples, then compare the
model with the baseline using a predeclared metric and a decision owner.

### Scenario 2 — the inconvenient slice

Now isolate a population, language, device, location, time period, or rare-but-costly
case for which the training distribution may be thin. If performance drops, do not
average it away. Diagnose whether the cause is representation, label quality, a proxy
definition, access constraint, or an unsupported use. The right mitigation may be
better data, a narrower scope, a different workflow, an abstention path, or no model.
Changing the architecture is only one option.

### Scenario 3 — change after launch

Assume a vendor update, policy change, seasonal shift, or adversarial actor changes
the input stream. Your offline metric may remain stable while the system's meaning
changes. Monitor leading indicators, audit samples, and user reports; compare them
against a reference period. Pre-authorize an action for each alert: investigate,
throttle, require review, disable a tool, or roll back. Reliability is sustained
through this feedback loop, not “certified” once.

## Diagnostic workflow

When an issue appears, resist the urge to tune immediately. First reproduce it with a
versioned input and record the model, prompt/configuration, retrieval state, policy,
and downstream action. Second, classify the failure: data defect, measurement defect,
model limitation, interface pressure, policy conflict, adversarial manipulation, or
human-process failure. Third, estimate scope and severity. A rare security or clinical
failure can outrank a common cosmetic one.

Use this diagnostic table in your report:

| Question | Evidence to collect | Decision consequence |
| --- | --- | --- |
| What changed? | versions, inputs, environment, timestamps | isolates a plausible cause |
| Who is affected? | slices, exposure counts, user reports | sets urgency and scope |
| Does the control work? | adversarial/replay test, confidence interval | ship, restrict, or pause |
| What remains unknown? | assumptions and missing measurements | assigns follow-up ownership |

The characteristic failure to avoid is **deploying a risk rank as an unreviewed final decision**. It often survives a dashboard
because the dashboard measures a convenient proxy. Add a direct test wherever feasible,
and document the residual uncertainty where it is not.

## Implementation blueprint

Implement the lesson as a repeatable evaluation, not a one-off analysis.

1. Specify the use decision and unacceptable harm in plain language.
2. Version the data, model, configuration, and evaluation protocol.
3. Build a small, reviewed set of routine, edge, and adversarial examples.
4. Compute harm-weighted error, appeal overturns, service denial duration, subgroup performance, and audit exceptions; publish slice counts and uncertainty.
5. Run failure drills: missing input, stale source, adversarial input, and escalation.
6. Record a release decision with a named owner and a rollback or appeal path.

Pseudocode:

```python
report = evaluate(system, cases, slices=True, retain_failures=True)
if report.crosses_harm_boundary() or report.evidence_is_incomplete():
    route_to_review(report)
    restrict_or_pause(system)
else:
    deploy_with_monitoring(report, owner="named accountable role")
```

The code is deliberately short. Most reliable-AI work is in defining `cases`,
`harm_boundary`, and a response that has real authority.

## Assignment: build and defend a reliability case

Choose a proposed AI system in a high-impact or widely used workflow. Produce a
two-page reliability case plus a reproducible evaluation appendix.

- Define the intended use, non-use, affected people, and no-model baseline.
- Give three routine cases, three edge cases, and three misuse or failure cases.
- Specify the measurement protocol, slice plan, threshold, uncertainty treatment, and
  response plan using the signals above.
- Include one decision you would *not* automate and explain the human authority needed.
- Present one unresolved risk honestly, including the evidence needed to reduce it.

### Rubric (20 points)

| Criterion | Points |
| --- | ---: |
| Specific, bounded claim and appropriate baseline | 4 |
| Evidence design, slices, calculations, and uncertainty | 5 |
| Diagnostics connect a plausible failure to a meaningful control | 4 |
| Operational response, ownership, and contestability are credible | 4 |
| Clear limits, provenance, and reproducible documentation | 3 |

A strong submission makes it easy for a skeptical reviewer to find the boundary of the
claim. A weak submission says the system is responsible without explaining what would
falsify that statement.


## Exercises: evidence before assertion

1. Pick a real or hypothetical system in this lesson's domain. Write one deployment
claim that names the population, workflow, time window, and harm boundary. Then name
one item of evidence that could falsify it.
2. Construct a two-slice test: define the slices, a primary metric, a consequential
error metric, and the action you would take if the slices disagree. Explain why an
aggregate score could be misleading.
3. Create a three-row assurance table with columns **assumption**, **diagnostic signal**,
and **owner/fallback**. At least one row must describe a failure discovered only after
release.
4. Write a 120-word incident note for an adverse result. Separate observed facts from
hypotheses; include containment, preserved evidence, and the test that must pass before
re-enabling the affected capability.

For full credit, calculations and judgments must be traceable to stated assumptions.
A polished narrative without a measurable boundary, a reproducible artifact, or a
responsible owner earns no more than partial credit.
