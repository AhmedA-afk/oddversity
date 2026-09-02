---
title: "Extract, transform, load: the honest version"
phase: data
module: etl-and-messy-data
kind: lesson
summary: Most of the work in a deployment is not analysis, it is getting at the data, cleaning it and joining it. This is what ETL actually looks like inside a customer, and the three properties every pipeline you leave behind has to have.
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Explain why extraction, not transformation, is usually the part that slips a deadline.
  - Write a loader that can be re-run twice on the same file without duplicating or corrupting rows.
  - Choose between full reload and a watermarked incremental load, and defend the choice.
artifact: A one-page pipeline contract for your current project, naming source, grain, key, watermark, and what happens on a re-run.
sources:
  - https://www.lennysnewsletter.com/p/inside-palantir-nabeel-qureshi
  - https://nabeelqu.co/reflections-on-palantir
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-for-enterprise-llm-deployments
---

Nabeel Qureshi spent eight years as a Forward Deployed Engineer at Palantir. On Lenny's podcast he says the thing that most people building AI products refuse to believe:

> 95% of enterprise data problems involve access, cleaning and joining data, not analysis.

That is the sentence this whole phase is built on. You will be hired for the model, or the agent, or the dashboard. You will spend most of the engagement on the three verbs in that quote. Colin Jarvis, who runs OpenAI's Forward Deployed Engineering team, says something adjacent: the layer between raw data and business logic is "the underrated space" where his teams spend substantial time, and the systems he names are data warehouses and SharePoint.

So the useful version of ETL is not the textbook one. It is a description of where the time goes.

## E is the hard part, and it is not technical

Extraction in a tutorial is `pd.read_csv`. Extraction in a customer is a sequence like this.

You ask for the sales table. The business owner says yes. Three days later you learn the sales table lives in an Oracle instance the ERP vendor manages under contract, and only the vendor's support desk can grant read access, and the request needs a signed change form from a director who is travelling. Meanwhile someone offers you a CSV that an analyst exports weekly, which is close to the table but not the same, because the export applies a filter nobody has written down.

Almost every extraction problem is one of five:

- **Access.** Credentials, VPN, a jump host, a firewall allowlist, a licence seat, a ticket queue. Start this on day one, before you know what you need, because the lead time is measured in weeks and it runs in parallel with everything else.
- **Interface.** A database you can query, an API with a rate limit, a file drop on SFTP, a report someone emails, a screen with no export button at all.
- **Grain.** What one row means. "One order" and "one order line" are different tables that both get called `orders`.
- **Volume and window.** The DBA will not let you scan the production table at 11 a.m. You get a window, or a replica, or a nightly dump.
- **Permission to see it.** Being technically able to read a table is not the same as being allowed to. This becomes a real problem in [identity, permissions and residency](/roles/forward-deployed-engineer/data/data-residency-dpdp-gdpr-hipaa); do not paper over it now.

Write down which of the five is blocking you, and take it to the person who can clear it. "The pipeline is blocked on a firewall rule for 10.4.0.0/16 to port 1521, ticket INC-40912, raised Tuesday" moves. "Data access issues" does not.

## T is where the domain lives

Transformation is the only part of a pipeline that encodes business meaning, which means it is the part you cannot write correctly on your own. Every non-obvious transform in a customer pipeline is a decision someone made, usually years ago, often for a reason that still holds.

A short list of transforms that always turn out to be domain rules in disguise:

- Which rows to drop. Cancelled orders, test accounts, internal transfers, the branch that closed in 2019, the vendor code used for adjustments.
- How to define a date. The invoice date, the posting date, the date the goods left the gate, and the date the finance team recognises revenue are four different dates, and the report the customer wants uses exactly one of them.
- What "active" means. Ask this out loud. A co-operative bank might call an account active if there was one transaction in twelve months. The core banking system might flag it inactive after six. The report reconciles to neither.
- Units and currency. Kilograms versus metric tonnes, paise versus rupees, the rate table used for conversion and its as-of date.
- Deduplication rules. Which of two near-identical customer records wins, and on what evidence.

Every one of these belongs in a comment next to the code and in a line in the handover document, attributed to the person who told you. "Cancelled orders excluded (status in CANC, CANX). Confirmed by R. Nair, Order Management, 14 Aug." That attribution is what stops the rule being silently reversed by the next engineer, and it is what protects you when a number in the demo does not match a number in someone's spreadsheet.

