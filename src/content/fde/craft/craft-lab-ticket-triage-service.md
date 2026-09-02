---
title: "Lab: the ticket-triage service, shipped with a README"
phase: craft
module: ship-a-service-end-to-end
kind: lab
summary: Build and hand over a ticket-routing service for a fictional eleven-hospital network in Maharashtra, working from a messy export of 500 real-shaped tickets. Deterministic rules, structured errors, four tests, a container, and a README a stranger can follow.
duration: 7 h
updated: "2026-09-02"
outcomes:
  - Ship a FastAPI service with validated config, health and readiness endpoints, structured errors and a data contract.
  - Turn an ambiguous routing request into a rules file the customer can edit without you.
  - Produce a coverage report showing what fraction of real tickets your rules route confidently.
  - Run a handover rehearsal and fix every README gap it exposes.
artifact: A public repository containing the triage service, its rules file, its tests, a Dockerfile, a five-section README and a one-page routing report. This is the first portfolio piece of the Build stage.
sources:
  - https://vinoo.io/writing/2026-02-05-forward-deployed-engineering/
  - https://engineering.ramp.com/post/forward-deployed-engineering
---

## The situation

**Sahyadri Health Network** is a fictional chain of eleven hospitals across Maharashtra and northern Karnataka. Its central IT helpdesk receives roughly 400 tickets a working day through a legacy tool. Two coordinators read every incoming ticket and drag it into one of six queues. They are the bottleneck: tickets raised after 6 p.m. sit untriaged until the next morning, and the two of them are also the only people who know the routing rules.

The IT head, Meera Kulkarni, has asked for "AI ticket triage". Her stated goal in the kickoff was "the coordinators should only look at the hard ones".

You have ten days. This lab is days one to three.

**What you are given:** one CSV export of 500 tickets from the last fortnight, produced by a coordinator who clicked Export in the legacy tool. It has these columns.

| Column | Reality |
|---|---|
| `TicketNo` | Mostly `SHN-######`, but 14 rows use an older `HD/######` format |
| `Raised` | `14-08-2026 18:42` in most rows, ISO 8601 in 61 rows, blank in 3 |
| `Site` | Free text. `Pune`, `pune`, `Pune - Kothrud`, `PNQ`, and 9 blanks |
| `Subject` | Free text, sometimes empty, sometimes the whole problem |
| `Body` | Free text, English and Marathi and mixed, occasionally with a pasted email chain |
| `Queue` | The coordinator's decision. Six values plus 7 rows of `Misc` |
| `RaisedBy` | Employee name and email. **Personal data.** |

Build the export yourself before you start: write a 40-line script that generates 500 rows with all of the above defects. Doing that is part of the lab, because it forces you to decide what "messy" means before you write the parser.

## Deliberately out of scope

No model, no LLM, no embeddings. The routing here is rules, in a file the customer can edit. If that feels like a downgrade from "AI ticket triage", read [Script or architecture: the calibration call](/roles/forward-deployed-engineer/craft/script-or-architecture-the-calibration-call) first. The AI phase of this path revisits this exact service with an eval harness in front of it, and the whole point is that you will then be able to prove whether the model beat the rules.

## Steps

### 1. Read the data before you write anything (45 min)

Open the CSV in a terminal, not a spreadsheet. Answer, in writing:

- How many distinct values does `Queue` take, and what is the count of each?
- What fraction of tickets have an empty `Subject`?
- How many distinct spellings does `Site` have, and how do they collapse to eleven hospitals?
- Which two queues account for the most tickets? Which queue has the fewest examples?

```bash
cut -d, -f6 tickets.csv | sort | uniq -c | sort -rn
```

Write the answers in a file called `data-notes.md` in the repo. This file is a deliverable. It is the first thing you will show Meera, and it is the reason you will be trusted for the rest of the engagement.

### 2. Write the data contract (30 min)

A Pydantic model with an explicit decision for every defect you found: which fields are required, which are normalised, and what happens to a row that violates the contract. Rows are skipped and counted, never silently dropped.

```python
from datetime import datetime
from pydantic import BaseModel, field_validator

class RawTicket(BaseModel):
    ticket_no: str
    raised: datetime | None
    site: str | None
    subject: str = ""
    body: str = ""
    queue: str | None

    @field_validator("raised", mode="before")
    @classmethod
    def parse_either_format(cls, v):
        if not v or not str(v).strip():
            return None
        for fmt in ("%d-%m-%Y %H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.strptime(str(v).strip(), fmt)
            except ValueError:
                continue
        raise ValueError(f"unparseable timestamp: {v!r}")
```

Note that `14-08-2026` and `08-14-2026` are indistinguishable for the first twelve days of a month. Ask which it is; do not infer. Write the answer in `data-notes.md`.

### 3. Strip the personal data at the boundary (20 min)

`RaisedBy` never enters your service, your logs, or your repository. Hash it to a stable pseudonymous id if you need to group by requester, and record that decision in `data-notes.md` with a line about India's Digital Personal Data Protection Act 2023 and who at Sahyadri approved the handling.

### 4. Build the rules engine (90 min)

A YAML file the customer can edit, and forty lines of Python that evaluate it in order.

