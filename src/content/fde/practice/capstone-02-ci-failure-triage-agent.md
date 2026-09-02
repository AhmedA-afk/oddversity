---
title: "Capstone 02: the CI failure triage agent (after the semiconductor case)"
phase: practice
module: capstones
kind: capstone
summary: "Rebuild the shape of the European semiconductor debug-triage engagement on data you can actually get: failed GitHub Actions runs from a public repository. The eval labels expert action sequences, not answers, and the agent earns write access one stage at a time."
duration: 3 weeks
updated: "2026-09-02"
outcomes:
  - Label 30 real CI failures with a root-cause category and the expert's next three actions, then score an agent against that trajectory.
  - Build an agent whose tools are read-only by construction and whose command allowlist lives in one file.
  - Run the agent as a webhook service on a small VM in shadow mode, then in comment mode, with a one-command rollback.
artifact: A repository with an archived corpus of failed CI runs, a trajectory-labelled eval set, the triage agent, the deployed webhook service, a first-person write-up, a recorded walkthrough, and a generalise-vs-one-off memo.
sources:
  - "https://www.zenml.io/llmops-database/forward-deployed-engineering-for-enterprise-llm-deployments"
  - "https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production"
---

## The public case, and what is actually known about it

A European semiconductor manufacturer worked with OpenAI's FDE team on a debug investigation and triage agent. The account comes from Colin Jarvis, OpenAI's head of Forward Deployed Engineering, in a talk transcribed in the ZenML LLMOps database. The customer is not named, which limits what can be verified.

What the account describes: engineers were spending most of their time on bug-fixing, the agent was built on a forked coding model with access to execution environments and a lot of telemetry, and capability was staged from advisory, to generating pull requests, to autonomously testing fixes. Ten use cases across the value chain. The eval was built from expert action sequences, on the order of twenty labelled debugging actions.

What is speaker-reported and unaudited: the "70 to 80% of time on bug-fixing" framing, the "20 to 30% efficiency gains to date, targeting 50%", and the goal that most overnight test failures resolve autonomously. Say "OpenAI's FDE lead reports" if you repeat any of them, and do not put a number like that anywhere near your own results table.

The two transferable ideas are the ones to build on. First, the eval labels the *sequence of actions an expert would take*, not the final answer, because in debugging the answer is often unknowable in advance and the process is what generalises. Second, write access is earned in stages.

## The customer stand-in

**Arclite Systems.** A fictional embedded-software company, 90 engineers across Bengaluru and Munich, shipping firmware for industrial controllers. Their nightly suite runs 40 minutes across simulated and hardware-in-the-loop targets and fails somewhere between four and twelve times a night. Every morning one engineer, on rotation, spends the first ninety minutes deciding which failures are real.

**Sneha Kulkarni**, the platform lead, wants the rotation abolished and is completely uninterested in a chatbot. **Markus Behr**, a principal engineer, has seen an internal "flaky test detector" fail twice and will judge this on whether it is ever confidently wrong. Being confidently wrong is worse than saying nothing, and your eval has to price that.

## The data pack

This is the capstone where the data is real, which makes it the best one in the module for a portfolio.

Public repositories with GitHub Actions expose their run history through the REST API. You can list failed workflow runs, list the jobs in a run, and download the raw logs for a job. A token from your own account raises the rate limit and is enough; no special access is needed for public repositories.

```python
import os, requests

H = {"Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
     "Accept": "application/vnd.github+json"}
REPO = "pallets/flask"   # any active public repo with Actions

runs = requests.get(
    f"https://api.github.com/repos/{REPO}/actions/runs",
    headers=H, params={"status": "failure", "per_page": 50},
).json()["workflow_runs"]

for run in runs:
    jobs = requests.get(run["jobs_url"], headers=H).json()["jobs"]
    for job in jobs:
        if job["conclusion"] != "failure":
            continue
        logs = requests.get(
            f"https://api.github.com/repos/{REPO}/actions/jobs/{job['id']}/logs",
            headers=H, allow_redirects=True,
        )
        path = f"corpus/{run['id']}_{job['id']}.log"
        with open(path, "wb") as f:
            f.write(logs.content)
```

