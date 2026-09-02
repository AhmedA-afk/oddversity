---
title: "Indexes, EXPLAIN, and the report that takes forty minutes"
phase: foundations
module: sql-without-googling
kind: lesson
summary: "A report that used to run in seconds now takes forty minutes, and nobody changed the query. This lesson is about reading a query plan to find out what actually changed, and fixing it with an index instead of a rewrite."
duration: 13 min
updated: "2026-09-02"
outcomes:
  - Explain what an index does and why it doesn't help every query.
  - Read an EXPLAIN ANALYZE plan and identify a sequential scan that should be an index scan.
  - Add a targeted index and confirm, with numbers, that it fixed the actual problem.
artifact: An EXPLAIN ANALYZE before-and-after pair, saved in your journal, from a query you actually sped up.
---

An index is a separate, sorted structure the database maintains alongside a table, built on one or more columns, so that finding rows matching a condition on those columns doesn't require reading every row in the table. Almost every database index you'll meet in practice is a B-tree: think of it like the index at the back of a book — instead of reading every page to find "cardamom," you jump to the C section. Without an index, the database does the equivalent of reading every page: a **sequential scan**, checking every row against your condition. On a table with two hundred rows that's instant. On a table with forty million rows, accumulated over three years of a hospital chain's admissions, it's the forty-minute report.

## Why the report got slow without anyone changing the query

This is the actual, common shape of the bug: the query didn't change. The data did. A table that had 50,000 rows when the report was written now has 40 million, because eighteen months of production data accumulated on top of the test data the report was built and tested against. A sequential scan over 50,000 rows is fast enough that nobody noticed the missing index. A sequential scan over 40 million rows is not. Nothing broke — the table just grew past the point where "just scan it" was a reasonable plan, and no index was ever added because the query always used to be fast.

## Reading EXPLAIN

`EXPLAIN` shows you the query plan the database's optimiser chose, without running the query. `EXPLAIN ANALYZE` actually runs it and shows you real timings alongside the plan, which is what you want when diagnosing a slow query (be careful running `ANALYZE` on a query that writes data — it executes it for real).

```sql
EXPLAIN ANALYZE
SELECT patient_id, admission_date, department
FROM admissions
WHERE department = 'Cardiology'
  AND admission_date >= '2026-01-01';
```

A plan for this without an index looks roughly like:

```
Seq Scan on admissions  (cost=0.00..891234.00 rows=41203 width=24)
                        (actual time=0.031..38214.552 rows=40988 loops=1)
  Filter: (department = 'Cardiology'::text AND admission_date >= '2026-01-01'::date)
  Rows Removed by Filter: 39958012
Planning Time: 0.412 ms
Execution Time: 38221.887 ms
```

Read this bottom-up in terms of what matters: `Execution Time: 38221.887 ms` is thirty-eight seconds, and `Seq Scan on admissions` with `Rows Removed by Filter: 39958012` tells you exactly why — it read almost forty million rows to keep forty-one thousand of them. That "rows removed" line is the single most useful number in the plan: it's the waste.

After adding an index on the columns the query filters on:

```sql
CREATE INDEX idx_admissions_dept_date ON admissions (department, admission_date);
```

```
Index Scan using idx_admissions_dept_date on admissions
                        (cost=0.43..1204.11 rows=41203 width=24)
                        (actual time=0.045..18.203 rows=40988 loops=1)
  Index Cond: (department = 'Cardiology'::text AND admission_date >= '2026-01-01'::date)
Planning Time: 0.298 ms
Execution Time: 19.847 ms
```

Same result set, thirty-eight seconds down to twenty milliseconds, because the index went straight to the matching rows instead of reading the whole table. This is what "the report went from forty minutes to under a second" looks like in the plan, not just in the wall clock.

## Column order in a composite index

`CREATE INDEX idx_admissions_dept_date ON admissions (department, admission_date)` is a composite index, and column order matters. It's efficient for filtering on `department` alone, or `department` and `admission_date` together, because the index is sorted by `department` first and `admission_date` second within each department — like a phone book sorted by last name then first name. It is close to useless for filtering on `admission_date` alone, because the index isn't sorted by date at the top level; the database would still have to scan every department's slice. If your queries filter by date without department roughly as often as the other way round, you need a second index on `admission_date` alone, or to lead the composite index with the column that's used alone more often.

## When an index does not help

Indexes aren't free, and they aren't always the answer, which is worth knowing before you reach for `CREATE INDEX` on everything.

- **Low-cardinality columns.** An index on a boolean `is_active` column, or a status column with three possible values, gives the planner little to work with — filtering to "one of three roughly-equal-sized buckets" isn't much better than scanning, and the planner will often ignore the index and scan anyway, correctly.
- **Small tables.** A sequential scan over 3,000 rows takes microseconds. An index adds overhead to every write to that table for a read speedup you'll never notice. Not every table needs indexing.
- **A function wrapped around the column in WHERE.** `WHERE LOWER(email) = 'x@y.com'` cannot use a plain index on `email`, because the index is sorted by the raw column values, not by the result of applying `LOWER` to them. You need either an index on the expression itself (`CREATE INDEX ON users (LOWER(email))`) or to store the normalised value.
- **Writes get slower.** Every `INSERT`, `UPDATE`, or `DELETE` has to update every index on that table, not just the table itself. A table with eight indexes, most of them unused by any real query, is paying that cost on every write for no benefit — a common state to find a legacy table in, and worth cleaning up, carefully, rather than just adding a ninth index on top.

## The actual diagnostic sequence

When someone says "the report is slow," the sequence that gets to an answer fastest:

1. Get the exact query being run — not a paraphrase, the literal SQL, with real parameter values if it's parameterised.
2. Run `EXPLAIN ANALYZE` on it against production-shaped data (or the closest you're allowed to touch).
3. Find the step with the largest gap between the row count the planner expected and the actual row count, or the step consuming the most of the total execution time. In Postgres this is often, but not always, a `Seq Scan` with a large `Rows Removed by Filter`.
4. Check whether the filtered/joined column already has an index. If not, that's usually the fix. If it does and the plan still scans, check for a wrapping function, a type mismatch (`WHERE id = '4471'` against an integer column can silently prevent index use in some engines), or genuinely low selectivity.
5. Add the index, re-run `EXPLAIN ANALYZE`, and compare the actual numbers — not "it feels faster," the execution time, before and after.

## The FDE version of this lesson

This is one of the most common live-coding scenarios in an FDE loop: a slow query on an unfamiliar schema, and a request to make it fast, narrated out loud. The wrong instinct is to start rewriting the query — restructuring joins, adding a subquery — before looking at the plan. The right instinct is `EXPLAIN ANALYZE` first, always, because it tells you where the forty minutes is actually going instead of where you'd guess it's going. In the field, this is also the conversation where you push back gently on "just add an index to everything," because you can show, with `EXPLAIN`, exactly which one index fixes exactly this report, and why the other seven suggested by a well-meaning junior colleague wouldn't.
