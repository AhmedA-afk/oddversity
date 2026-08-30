---
title: "See AI as a data, model, and output loop"
track: "ai-literacy"
status: live
summary: "An AI feature is a loop, not a model-shaped box: data enters, a model transforms it, an application interprets the output, a person or system acts."
duration: "5 min read"
---

## The short answer

An AI feature is a loop, not a model-shaped box: data enters, a model transforms it, an application interprets the output, a person or system acts, and the resulting behavior changes future data. A failure can start at any point. Inspect the whole loop before blaming the model.

## Why this matters

“The model is 90% accurate” says little about whether a feature works. The number
may be measured on old data, the application may map the output to the wrong
action, or users may stop supplying the feedback the metric assumes. A system
view keeps the boundaries visible:

```text
data/context → model or retrieval → output → policy → action → feedback
      ↑__________________________________________________________|
```

The arrows have different owners. Data may belong to an operations team, model
evaluation to an engineer, policy to a product or risk owner, and feedback to the
people using the feature. A useful map names those owners instead of treating the
model as the only component that can fail.

## How it works

1. **Data or context:** what was observed, collected, labeled, retrieved, or
   supplied by the user? What is missing, stale, or permissioned?
2. **Model or operation:** what rule, learned pattern, retrieval step, or
   generation transforms it? What assumptions does it make?
3. **Output:** what format, uncertainty, evidence, and failure state are returned?
4. **Policy and decision:** what action follows, and who is allowed to approve it?
5. **Feedback:** what gets recorded, corrected, appealed, or silently dropped?

Do not mix three kinds of data:

- **Training data** shapes model parameters before your feature runs.
- **Runtime context** is the input or retrieved evidence used for this decision.
- **Telemetry and feedback** describe what happened afterward.

They require different permissions and support different claims. A user clicking
“undo” is feedback about a result; it is not automatically a correct label.

## Worked examples and variations

### Example A: spam filtering

**Data:** an email plus a label. **Model:** predicts spam. **Output:** label and
perhaps a review score. **Policy:** move high-confidence cases, hold uncertain
ones. **Action:** message goes to a folder. **Feedback:** a user rescues a message.
**Inspection:** compare false positives and false negatives by sender and message
type. If rescue actions are not logged, the loop cannot learn what it missed.

### Example B: document question answering

**Data/context:** a permitted corpus and a question. **Operation:** retrieval
selects passages; generation forms an answer. **Output:** answer with source spans
or an abstention. **Policy:** only show documents the user may access. **Feedback:**
the user marks a citation as irrelevant. A fluent answer without supporting
passages is a system failure even if the language model is behaving as trained.

### Example C: model score becomes a business action

**Data:** recent support history. **Model:** predicts which ticket may breach an
SLA. **Output:** a risk score. **Policy:** the score creates a callback queue but
does not penalize an agent. **Feedback:** the eventual breach is recorded along
with whether the team had capacity to respond. **Inspection:** a rising breach
rate may mean the model is wrong, the queue is overloaded, or the action was never
completed. The output and the action must be measured separately.

### Boundary case: feedback is a policy

If an employee is denied access and never gets a meaningful appeal, the observed
“successful” outcome may mean only that the system prevented appeals. Feedback is
not automatically ground truth. Ask who could disagree with the label, whether
they can appeal, and what evidence would change the decision.

### Counterexample: optimize clicks only

A recommendation system can improve clicks while reducing trust or increasing
low-quality content. The output metric is narrower than the real outcome. Add a
quality or complaint signal, define a time window, and decide what trade-off the
owner is actually willing to accept.

### Production example: the changed label

A dashboard shows stable model accuracy while users increasingly ignore its
recommendations. The model may still match the old labels, while the UI or policy
has changed the meaning of the output. Compare the current action with the label
definition, sample ignored cases, and check whether the feedback channel still
captures disagreement.

## An illustrative story

A dashboard showed stable model accuracy while users increasingly ignored its
recommendations. An interview revealed that the UI had changed the meaning of one
label. Nothing obvious was wrong inside the model; the loop had changed around it.

## Two ways to see it

### Model view

Ask whether the learned mapping generalizes from its training distribution.

### System view

Ask whether the data, interface, policy, action, and feedback still mean what the
metric assumes.

## Hands-on

Draw the loop for an AI feature. Put a concrete field, transformation, output,
policy, decision, and feedback event at every stage. For every arrow, add an
owner and one inspection question:

| Stage | Concrete value | Owner | Inspection question |
| --- | --- | --- | --- |
| Data/context | | | Is it permitted, current, and complete? |
| Model/operation | | | What assumption could fail? |
| Output | | | What evidence or abstain state exists? |
| Policy | | | What does this output authorize? |
| Action | | | Who can reverse it? |
| Feedback | | | Who is missing from the signal? |

Use a deliberately broken case: remove one source field, change a label’s
meaning, or make the feedback optional. Your failure state is a diagram that
still says “success” without showing where the missing information is detected.
Add the check and write the user-visible behavior when it fails.

## Checkpoint

- [ ] You can separate training data, runtime context, and feedback.
- [ ] You can name the output’s format, evidence, abstain state, and authorized action.
- [ ] You can identify one missing or biased feedback signal.
- [ ] You can point to the first stage that would detect each of two injected failures.

## What this does not solve

The loop helps locate responsibility; it does not by itself choose a model or
prove that a metric captures the outcome people care about.

## Continue, go deeper, apply it

- Continue: Choose the right AI system
- Go deeper: Features, leakage, and missingness
- Apply it: Data contracts and validation
