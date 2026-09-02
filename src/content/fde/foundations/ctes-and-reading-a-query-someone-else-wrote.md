---
title: "CTEs, and reading a 200-line query someone else wrote"
phase: foundations
module: sql-without-googling
kind: lesson
summary: "Common table expressions let you name intermediate steps instead of nesting subqueries. This lesson covers writing them, and the specific method for reading a long query that isn't yours without getting lost."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Write a query using two or more chained CTEs instead of nested subqueries.
  - Read an unfamiliar multi-CTE query by tracing data lineage from the final SELECT backward.
  - Use a recursive CTE for a simple hierarchy, and know when you actually need one.
artifact: A commented, restructured version of a long query (yours or a sample one) that shows the lineage of each CTE in a code comment above it.
---

A common table expression — a `WITH` block — lets you name a subquery and refer to it by that name later in the same statement, including from other CTEs. It doesn't do anything a nested subquery couldn't do. What it buys you is readability: instead of three levels of parentheses nested inside each other, you get a sequence of named steps you can read top to bottom, each one a self-contained piece of logic.

## Writing one

```sql
WITH monthly_txns AS (
  SELECT
    branch_id,
    date_trunc('month', txn_date) AS txn_month,
    amount
  FROM transactions
  WHERE txn_date >= '2026-01-01'
),
branch_totals AS (
  SELECT
    branch_id,
    txn_month,
    SUM(amount) AS total_amount,
    COUNT(*) AS txn_count
  FROM monthly_txns
  GROUP BY branch_id, txn_month
),
branch_avg AS (
  SELECT
    branch_id,
    AVG(total_amount) AS avg_monthly_total
  FROM branch_totals
  GROUP BY branch_id
)
SELECT
  b.name AS branch_name,
  bt.txn_month,
  bt.total_amount,
  ba.avg_monthly_total,
  bt.total_amount - ba.avg_monthly_total AS deviation_from_avg
FROM branch_totals bt
JOIN branch_avg ba ON bt.branch_id = ba.branch_id
JOIN branches b ON bt.branch_id = b.branch_id
ORDER BY b.name, bt.txn_month;
```

This computes, for every branch of a cooperative bank, how each month's transaction total compares to that branch's own monthly average — the kind of query that flags an unusual month worth asking about. Written as nested subqueries, this would be three layers of parentheses, and you'd read it inside-out. Written as CTEs, you read it in the order it executes: raw transactions, then monthly totals, then per-branch average, then the final comparison. Each name (`monthly_txns`, `branch_totals`, `branch_avg`) documents what that step produces, which is most of what makes it readable months later.

CTEs are not free performance-wise — in some engines (older Postgres versions, notably) a CTE could act as an optimisation fence, materialising the intermediate result even when the planner could have done better by inlining it. Modern Postgres (12+) inlines CTEs automatically unless you force materialisation, so write them for clarity first and check `EXPLAIN` if performance matters — the next lesson in this module covers reading query plans.

## The method for reading a query you didn't write

You will inherit long queries constantly — a report a previous consultant left behind, a view definition nobody documented, a 200-line monster that "just works" and that someone now wants you to modify. Reading it top to bottom, left to right, the way it's written on the page, is the slow way and the way that gets you lost by line 40. Here is the method that doesn't.

**1. Read the final SELECT first, not the first CTE.** The last statement tells you what the query is *for*. Look at its columns, its FROM/JOIN list, its WHERE and GROUP BY. That's the destination — everything above it exists to feed it.

**2. List the CTE names and, for each, read only its own body — not what it depends on.** Just: what table(s) does it start from, what does it filter, what does it group by, what does it produce. Write a one-line comment above each one if the original author didn't:

```sql
-- monthly_txns: raw transactions since Jan 2026, one row per transaction
WITH monthly_txns AS ( ... )
-- branch_totals: monthly_txns rolled up to one row per branch per month
, branch_totals AS ( ... )
```

**3. Trace lineage, not logic, first.** Before you try to understand *why* a CTE does what it does, map *what feeds what*: `branch_totals` reads from `monthly_txns`; `branch_avg` reads from `branch_totals`; the final SELECT reads from `branch_totals` and `branch_avg` and joins `branches`. This is a dependency graph, and most 200-line queries have three or four "stages" in that graph even when they have a dozen CTEs — several CTEs at the same stage, feeding forward together. Seeing the stages tells you where a bug or a requested change actually belongs.

**4. Only now read for logic, one CTE at a time, in dependency order.** Once you know what feeds what, read each CTE's actual filters and aggregations, starting from the ones with no dependencies (reading straight from tables) and working forward. You already know its output shape from step 2, so you're reading to confirm *how* it gets there, not discovering what it's for from scratch.

**5. When you need to verify a hypothesis, run just that CTE.** Comment out everything after it, change its final line to a plain `SELECT * FROM that_cte LIMIT 50`, and look at actual rows. This is the fastest way to confirm "I think this CTE is producing duplicate branch_id rows" without reasoning about it in the abstract.

This is a debugging-under-pressure skill as much as a reading skill. In an interview, or on a call with a customer's data team, you will be handed a query like this and asked "why is this number wrong" or "add a filter for region X" with someone watching. Reading top-to-bottom in real time looks like you're guessing. Reading destination-first, then lineage, then logic looks like — and is — a method.

## Recursive CTEs, briefly

A recursive CTE refers to itself, and is the standard way to walk a hierarchy — an org chart, a bill-of-materials, a category tree with subcategories — without knowing the depth in advance.

```sql
WITH RECURSIVE org_chart AS (
  -- anchor: the top of the hierarchy
  SELECT employee_id, name, manager_id, 1 AS depth
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- recursive step: each employee whose manager is already in org_chart
  SELECT e.employee_id, e.name, e.manager_id, oc.depth + 1
  FROM employees e
  JOIN org_chart oc ON e.manager_id = oc.employee_id
)
SELECT * FROM org_chart ORDER BY depth, name;
```

The anchor query establishes the starting rows (here, employees with no manager — the top). The recursive step joins the CTE to itself, adding one level at a time, until no new rows are produced. You reach for this specifically for tree or graph structures with unknown depth — an approval chain, a parts hierarchy for a manufacturer, a chart-of-accounts rollup. For anything with a fixed, small number of levels, a few plain joins are simpler and every reader on the customer's side will understand them faster, which matters more than it sounds like it should when you're handing code over.

## The FDE version of this lesson

The interview version of this is a query dumped in front of you with no explanation, and "walk me through what this does." The candidates who read line one, then line two, in order, run out of working memory around CTE four and start guessing. The candidates who read the final SELECT first, name what each CTE produces, and only then explain the logic, sound — and are — like someone who has done this before under worse conditions than an interview room.
