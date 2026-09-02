---
title: "SQL drill bank: 30 questions in the shape interviewers ask"
phase: foundations
module: sql-without-googling
kind: reference
summary: "Thirty SQL questions against one small schema, grouped the way an interview loop tests them: basics, joins, aggregates, window functions, and data quality. Each has a one-line approach, not a full solution — write the query yourself, from memory, before checking."
duration: 20 min
updated: "2026-09-02"
outcomes:
  - Answer any of the 30 questions below against the sample schema without searching for syntax.
  - Identify, from a question's wording alone, which SQL feature it is actually testing.
  - Use this bank as a five-minute warm-up before a live SQL round, cycling through one group at a time.
artifact: "Your own written answers to all 30 questions, timed, kept in your journal as a baseline to re-run before an actual interview loop."
---

Palantir's own hiring pipeline reportedly loses candidates at the "Learning" round specifically over SQL. Across the labs and most AI-adjacent companies hiring FDEs, a SQL round — live, on an unfamiliar schema, without a search engine — is standard. The skill being tested is not "do you know SQL exists." It is "can you write correct SQL under mild pressure, from memory, at the speed of a working session with a customer." This page is a drill bank for exactly that, not a tutorial — if a question below is unfamiliar, go back to the lessons earlier in this module before drilling here.

## Sample schema

Every question below uses this schema. It is deliberately small enough to hold in your head.

```sql
CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY,
    name TEXT,
    region TEXT,             -- 'North', 'South', 'East', 'West'
    signup_date DATE
);

CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    order_date DATE,
    status TEXT               -- 'completed', 'cancelled', 'pending'
);

CREATE TABLE order_items (
    order_id INTEGER REFERENCES orders(order_id),
    product_id INTEGER,
    quantity INTEGER,
    unit_price NUMERIC
);

CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    category TEXT,
    name TEXT
);
```

Write each answer yourself before reading the approach line — the approach is a check, not a shortcut.

## Basics

1. **List every customer who signed up in the last 90 days.**
   Approach: `WHERE signup_date >= CURRENT_DATE - INTERVAL '90 days'`.
2. **Find all orders with a NULL status.**
   Approach: `WHERE status IS NULL` — never `= NULL`, which matches nothing in standard SQL.
3. **List distinct regions present in the customers table.**
   Approach: `SELECT DISTINCT region FROM customers`.
4. **Find the five most recently placed orders.**
   Approach: `ORDER BY order_date DESC LIMIT 5`, and ask whether ties on `order_date` need a tiebreaker before trusting "the five most recent."
5. **Rename the output column `name` to `customer_name` in a customer list.**
   Approach: `SELECT name AS customer_name FROM customers`.
6. **Find every customer whose name contains "and" (case-insensitive).**
   Approach: `WHERE name ILIKE '%and%'` (Postgres) or `LOWER(name) LIKE '%and%'` portably.

## Joins

7. **List each order with its customer's name.**
   Approach: `orders JOIN customers ON orders.customer_id = customers.customer_id`; decide INNER vs LEFT based on whether orphaned orders should be dropped or shown.
8. **Find customers who have never placed an order.**
   Approach: `LEFT JOIN orders ... WHERE orders.order_id IS NULL` — the classic anti-join shape.
9. **List every order along with each of its line items.**
   Approach: `orders JOIN order_items ON orders.order_id = order_items.order_id`; expect one row per item, not per order.
10. **Find every product that has never been ordered.**
    Approach: `products LEFT JOIN order_items ... WHERE order_items.product_id IS NULL`.
11. **List pairs of customers in the same region who both signed up in the same month.**
    Approach: self-join `customers a JOIN customers b ON a.region = b.region AND a.customer_id < b.customer_id`, with the `<` to avoid duplicate mirrored pairs.
12. **Given that `orders.customer_id` might have duplicates on the `customers` side after a bad import, detect it before joining.**
    Approach: `SELECT customer_id, COUNT(*) FROM customers GROUP BY customer_id HAVING COUNT(*) > 1` before trusting any join on that key.