## L is where you decide whether you can be re-run

The load step gets the least attention and causes the most incidents. There is one question that matters: **what happens if this runs twice on the same input?**

It will run twice. A job will time out and be retried. Someone will re-drop yesterday's file. You will re-run it yourself at 11 p.m. before a demo. If a second run duplicates rows, the numbers in the demo double, and you will find out in front of the customer.

The fix is a natural key and an upsert.

```python
import csv
import sqlite3

DDL = """
CREATE TABLE IF NOT EXISTS invoice (
    invoice_id   TEXT PRIMARY KEY,
    vendor_code  TEXT NOT NULL,
    invoice_date TEXT,
    amount_paise INTEGER NOT NULL,
    source_file  TEXT NOT NULL,
    loaded_at    TEXT NOT NULL
)
"""

UPSERT = """
INSERT INTO invoice (invoice_id, vendor_code, invoice_date,
                     amount_paise, source_file, loaded_at)
VALUES (:invoice_id, :vendor_code, :invoice_date,
        :amount_paise, :source_file, datetime('now'))
ON CONFLICT(invoice_id) DO UPDATE SET
    vendor_code  = excluded.vendor_code,
    invoice_date = excluded.invoice_date,
    amount_paise = excluded.amount_paise,
    source_file  = excluded.source_file,
    loaded_at    = excluded.loaded_at
"""


def load(conn, rows):
    conn.execute(DDL)
    conn.executemany(UPSERT, rows)
    conn.commit()


if __name__ == "__main__":
    rows = [
        {"invoice_id": "INV-1", "vendor_code": "V100",
         "invoice_date": "2026-08-01", "amount_paise": 125000,
         "source_file": "aug.csv"},
        {"invoice_id": "INV-2", "vendor_code": "V101",
         "invoice_date": None, "amount_paise": 9900,
         "source_file": "aug.csv"},
    ]
    conn = sqlite3.connect(":memory:")
    load(conn, rows)
    load(conn, rows)          # the retry
    print(conn.execute("SELECT count(*) FROM invoice").fetchone()[0])
```

That prints `2`, not `4`. If your loader cannot pass that test, it is not finished.

Two details in that snippet are field habits rather than style. `amount_paise` stores money as an integer in the smallest unit, because floats will eventually give you a total that ends in `.9999999`. `source_file` and `loaded_at` are lineage columns: when the customer asks why a number changed, you need to be able to answer "that row last came from `aug.csv` at 03:14" without guessing.

## Full reload or incremental

Two strategies, and the choice is a calibration call, not a preference.

**Full reload.** Truncate the target, load everything, every time. Correct by construction, trivially re-runnable, self-healing when the source is corrected retroactively. Costs a full scan.

**Incremental with a watermark.** Keep the maximum `modified_at` you have seen, ask the source for rows newer than that, upsert them. Cheap, and wrong in four specific ways you must handle: rows deleted at the source never disappear from yours; rows updated without touching `modified_at` are missed; clock skew between source and pipeline can skip a boundary row; and late-arriving corrections dated in the past are invisible.

The field default is: **full reload until it hurts**. If the table is under a few million rows and the window allows it, reload. Take a watermark when the DBA asks you to, and when you do, overlap the window (re-read the last hour or day) and add a periodic full reconciliation so drift is caught rather than compounded.

## The three properties of a pipeline you can hand over

Whatever the stack, the pipeline you leave behind needs three things. Nothing else on the list matters as much.

1. **Re-runnable.** Same input, same result, no matter how many times. Proven by an actual test, not by intention.
2. **Observable.** Every run writes a row: run id, source, rows read, rows written, rows rejected, duration, outcome. When something is wrong three weeks after you leave, this table is the first place the customer's own engineer looks, and it is the difference between them fixing it and them calling you.
3. **Explainable.** For any number in the output, you can trace it to a source row and a named rule. Lineage columns plus the rules document.

A pipeline with those three properties and ugly code is a good handover. A beautiful pipeline without them is a support ticket with your name on it.

## What an interviewer can test

In a decomposition round, "how would you get the data" is a question you should be able to answer in structure, not in tools. A strong answer names the five extraction blockers, asks what one row means before asking about volume, asks who owns the definition of the business rules, and says out loud what happens on a re-run. A weak answer opens with a diagram containing Kafka.
