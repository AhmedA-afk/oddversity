---
title: "Window functions: second-highest per category, running totals, gaps"
phase: foundations
module: sql-without-googling
kind: lesson
summary: "Window functions let you compute a value across a set of related rows without collapsing them into one row the way GROUP BY does. This is the single most-tested SQL skill in an FDE interview loop, and this lesson builds it from first principles to the classic second-highest-per-category question."
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Explain, precisely, how a window function differs from GROUP BY in what it does to the row count.
  - Solve "second-highest value per category" using RANK or DENSE_RANK, from memory.
  - Compute a running total and a gap between consecutive rows using window functions.
---

Window functions are the feature that separates candidates who learned SQL from a tutorial from candidates who actually use it. Research on FDE-adjacent interview loops names this specifically: window functions "without Googling" is a stated Tier 1 emphasis, and "second-highest per category" is close to a canonical question across the labs and most serious AI companies' loops. This lesson builds the concept properly, then answers that exact question.

## The one sentence that makes window functions click

`GROUP BY` collapses multiple rows into one row per group — you lose the individual rows, you keep only the aggregate. A window function computes a value across a set of related rows *without* collapsing anything — every original row survives, each annotated with a value computed from its "window" (its related rows).

```sql
-- GROUP BY: collapses to one row per category
SELECT category, MAX(price) AS max_price
FROM products
GROUP BY category;

-- Window function: every row survives, each gets the category's max attached
SELECT category, product_name, price,
       MAX(price) OVER (PARTITION BY category) AS category_max_price
FROM products;
```

The second query returns the same number of rows as `products` — every product, individually — but each row now also carries its category's maximum price alongside it, letting you compare an individual row to its group's aggregate in the same result set. This is the whole idea: aggregate *and* keep the detail rows, at the same time.

## The anatomy of a window function call

```sql
RANK() OVER (PARTITION BY category ORDER BY price DESC)
```

- `RANK()` — the function itself. Could be an aggregate (`SUM`, `AVG`, `MAX`) used as a window function, or a dedicated ranking function (`ROW_NUMBER`, `RANK`, `DENSE_RANK`, `LAG`, `LEAD`).
- `OVER (...)` — marks this as a window function call, and defines the window.
- `PARTITION BY category` — divides rows into groups (partitions), analogous to `GROUP BY`, except rows are not collapsed. Omit it entirely and the "window" is the whole result set.
- `ORDER BY price DESC` — orders rows within each partition, required for ranking functions and running calculations, meaningless for a plain `MAX`/`MIN` that doesn't care about order.

## ROW_NUMBER, RANK, and DENSE_RANK: the difference that matters on ties

All three assign a position within a partition, ordered by the `ORDER BY` clause, and they differ only in how they treat ties:

```sql
SELECT category, product_name, price,
       ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn,
       RANK()       OVER (PARTITION BY category ORDER BY price DESC) AS rnk,
       DENSE_RANK() OVER (PARTITION BY category ORDER BY price DESC) AS drnk
FROM products;
```

Given two products tied for the highest price in a category (both at 999):

| price | ROW_NUMBER | RANK | DENSE_RANK |
|---|---|---|---|
| 999 | 1 | 1 | 1 |
| 999 | 2 | 1 | 1 |
| 750 | 3 | 3 | 2 |

`ROW_NUMBER` never ties — it assigns a unique, arbitrary order among tied rows, which makes it wrong for "rank by price" (it invents an ordering between two genuinely equal prices) but exactly right for "give me exactly one row per group" (covered below). `RANK` gives tied rows the same rank and then skips the next rank number (1, 1, 3). `DENSE_RANK` gives tied rows the same rank without skipping (1, 1, 2). Which one is correct depends entirely on what the question is actually asking — "second-highest price" using `RANK` will silently skip to showing the third-distinct price if the top two are tied, which is a real, common source of a wrong answer under interview pressure.

## The classic question: second-highest value per category

```sql
WITH ranked AS (
    SELECT
        category,
        product_name,
        price,
        DENSE_RANK() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank
    FROM products
)
SELECT category, product_name, price
FROM ranked
WHERE price_rank = 2;
```

`DENSE_RANK` is the right choice here, not `RANK`: "second-highest price" should mean the second *distinct* price value in that category, regardless of how many products share the top price — if three products are all tied for the highest price, `DENSE_RANK` still correctly identifies the next distinct price down as rank 2, where `RANK` would jump to rank 4 and could skip a real second-place value entirely if you were asking for it. Note also the structural point: you cannot filter on a window function's result directly in `WHERE` in the same query that defines it — `WHERE price_rank = 2` in the query above would fail if `price_rank` were computed in the same `SELECT`, because `WHERE` executes before window functions do. The fix is exactly what this query does: compute the rank in a CTE, then filter in an outer query against the CTE.

## Exactly one row per group: the ROW_NUMBER pattern

A closely related, equally common question — "each customer's most recent order" — uses `ROW_NUMBER` specifically because you want exactly one row per group, tie or no tie:

```sql
WITH latest AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) AS rn
    FROM orders
)
SELECT * FROM latest WHERE rn = 1;
```

## Running totals and gaps

A running total uses a window function with `ORDER BY` but no `PARTITION BY` (or a partition, if you want a running total per group), and no ranking function at all — just an aggregate used as a window:

```sql
SELECT order_date, amount,
       SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;
```

The gap between consecutive rows uses `LAG`, which reaches back to a previous row within the same ordered partition:

```sql
SELECT customer_id, order_date,
       order_date - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS days_since_last_order
FROM orders;
```

`LAG` returns `NULL` for the first row in each partition (there is no previous row to look back to) — worth stating out loud in an interview, because handling that `NULL` correctly downstream (rather than letting it silently propagate into a later calculation) is often exactly the follow-up question.

## The FDE version of this lesson

This is close to the single most reliable "do they actually know SQL" filter used across FDE interview loops, precisely because it cannot be faked with memorised syntax — you have to understand what a window is, why it does not collapse rows, and which ranking function handles ties the way the question actually intends. Practise it until "second-highest per category" produces the CTE-plus-DENSE_RANK pattern above without conscious effort; the drill bank elsewhere in this module has more variations to run through cold.
