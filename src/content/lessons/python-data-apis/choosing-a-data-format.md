---
title: "CSV vs JSON vs JSONL vs Parquet"
track: "python-data-apis"
status: live
summary: "A code-first comparison of CSV, JSON, JSONL, and Parquet — how each works, when it wins, its concrete failure mode, and relative cost — scored in a decision table and applied to th"
duration: "22 min read"
---

Every file format is a bet about how the data gets used next — read once by a human, streamed record-by-record, or scanned column-by-column across gigabytes. Get the bet wrong and you find out at the worst time: a script that OOMs loading a JSON file, a CSV column that silently turned your account IDs into floats, or a 50GB Parquet file nobody on the team can peek at to sanity-check.

## CSV — comma-separated values

**How it works.** Plain text, one row per line, values separated by commas, an optional header row. That's the whole spec — which is both its strength and the source of every failure mode below.

```python
import csv

rows = [
    {"user_id": "007", "name": "Alice, B.", "signup_date": "2026-01-15", "is_active": "True"},
    {"user_id": "042", "name": "Bob", "signup_date": "2026-02-03", "is_active": "False"},
]

with open("users.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["user_id", "name", "signup_date", "is_active"])
    writer.writeheader()
    writer.writerows(rows)

with open("users.csv", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        print(row)
```

The `csv` module quotes `"Alice, B."` automatically so the embedded comma doesn't split the row — that part just works. See [reading and writing CSV](/learn/python-data-apis/reading-and-writing-csv) for the quoting and dialect details.

**When it wins.** Flat, tabular, no nesting, and someone needs to open it in Excel or load it with a fifteen-year-old SQL tool that still has a `LOAD DATA INFILE` CSV importer. Nothing reads more universally.

**Failure mode.** Every value is a string — always. That "is_active" field reads back as the literal text `"False"`, and a non-empty string is truthy in Python:

```python
row = {"is_active": "False"}
if row["is_active"]:
    print("row is active")   # prints — the string "False" is truthy
```

Types get *guessed* by whoever reads the file next, and the guess can be wrong in ways that lose data. Load the same file with pandas and it infers `user_id` as an integer:

```python
import pandas as pd
df = pd.read_csv("users.csv")
print(df["user_id"].tolist())   # [7, 42] — the leading zero in "007" is gone for good
```

That's not a pandas bug, it's what CSV *is*: no type information ever made it into the file, so [type coercion](/learn/python-data-apis/type-coercion-and-parsing-dates) is a guess performed fresh on every read, by every consumer, forever.

**Cost.** Cheapest format to write and the cheapest to open by hand. The cost shows up downstream: every reader re-infers types from scratch, nested data (a list of tags, a nested address) simply doesn't fit, and the file isn't compressed, so it's the largest of the four on disk for the same data.

## JSON — a single structured document

**How it works.** One tree of objects, arrays, strings, numbers, booleans, and `null`, parsed and written as a whole with `json.load` / `json.dump`.

```python
import json

config = {
    "model": {"name": "gpt-mini", "temperature": 0.2, "max_tokens": 512},
    "training": {"epochs": 10, "batch_size": 32, "learning_rate": 3e-4},
    "tags": ["experiment", "baseline"],
}

with open("config.json", "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2)

with open("config.json", encoding="utf-8") as f:
    loaded = json.load(f)

print(loaded["training"]["learning_rate"])   # 0.0003 — still a float, not a string
```

Unlike CSV, the type survives the round trip: `0.0003` comes back as a float because JSON actually distinguishes numbers, strings, and booleans. It also survives [nested structure](/learn/python-data-apis/nested-json-in-memory) — the `"model"` object and the `"tags"` array don't need to be flattened into columns.

**When it wins.** Small-to-medium nested payloads that a person will read or hand-edit: config files, a single API response, settings that live in git and get diffed in a PR.

**Failure mode.** `json.load` has to parse the *entire* file before you can touch a single value:

```python
# If results.json holds 2 million records, this line allocates
# all 2 million of them in memory before you can read even one.
with open("results.json", encoding="utf-8") as f:
    results = json.load(f)
```

There's no way to stream a JSON array — the closing `]` has to exist and be reached before the object is valid. And because it's one document, one stray trailing comma or unclosed brace anywhere in a multi-megabyte file invalidates the whole thing, not just the record near the typo.

**Cost.** Cheap for small files, and the type fidelity is a real win over CSV. The cost scales badly: keys are repeated per object (no schema shared across records) and the whole-document parse means memory use scales with file size, not with how much of the data you actually need.

## JSONL — JSON Lines

**How it works.** One JSON object per line, no wrapping array, no commas between records. Each line is independently valid JSON.

```python
import json

def fetch_page(page: int) -> list[dict]:
    return [{"id": page * 2 + i, "status": "ok"} for i in range(2)]   # stand-in for a real API call

with open("api_results.jsonl", "w", encoding="utf-8") as f:
    for page in range(3):
        for record in fetch_page(page):
            f.write(json.dumps(record) + "\n")
            f.flush()   # each line is durable on disk as soon as it's written

with open("api_results.jsonl", encoding="utf-8") as f:
    for line in f:
        record = json.loads(line)
        print(record["id"], record["status"])
```

