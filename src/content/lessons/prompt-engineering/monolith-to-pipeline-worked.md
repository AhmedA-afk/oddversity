---
title: "Worked Example: Refactoring a Resume Screener Into Stages"
track: "prompt-engineering"
status: live
summary: "One resume, scored two ways — a single mega-prompt versus a parse, score, explain pipeline — and why the split wins."
duration: "8 min read"
---

Same resume, same job requirements, two implementations. The first is one prompt doing everything. The second is three small ones. Watch what changes besides the code.

## The setup

The job requirement: **Senior Backend Engineer** — 3+ years backend experience, Python or Go, leadership experience preferred, degree not required.

The resume:

```text
Jordan Blake — 4 years as a backend engineer at a logistics startup.
Primary languages: Python and Go. Led a team of 2 engineers for the last
year. Migrated a monolithic order system to services. B.S. in Computer
Science, State University.
```

The task, in one call: summarize the candidate, score them 1-10 against the requirements, and write two sentences of recruiter feedback.

```text
You are a resume screener. Read the resume below and the job requirements, then:
1. Summarize the candidate's experience.
2. Score the candidate from 1-10 against the job requirements.
3. Write two sentences of feedback for the recruiter explaining the score.

Job requirements: Senior Backend Engineer, 3+ years backend experience,
Python or Go, leadership experience preferred, degree not required.

Resume: {resume_text}

Respond with the summary, score, and feedback.
```

Run this a few times and the shape of the problem shows up fast: the score sometimes appears as "8/10", sometimes as "I'd put this around an 8", sometimes folded into the feedback sentence with no clean number to parse. The summary, score, and feedback are three different jobs — see [When to Split a Prompt](/learn/prompt-engineering/when-to-split-a-prompt) for the general signals — and this one has all four of them stacked in a single pass.

## Step by step

### Stage 1 — parse

```text
Extract the following fields from the resume as JSON. Use null for
anything not stated. Do not infer years of experience from job titles —
only use explicit statements.

Fields: years_experience (number or null), languages (array of strings),
has_leadership_experience (boolean), degree (string or null)

Resume: {resume_text}

Respond with JSON only.
```

Output:

```json
{
  "years_experience": 4,
  "languages": ["Python", "Go"],
  "has_leadership_experience": true,
  "degree": "B.S. Computer Science"
}
```

> **Why this step?** Parsing is a precision task — either the resume said 4 years or it didn't. Isolating it means you can check its output against the source text directly, with no scoring judgment mixed in to muddy whether an error is a misread or a matter of opinion. See [Structured Output as a Contract](/learn/prompt-engineering/structured-output-contracts) for why "years_experience: number or null" instead of a free-text summary is what makes this checkable at all.

### Stage 2 — score

```text
Score this candidate against the job requirements using this rubric.
Award points only for criteria explicitly met in the parsed data — do
not guess.

Rubric (10 points total):
- 3+ years backend experience: 4 points (0 if under 3, 4 if 3+)
- Python or Go listed: 3 points
- Leadership experience: 3 points (preferred, not required)

Job: Senior Backend Engineer, 3+ years backend, Python or Go, leadership preferred.

Parsed candidate data: {parsed_json}

Respond with JSON: {"score": number, "matched": [string], "missing": [string]}
```

Output:

```json
{
  "score": 10,
  "matched": ["3+ years backend experience", "Python or Go", "leadership experience"],
  "missing": []
}
```

> **Why this step?** The rubric is now the only thing this prompt is responsible for, and it takes structured input instead of prose — no re-reading the raw resume, no re-deriving facts it already extracted. That means you can rewrite the point weights, add a criterion, or run this stage against a hundred already-parsed candidates without touching parsing or feedback at all.

### Stage 3 — explain

```text
Write two sentences of feedback for a recruiter, explaining this score.
Reference specific matched or missing criteria. Do not restate the raw score number.

Score data: {score_json}
```

Output:

```text
Jordan meets all core requirements for this role, with 4 years of backend
experience in Python and Go plus a year of team leadership. This is a
strong match with no gaps against the stated criteria.
```

> **Why this step?** Tone and phrasing are a different quality bar than scoring accuracy — a recruiter reading "strong match, no gaps" doesn't need to see the arithmetic. Keeping this stage separate also means you can point it at a higher temperature for more natural phrasing while the scoring stage stays deterministic, something you can't do when one call has to serve both purposes.

## Where it breaks (and the fix)

Run stage 2 on ten more candidates and one rubric line turns out to be doing more work than it looks like: "leadership experience preferred" isn't binary in most resumes — some show a title without team size, some show "led initiatives" with no direct reports. The score for those swings between full and zero points on the leadership line depending on phrasing, run to run.

Because scoring is now its own isolated call, the fix is local: tighten the rubric's wording for that one line — "3 points if the resume states managing or leading other people; 1 point for leading a project with no stated reports; 0 otherwise" — and re-test stage 2 alone against your set of already-parsed resumes. Nothing about parsing or the feedback wording has to change, and you don't burn a parse call just to re-test a scoring tweak.

This is also the point where the isolated scoring stage becomes cheap to run more than once: sampling stage 2 a few times and taking the majority score is a small, targeted use of [self-consistency](/learn/prompt-engineering/self-consistency-sampling) precisely because it's a narrow, structured call — doing the same thing to the four-job monolith would mean re-running summary and feedback generation for no reason every time.

## Takeaways

- Each stage has one job and one thing to test: parsing against the source text, scoring against the rubric, feedback against tone.
- A bug found in production points at exactly one prompt, because each stage's input and output are inspectable on their own.
- Tuning the rubric no longer risks the summary or the feedback wording — the stages can't step on each other because they don't share a prompt.
- The intermediate JSON is what makes this possible at all; the [JSON schema](/learn/prompt-engineering/json-schema-in-prompts) each stage emits is the interface the next stage depends on.

**Related:** [When to Split One Prompt Into a Pipeline](/learn/prompt-engineering/when-to-split-a-prompt), [One Prompt, One Job](/learn/prompt-engineering/one-prompt-one-job-intuition), [Structured Output: Making the Model Speak a Contract](/learn/prompt-engineering/structured-output-contracts), [Enforcing a JSON Schema From the Prompt](/learn/prompt-engineering/json-schema-in-prompts), [Self-Consistency Sampling](/learn/prompt-engineering/self-consistency-sampling)