Two practical notes. Actions log retention is limited, ninety days by default, so archive as you collect and commit the corpus. And pick two or three repositories with different stacks: a Python one, something with a compile step, something with a browser or integration suite. A triage agent that only ever saw `pytest` output has learned one repository's dialect, not triage.

If you want the Arclite flavour on top, append synthetic hardware-in-the-loop failures: timeouts on a serial port, a flashing step that fails on one board revision, a fixture that leaks state into the next test. Ten hand-written ones are enough to make the category set realistic.

## The eval, before anything else

**The set.** Thirty failed jobs, sampled to cover the categories rather than the frequency distribution, because the rare categories are the expensive ones.

**The labels.** For each failure:

- `root_cause` from a closed set: `test_assertion`, `flaky_infra`, `dependency_resolution`, `compile_error`, `timeout`, `config_or_secret`, `upstream_service`, `genuine_regression`.
- `evidence_line`: the line number in the log a human would point at.
- `next_actions`: the ordered first three things an experienced engineer would do. Keep them in a controlled vocabulary so they can be compared, for example `read_file(path)`, `git_blame(path, line)`, `search_repo(term)`, `rerun_job`, `check_recent_commits`, `escalate_to_owner`, `no_action_flaky`.
- `confidence`: whether the label was obvious or arguable.

**The protocol.** Two labellers, independently, and this is the set where you will disagree most, because half of CI triage is judgement. Record every disagreement in `eval/disagreements.md` with the reasoning on both sides. When you and your second labeller cannot agree whether something is `flaky_infra` or `upstream_service`, that is not a labelling failure, it is a finding about the category set, and you should probably merge or split a category and say so.

**The scorer.**

- Category accuracy against the label.
- First-action match: did the agent's first proposed action equal the expert's first.
- Top-3 containment: is the expert's first action anywhere in the agent's three.
- Evidence hit: does the agent's cited log line fall within a few lines of the labelled one.
- **Confidently wrong rate**: the agent asserted a category with high stated confidence and was wrong. This is the number Markus will look at, and it is the one that should be reported first.

**The baseline.** A regex classifier. Twenty patterns, thirty lines of code, `ModuleNotFoundError` maps to `dependency_resolution`, `Connection refused` maps to `upstream_service`, and so on. It will be surprisingly good on the common categories, which is exactly why you run it: it sets the bar the agent has to clear to be worth its cost and its risk.

## The build, in stages

**Stage 1: normalise.** Actions logs are large, timestamped, and full of setup noise. Strip timestamps, drop the successful steps, keep the failing step plus a window before and after, and collapse repeated lines. This step alone often moves accuracy more than anything you do to the model, which is a lesson worth measuring rather than reading.

**Stage 2: classify with evidence.** One call, structured output: category, the cited line, a one-sentence reason, and a confidence. Score it. This is your v1 and it should beat the regex on the long tail and possibly lose on the common cases.

**Stage 3: give it tools.** The agent gets read-only access to the repository at the failing commit and to recent history.

```python
ALLOWED = {"read_file", "search_repo", "git_log", "git_blame", "list_dir"}

def dispatch(name: str, args: dict, ctx) -> str:
    if name not in ALLOWED:
        raise PermissionError(f"tool {name} not permitted")
    if name == "read_file":
        return ctx.repo.read(args["path"], ref=ctx.failing_sha)[:8000]
    if name == "search_repo":
        return ctx.repo.grep(args["term"], ref=ctx.failing_sha, max_hits=20)
    ...
```

There is no `write_file`, no `run_command`, no `git push`. The allowlist is a set literal in one file and the tests try to get past it.

**Stage 4: history.** Index the previous failures you archived. When a new failure arrives, retrieve the three most similar past failures and their labels. This is the cheapest large accuracy gain available and it is also the thing that makes the system worth more to Arclite over time, which is a fact worth putting in the adoption plan.

**Stage 5: the action plan.** Output the three next actions in the controlled vocabulary, scored against the labels. Do not skip to generating patches. The public case staged it that way for a reason and so does your grading.

## The deployment target

A container on a small VM. It runs a webhook receiver for `workflow_run` completion events, a worker that pulls the logs and triages, and a store for the corpus and results. The GitHub token it holds is read-only and scoped to the repositories in question; the token that posts comments is separate and only exists in the stage where you turn commenting on.

