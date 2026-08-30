---
title: "Quiz: Files & Formats"
track: "python-data-apis"
status: live
summary: "A six-question self-check on picking the right file format, spotting an encoding bug that produces mojibake, and knowing when JSONL beats a single JSON array."
duration: "12 min read"
---

You've seen CSV, JSON, JSONL, and Parquet each on their own — this is where you find out whether you'd actually reach for the right one under pressure, and catch an encoding mismatch before it quietly corrupts a file.

## Question 1

Your app ships a single settings file that lives in the repo: nested sections (`database`, `logging`, `feature_flags`), maybe 40 keys total, hand-edited by teammates in a text editor a few times a month. Which format fits best?

- A) CSV — flat rows and columns, easy to open in Excel
- B) JSON — a single nested document, human-readable, diffs cleanly in git
- C) JSONL — one JSON object per line, built for streaming
- D) Parquet — compressed columnar binary, optimized for analytics

<details><summary>Answer</summary>

**Correct: B.** This is exactly what JSON is for: one hierarchical document that a human can read and edit, and because it's plain text it diffs cleanly in git — you can see exactly which key someone changed in a pull request. See [Files & Data Formats: the overview](/learn/python-data-apis/files-and-data-formats-overview) for the full comparison. **A** CSV is inherently tabular — rows and columns. Forcing nested settings into it means flattening keys awkwardly (`database.host`, `database.port` as separate columns) for no real benefit. **C** JSONL's whole point is many independent records processed one at a time. A settings file is one record, not a stream of them — wrapping single-document config in JSONL buys you nothing. **D** Parquet is binary, compressed, and built for large tabular datasets. You can't open it in a text editor or hand-edit it, which kills the actual requirement here.

</details>

## Question 2

You're scraping product listings overnight. You want to write each record to disk the moment it's fetched, so if the process crashes 40 minutes in, you've lost only whatever wasn't written yet — not the whole run. Which format?

- A) Parquet
- B) CSV
- C) JSONL
- D) A single JSON array

<details><summary>Answer</summary>

**Correct: C.** [JSONL](/learn/python-data-apis/json-and-jsonl-files) writes one complete JSON object per line. Each `f.write(json.dumps(record) + "\n")` is a fully independent, immediately-flushable unit — a crash after write N leaves you with N valid lines and nothing to repair. **A** Parquet files are written in one shot (or in batched row groups) from an in-memory table — you generally build up a full DataFrame and write it once, so there's no clean "append one record safely" story mid-run. **B** Tempting, since [CSV](/learn/python-data-apis/reading-and-writing-csv) can also be appended line-by-line — but products with variable or nested fields (an optional `sale_price`, a `variants` list) don't fit flat rows without committing to a fixed column schema up front, which scraped data rarely has on day one. **D** A JSON array is one document bounded by `[` and `]`. Appending a record means loading the whole file, inserting before the closing bracket, and rewriting it — slow at scale, and a crash mid-rewrite can leave the *entire* file invalid, not just the newest record.

</details>

## Question 3

Beyond appendability, why does JSONL scale better than a single JSON array for a 50 GB dataset of scraped records that a downstream script needs to process?

- A) You can process it one line at a time with `json.loads(line)`, so memory use stays roughly constant instead of needing the whole file parsed into a list before you can touch record 1
- B) JSONL files are always smaller on disk than the equivalent JSON array, because newlines replace the commas
- C) JSONL supports nested objects and arrays inside each record, while a JSON array format doesn't
- D) `json.load()` can parse a 50 GB JSONL file directly and return a list, the same way it would for a JSON array

<details><summary>Answer</summary>

**Correct: A.** `json.load(f)` on a giant array reads the *entire* file and builds the entire Python object in memory before you get anything back. With JSONL, `for line in f: record = json.loads(line)` only ever holds one record (plus whatever you choose to accumulate) at a time — you can start processing before the file has even finished writing. **B** Tempting, but file size is roughly a wash: you trade one comma per record for one newline per record, and JSONL still repeats every key name on every line, same as a JSON array of objects. Neither wins meaningfully on size — that's what Parquet's columnar encoding is for, not JSONL. **C** A JSON array's elements can be arbitrarily nested too; nesting has nothing to do with the array-vs-lines choice. The only difference is whether records live inside one top-level structure or as independent lines. **D** `json.load()` on a JSONL file raises `JSONDecodeError`, because the file as a whole isn't valid JSON — it's multiple top-level values with no enclosing `[...]` or commas between them. You must parse it line by line, which is the actual price of the streaming benefit in A.

</details>

## Question 4

A teammate says: "Just export the dataframe to CSV — it's simple and opens everywhere." Your dataframe has a `datetime64` column, a `category` column, and an `int32` column with no missing values. What actually happens when you `df.to_csv()` it and then `pd.read_csv()` it back, and what's the more robust fix?

- A) Nothing changes — CSV round-trips pandas dtypes exactly, so the teammate's instinct is correct here
- B) The datetime column comes back as plain text, the category comes back as a generic `object` column, and the `int32` may silently upcast to `int64`; `to_parquet()` / `read_parquet()` preserves all three exactly, though the resulting file is binary and won't open in a text editor
- C) Switch to Parquet — it preserves dtypes exactly and, being a well-documented open format, can still be opened and read directly in a plain text editor the way CSV or JSON can
- D) Switch to JSONL — writing each row as a JSON object preserves the exact dtype, since JSON has native number types

