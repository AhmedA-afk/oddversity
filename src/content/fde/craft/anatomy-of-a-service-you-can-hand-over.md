---
title: "Anatomy of a service you can hand over"
phase: craft
module: ship-a-service-end-to-end
kind: lesson
summary: The service you demo on Thursday is not the deliverable. The deliverable is a service that someone in the customer's team can configure, run, deploy and repair on a Monday when you are on a plane. This is the parts list for that.
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Name the seven parts every handover-ready service has, and say what breaks when each is missing.
  - Write a config layer that fails loudly at startup instead of quietly at 2 a.m.
  - Run a handover rehearsal where a customer engineer starts your service while you say nothing.
artifact: A service skeleton in your own repo with config validation, health endpoints, a data contract and a five-section README, reusable as the starting point for every lab in this phase.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
  - https://engineering.ramp.com/post/forward-deployed-engineering
  - https://conikeec.substack.com/p/the-forward-deployed-engineer-playbook
  - https://www.tryexponent.com/guides/openai-forward-deployed-engineer-interview
---

A product engineer ships a service into infrastructure their own company owns. If it breaks, they are on the pager, and the fix is a deploy away. An FDE ships a service into someone else's infrastructure, then leaves. That single difference reorders every engineering decision you make.

Chetan Conikee's FDE playbook ends its engagement arc on a phase most engineering writing skips entirely: **handoff**. Not "deploy", not "launch". Handoff. The thing you leave behind has to keep running without you, be repaired by people who did not write it, and survive a platform team who will eventually decide to move it.

So the deliverable is not the code. The deliverable is the code plus the smallest possible set of things a stranger needs in order to own it.

## The handover test

Before you write a line, name the person. Not "the customer". A named engineer at the customer, with a laptop, who will one day have to restart this thing.

**The test:** that person clones the repo, follows the README, and gets a running service against their own environment, with you in the room but silent. If they get stuck and you have to speak, that is a defect. Write it down and fix it in the README, not in the conversation.

Almost nobody does this rehearsal, and it is the single highest-value hour of a two-week engagement.

## The seven parts

### 1. One entry point, and it is obvious

There is exactly one way to start the service and it is the first code block in the README. Not three ways with a paragraph explaining which is for what. If it runs under Docker in production, it runs under Docker in the README, with the local variant second.

What breaks without it: three months later somebody starts it the wrong way, misses an environment variable, and files a bug against your service.

### 2. Config from the environment, validated at startup

Every value that differs between your laptop and their production is an environment variable. No exceptions, no "I'll parameterise it later". And the service refuses to start if any of them is missing or malformed.

```python
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="TRIAGE_", env_file=".env")

    database_url: str
    upstream_base_url: str
    upstream_api_key: str
    request_timeout_seconds: float = Field(default=10.0, gt=0, le=120)
    max_retries: int = Field(default=3, ge=0, le=10)
    log_level: str = "INFO"


settings = Settings()  # raises at import time if anything is missing
```

Ship a `.env.example` with every key present and every secret blanked. The example file is documentation that cannot go stale, because the code fails when it does.

What breaks without it: the service starts happily with a missing upstream key and fails on the first real request, at which point the failure is three layers away from the cause.

### 3. Health and readiness, separated

Two endpoints, and they answer different questions.

- `GET /healthz` answers "is this process alive". No dependencies checked. It must never fail because a database is slow, or a Kubernetes liveness probe will restart your pod in a loop during an unrelated outage.
- `GET /readyz` answers "can this process serve traffic". It checks the database connection and any upstream the request path needs, and it returns which check failed.

```python
@app.get("/readyz")
async def readyz():
    checks = {"database": await db_ok(), "upstream": await upstream_ok()}
    failing = [name for name, ok in checks.items() if not ok]
    if failing:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "failing": failing},
        )
    return {"status": "ready"}
```

A readiness endpoint that names the failing dependency turns an escalation into a screenshot. The customer's ops person sends you `{"failing": ["upstream"]}` and you have skipped an entire day of back-and-forth.

### 4. Authentication at the edge, and the customer's, not yours

