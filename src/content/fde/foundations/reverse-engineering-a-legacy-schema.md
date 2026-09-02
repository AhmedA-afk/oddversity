---
title: "Lab: reverse-engineer a legacy schema into a data dictionary in a day"
phase: foundations
module: sql-without-googling
kind: lab
summary: "No customer hands you a clean ERD. You get a database, no documentation, and a deadline. This lab is the systematic process for turning an unfamiliar schema into a data dictionary you can hand to a domain expert for review, in one day."
duration: "3 h"
updated: "2026-09-02"
outcomes:
  - Enumerate every table, column, and inferred relationship in an unfamiliar schema using only SQL against the database's own catalog.
  - Distinguish declared foreign keys from implied ones, and confirm implied relationships with real data before trusting them.
  - Produce a data dictionary a domain expert can correct in a 30-minute review, instead of one they have to rewrite.
artifact: "A data_dictionary.md file covering every table in a sample legacy schema, with a one-paragraph note on which relationships you inferred rather than found declared."
---

The 95% figure that keeps showing up in FDE hiring material — most enterprise data problems are access, cleaning, and joining, not analysis — starts here. You are handed read access to a production database, a login that works, and no documentation, because the person who built it left three years ago and the wiki page is stale. Before you can build anything on top of it, you need to know what is actually in there. This lab is the process for doing that in a day instead of a week.

## Set up a legacy-shaped schema to practice on

Real legacy schemas share a set of traits: inconsistent naming, no declared foreign keys (someone turned off referential integrity for import speed and never turned it back on), a status column with undocumented magic values, and at least one table nobody remembers the purpose of. Build one to practice against:

```sql
CREATE TABLE cust (
    cust_id INTEGER PRIMARY KEY,
    cust_nm TEXT,
    region_cd TEXT,
    stat INTEGER   -- undocumented: 0, 1, 2, 9 seen in the data
);

CREATE TABLE ord_hdr (
    ord_id INTEGER PRIMARY KEY,
    cust_id INTEGER,   -- no FK constraint declared
    ord_dt TEXT,
    ord_stat TEXT
);

CREATE TABLE ord_line (
    ord_id INTEGER,    -- no FK constraint declared
    line_no INTEGER,
    sku TEXT,
    qty INTEGER,
    unit_px REAL,
    PRIMARY KEY (ord_id, line_no)
);

CREATE TABLE sku_ref (
    sku TEXT PRIMARY KEY,
    sku_desc TEXT,
    active_flg TEXT   -- 'Y'/'N', sometimes NULL
);
```

Populate a few dozen rows in each, including some `cust_id` values in `ord_hdr` that do not exist in `cust`, and some `stat` values outside the documented set, on purpose — that mess is the point.

## Steps

**1. Enumerate every table.** Never trust a verbal "there are about fifteen tables" — query the catalog:

```sql
-- Postgres
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1;

-- SQLite
SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY 1;
```

Write every table name down before opening a single one. A table you never notice is a table whose data quietly missing from your model later.

**2. Pull columns and types for every table**, in one pass, rather than opening each table individually:

```sql
-- Postgres
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

Note every nullable column — a `NOT NULL` constraint tells you a value is guaranteed; a nullable one tells you to expect a gap, and to check what a NULL means here versus a real business value.

**3. Find declared primary and foreign keys**, then separately note where you'd expect a foreign key but the catalog shows none:

```sql
-- Postgres: declared foreign keys
SELECT
    tc.table_name, kcu.column_name,
    ccu.table_name AS references_table, ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

In this practice schema, this query returns nothing — no foreign keys were declared, which is realistic. That does not mean no relationships exist; it means you have to find them yourself, and treat every one you find as a hypothesis until you check it.

**4. Infer relationships from naming and sample data**, then confirm each one:

```sql
-- Does every ord_hdr.cust_id exist in cust?
SELECT o.cust_id
FROM ord_hdr o
LEFT JOIN cust c ON o.cust_id = c.cust_id
WHERE c.cust_id IS NULL;
```

If this returns rows, you have just found orphaned orders — orders referencing customers that do not exist in the customer table, probably from deleted or never-migrated customer records. This is exactly the finding that goes in your data dictionary, not something you quietly work around: it tells the next person building on this schema that `ord_hdr.cust_id` cannot be assumed to always resolve.

**5. Decode undocumented status columns from the data itself**, not from a guess:

```sql
SELECT stat, COUNT(*) FROM cust GROUP BY stat ORDER BY stat;
SELECT ord_stat, COUNT(*) FROM ord_hdr GROUP BY ord_stat ORDER BY ord_stat;
```

Cross-reference the counts against anything you can — a related table, a UI you have access to, or a domain expert's memory — before writing down what each code means. A wrong guess about what `stat = 9` means, written into a data dictionary as fact, will get copied into every query that follows it.

**6. Check cardinality on every relationship you plan to rely on**, exactly as the joins lesson in this module covers:

```sql
SELECT cust_id, COUNT(*) FROM cust GROUP BY cust_id HAVING COUNT(*) > 1;
```

**7. Write the data dictionary.** One entry per table: its apparent purpose (inferred, not assumed), each column with its type and what you believe it means, every relationship found (declared or inferred, labelled as which), and every anomaly discovered — orphaned rows, undocumented codes, nullable columns that should not be. Keep inferred facts visibly separate from declared ones:

```markdown
## ord_hdr — order headers
- ord_id (PK): unique per order
- cust_id: references cust.cust_id (INFERRED — no FK constraint; 3 orphaned rows found, see anomalies)
- ord_stat: 'OPEN', 'SHIPPED', 'CANCELLED', 'RTN' (RTN meaning unconfirmed — return? — flag for domain expert)

### Anomalies found
- 3 orders in ord_hdr reference cust_id values not present in cust.
- cust.stat has an undocumented value 9 (4 rows) alongside the expected 0/1/2.
```

## Definition of done

- Every table and column in the schema appears in the dictionary, with type and nullability noted.
- Every relationship is marked declared or inferred, and every inferred relationship was checked against real data, not assumed from naming alone.
- Every undocumented code column has its distinct values enumerated with counts, even where the meaning is still unconfirmed.
- Every anomaly you found (orphaned foreign keys, unexpected NULLs, undocumented codes) is written down as a flagged item, not silently fixed or silently ignored.
- The document is written so a domain expert who has never seen SQL can correct it in a 30-minute conversation — plain language for what each table represents, not just the schema restated.

## How this goes wrong

**Trusting column names as documentation.** `stat` on `cust` and `ord_stat` on `ord_hdr` look like the same concept from the name alone and frequently are not — different code sets, different meanings, sometimes overlapping numeric ranges by coincidence. Always check actual distinct values before assuming two similarly-named columns mean the same thing.

**Skipping the orphan check because the row counts look fine.** Three orphaned rows out of ten thousand will never show up by eyeballing a `SELECT *`. They show up only when you explicitly check with a `LEFT JOIN ... WHERE right.key IS NULL`, and they are exactly the rows that will make a customer's finance team ask why revenue does not reconcile.

**Presenting inference as fact.** A data dictionary that states "cust_id references cust.cust_id" with the same confidence whether that was a declared constraint or your best guess from a column name will get trusted equally either way by the next person who reads it — and an inferred relationship that turns out wrong, once encoded as fact in a document everyone relies on, is far more expensive to unwind than the ten extra minutes it takes to verify it first.
