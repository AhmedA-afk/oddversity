---
title: "SAP and ERP exports: living with the flat file"
phase: data
module: enterprise-connectors
kind: lesson
summary: "You will rarely get an API into an ERP. You will get a nightly file, someone's cron job, and a schema nobody wrote down. Here is how to parse it correctly, and what to ask the functional consultant before you touch it."
duration: 14 min
updated: "2026-09-02"
outcomes:
  - Explain why direct API access into SAP or another core ERP is the exception, not the default, in most deployments.
  - Parse both delimited and fixed-width ERP exports correctly, including the codes that look like data-quality bugs but are not.
  - List the three questions to ask the ERP's functional consultant before building against an export.
artifact: A parser that turns a real-shaped ERP flat file into a typed table, with the material and plant code conventions preserved.
---

SAP runs the back office of a large share of the manufacturers, distributors, and public-sector bodies you will deploy into, and the same pattern shows up under Oracle E-Business Suite, Microsoft Dynamics, and homegrown ERPs: a system of enormous configurability, guarded by a small team of functional consultants, that you will almost never be allowed to query directly.

What you get instead, in the overwhelming majority of engagements, is a **flat file**: a scheduled batch job that dumps a table or a report to a shared folder or an SFTP drop, once a night or once an hour. This lesson is about taking that file seriously as an interface, because it is one, with its own quirks that will not look like quirks the first time you meet them.

## Why an API is rarely on the table

SAP does expose APIs — RFC/BAPI calls, IDocs, and in modern S/4HANA deployments, OData services — but getting one opened for you usually means: a change request through the customer's IT governance process, a security review of what the calling application can do, a dedicated service user with its own authorisation profile in SAP's own permission model, and a functional consultant's time to configure the exposed fields correctly. None of that is fast, and none of it is something the business owner who invited you can approve alone.

The flat file exists precisely because someone already solved this problem years ago for a different report, and reusing that export is faster than opening a new integration. Ask, on day one, "is there already an export that's close to what I need," before asking for a new API. The answer is usually yes, and the gap between "close" and "exact" is where the real transformation work lives.

## Reading the file correctly

Two shapes recur.

**Delimited exports** (CSV, pipe-delimited, tab-delimited) are the easier case, but carry three habits specific to ERP exports: a header block before the actual column headers (a report title, a run date, a page number — strip it, do not assume row one is the header), a footer summary row (a totals line that will silently poison a sum if you do not exclude it), and an encoding that is not UTF-8. Windows-1252 or an Indian-locale code page is common when the export runs from a Windows batch job; read the wrong encoding and you get rupee symbols, accented vendor names, or Devanagari fields turning into mojibake rather than a clean error.

**Fixed-width exports** are older and still common on core ERP and mainframe-adjacent systems, because they predate any delimiter convention and nobody has had a reason to change a working nightly job. Every field occupies a fixed number of characters, right- or left-padded, with no separator at all.

```python
"""Parse a fixed-width SAP-style material master export."""
from dataclasses import dataclass

# (field name, start, end) — 0-indexed, end exclusive. Get this spec from
# the functional consultant or the job's own documentation; guessing
# column widths from a sample file is how you silently truncate a field.
LAYOUT = [
    ("material_code", 0, 18),
    ("plant_code",    18, 22),
    ("description",   22, 62),
    ("uom",           62, 65),
    ("std_price",     65, 80),
    ("currency",      80, 83),
]

@dataclass
class MaterialRow:
    material_code: str
    plant_code: str
    description: str
    uom: str
    std_price: str
    currency: str

def parse_line(line: str) -> MaterialRow:
    values = {name: line[start:end].strip() for name, start, end in LAYOUT}
    return MaterialRow(**values)

def parse_file(path: str, encoding: str = "cp1252"):
    with open(path, encoding=encoding) as fh:
        for lineno, line in enumerate(fh, start=1):
            if not line.strip() or line.startswith("*"):   # blank or comment/footer marker
                continue
            try:
                yield parse_line(line.rstrip("\n"))
            except Exception as exc:
                raise ValueError(f"line {lineno}: {exc}") from exc
```

The comment on `LAYOUT` is the important line in that file. Column positions come from a specification, not from eyeballing a sample. A material code field that looks 15 characters wide in your one sample file might be 18 characters wide with leading spaces in a row you have not seen yet, and a guessed layout will silently shift every field after the wrong one rather than raising an error.

## Codes that look like bugs and are not

Three patterns recur across SAP-shaped exports specifically, and each has burned someone into filing a bug report against data that was actually correct.

- **Leading zeros in material and customer codes.** `0000123456` is the real key, not `123456` with formatting applied. Read the field as a string, always, never as a number, or a spreadsheet tool or a lazy `int()` cast will strip the zeros and silently break every join against the source system.
- **Plant and company codes are short, opaque, and load-bearing.** A four-character plant code like `1000` means one manufacturing site to the ERP and nothing to a human reading a report. Get the code-to-name mapping table on day one; it is usually a small, stable reference table someone can hand you in five minutes, and without it, every downstream number is unreadable to the customer.
- **Deletion flags, not deleted rows.** SAP rarely deletes a master data record. A material marked for deletion carries a flag (often `LVORM` or similar) and stays in the export forever. Filter on the flag explicitly; do not assume absence means deleted, because it usually means still there and now wrong.

## Three questions for the functional consultant

Every SAP-adjacent engagement has a functional consultant, in-house or from the ERP's implementation partner, who holds knowledge that exists nowhere in writing. Get thirty minutes with them before you build anything, and ask:

1. **"What does this export leave out?"** Every scheduled report has a WHERE clause someone wrote for a different purpose years ago — a plant excluded, a status filtered, a date range capped. That filter is now invisibly shaping your data.
2. **"What changed in the last major upgrade or restructuring?"** A company-code merger, a chart-of-accounts restructuring, or a plant consolidation leaves old codes still present in historical rows, mapped inconsistently to the new ones.
3. **"Who owns a change to this export, and how long does that take?"** If the file is missing a field you need, this is the lead time you plan around, and it is usually measured in weeks, not days, because SAP changes go through change control.

## What you can now do

You can treat a flat file from an ERP as a real interface with its own contract, parse both delimited and fixed-width shapes correctly against a documented layout rather than a guess, and recognise the three code patterns — leading zeros, opaque plant codes, deletion flags — that read as bugs to someone who has not worked against SAP exports before and are not.
