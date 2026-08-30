---
title: "Migrating v1 to v2 in Code"
track: "structured-outputs"
status: live
summary: "Build a transformer, a version-aware parser, and a test proving old records still load, around one real breaking change: a split field."
duration: "9 min read"
---

Versioning rules are easy to agree with in the abstract. This lesson builds the actual code around one concrete breaking change, so "migrate at the boundary" stops being a phrase and becomes something you can copy.

## What we're building

A contact-record schema where v1 stores a single `contact` field that mixes emails and phone numbers together — a design mistake discovered after it shipped. v2 fixes it by splitting `contact` into separate `email` and `phone` fields, which [Versioning a Schema Without Breaking Consumers](/learn/structured-outputs/schema-versioning-basics) flags as a breaking change: no v1 record has `email` or `phone`, and nothing about the field type gives you a free way to tell old records from new ones. We'll build three pieces: a transformer that upgrades a v1 record to v2 shape, a parser that accepts either version by its tag, and a test that proves records written before this change still load correctly after it.

## Setup

Both schema versions, as [Pydantic](/learn/structured-outputs/pydantic-zod-schema-patterns) models, kept as separate named types rather than one type with everything optional — the point of versioning is catching the exact bugs a two-name, everything-required setup would hide:

```python
from typing import Literal, Optional
from pydantic import BaseModel

class ContactRecordV1(BaseModel):
    schema_version: Literal["1"] = "1"
    customer_id: str
    contact: str  # an email OR a phone number, mixed together — the mistake

class ContactRecordV2(BaseModel):
    schema_version: Literal["2"] = "2"
    customer_id: str
    email: Optional[str] = None
    phone: Optional[str] = None
    contact_raw: Optional[str] = None  # kept when migration can't confidently classify
```

`contact_raw` isn't part of the "clean" v2 design — it exists specifically to hold onto information a lossy migration might otherwise drop, which the harden-it step below explains.

## Build it

### Step 1 — Write the migration transformer

```python
import re

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_PATTERN = re.compile(r"^[\d\-\+\(\)\s]{7,}$")

def migrate_v1_to_v2(v1: ContactRecordV1) -> ContactRecordV2:
    raw = v1.contact.strip()
    if EMAIL_PATTERN.match(raw):
        return ContactRecordV2(customer_id=v1.customer_id, email=raw)
    if PHONE_PATTERN.match(raw):
        return ContactRecordV2(customer_id=v1.customer_id, phone=raw)
    # Doesn't confidently match either shape — don't guess, keep the original.
    return ContactRecordV2(customer_id=v1.customer_id, contact_raw=raw)
```

> **Why this step?** This is the one function that knows both schema versions exist. Everything downstream of it only ever sees `ContactRecordV2` — the split happens once, here, instead of being re-derived every time a v1 record gets touched.

### Step 2 — Write the version-aware parser

```python
def parse_contact_record(payload: dict) -> ContactRecordV2:
    version = payload.get("schema_version", "1")  # no tag at all = pre-versioning legacy data
    if version == "1":
        return migrate_v1_to_v2(ContactRecordV1.model_validate(payload))
    if version == "2":
        return ContactRecordV2.model_validate(payload)
    raise ValueError(f"Unrecognized schema_version: {version!r}")
```

> **Why this step?** This is the single seam mentioned in [Schema Versioning: Evolving a Contract Without Breaking Consumers](/learn/structured-outputs/schema-versioning-and-migration) — business logic anywhere else in the codebase calls `parse_contact_record` and only ever receives a `ContactRecordV2`, never an `if hasattr(record, "contact")` check scattered through unrelated code. Defaulting an untagged payload to `"1"` matters specifically because most real systems have records written before anyone thought to add a version field at all.

### Step 3 — Prove it with a test

```python
def test_v1_email_migrates_to_v2():
    result = parse_contact_record({
        "schema_version": "1", "customer_id": "cust_042", "contact": "ada@example.com",
    })
    assert (result.email, result.phone) == ("ada@example.com", None)

def test_v1_phone_migrates_to_v2():
    result = parse_contact_record({
        "schema_version": "1", "customer_id": "cust_043", "contact": "+1 555-123-4567",
    })
    assert (result.email, result.phone) == (None, "+1 555-123-4567")

def test_v2_passes_through_unchanged():
    result = parse_contact_record({
        "schema_version": "2", "customer_id": "cust_044", "email": "b@example.com",
    })
    assert result.email == "b@example.com"

def test_legacy_record_with_no_version_tag_still_loads():
    # Written before schema_version existed at all — must not be dropped.
    result = parse_contact_record({"customer_id": "cust_001", "contact": "old@example.com"})
    assert result.email == "old@example.com"
```

> **Why this step?** The fourth test is the one that actually matters for this lesson's promise. It's easy to write a migration that works on fixtures crafted after the fact; this test uses the *actual old shape*, with no version field at all, and proves it still resolves correctly. Run this in CI, permanently — [Regression Testing Schemas and Prompts](/learn/structured-outputs/regression-testing-schemas-and-prompts) covers keeping a small corpus of real historical payloads for exactly this purpose, not just synthetic ones.

## Run it

```bash
pytest test_contact_migration.py -v
```

All four pass, and — this is the point — they keep passing after v2 becomes the default shape your extraction pipeline produces going forward, because the parser never assumes which version it's holding until it checks the tag.

## Harden it

Two gaps this version leaves open:

- **The ambiguous case is silent.** A `contact` value that matches neither pattern (a garbled OCR read, a Skype handle, someone's name typed into the wrong field) falls into `contact_raw` with no signal that it needs a human look. Add a `needs_review: bool` field to `ContactRecordV2`, set it wherever `migrate_v1_to_v2` falls through to the `contact_raw` branch, and route those records to a queue instead of leaving them silently under-populated — the same pattern as [Extraction Confidence and Review Routing](/learn/structured-outputs/extraction-confidence-and-review-routing).
- **An unrecognized version currently crashes the whole call.** That's the right default for a version you've genuinely never seen — silently guessing would be worse — but log it with the full payload before raising, so a v3 rollout that forgot to update this parser fails loudly in a way someone actually sees, not as a stack trace three services downstream.

## Extend it

When v3 arrives, resist writing a `migrate_v1_to_v3` shortcut alongside `migrate_v2_to_v3` — two migration functions per version pair is fine for one hop, but it turns combinatorial fast. Chain them instead: `parse_contact_record` always upgrades one version at a time (`v1 → v2 → v3`), so adding a new version means writing exactly one new transformer, not one per old version still in your data. The four tests above become the template for every future migration: one test per meaningfully different old shape, always including at least one payload with no version tag at all, because that's the shape most likely to still be sitting in storage from before anyone was versioning in the first place.

**Related:** [Versioning a Schema Without Breaking Consumers](/learn/structured-outputs/schema-versioning-basics), [Schema Versioning: Evolving a Contract Without Breaking Consumers](/learn/structured-outputs/schema-versioning-and-migration), [Regression Testing Schemas and Prompts](/learn/structured-outputs/regression-testing-schemas-and-prompts), [Pydantic and Zod: Deriving Schemas from Code](/learn/structured-outputs/pydantic-zod-schema-patterns)
