---
title: "Bronze, silver, gold: medallion layers for a small team"
phase: data
module: etl-and-messy-data
kind: lesson
summary: The medallion pattern gives you a rollback, an audit trail and a place to put every argument about definitions. Here is how to run it with a folder and one database rather than a platform, and when it is overkill.
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Lay out bronze, silver and gold layers for a deployment using only object storage and one relational database.
  - Reprocess a month of history from bronze after a business rule changes, without going back to the source system.
  - Decide when three layers is the wrong answer for the size of the problem.
artifact: A layered repository skeleton (bronze paths, silver models, gold views) with the naming convention documented in its README.
sources:
  - https://abhijayvuyyuru.substack.com/p/the-free-8-week-roadmap-to-become
  - https://github.com/goday-org/FDE-Handbook
  - https://www.zenml.io/llmops-database/forward-deployed-engineering-for-enterprise-llm-deployments
---

Medallion architecture is three layers with unglamorous names. Bronze is what arrived. Silver is what it means. Gold is what someone asks for. It shows up in most FDE-oriented curricula, including Abhijay Vuyyuru's roadmap and the open FDE handbook, usually attached to a platform like Databricks. You do not need the platform. You need the discipline, and the discipline is worth more than the tooling.

The reason to care is not elegance. It is that on a deployment you will be told, in week five, that a rule you were given in week one was wrong. Medallion is what makes that a two-hour fix instead of a re-negotiation with the customer's DBA for another extract.

## Bronze: what arrived, unchanged

Bronze is the raw landing zone. One rule: **bronze is append-only and byte-identical to what the source gave you.** No parsing, no renaming, no type coercion, no fixing that obviously broken row.

Layout by source and by arrival, not by content:

```
bronze/
  erp_orders/
    ingest_date=2026-08-01/orders_20260801.csv.gz
    ingest_date=2026-08-02/orders_20260802.csv.gz
  crm_accounts/
    ingest_date=2026-08-01/accounts.csv.gz
  sharepoint_pricelists/
    ingest_date=2026-08-01/Pricelist_FINAL_v3.xlsx
```

Alongside each file, a small manifest: source system, who or what produced it, the extraction window it claims to cover, byte size, a SHA-256 of the file, and the run id. That manifest is how you prove, three weeks later, that the file the customer says they sent on the 3rd was not the file that landed.

Bronze buys you four things:

- **A rollback.** Any rule change is replayed from bronze. You never go back to the source system for history you already have.
- **An arbiter.** When your number and the customer's number disagree, you can open the exact bytes that produced yours.
- **Cheap re-extraction of new fields.** The column nobody asked for in week one is already sitting in bronze in week six.
- **A boundary for the compliance conversation.** Bronze is the only place raw personal data has to live, so retention and access controls have one obvious place to apply.

Compress it, keep it immutable, and set a retention policy on it deliberately rather than by accident.

## Silver: conformed, typed, deduplicated

Silver is where the messy-data work from the previous lesson gets applied. One table per business entity, not one per source file. Typed columns, real nulls, canonical identifiers, one row per thing at a stated grain.

Silver rules that survive contact with customers:

- **State the grain in the table comment.** "One row per order line per revision" is a sentence that prevents a month of argument.
- **Keep the source key and add a surrogate key.** You need `erp_order_id` and `crm_opportunity_id` side by side to explain a join to a human.
- **Carry lineage.** `_source_file`, `_ingested_at`, `_run_id` on every silver row.
- **Quarantine, do not drop.** Rows that fail a contract go to `silver_rejects` with the raw payload and a reason code. The count per reason is your weekly data-quality note.
- **No business opinions.** Silver says what happened. It does not say whether a customer is "active" or an order is "at risk". That is gold.

That last rule is the one people break. The moment a definition anyone might argue about lands in silver, every downstream number inherits the argument and you cannot show two versions side by side.

## Gold: one table per question

