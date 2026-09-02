---
title: Labelling twenty examples with a domain expert
phase: ai
module: evals-first
kind: lesson
summary: How to run the ninety-minute session that produces the labelled set your whole build depends on, including what to do when the expert contradicts themselves and when the label is a sequence of actions rather than an answer.
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Run a labelling session that produces twenty usable examples in about ninety minutes.
  - Write a label schema that captures the decision, the reason, and the evidence.
  - Handle disagreement between two experts without averaging it away.
artifact: A labelled JSONL set of twenty examples with a written label schema and an inter-rater note.
sources:
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production
  - https://deploy.co/
  - https://www.theforwarddeployed.io/engagements/john-deere
---

Twenty is not a statistical sample. It is a working set: small enough that a busy expert will sit through it, large enough to surface the disagreements that will otherwise kill the project in month three.

The number recurs in the field accounts. In the semiconductor debug-triage engagement Jarvis describes, the eval was built from labelled sets of roughly twenty expert debugging action sequences, captured by engineers who spent weeks on site learning the domain. On the John Deere agronomy work, OpenAI's own account describes "reviewing hundreds of real-world examples with domain experts, building custom evaluation systems" before scaling. Both start the same way: someone sat with the person who does the job and wrote down what they do.

## Who the expert is

Not the executive sponsor. Not the IT manager who owns the system. The expert is the person whose judgement the system is trying to reproduce or assist: the claims adjuster, the underwriting officer, the L2 support agent, the agronomist, the ward coordinator, the compliance reviewer.

You want one primary expert and, ideally, a second for a subset. If the sponsor insists on nominating their best person, take the best person and then ask for a median one too. A system tuned to the top performer's judgement will be rejected by everyone else.

Get ninety minutes, in one block, in a room or a call where they can share their screen and open the actual system they use. Not a conference room with slides.

## What you bring to the session

**Twenty inputs, already chosen, already on screen.** Never make the expert find examples. That is your job and it is where most of the effort goes. Pull them yourself from the export, the ticket queue, the shared drive.

Choose them like this:

- Ten typical cases, sampled from the real distribution.
- Five the customer already told you are hard, from your discovery notes.
- Three that are broken input: the truncated PDF, the scanned fax, the ticket with the entire email thread pasted in, the Hinglish message with the account number written in words.
- Two you believe should be refused or escalated rather than answered.

That last group is the one people forget, and it is the one that decides whether the deployment is safe.

**A label schema, drafted.** Bring a strawman so the session is a critique rather than a blank page. A first draft for a claims-triage assistant at a fictional mid-size Indian health insurer:

```json
{
  "id": "clm-0007",
  "input": {
    "claim_text": "...",
    "policy_id": "P-4482",
    "attachments": ["discharge-summary.pdf"]
  },
  "expected": {
    "decision": "review",
    "reason_code": "PRE_EXISTING_UNCLEAR",
    "evidence": ["discharge-summary.pdf p2: 'known diabetic since 2019'"],
    "confidence": "high"
  },
  "meta": {"language": "en", "channel": "portal", "labeller": "R. Iyer"}
}
```

Four fields do the work. **Decision** is what the system outputs. **Reason code** comes from a closed list the customer already uses, which is how you avoid grading free text later. **Evidence** is the span or page the expert pointed at, which turns into your citation requirement and your hallucination check. **Confidence** is the expert's own, and it is the field that tells you which cases will need a human forever.

## How the session runs

1. **Show the input. Say nothing.** Do not describe the system, do not mention the model. Ask: "What would you do with this one?"
2. **Let them do it, out loud.** They will open three tabs, check a policy PDF, look up the member's claim history, and then decide. Write down the tabs. That list becomes your tool inventory in the tools lesson, and it is more valuable than the label.
3. **Record the decision and the reason code.** In their words first, mapped to the closed list second, and ask them to confirm the mapping.
4. **Ask for the evidence.** "Which line told you that?" If they cannot point at one, mark it. Cases decided on unwritten experience are the cases the system will get wrong, and they are worth flagging early to the sponsor.
5. **Time-box each example to four minutes.** Twenty examples at four minutes is eighty minutes, plus setup. When one runs long, that is a finding, not a delay: park it and note why.
6. **At the end, ask the two closing questions.** "Which of these would you be unhappy for a computer to decide alone?" and "Which mistake here would you have to explain to your manager?" The answers are your human-in-the-loop rule and your must-never-happen event.

## When the expert contradicts themselves

They will. Two near-identical cases will get different decisions, twenty minutes apart. This is the most useful thing that happens all day, and the wrong response is to pick one and move on.

Show them the pair. Ask what is different. You get one of three answers.

- **A real distinction you missed.** The policy has a rider, the branch has a local rule, the claim date crosses a fiscal boundary. Capture it in the schema, add it to the input, and you have improved the specification.
- **A genuine judgement call.** Two competent people would differ. Then the correct label is "review", not either decision, and you have found a class the system should hand to a human. Say so in the report.
- **An error.** They misread one. Fix it, and note the rate, because it is your ceiling. If your expert is inconsistent on one in twenty, a system scoring 95% against their labels is at human parity, and demanding 99% is demanding something no one in the building achieves.

That last point is worth writing down for the sponsor before you promise a threshold. Measure a small inter-rater check: give five of the twenty to a second expert, blind, and report the agreement rate as a line in your charter. It costs twenty minutes and it protects you from a target nobody can hit.

## When the label is a sequence, not an answer

For an agent, "correct output" is often the wrong frame. The semiconductor triage engagement labelled expert action sequences: what an engineer opened, what they checked, in what order, before reaching a conclusion.

For those, label the trajectory:

```json
{
  "id": "inc-0031",
  "expected": {
    "final": "root_cause: flaky_integration_test",
    "must_touch": ["ci_log_fetch", "commit_range_diff"],
    "must_not_touch": ["restart_production_service"],
    "max_steps": 8
  }
}
```

Three checks fall out of that: did it reach the right conclusion, did it consult what an expert would consult, and did it stay away from the dangerous action. The third one is the guardrail eval, and it usually matters more than the first.

## Storage and hygiene

Store the set as JSONL, one example per line, in the repository, reviewed like code. A pull request that changes a label needs an approver from the customer's side. That single rule prevents the most common quiet failure: an engineer relabelling a case because the system got it wrong.

Two practical constraints for the field. First, the examples are customer data. Under India's DPDP Act 2023 and under GDPR, a claim note with a member's name and diagnosis is personal and, in the health case, sensitive. Redact at capture time, keep a mapping outside the repository if you need to trace back, and confirm in writing where the file is allowed to live. Second, if the deployment is in a VPC or air-gapped, the eval set lives there too, and your harness must run without internet.

## What good looks like

By the end of the session you have twenty labelled lines, a schema the expert signed off, a list of the systems they opened, one inter-rater number, one named human-in-the-loop class, and one must-never-happen event. That is a morning's work and it is the foundation of everything in this phase.

Next: run those examples through a model by hand, before you promise anyone a delivery date.