Memory use here is flat — O(1) per record — regardless of whether the file holds a hundred lines or a hundred million. That's the entire value proposition over plain JSON, and it's why it's the natural format for paginated API pulls (see [pagination patterns](/learn/python-data-apis/pagination-patterns)): you can write one page at a time, crash mid-pull, and resume without re-fetching what's already on disk.

**When it wins.** Streams of independent records — logs, a long-running API pull, anything you want to append to incrementally or process one record at a time without holding the whole dataset in memory.

**Failure mode.** Nothing enforces that line 4,000 has the same shape as line 1. If an upstream API changes its response shape mid-pull:

```python
with open("api_results.jsonl", encoding="utf-8") as f:
    for line in f:
        record = json.loads(line)
        print(record["status"])   # KeyError on the line where the field went missing
```

You find out at whatever line the drift happened, not up front. It also isn't something a teammate can double-click and skim in Excel — a JSONL file "looks like" a table conceptually but isn't rendered as one by anything except code (or a quick `pd.read_json(path, lines=True)`).

**Cost.** Same per-line redundancy as JSON — keys repeated every record, so file size is comparable to the equivalent JSON array. The win isn't size, it's that the memory and durability cost per record is constant instead of growing with the whole file.

## Parquet — columnar binary storage

**How it works.** Binary, columnar (values for one column are stored together, not row by row), with the schema embedded in the file itself. Written and read through a library — `pyarrow` or `fastparquet` — usually via pandas.

```python
import pandas as pd

df = pd.DataFrame({
    "timestamp": pd.date_range("2026-01-01", periods=5, freq="h"),
    "user_id": [101, 102, 103, 104, 105],
    "event_type": ["click", "view", "click", "purchase", "view"],
    "country": ["IN", "IN", "US", "US", "DE"],
    "revenue": [0.0, 0.0, 0.0, 49.99, 0.0],
})

df.to_parquet("events.parquet", engine="pyarrow", compression="snappy")

# Column pruning: pull only the two columns you actually need
subset = pd.read_parquet("events.parquet", columns=["event_type", "revenue"])
print(subset.dtypes)
```

`revenue` comes back as `float64` and `timestamp` as an actual timestamp type — no re-parsing, no guessing, because the schema travels with the file. That's what [columnar formats](/learn/python-data-apis/parquet-and-columnar-formats) buy you that row-based text formats can't.

**When it wins.** Large analytics tables, especially wide ones where a given query only touches a handful of columns — reading `event_type` and `revenue` out of a 40-column table means the engine can skip the other 38 columns entirely, something no row-based format can do.

**Failure mode.** It's binary — you can't open it in a text editor, `git diff` it, or `curl` it and read the response. And schema drift between files that get concatenated later is a real trap: if one day's file has `revenue` as `int64` (all whole-dollar amounts, no decimals recorded that day) and the next day's has it as `float64`, some readers will fail to merge the two, others will silently upcast — either way it's a bug you discover downstream, not at write time. Small files are also a poor fit: the embedded schema and metadata add fixed overhead, so a handful of tiny Parquet files can end up *larger* than the equivalent CSV.

**Cost.** Higher upfront tooling cost — you need `pyarrow` installed, and there's no manual editing. In exchange, storage is the smallest of the four (columnar compression works especially well on repeated values like `country` or `event_type`), and scan cost at scale is the lowest, because readers can skip whole columns and, with row-group statistics, sometimes skip whole chunks of rows too.

> In practice, CSV and JSONL are often shipped gzip-compressed (`events.csv.gz`, `results.jsonl.gz`). That narrows the size gap with Parquet, but it doesn't buy back column pruning or a typed schema — once you decompress, you're still parsing text end to end to get anything out of it.

## Decision table

Scored against the five axes from the brief:

| Format | Human-readable | Schema / typing | File size | Streamability | Interoperability |
|---|---|---|---|---|---|
| CSV | High — opens in any editor or spreadsheet | None — everything is text, types are guessed on read | Smallest per-cell overhead, but no compression | Medium — line-by-line, but no nesting | Very high — every language and tool reads it |
| JSON | High, for small-to-medium files | Preserves types (int/float/bool/null), no cross-file schema enforcement | Larger than CSV — keys repeated per object | Low — must parse the whole document to reach one value | High — near-universal for configs and APIs |
| JSONL | High per line, awkward as a whole file | Same as JSON per record, no guarantee across lines | Similar to JSON — keys still repeated per line | High — one record per line, appends and streams naturally | Medium — parses everywhere, opens natively in few GUI tools |
| Parquet | None — binary, needs a library to view | Strong — schema embedded, real types (int64, timestamp, etc.) | Smallest — columnar compression | Medium — great for bulk scans, poor for single-record appends | Medium — needs pyarrow/fastparquet/Spark/DuckDB, now standard tooling |

And the required shape — where each one is the right call:

