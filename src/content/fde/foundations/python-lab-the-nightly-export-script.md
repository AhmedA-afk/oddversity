---
title: "Lab: the nightly export script that must not silently fail"
phase: foundations
module: python-for-the-field
kind: lab
summary: "Build a script that exports a table to CSV on a schedule, then break it on purpose four ways — a missing dependency, a dropped connection, a partial write, a swallowed exception — until it fails loudly every time instead of quietly some of the time."
duration: "2 h"
updated: "2026-09-02"
outcomes:
  - Write an export script that logs its own success or failure somewhere a human, or a monitor, can check the next morning without reading source code.
  - Make the script idempotent, so a re-run after a crash never produces duplicate or half-written output.
  - Turn every failure mode into a non-zero exit code, and explain why a cron job that always exits 0 is a cron job nobody trusts.
artifact: "A nightly_export.py script, a sample run log, and a short README written for the customer's ops team, not for you."
---

Every customer engagement eventually needs a script that moves data from one system to another, unattended, on a schedule. It runs at 2am or 3am, nobody is watching, and the only signal anyone gets is whether the file showed up where it was supposed to. The failure mode you are defending against is not "the script crashes" — a crash is loud and easy to notice. The failure mode is the script that appears to succeed, writes a truncated or stale file, and nobody finds out until a report built on that file is wrong three weeks later.

This lab builds one script, then deliberately breaks it four different ways to prove it fails the way you intend, not the way Python happens to fail by default.

## What you're building

A script that reads rows from a source table (a local SQLite database is fine — you are not testing the database here) and writes them to a timestamped CSV file, logging its own outcome, in a form you could hand to an ops team that has never seen your code.

## Steps

**1. Set up a tiny source database** so there is something real to export:

```python
# setup_source.py — run once
import sqlite3

conn = sqlite3.connect("orders.db")
conn.execute("""
CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    amount REAL,
    created_at TEXT
)
""")
conn.executemany(
    "INSERT INTO orders VALUES (?, ?, ?, ?)",
    [(i, i % 20, 49.99 * (i % 7 + 1), f"2026-09-0{(i % 9) + 1}") for i in range(1, 501)],
)
conn.commit()
conn.close()
```

**2. Write the export script with logging first, logic second.** Set up logging before you write a single line of business logic — a script that only adds logging after something has already gone wrong in the field is a script you are debugging blind.

```python
# nightly_export.py
import csv
import logging
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler("export.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("nightly_export")

def export_orders(db_path: str, out_dir: str) -> Path:
    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    tmp_path = Path(out_dir) / f".orders_{run_id}.csv.tmp"
    final_path = Path(out_dir) / f"orders_{run_id}.csv"

    conn = sqlite3.connect(db_path)
    try:
        cursor = conn.execute("SELECT order_id, customer_id, amount, created_at FROM orders ORDER BY order_id")
        rows = cursor.fetchall()
        if not rows:
            raise RuntimeError("source query returned zero rows — refusing to write an empty export")

        with open(tmp_path, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["order_id", "customer_id", "amount", "created_at"])
            writer.writerows(rows)

        tmp_path.rename(final_path)  # atomic on the same filesystem
        log.info("exported %d rows to %s", len(rows), final_path)
        return final_path
    finally:
        conn.close()

if __name__ == "__main__":
    try:
        export_orders("orders.db", ".")
    except Exception:
        log.exception("export failed")
        sys.exit(1)
    sys.exit(0)
```

Two choices here are load-bearing, not decoration. First, the script writes to a `.tmp` file and only renames it to the final name once the write is complete — a reader watching the output directory never sees a half-written file, because the rename is atomic on the same filesystem. Second, an empty result set raises instead of writing an empty file, because "the export ran and produced nothing" is far more often a broken query or an empty source than a genuinely empty day, and treating it as success hides that from everyone downstream.

**3. Run it and confirm the happy path:**

```bash
python setup_source.py
python nightly_export.py
cat export.log
ls orders_*.csv
```

**4. Break it, way one: point it at a database that does not exist**, and confirm you get a logged failure and exit code 1, not a silent hang or a bare traceback with no exit code check:

```bash
python -c "
import sys
sys.path.insert(0, '.')
from nightly_export import export_orders
export_orders('does_not_exist.db', '.')
"
echo "exit code: $?"
```

Adapt `nightly_export.py` temporarily to point at the missing file and confirm `echo $?` shows `1`, and `export.log` has a full traceback via `log.exception`, not just a one-line message.

**5. Break it, way two: simulate a write failure mid-export**, by pointing the output directory at a path you do not have permission to write to (`out_dir="/root"` if you are not root). Confirm the script fails before renaming to `final_path`, and that no partial `orders_*.csv` file (only the `.tmp`, if anything) is left behind for the next process to accidentally read.

**6. Break it, way three: introduce a duplicate run.** Run the script twice in the same minute. Confirm you get two distinct, correctly named files rather than one file silently overwritten or corrupted — then decide, and write down in your README, whether the customer wants "keep every run" (what this script does) or "overwrite yesterday's file" (a one-line change, replacing the timestamp with a fixed filename), because both are legitimate and the difference has caused real incidents when assumed instead of asked.

**7. Wire it to cron or systemd and confirm the exit code actually gets checked.** A script that fails correctly is worthless if nothing reads its exit code. Add a one-line wrapper the customer's monitoring can poll:

```bash
# crontab -e
0 2 * * * cd /opt/export && /usr/bin/python3 nightly_export.py || echo "export failed at $(date)" >> /var/log/export_alerts.log
```

## Definition of done

- `nightly_export.py` exits `0` on success and `1` on any failure, with the exception fully logged via `log.exception` (traceback included) rather than caught and discarded.
- A zero-row result is treated as a failure, not a successful empty export.
- The output file never appears partially written — verified by the temp-file-then-rename pattern, not just by reading the code.
- Two runs in quick succession produce two distinct, correctly ordered files, and you have written down, in the README, which retention behaviour the customer actually wants.
- `export.log` alone — without looking at the source — tells someone whether last night's run succeeded, how many rows it moved, and if it failed, why.

## How this goes wrong

**The bare `except: pass`.** The single most common way an export script goes quiet in production is a broad exception handler added under deadline pressure to stop an alert from firing, with the intention of "fixing it properly later." It never gets fixed, because it never fires an alert again. Never write a bare `except`, and be suspicious of any `except Exception` that does not re-raise or explicitly log and exit non-zero.

**Cron's minimal environment.** A script that works perfectly when you run it by hand can fail under cron because cron runs with a stripped-down `PATH` and no shell profile loaded — a script that shells out to a binary found via your interactive `PATH`, or that relies on an environment variable set in `.bashrc`, will fail under cron with an error that looks nothing like the actual cause. Always use absolute paths for both the interpreter and any external commands in a scheduled script.

**Trusting "it ran" over "it produced correct output."** A monitor that only checks whether the process exited 0 will happily report success on a script that connected to the wrong database, exported the wrong table, or silently dropped rows that failed a type conversion. The row-count log line above is not decoration — it is the cheapest anomaly detector available, and a customer's ops team pasting last night's row count into a monitoring dashboard is a five-minute addition that catches problems your exit code alone never will.
