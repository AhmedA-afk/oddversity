---
title: "Tables, keys, and the relational idea"
phase: foundations
module: sql-without-googling
kind: lesson
summary: "Every enterprise database you touch in the field, however messy, is an attempt at the relational model: data split into tables, related by keys, so nothing has to be stored twice. This lesson is the mental model that makes the rest of the SQL module make sense."
duration: 11 min
updated: "2026-09-02"
outcomes:
  - Explain why data is split across multiple related tables instead of stored in one wide table.
  - Identify a primary key and a foreign key in an unfamiliar table, and explain what each guarantees.
  - Recognise the signs of a schema that is not properly normalised, and explain the practical cost of that.
---

Before window functions, before joins, before any SQL syntax at all, there is a single idea that explains why enterprise data looks the way it does: a well-designed database avoids storing the same fact twice. Everything else in this module — why joins exist, why a row count can silently triple, why a legacy schema needs reverse-engineering — follows from this one idea and the ways real systems fall short of it.

## Why not one big table

Imagine storing every order in a single table with all the customer's details repeated on every row:

```
order_id | customer_name | customer_email | customer_region | product | amount
1        | Priya Menon    | priya@x.com    | South            | Widget  | 499
2        | Priya Menon    | priya@x.com    | South            | Gadget  | 299
3        | Arjun Rao       | arjun@y.com    | North            | Widget  | 499
```

This works until Priya changes her email address, and now you need to update it in every row where it appears — miss one, and the same customer now has two different emails on file, with no way to know which is current without checking every row. This is the core problem the relational model exists to prevent: a fact stored in more than one place will eventually disagree with itself.

## Splitting into related tables

The relational fix: store each fact exactly once, in the table it belongs to, and connect tables by reference rather than by repetition:

```sql
CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    region TEXT
);

CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    product TEXT,
    amount NUMERIC
);
```

Now Priya's email lives in exactly one row, in `customers`. Every order references her by `customer_id`, an integer, instead of repeating her details. Change her email once, and every order that references her is instantly, correctly, up to date — because nothing about her email was ever duplicated in the first place.

## Primary keys: the guarantee of uniqueness

A **primary key** is the column (or combination of columns) that uniquely identifies a row in that table. `customer_id` in `customers` above is the primary key: no two rows in `customers` share the same `customer_id`, and the database itself enforces this — an `INSERT` attempting to reuse an existing primary key value is rejected, not silently allowed.

A primary key can be a single column (`customer_id`) or a composite of several. In an `order_items` table where the natural identifier is "this line, on this order":

```sql
CREATE TABLE order_items (
    order_id INTEGER,
    line_no INTEGER,
    product TEXT,
    quantity INTEGER,
    PRIMARY KEY (order_id, line_no)
);
```

No single column uniquely identifies a row here — `order_id` repeats across lines of the same order, `line_no` repeats across different orders — but the pair together is guaranteed unique.

## Foreign keys: the guarantee of a real relationship

A **foreign key** is a column that references another table's primary key, and it is what turns "these two tables happen to have matching values" into "the database guarantees this relationship is valid." `orders.customer_id REFERENCES customers(customer_id)` means the database will reject an `INSERT` into `orders` with a `customer_id` that does not exist in `customers` — the orphaned-row problem from the reverse-engineering lab in this module cannot happen if the foreign key constraint is actually declared and enforced.

The uncomfortable field truth: many production schemas, especially older ones, do not declare foreign key constraints at all — often disabled deliberately for import speed, or never added by whoever built the system originally. The *relationship* still exists conceptually (`orders.customer_id` still means "the customer who placed this order"), but nothing in the database enforces it, which is exactly why the reverse-engineering lab teaches you to check for orphaned rows explicitly rather than trust that a lack of errors means a clean relationship.

## Normalisation, briefly, and why it matters practically

"Normalisation" is the formal name for the process of splitting data to avoid the duplicate-fact problem above. You do not need the formal normal forms (1NF, 2NF, 3NF) memorised to work effectively — you need the practical instinct: **if a fact about something can change, and it is stored in more than one place, it will eventually be wrong in at least one of them.** A denormalised legacy schema — a `region` column duplicated on both `customers` and every one of their `orders`, say — is a sign that someone either prioritised query convenience over correctness, or that the schema evolved without anyone revisiting the design. Neither is automatically wrong (a deliberately denormalised reporting table, built for read speed, is a legitimate and common pattern), but an accidentally denormalised schema is a data-quality risk you should flag, not silently work around.

## Reading an unfamiliar schema through this lens

When you are handed a schema you have never seen, this idea gives you a fast first question for every table: what is this table's primary key, and what does that tell you about what one row represents? A table where you cannot easily answer "what makes one row unique" is usually a table someone built in a hurry, or a reporting/staging table that was never meant to be a source of truth — both worth flagging before you build anything on top of it.

## The FDE version of this lesson

Enterprise schemas you meet in the field will rarely be textbook-normalised. You will see denormalised reporting tables sitting next to clean transactional ones, legacy tables with no declared keys at all, and tables where the "primary key" is technically a nullable column because nobody enforced it at creation time. Understanding the relational idea is not about judging these schemas against an academic ideal — it is about knowing, precisely, which guarantees you can rely on in a given table and which you cannot, and checking for the ones you cannot rather than assuming them. That check is the difference between a data model you can build a customer-facing report on with confidence, and one that quietly produces a wrong number three weeks later.
