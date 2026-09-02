---
title: "SELECT, WHERE, GROUP BY, HAVING: the four you use every day"
phase: foundations
module: sql-without-googling
kind: lesson
summary: "These four clauses cover most of the SQL you will write in the field. This lesson is about the order they actually execute in, because that order — not the order you type them — is what explains every confusing error you will hit with them."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Write a SELECT with WHERE, GROUP BY, and HAVING that filters rows before aggregating and filters aggregates after.
  - Explain, from the execution order, why WHERE cannot reference an aggregate and HAVING can.
  - Diagnose a query returning the wrong row count by checking which clause is doing the filtering you expected another clause to do.
---

Most SQL a Forward Deployed Engineer writes day to day is not exotic. It is `SELECT`, `WHERE`, `GROUP BY`, and `HAVING`, composed correctly, against a schema you have never seen before, under time pressure, without reaching for a search engine. This lesson is not a syntax reference — you already half-know the syntax. It is about the one thing that actually causes confusion with these four clauses: SQL executes in a different order than you type it in.

## The order you write it in, and the order it runs in

You write a query in this order:

```sql
SELECT customer_id, COUNT(*) AS order_count
FROM orders
WHERE status = 'completed'
GROUP BY customer_id
HAVING COUNT(*) > 5
ORDER BY order_count DESC;
```

It executes in roughly this order:

1. `FROM` — identify the source table(s).
2. `WHERE` — filter individual rows, before any grouping happens.
3. `GROUP BY` — collapse the remaining rows into groups.
4. Aggregate functions (`COUNT`, `SUM`, `AVG`) — computed per group.
5. `HAVING` — filter groups, based on the aggregate values just computed.
6. `SELECT` — choose which columns/expressions to return.
7. `ORDER BY` — sort the final result.

Almost every "why does this query error" or "why is this filtering wrong" question about these clauses is answered by this list. `WHERE` runs before grouping exists, so it can only see individual row values — it has no concept of a group's `COUNT` yet, because groups have not been formed. `HAVING` runs after grouping and aggregation, so it can filter on `COUNT(*) > 5` because that count already exists by the time `HAVING` runs.

## WHERE filters rows; HAVING filters groups

This is the one distinction worth memorising cold, because it is the most common thing an interviewer checks:

```sql
-- WRONG: WHERE cannot see an aggregate
SELECT customer_id, COUNT(*) AS order_count
FROM orders
WHERE COUNT(*) > 5   -- error: aggregate functions are not allowed in WHERE
GROUP BY customer_id;
```

```sql
-- RIGHT: filter groups with HAVING, after the aggregate exists
SELECT customer_id, COUNT(*) AS order_count
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 5;
```

If you want to filter which rows go into the aggregation in the first place — say, only counting orders placed in the last 90 days — that is still `WHERE`, because it is a row-level condition:

```sql
SELECT customer_id, COUNT(*) AS order_count
FROM orders
WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY customer_id
HAVING COUNT(*) > 5;
```

Read this query left to right in execution order, not typing order: first keep only orders from the last 90 days, then group what remains by customer, then keep only the groups with more than five orders in that window. Both filters are doing real work, at different stages.

## GROUP BY: every non-aggregated column must be in it

A rule that trips up almost everyone once: every column in the `SELECT` list that is not wrapped in an aggregate function must appear in `GROUP BY`.

```sql
-- ERROR in strict SQL (Postgres will reject this)
SELECT customer_id, order_date, COUNT(*)
FROM orders
GROUP BY customer_id;
```

`order_date` is neither aggregated nor grouped by, so the database has no single value to return for it once rows are collapsed into one row per `customer_id` — there could be many different `order_date` values in that group, and SQL will not silently pick one for you. (MySQL historically allowed this and picked an arbitrary value, which is worse, not better — it produces a plausible-looking wrong answer instead of an error.) The fix is either to add the column to `GROUP BY`, or to aggregate it explicitly if you want a single representative value:

```sql
SELECT customer_id, MAX(order_date) AS most_recent_order, COUNT(*) AS order_count
FROM orders
GROUP BY customer_id;
```

## WHERE runs before GROUP BY, so it is cheaper

Beyond correctness, the ordering has a performance consequence worth internalising: `WHERE` throws away rows before the database does the work of grouping and aggregating them. If a filter can be expressed as a row-level condition, putting it in `WHERE` instead of filtering on the aggregate later is not just clearer, it is less work for the database — fewer rows reach the grouping step. In the field this shows up as the difference between a report that runs in half a second and one that takes forty minutes on a large table, covered properly in the indexes lesson later in this module.

## A worked example, end to end

Given an `orders` table (`order_id`, `customer_id`, `status`, `amount`, `order_date`), find every customer with more than three completed orders in the last quarter, along with their total spend, sorted highest spend first:

```sql
SELECT
    customer_id,
    COUNT(*) AS completed_orders,
    SUM(amount) AS total_spend
FROM orders
WHERE status = 'completed'
    AND order_date >= '2026-04-01'
GROUP BY customer_id
HAVING COUNT(*) > 3
ORDER BY total_spend DESC;
```

Trace it in execution order: filter to completed orders in the date range (`WHERE`), collapse to one row per customer (`GROUP BY`), compute the count and sum per customer (aggregates), keep only customers with more than three such orders (`HAVING`), then sort by spend (`ORDER BY`, last, because you cannot sort a result set that has not been produced yet).

## The FDE version of this lesson

This is the shape of query you will write dozens of times in an engagement before you touch anything more advanced: "how many of X met condition Y, grouped by Z, where the group itself meets some threshold." A customer stakeholder asking "which accounts have had more than five support tickets this month" is asking for exactly this pattern. Interviewers testing SQL fluency at this level are rarely checking whether you know the keywords — they are checking whether you reach for `WHERE` versus `HAVING` instantly and correctly, without pausing, because pausing on this one is the tell that you have not internalised the execution order yet.