Whatever the customer already uses is what you use. If the platform is behind an OIDC provider, sit behind it. If internal services authenticate with a shared header issued by an API gateway, do that. Inventing your own token scheme because it was faster on day two guarantees a security review finding on day forty.

The one thing you may own is the authorisation *decision*, and it belongs in one function that every route calls, so that when the rules change, they change in one place.

### 5. Structured errors with an identifier

Every error response carries a machine-readable code, a human sentence, and a correlation id that also appears in the logs. This gets its own page, [Structured errors, and the message the customer will actually read](/roles/forward-deployed-engineer/craft/structured-errors-and-the-message-a-customer-reads), because it is the difference between a support ticket you can act on and a support ticket that says "it didn't work".

### 6. A data contract, written down

Whatever you consume from their systems, write down the shape you are relying on: the fields, the types, the ones that are allowed to be null, and the ones whose absence should stop the pipeline. A dataclass or Pydantic model that raises on violation is the contract; a paragraph in the README is the explanation.

This exists because their systems will change under you without warning. The lab [The vendor changed a field name overnight](/roles/forward-deployed-engineer/craft/debugging-lab-the-vendor-changed-a-field-name) is the drill for exactly that.

### 7. A README with five sections and nothing else

Long READMEs do not get read. Five headings, in this order:

1. **What this does** — three sentences, in the customer's vocabulary, naming the workflow it serves.
2. **Run it** — one command block for production, one for local.
3. **Configure it** — a table of every environment variable, what it does, and whether it is a secret.
4. **What it does not do** — the explicit list of things a reader might reasonably assume and be wrong about. This is the section that prevents the worst arguments.
5. **When it breaks** — the three or four failures you actually expect, each with the symptom, the check, and the fix. A runbook in embryo.

Vinoo Ganesh's guide is blunt that the FDE bar is production code in someone else's environment, not prototypes. Section four is where prototypes usually get mistaken for products.

## What is different because you are forward deployed

**You do not own the pipeline.** Their CI may be Jenkins on a box, or a Bitbucket pipeline with a two-year-old runner. Assume your build has to work as a plain `docker build`, and add the pipeline glue after.

**You may not choose the base image.** A hospital chain's platform team may hand you an approved hardened base with no package manager. Pin your Python version and keep a list of the system packages you actually need, so the substitution is a fifteen-minute conversation rather than a rewrite.

**Egress is not free.** In a bank's VPC your service may have no route to the public internet. Anything you `pip install` at runtime, any font, any model download, any call to a public API, is a deployment failure waiting for a Friday. Vendored dependencies and an explicit list of outbound hostnames are part of the deliverable.

**Someone will ask for a Helm chart.** Not this week. Structure the service so that the answer is packaging, not surgery: no state on local disk, config from the environment, logs to stdout, one port.

## The handover rehearsal, in practice

Book forty-five minutes. Ask the customer's engineer to share their screen. Then:

1. They clone the repo. You say nothing.
2. They copy `.env.example` and fill it from their own secret store. You watch which variable names confuse them.
3. They run the start command. If it fails, they read the error and try to fix it. You still say nothing for two minutes.
4. They hit `/readyz` and a real endpoint.
5. You spend the last fifteen minutes fixing the README, live, with them watching.

Ramp's forward deployed team lists "generalise work" as a founding principle, and the README is where generalisation starts: the third time you write the same "when it breaks" entry, you have found a product bug rather than a documentation gap.

## What an interviewer can test

OpenAI's FDE loop, as described in Exponent's guide, centres on a take-home where you submit working code, a running app, and a recorded walkthrough. The walkthrough is where this page pays. An interviewer watching you narrate a service will notice, in order: whether it starts from a single documented command, whether config is externalised, whether errors say anything useful, and whether you can articulate what you deliberately did *not* build.

Build the skeleton once, properly, and keep it. Every lab in this phase starts from it.

## Do this now

Create a repo with the seven parts and nothing else: a single `GET /items` endpoint backed by an in-memory dict, validated settings, `/healthz` and `/readyz`, one auth dependency, a structured error handler, a Pydantic model as the data contract, and the five-section README. It should be under 200 lines. That skeleton is the artifact for this page.