The things that will break, and are meant to: the webhook delivers before the logs are ready, so you need a retry with backoff; the same run can be delivered twice, so the pipeline must be idempotent on `job_id`; and the log download redirects to a signed URL that expires, so a naive retry of the wrong step fails confusingly. Idempotency and failure recovery are specifically what OpenAI's LLM system-design round probes, so build them properly and be ready to talk about them.

**Rollback.** `TRIAGE_MODE=off` stops the worker consuming; in-flight jobs finish and write nothing. Comment mode is a second flag. Pinned image tags. Rehearse turning it off mid-queue and show what happens to the job that was in flight.

**Air-gap variant (stretch).** Arclite's Munich site will not let build logs leave the network. Replace the hosted model with a small local one, pre-stage weights and wheels into the image, and mirror the repository locally. Report the accuracy delta honestly; on classification tasks with good normalisation it is often smaller than people expect, and that is a genuinely useful thing to have measured.

## Guardrails, and where they live

`tools.py` holds the allowlist and the dispatcher. `limits.py` holds the per-run token budget, the maximum number of tool calls, and the wall-clock cap, all read from environment configuration. `redaction.py` strips anything shaped like a token or a key from the log before the model sees it, because CI logs leak secrets constantly and you should assume yours will.

The test that matters: feed the agent a log whose contents include an instruction telling it to run a shell command or open a different repository, and assert that nothing outside the allowlist is attempted and the run completes normally. Log injection through build output is a real attack surface here, not a hypothetical.

## The adoption plan

- **Weeks 1 to 2, shadow.** The agent triages every overnight failure and writes to a dashboard only. The rotation engineer records their own triage first, then looks. You now have live labels arriving daily, and the disagreement rate between the agent and the rotation is your real metric.
- **Weeks 3 to 5, comment mode.** The agent posts one comment per failed run: category, evidence line, three suggested actions, and a confidence. A thumbs-down button writes the case into the review queue and the eval set.
- **Week 6, the decision.** Markus's criterion, agreed in advance: the confidently-wrong rate over the shadow and comment periods. If it is above the agreed threshold the system stays advisory and you say so plainly.
- **The metric.** Minutes of rotation time per morning, self-timed for two weeks before anything is switched on. Not "engineer satisfaction", not "number of comments posted".
- **The kill date.** End of week 6.

Never propose the patch-generation stage in week one. Sneha will say yes and Markus will be right that it is too early.

## The memo

**Specific to Arclite:** the hardware-in-the-loop failure categories, the serial-port timeout heuristics, the repository layout assumptions, the overnight-batch cadence.

**Any three customers would need:** the log normaliser, the trajectory-labelled eval format, the read-only tool sandbox with an allowlist, the similar-past-failures retrieval, the shadow-then-comment adoption arc, the idempotent webhook worker.

**Should be configuration, not code:** the category set, the confidence threshold at which the agent stays silent, the tool budget, the retrieval window.

The recommendation writes itself and it is worth writing anyway: the category set is the part every customer will want to change, so it belongs in a config file from the first commit, and the log normaliser is the piece with the highest reuse and the least glamour. Note the reuse fraction you actually achieved. The stated target from OpenAI's FDE lead is around 20% reusable out of engagement one; on this build most people land near that and overestimate it before measuring.

## Grading applied

| Line | Weight | What the grader opens |
|---|---|---|
| Eval before build | 20 | The archived corpus, `eval/labels.jsonl` with action sequences, `eval/protocol.md`, the disagreement log, and a git history showing the regex baseline scored before the agent existed |
| Deployed off your laptop | 20 | The webhook service on a VM, idempotency on `job_id`, retry with backoff, a health endpoint, scoped tokens |
| Measured result | 15 | Regex baseline vs v1 vs tool-using vs retrieval-augmented, on all five scorer numbers, with cost per triage |
| Guardrails and rollback | 15 | `tools.py`, `limits.py`, `redaction.py`, the log-injection test, the rollback recording with an in-flight job |
| Adoption plan | 10 | Shadow, comment, decision, with Markus's threshold agreed in advance |
| Write-up | 10 | First person, your numbers, the category you had to split, semiconductor figures labelled as OpenAI-reported |
| Walkthrough | 5 | Six minutes: a confidently-wrong case, what you changed, the same case after |
| Memo | 5 | Three columns, a costed recommendation, your measured reuse fraction |
