---
title: "Joins, and why your row count just tripled"
phase: foundations
module: sql-without-googling
kind: lesson
summary: "A join with the wrong cardinality does not error. It silently multiplies rows, and every SUM downstream is now wrong. This lesson is about seeing that before the customer does."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Write INNER, LEFT, and self joins correctly, and explain what each does to unmatched rows.
  - Diagnose a row-count explosion caused by duplicate keys on the "many" side of a join.
  - Check a join's cardinality before trusting any aggregate built on top of it.
artifact: A short written note, in your journal, of a query you wrote where the row count changed unexpectedly, and what the actual cause turned out to be.
---

A join is a row-matching operation: for every row on the left, find every row on the right where the join condition is true, and produce one output row per match. The word to notice is "every." If the join condition matches more than one row on the right for a given row on the left, you get more than one output row. This is correct behaviour, and it is also the single most common way a report's numbers turn out to be wrong.

## The four you will actually use

```sql
-- INNER JOIN: only rows that match on both sides
SELECT o.order_id, c.name
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id;

-- LEFT JOIN: every row from orders, matched customer data if it exists, NULL if not
SELECT o.order_id, c.name
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id;
```

`INNER JOIN` drops orders whose `customer_id` does not exist in `customers` — useful when you only want complete records, dangerous when you did not realise some orders would be dropped. `LEFT JOIN` keeps every row from `orders` regardless of whether a match exists, filling unmatched columns with `NULL`. If you are counting orders and the count is lower than you expect, you probably wanted a `LEFT JOIN` and used `INNER JOIN`, and some orders reference a `customer_id` that was deleted or never existed.

`RIGHT JOIN` is a `LEFT JOIN` with the tables swapped, and most people never write it — they just swap which table comes first. `FULL JOIN` keeps unmatched rows from both sides. You will use it rarely, mostly for reconciliation: "which ids are in system A but not B, and vice versa."

## Where the row count triples

The multiplication happens when the "many" side of a one-to-many relationship isn't actually one-to-many — it's many-to-many, usually by accident.

```sql
SELECT o.order_id, o.amount, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;
```

If `customers` has exactly one row per `customer_id`, this is a clean one-to-many join and each order appears once. Now imagine a customer master table that was imported twice during a migration, or has a legacy row and a re-registered row that were never merged — three rows share `customer_id = 4471`. Every order placed by that customer now appears three times in the output, once per matching customer row, and `SUM(amount)` for that customer is now triple the true figure. No error. No warning. The query runs fine and returns a plausible-looking, wrong number.

This is exactly the shape of bug you inherit on a customer engagement: a CRM export with duplicate contact records, a legacy database where "cancelled and re-signed" customers got a second row instead of a status update, a SAP export where the same vendor appears under two vendor codes. Nobody flags it because the join doesn't fail — it just quietly does more work than you asked for.

## Checking cardinality before you trust the aggregate

Before joining two tables and summing anything, check whether the join key is actually unique on the side you assume is "one."

```sql
SELECT customer_id, COUNT(*)
FROM customers
GROUP BY customer_id
HAVING COUNT(*) > 1;
```

If this returns any rows, `customers.customer_id` is not unique, and any join against it on that key will multiply matching rows on the other side. This single query — count, group by, having count greater than one — is worth running against every table you're about to join in an unfamiliar schema, before you write the join. It costs ten seconds and it is the difference between catching the bug in your own query and catching it three weeks later when someone asks why revenue doesn't reconcile with the finance system.

The other half of the check is comparing row counts directly:

```sql
SELECT COUNT(*) FROM orders;                                  -- e.g. 50,000

SELECT COUNT(*)
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;            -- if this is > 50,000, something duplicated
```

If the joined count is larger than the starting count, the join is not one-to-one or many-to-one — it's many-to-many somewhere, and you need to find where before you build anything on top of it.

## Fixing it, not band-aiding it

The tempting fix, once you notice duplicate rows in your output, is `SELECT DISTINCT`. Resist it as a first move. `DISTINCT` collapses duplicate *output rows*, but if the duplication came from a multiplied join, `DISTINCT` will still leave you with duplicated amounts unless every column in the row happens to be identical across the duplicates — and `order_id` alone usually makes each duplicated row look distinct even though the underlying order was only placed once. `DISTINCT` treats the symptom. The fix is upstream: deduplicate the customer table before joining, or add a condition that selects only the canonical row per customer.

```sql
WITH canonical_customers AS (
  SELECT DISTINCT ON (customer_id) *
  FROM customers
  ORDER BY customer_id, created_at DESC   -- keep the most recent record per id
)
SELECT o.order_id, o.amount, cc.name
FROM orders o
JOIN canonical_customers cc ON o.customer_id = cc.customer_id;
```

(`DISTINCT ON` is Postgres-specific; the equivalent elsewhere is usually a window function — `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC)` filtered to `= 1` — which the next lesson in this module covers.)

## Self-joins, briefly

A self-join is the same table joined to itself, useful for comparing rows within one table — finding, say, every pair of transactions from the same account within an hour of each other:

```sql
SELECT a.txn_id, b.txn_id, a.account_id, a.txn_time, b.txn_time
FROM transactions a
JOIN transactions b
  ON a.account_id = b.account_id
  AND a.txn_id < b.txn_id
  AND b.txn_time - a.txn_time < INTERVAL '1 hour';
```

The `a.txn_id < b.txn_id` condition matters for a reason worth internalising: without it, every pair matches twice (A-B and B-A), and the same explosion happens for the same reason as above — the join condition matched more rows than you intended.

## The FDE version of this lesson

An interviewer who wants to see if you actually understand joins, not just recite the four types, will hand you a schema with a subtly duplicated table and ask you to compute a total. The candidates who get it wrong write the join, get a number, and report it. The candidates who get it right check `COUNT(*)` before and after the join, or run the duplicate-key check first, and say "before I trust this number, let me confirm this join key is actually unique" — out loud, before being asked. In the field this is the difference between handing a customer a revenue figure that's wrong by a factor of three and catching it before the meeting.