```yaml
# config/rules.yaml
queues: [hardware, network, applications, clinical_systems, accounts, facilities]
default: unrouted
rules:
  - queue: clinical_systems
    any_of: ["PACS", "radiology", "HIS", "lab report", "प्रयोगशाळा"]
    priority: 10
  - queue: network
    any_of: ["wifi", "wi-fi", "vpn", "no internet", "slow network"]
    priority: 20
  - queue: hardware
    any_of: ["printer", "monitor", "keyboard", "laptop not starting"]
    priority: 30
```

Rules are matched case-insensitively against subject and body combined, lowest `priority` number wins, and a ticket matching nothing gets `unrouted`. Return the matched rule so the answer is explainable:

```json
{"queue": "network", "matched": "vpn", "rule_priority": 20, "confidence": "rule"}
```

Explainability is not a nicety here. When a ticket is misrouted, a coordinator has to be able to see why in one glance and change the rules file themselves. That is what makes this a handover rather than a dependency.

### 5. Wrap it in the service skeleton (60 min)

Use the skeleton from [Anatomy of a service you can hand over](/roles/forward-deployed-engineer/craft/anatomy-of-a-service-you-can-hand-over). Endpoints:

- `POST /triage` — one ticket in, a routing decision out.
- `POST /triage/batch` — up to 500 tickets, same decision shape per ticket, with a summary count.
- `GET /rules` — returns the loaded rules and the file's modification time, so anyone can confirm which version is live.
- `GET /healthz`, `GET /readyz`.

Auth: a bearer token from configuration. Not because it is good security, but because it is what their integration team will actually be able to configure this week, and it is honest about what it is in the README.

### 6. Errors and the catalogue (30 min)

Implement the handler from the structured-errors lesson and write the catalogue table. At minimum: `INVALID_TICKET_PAYLOAD`, `BATCH_TOO_LARGE`, `RULES_FILE_INVALID`, `NOT_READY`. The `RULES_FILE_INVALID` message must name the line number, because the person who broke the file is a coordinator, not an engineer.

### 7. Tests (60 min)

Four, matching the four categories:

1. **Contract:** parse the 500-row fixture, assert every row is either parsed or counted as skipped, with a skipped count under a threshold you choose and justify.
2. **Failure path:** a malformed rules file raises `RULES_FILE_INVALID` with the line number.
3. **Smoke:** hit a deployed base URL, route one synthetic ticket, assert the queue is in the allowed set.
4. **Regression:** the Marathi keyword rule. Add a test for a body containing `प्रयोगशाळा` and confirm the encoding survives the whole path, file to response.

### 8. The routing report (45 min)

Run the batch endpoint over all 500 tickets and compare your routing against the coordinator's `Queue` column. Produce a one-page `report.md`:

- Overall agreement percentage.
- Agreement per queue, so the weak queue is visible.
- The count of `unrouted` tickets.
- Ten sampled disagreements with the ticket text, and your judgement on which of you was right.

That last section is the most valuable page in the repository. Some of the disagreements will be coordinator errors, and finding them changes the conversation from "is your system accurate" to "here are eight tickets your team misrouted last fortnight".

### 9. Container and README (45 min)

A Dockerfile that runs with no network access at build time beyond the package install, a `.env.example`, and the five-section README. The "What this does not do" section must include: no learning from corrections, no Marathi beyond the listed keywords, no handling of attachments, no queue for `Misc`.

### 10. Handover rehearsal (45 min)

Find a person who has not seen the repo. Give them the URL and nothing else. Watch them, silently, until they either have it running or give up. Fix the README, not the conversation.

## Definition of done

- [ ] `docker run` with a filled `.env` starts the service; `/readyz` returns 200.
- [ ] `POST /triage` returns a queue, the matched keyword, and a correlation id, for a ticket with an empty subject.
- [ ] A coordinator can add a keyword by editing `config/rules.yaml` and restarting, with no code change.
- [ ] A broken rules file produces `RULES_FILE_INVALID` naming the line, and the service refuses to start rather than serving stale rules.
- [ ] `pytest` passes offline, with no network.
- [ ] `report.md` states an agreement percentage, per-queue breakdown, and ten reviewed disagreements.
- [ ] `data-notes.md` records every data defect and the decision made about it.
- [ ] No personal data anywhere in the repository, including the fixture.
- [ ] A person who has never seen the repo got it running from the README alone.

## How this could go wrong

**You build a classifier on day one.** The request said AI. The data says six queues, of which two carry most of the volume, and a keyword list covers a large fraction. Build the rules, measure, and let the report make the case for a model. Ramp's forward deployed team lists "always be scoping: question all requirements" as a founding principle, and this is what that looks like on a Tuesday.

**You accept `Queue` as ground truth.** It is one coordinator's opinion, made in a hurry, and the `Misc` rows are where they gave up. Treat it as a strong signal, not a label set.

**You infer the date format.** Half the year, `14-08-2026` and `08-14-2026` produce different months and nobody notices until a report is wrong in November. Ask.

**Unicode dies somewhere in the middle.** The Marathi keyword works in your test and returns mojibake through the container because a locale is unset or the CSV was written as CP1252. This is why the regression test runs end to end and not against the function.

**You make the rules file too clever.** Regular expressions, nested conditions, a small expression language. The person maintaining it is a helpdesk coordinator. Keyword lists and an ordering are the ceiling.

**You skip the report.** Without it you have a service and no evidence. With it you have a document that decides the next two weeks of the engagement, and a portfolio piece that shows judgement rather than syntax.
