---
title: "Tests that earn their keep on a two-week engagement"
phase: craft
module: ship-a-service-end-to-end
kind: lesson
summary: You have two weeks, a demo on Thursday, and no time for a test pyramid. This is how to spend a small testing budget on the four kinds of test that actually stop a forward deployed project from failing, and how to say out loud what you chose not to test.
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Rank a testing backlog by what will actually break in a customer environment rather than by coverage.
  - Write a golden-fixture contract test from a real customer export, redacted safely.
  - Write a post-deploy smoke test the customer's own team can run without you.
  - State, in a handover document, what you deliberately did not test and why.
artifact: A test suite for your service skeleton with one golden fixture, one failure-path test, one smoke test runnable against a deployed URL, and a "not tested" section in the README.
sources:
  - https://finance.biggo.com/podcast/a5f316b781abb2dc
  - https://www.tryexponent.com/guides/palantir-forward-deployed-engineer-interview
  - https://www.welcometothejungle.com/en/companies/cohere/jobs/forward-deployed-engineer_fr_jfjwbzcr
  - https://www.firstresonance.io/blog/a-day-in-the-life-of-a-forward-deployed-systems-engineer-fdse-c
---

Jia Wu, who does forward deployed work at Cognition, put the shape of the problem plainly in a 2026 conference talk: writing code faster is "only 20% of the problem". The rest is "how do you test this code, how do you review and deploy this code, and how do you maintain this code across the enterprise".

That is the honest framing for testing on an engagement. You are not testing to reach a coverage number. You are testing so that a system you will stop touching in nine days keeps working in an environment you cannot see.

## The budget

Assume ten working days. Assume roughly one day of that, spread thin, goes to tests. That is a real budget and it is small. Spending it on unit tests for pure functions you wrote yesterday is the classic waste: those functions are the part of the system you understand best and control completely.

Spend it at the **seams**, where your assumptions meet their reality. Ranked, highest return first.

## 1. The contract test on their actual data

Get one real export. Not a sample you generated. A real CSV, a real API response, a real XML file, from their system, on the day you got access. Redact it, commit it as a fixture, and write a test that parses it.

```python
# tests/fixtures/tickets_2026_08_14.json  <- a redacted real export
# tests/test_contract.py
import json
from pathlib import Path

import pytest

from triage.parsing import parse_tickets

FIXTURE = Path(__file__).parent / "fixtures" / "tickets_2026_08_14.json"


def test_real_export_parses_and_keeps_every_row():
    raw = json.loads(FIXTURE.read_text())
    tickets = parse_tickets(raw)
    assert len(tickets) == len(raw["records"])
    assert all(t.ticket_id for t in tickets)


def test_priority_is_normalised_to_the_four_values_we_handle():
    raw = json.loads(FIXTURE.read_text())
    priorities = {t.priority for t in parse_tickets(raw)}
    assert priorities <= {"p1", "p2", "p3", "p4"}
```

This test is worth more than the next twenty because it encodes the one thing you cannot derive from documentation: what their data actually looks like. When a field name changes, a type flips from integer to string, or a priority value you have never seen appears in a Diwali-week backlog, this test fails and names the change.

**Redaction is not optional.** Under India's Digital Personal Data Protection Act 2023, and under GDPR or HIPAA elsewhere, a real export in your git repo is a problem even when the repo is private. Strip names, emails, phone numbers, account numbers and free-text bodies. Keep structure, cardinality and the weird values. Get it in writing from whoever owns the data that the redacted fixture may live in the repo. If the answer is no, keep the fixture on a customer-controlled path and read it through an environment variable, with a synthetic fallback checked in.

## 2. The failure-path test

Every integration you write will have a bad day. Their identity provider will time out, their warehouse will return a 503 during a maintenance window, a proxy will hand back an HTML error page with a 200 status code. Test the behaviour you want in each case, because it is the behaviour nobody will describe in a meeting.

```python
import httpx
import pytest
import respx

from triage.upstream import fetch_ticket, UpstreamUnavailable


@respx.mock
def test_timeout_raises_a_typed_error_not_a_raw_httpx_error():
    respx.get("https://crm.example.internal/tickets/42").mock(
        side_effect=httpx.ConnectTimeout("timed out")
    )
    with pytest.raises(UpstreamUnavailable) as exc:
        fetch_ticket("42")
    assert "crm" in str(exc.value)


@respx.mock
def test_html_error_page_with_a_200_is_treated_as_a_failure():
    respx.get("https://crm.example.internal/tickets/42").mock(
        return_value=httpx.Response(200, text="<html>Proxy error</html>")
    )
    with pytest.raises(UpstreamUnavailable):
        fetch_ticket("42")
```