Gold is shaped for consumption. A dashboard, a report, an API endpoint, the retrieval corpus for an assistant. It is denormalised, it is named in the customer's language, and each object exists because a named person asked a named question.

```sql
-- gold: daily dispatch performance, as the operations head asks for it.
-- Grain: one row per plant per IST business day.
-- "On time" = dispatched on or before promised_date. Confirmed by
-- S. Iyer (Ops), 14 Aug 2026. Cancelled orders excluded.
CREATE VIEW gold_dispatch_daily AS
SELECT
    o.plant_code,
    o.dispatch_business_day               AS business_day,
    COUNT(*)                              AS lines_dispatched,
    SUM(CASE WHEN o.dispatch_date <= o.promised_date
             THEN 1 ELSE 0 END)           AS lines_on_time,
    SUM(o.value_paise)                    AS value_paise
FROM silver_order_line o
WHERE o.status NOT IN ('CANC', 'CANX')
GROUP BY o.plant_code, o.dispatch_business_day;
```

Two things in that snippet are the point. The definition of "on time" is written down, with the person who owns it and the date. And it lives in gold, so when the finance head insists that "on time" should be measured against the revised promise date rather than the original, you add `gold_dispatch_daily_v2` and show both, instead of rewriting history and breaking last month's report.

## Running it without a platform

You do not need Delta Lake, Iceberg, or a Spark cluster to get the value. A deployment at a mid-sized customer can run all three layers on:

- **Bronze:** an S3 bucket, an Azure container, or, at a customer with no cloud at all, a dated directory on a file server that is backed up.
- **Silver:** tables in Postgres. Or DuckDB over Parquet files if the volumes are large and the analysis is read-only.
- **Gold:** views in the same database, plus a materialised table if a view is too slow.
- **Orchestration:** cron and a Python entrypoint, until the failure modes justify Airflow or Dagster. Two scheduled jobs do not need a scheduler with a web UI.

The naming convention matters more than the technology, because the customer's own engineer has to navigate it after you leave:

```
bronze_<source>_<object>        bronze_erp_orders
silver_<entity>                 silver_order_line
gold_<audience>_<question>      gold_ops_dispatch_daily
```

Anyone who reads three table names now knows the rule.

## The reprocess drill

This is the capability the layers exist to give you. Practise it once before you need it.

1. A rule changes: cancelled orders should now include status `HOLD` older than 30 days.
2. Change the silver transform. Do not touch bronze.
3. Rebuild silver for the affected window from bronze into a new run id.
4. Compare row counts and key totals between the old and new silver, per day. Expect the diff to be explainable in one sentence.
5. Swap gold to the new run, keeping the old one queryable for a week.
6. Send the customer the diff, not just the new number.

If any of those steps requires talking to the source system's owner, your bronze layer is not doing its job.

## When three layers is the wrong answer

Calibration applies here as much as anywhere. Colin Jarvis describes the layer between raw data and business logic as underrated, which it is, and that is not a licence to build a warehouse for a problem that is one query wide.

Skip layers when:

- The whole engagement is one report over one source, and the source is a clean API. One transform, one output, done.
- The data is small, static reference material, for example a price list that changes quarterly. Version the file; do not build a pipeline around it.
- The customer already has a warehouse with a curated layer. Your silver is their existing model. Build on it and say so, rather than shadowing it and creating a second version of the truth, which is the thing their data team will most resent.

Collapse bronze and silver when the source is already immutable and typed, for example a Parquet export you cannot re-request. Collapse silver and gold when there is exactly one consumer and one definition.

The test to apply: **can a rule change be replayed without asking anyone for anything?** If yes, you have enough layers. If no, you need one more.

## What you can now do

You can lay out a deployment so that the inevitable "actually, that definition was wrong" costs an afternoon, and so that the customer's own engineer can find, six months later, the exact file and the exact rule behind a number on a screen. That is the whole argument for the pattern, and it is enough.