<details><summary>Answer</summary>

**Correct: B.** CSV is just text — it has no concept of a dtype. On reload, pandas has to *guess* types from string content: dates become plain strings unless you re-parse them with `parse_dates=` (see [type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates)), categories become generic `object` columns with the fixed category set gone, and integers default to the widest safe type. [Parquet](/learn/python-data-apis/parquet-and-columnar-formats) stores a schema alongside the columnar data, so `int32` stays `int32` and `category`/`datetime64` round-trip exactly — but packing that schema and data into a binary layout means opening a `.parquet` file in a plain text editor shows you unreadable bytes, not rows. **A** This is the actual bug the question is testing — CSV silently loses dtype information every time, one of the most common causes of "why does my column look different after I reload it" bugs (see [pandas dataframe fundamentals](/learn/python-data-apis/pandas-dataframes-fundamentals)). **C** Gets the dtype half right but wrong on the second half: Parquet's efficiency — columnar layout, compression, no repeated text per value — comes precisely *from* not being a text format. You need `pandas`/`pyarrow` or a dedicated viewer to read it, not a text editor. **D** JSON's number type doesn't distinguish `int32` from `int64`, or track "this column is categorical with these 5 allowed values." You'd get valid numbers and strings back, but not the same dtypes you started with — the same underlying problem as CSV, just wrapped in curlier syntax.

</details>

## Question 5

```python
data = "café".encode("utf-8")
print(data.decode("latin-1"))
```

What does this print, and why?

- A) `café` — `decode()` always reverses whatever `encode()` just did, regardless of which codec you name
- B) It raises `UnicodeDecodeError` — `latin-1` can't decode bytes that came from UTF-8 encoding
- C) `cafÃ©` — UTF-8 encoded the `é` as two bytes (`0xC3 0xA9`); latin-1 decodes those same two bytes one at a time into `Ã` and `©`
- D) `caf` followed by a null byte — latin-1 can't represent multi-byte characters, so it drops them and pads with `\x00`

<details><summary>Answer</summary>

**Correct: C.** `é` isn't one byte in UTF-8 — it's the two-byte sequence `0xC3 0xA9`. Latin-1 (ISO-8859-1) maps every single byte, 0 through 255, to its own character with no idea two of those bytes were meant to travel together. It decodes `0xC3` as `Ã` and `0xA9` as `©`, splicing two wrong characters in where one right one should be — that `Ã©`-style corruption is exactly what mojibake looks like in practice, and it means an encode and a decode somewhere used different codecs. **A** This is the misconception the question targets: `encode()`/`decode()` are only inverses of each other when you use the *same* codec on both ends. Naming a different codec on decode doesn't restore anything; it reinterprets the raw bytes under different rules. **B** Worth remembering precisely because it's the opposite of the real risk: latin-1 assigns a valid character to every possible byte value, so `.decode("latin-1")` never raises — it "succeeds" on literally any bytes, UTF-8 or not. That's what makes it dangerous as a guessed encoding: it corrupts data silently instead of failing loudly. **D** Nothing here truncates or pads — latin-1 decodes byte-for-byte with no length change, which is exactly why a 5-byte UTF-8 sequence decodes to a 5-character latin-1 string, always, just with the wrong characters.

</details>

## Question 6

You have eight years of daily sensor readings — 40 columns, hundreds of millions of rows — and your main workflow is loading a handful of columns into pandas and running filters and aggregations, repeatedly, on just those columns. Which format?

- A) JSON
- B) JSONL
- C) CSV
- D) Parquet

<details><summary>Answer</summary>

**Correct: D.** Parquet stores data column-by-column, not row-by-row, so `pd.read_parquet(path, columns=["temperature", "humidity", "timestamp"])` skips reading the other 37 columns off disk entirely. Add per-column compression — a column of repeated sensor IDs compresses far better than the same values scattered across text rows — and you get smaller files and faster loads for exactly this "select a few columns out of many, repeatedly" pattern. Walk through [when to reach for each format](/learn/python-data-apis/choosing-a-data-format) if this trade-off still feels fuzzy. **A** A single JSON document holding hundreds of millions of rows is impractical to even construct, and there's no way to read "just 3 of 40 fields" without parsing every object in full. **B** JSONL is row-oriented like CSV — loading it means reading every field of every row even if you only want 3 columns, and you re-pay the cost of repeating all 40 field names on every single line. **C** Tempting, since this data really is flat and tabular — but CSV is also row-oriented (no column pruning), stores every value as text with no compression and no dtypes, and at hundreds of millions of rows the file size and parse time both balloon compared to Parquet.

</details>

**Related:** [Files & Data Formats: the overview](/learn/python-data-apis/files-and-data-formats-overview) · [Reading and writing CSV](/learn/python-data-apis/reading-and-writing-csv) · [JSON and JSONL files](/learn/python-data-apis/json-and-jsonl-files) · [Parquet and columnar formats](/learn/python-data-apis/parquet-and-columnar-formats) · [Choosing a data format](/learn/python-data-apis/choosing-a-data-format) · [Type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates)