That second test looks paranoid until the first time a corporate proxy does it to you. It is one of the most common surprises inside enterprise networks and it produces a bug report that reads "the parser crashed", three layers from the truth.

## 3. The smoke test they can run without you

Two or three assertions that hit a deployed URL and prove the thing is alive and connected. Parameterised by an environment variable, runnable from a laptop or their CI, and documented in the README as the first thing to run after any deploy or restart.

```python
import os

import httpx

BASE = os.environ["TRIAGE_BASE_URL"]
TOKEN = os.environ["TRIAGE_SMOKE_TOKEN"]


def test_service_is_ready():
    r = httpx.get(f"{BASE}/readyz", timeout=10)
    assert r.status_code == 200, r.text


def test_a_real_triage_round_trip():
    r = httpx.post(
        f"{BASE}/triage",
        json={"ticket_id": "SMOKE-1", "subject": "printer offline", "body": "n/a"},
        headers={"Authorization": f"Bearer {TOKEN}"},
        timeout=30,
    )
    assert r.status_code == 200
    assert r.json()["queue"] in {"hardware", "software", "billing", "unknown"}
```

This is the highest-leverage test on the list for handover specifically. It converts "is it working?" from a question that requires you into a command that anyone can run. Give it a fixed synthetic ticket id so it can be excluded from reporting.

## 4. The regression test that pins the bug you already hit

Every time you debug something on this engagement, before you fix it, write the failing test. It costs five minutes while the failure is fresh and it is the only artifact that stops the same bug returning after you leave.

The First Resonance account of a forward deployed systems engineer's day describes same-day patching of a data parser after a vendor changed field names, and adding barcode validation. Both are exactly this: a real production surprise that should end its life as a test case, not just a patch.

## What to skip, and to say you skipped

Write this list in the README under "What this does not do". A short, specific, unapologetic list is a professional act; discovering the gap six months later is not.

| Skipped | Why it is defensible |
|---|---|
| Unit tests for pure formatting helpers | Cheap to re-derive, low blast radius, covered incidentally by the contract test |
| Load and performance testing | No agreed volume yet; add when the pilot volume is known |
| Browser end-to-end tests | The UI is three screens and changes weekly during the pilot |
| Their identity provider's behaviour | Not yours to test; assert your handling of its failures instead |
| Database migrations under load | Single-writer service, maintenance-window deploys agreed with their ops team |

The pattern is: name the risk, name why you accepted it, name the condition under which it stops being acceptable.

## Making the suite runnable inside their walls

A test suite that only runs on your laptop is a test suite that dies at handover.

- **No network in unit tests.** Everything mocked. Their build agents may have no egress at all, and a test that quietly reaches out to a public API will fail in a way that looks like your code is broken.
- **No Docker assumption.** If your integration tests need Postgres, make them skip cleanly with a clear message when `TRIAGE_DATABASE_URL` is unset, rather than erroring.
- **Pin everything.** A lockfile, and a wheel cache if the environment is air-gapped. "It worked last week" is usually a transitive dependency that moved.
- **One command.** `pytest` with no arguments runs the safe set. Anything needing credentials sits behind a marker: `pytest -m smoke`.

## The interview angle

Palantir's onsite pool includes a **Re-engineering** round: find and fix bugs in a three-hundred-plus-line block of unfamiliar code. Cohere's FDE posting asks for "production-grade Python with clean, testable code". Neither of those is asking for coverage. Both are asking whether you can look at code you did not write and find the seams where it will fail.

Practise by narrating: given this function, what are the three inputs that break it, and which of the three would a customer actually send? That question, asked out loud, is the whole skill.

## Do this now

Take the service skeleton from [Anatomy of a service you can hand over](/roles/forward-deployed-engineer/craft/anatomy-of-a-service-you-can-hand-over) and add four tests: one golden fixture built from a realistic messy export you write by hand, one timeout test, one smoke test parameterised by a base URL, and one regression test for a bug you deliberately introduce and then fix. Then write the "What this does not do" table. Five tests and a table is the whole deliverable.