| Approach | Best when | Avoid when | Cost |
|---|---|---|---|
| CSV | Flat tabular data a human or spreadsheet opens directly; maximum tool compatibility | Data is nested, precise typing matters, or the file's large enough that re-parsing types every load gets expensive | Cheapest to write; the type-inference bill is paid by every reader, every time |
| JSON | Small-to-medium nested structures — configs, a single API response, settings edited by hand | The file is really a long list of independent records, or is large enough that loading it whole risks memory | Cheap small; cost grows fast since the whole tree is parsed and held in memory at once |
| JSONL | Streams of independent records — API pulls, logs, anything appended to or processed incrementally | You need cross-record schema guarantees, columnar analytics, or a human to skim the dataset's shape at a glance | Same per-record overhead as JSON, but memory cost is flat per record instead of growing with the file |
| Parquet | Large analytics tables, especially wide ones where queries touch a handful of columns | The file is small, needs manual editing/diffing, or you're appending single records one at a time | Higher tooling cost upfront; lowest storage and scan cost at scale |

## How to choose

Work through these in order — the first "yes" usually settles it:

1. **Does a human need to open, edit, or diff this file directly?** → CSV if it's flat, JSON if it's nested.
2. **Is the data a single nested structure (a config, a settings object) rather than a list of similar records?** → JSON, not JSONL — JSONL is for repeated records, not one tree.
3. **Will you produce or consume this one record at a time, and might the full file be too big to hold in memory at once?** → JSONL.
4. **Is this a large, read-heavy table where queries usually touch a subset of columns?** → Parquet.
5. **Does it need to be read by tools you don't control, with zero custom code?** → CSV or JSON. Parquet needs library support, which is now standard in the Python/pandas/Spark/DuckDB world but isn't universal outside it.

### Scenario 1: exporting a training config

You're exporting the hyperparameters and settings for a training run — nested (`model`, `training`, `data` sections), small (a few KB), and a teammate will open the file in an editor, tweak `learning_rate`, and commit the diff.

**Pick: JSON.** CSV can't represent the nesting at all — you'd have to flatten `model.temperature` into a column name, which defeats the point of a config file. JSONL is built for repeated records, not one tree, so it doesn't fit a single document. Parquet needs a library just to view the file and adds compression machinery to a document that's a few kilobytes — pure overhead with no payoff.

```python
import json

with open("config.json", "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2)   # readable, diffable, hand-editable
```

### Scenario 2: streaming paginated API results

You're calling a [REST API](/learn/python-data-apis/calling-rest-apis-with-python) across many pages, writing each page's records to disk as they arrive so a crash or rate-limit doesn't lose progress, and a downstream step will process the records one at a time.

**Pick: JSONL.** A JSON array would force you to either hold every result in memory until the pull finishes, or rewrite the entire file on every append to keep the brackets and commas valid — both get worse as the pull grows. Parquet wants a batch of rows (or at least a row group) before it writes anything efficiently — it's not built for one-record-at-a-time durability. CSV loses the nested fields these APIs typically return (tags, nested address objects) unless you flatten them, which is exactly the transformation you're trying to avoid mid-stream.

```python
import json

with open("api_results.jsonl", "a", encoding="utf-8") as f:
    for record in next_page_of_results():
        f.write(json.dumps(record) + "\n")
        f.flush()   # crash-safe: everything written so far is on disk
```

### Scenario 3: a 50GB analytics table

You've got 50GB of event data — `timestamp`, `user_id`, `event_type`, `country`, `revenue`, plus a dozen more columns — and data scientists mostly run [groupby aggregations](/learn/python-data-apis/groupby-and-aggregation) over two or three columns at a time.

**Pick: Parquet.** At this scale, CSV means parsing 50GB of text and re-guessing every column's type on every load — slow, and memory-hungry if loaded whole. JSON as one document is an outright non-starter: `json.load` would try to materialize the entire 50GB tree before you could touch a single row. JSONL avoids the memory blowup (you *could* stream it), but you'd still pay to parse every field of every record as text, and you get none of the columnar compression or column-pruning that make Parquet queries fast here. With Parquet, a query that only needs `event_type` and `revenue` skips every other column on disk entirely:

```python
subset = pd.read_parquet(
    "events/",
    engine="pyarrow",
    columns=["event_type", "revenue"],
)
```

If the table is written partitioned by date or country, readers can skip whole files too:

```python
df.to_parquet("events/", engine="pyarrow", partition_cols=["country"])

only_us = pd.read_parquet("events/", engine="pyarrow", filters=[("country", "=", "US")])
```

That combination — typed columns, compression, and the ability to read only what a query needs — is the entire reason Parquet exists, and it's wasted on a config file or a 200-row export. Match the format to what happens to the file *next*, not to what's easiest to write today. For a broader map of the format landscape and where these fit against alternatives like YAML or Avro, see choosing a data format.

**Related:** /learn/python-data-apis/files-and-data-formats-overview · /learn/python-data-apis/choosing-a-data-format · /learn/python-data-apis/validating-dataframes-with-schemas · /learn/python-data-apis/data-contracts-and-validation · /learn/python-data-apis/files-and-formats-quiz