## Aggregates

13. **Total revenue per customer, from completed orders only.**
    Approach: join orders → order_items, `WHERE status = 'completed'`, `SUM(quantity * unit_price)`, `GROUP BY customer_id`.
14. **Count of orders per status.**
    Approach: `GROUP BY status`, `COUNT(*)`.
15. **Average order value, counting only completed orders, per region.**
    Approach: join customers → orders → order_items, filter status, aggregate `SUM` per order first in a subquery or CTE, then `AVG` of that per region — a two-level aggregation, not a single `AVG(unit_price)`.
16. **Customers with more than 10 completed orders.**
    Approach: `GROUP BY customer_id HAVING COUNT(*) > 10`, filtered to completed status in `WHERE` before grouping.
17. **The single best-selling product by total quantity.**
    Approach: `GROUP BY product_id ORDER BY SUM(quantity) DESC LIMIT 1`; note this silently drops ties — ask whether ties matter.
18. **Month-over-month order count, one row per month.**
    Approach: `GROUP BY DATE_TRUNC('month', order_date)` (Postgres) and order chronologically.

## Window functions

19. **The second-highest order value per customer.**
    Approach: `DENSE_RANK() OVER (PARTITION BY customer_id ORDER BY order_total DESC)`, filter to rank `= 2`, computed over a CTE of per-order totals.
20. **A running total of revenue by order date.**
    Approach: `SUM(amount) OVER (ORDER BY order_date)`, no `PARTITION BY` if the running total is global.
21. **Each customer's most recent order only.**
    Approach: `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC)`, filter to row number `= 1`.
22. **Rank products within their category by total revenue, allowing tied ranks to skip.**
    Approach: `RANK() OVER (PARTITION BY category ORDER BY revenue DESC)` — `RANK` skips after ties, `DENSE_RANK` does not; know which the question wants.
23. **The gap, in days, between each customer's consecutive orders.**
    Approach: `order_date - LAG(order_date) OVER (PARTITION BY customer_id ORDER BY order_date)`.
24. **Percentage of total revenue each region contributes.**
    Approach: `SUM(amount) OVER (PARTITION BY region) / SUM(amount) OVER ()` — two window functions, one partitioned, one not.

## Data quality

25. **Find orders referencing a customer_id that does not exist in customers.**
    Approach: `LEFT JOIN customers ... WHERE customers.customer_id IS NULL` — the orphan check from the reverse-engineering lab, applied here.
26. **Find duplicate order_items rows (same order_id, product_id appearing more than once).**
    Approach: `GROUP BY order_id, product_id HAVING COUNT(*) > 1`.
27. **Find orders with a negative or zero quantity in order_items.**
    Approach: `WHERE quantity <= 0` — a classic data-entry or import bug, not a valid business state.
28. **Confirm order_items.unit_price roughly matches products' expected pricing (assume a products.list_price column exists) and flag rows that differ by more than 20%.**
    Approach: join on product_id, `WHERE ABS(unit_price - list_price) / list_price > 0.2`.
29. **Find customers with a signup_date in the future.**
    Approach: `WHERE signup_date > CURRENT_DATE` — sounds absurd until you have seen it happen from a timezone or import bug.
30. **Count how many rows in orders have every nullable column NULL at once, a sign of a bad bulk import.**
    Approach: `WHERE order_date IS NULL AND status IS NULL` (extend to every nullable column present), `COUNT(*)`.

## How to use this page

Run through one group at a time, out loud, as if narrating to an interviewer — say what the query does before or while you write it, not silently after. The data-quality group is the one most self-taught SQL learners skip, and it is disproportionately what an FDE actually does day to day: not "can you aggregate," but "can you tell when the data underneath the aggregate is lying to you." Time yourself. A strong bar for this whole bank, cold, is well under 45 minutes.
