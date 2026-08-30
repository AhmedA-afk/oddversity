---
title: "Capstone: A Production Extraction Service"
track: "structured-outputs"
status: live
summary: "The module's capstone: an invoice-extraction service that survives a provider swap, a schema change, and a CI gate, with numbers to prove it."
duration: "10 min read"
---

Every lesson in this module was a piece: a portable schema, an adapter, an eval harness, a gold set, a regression gate, a production monitor. This is where they have to work together, against a real (if small) document corpus, producing numbers you actually measured rather than numbers you assumed.

## The brief

Build a document-extraction service for a small corpus of invoices or bank statements — synthetic or sanitized real ones both work, as long as they vary in format, vendor, and at least a few genuinely awkward edge cases (a missing field, an unusual currency, a scanned document with OCR noise if you're extracting from images).

The service must: define its output as a single versioned schema, not a schema re-derived per call site; support at least two providers behind one adapter interface, swappable by config; consume its own output as a stream where the input is long enough to matter; validate every response and auto-repair what fails validation before falling back to a review queue; route low-confidence extractions to that review queue instead of accepting them silently; run a gold-backed eval harness scoring all four quality metrics; gate merges in CI against that harness with a threshold that accounts for sampling noise; and log the four production signals from this module's monitoring lesson on every run against the corpus.

This is graded the way it should be in real work: an eval report either shows the numbers or it doesn't, and a CI run either blocks a deliberately-broken change or it doesn't.

## Acceptance criteria

- [ ] The output schema is defined once, in Pydantic or Zod, carries an explicit `schema_version`, and is never redefined ad hoc at a call site.
- [ ] Two provider adapters exist behind one shared interface (`request` / `normalize`), and switching between them is a one-line config change with no changes to extraction or validation logic.
- [ ] Every response is schema-validated before touching business logic; a validation failure triggers a bounded repair retry (capped, not unbounded) before falling through to the review queue.
- [ ] Extractions below a defined confidence threshold are routed to review rather than auto-accepted, and the routing rate is logged.
- [ ] A gold dataset of at least 20 labeled documents exists, includes a labeled "hard" subset of edge cases, and is demonstrably absent from any prompt or few-shot example used by the extractor.
- [ ] An eval harness runs the full corpus against gold and reports all four metrics — valid-rate, schema-conformance rate, field-level accuracy per field, and full-object exact-match — plus a named weakest field.
- [ ] A CI check runs the harness on every change to the schema, prompt, or provider config, and fails the build on a genuine regression while tolerating one sampling-noise-sized run (multiple runs or a margin, not a bare "any decrease fails").
- [ ] A monitoring rollup logs invalid-rate, repair frequency, field-value distribution, and review-routed rate across a full corpus run, in a form that could be diffed against a future run.
- [ ] A short write-up reports the corpus's actual valid-rate and field accuracy as measured — not estimated — along with the weakest field found and what, if anything, was done about it.

## Suggested stack

Language is your choice — nothing here is SDK-specific. You'll want: two provider SDKs (a hosted-API one and, if you want the strongest constraint guarantee, a local grammar-constrained engine); a small corpus, 20-40 documents is plenty to demonstrate the mechanics, with a few deliberately awkward ones; a place to store the gold labels separately from the corpus and from any prompt file, so leakage is structurally hard, not just a habit; and a CI runner (any standard one) wired to run the harness on push.

## Milestones

Treat these as capabilities to reach, not a fixed build order — several can be developed in parallel:

- **Portable.** The schema and validation logic are provider-agnostic; each adapter's `request`/`normalize` pair is the only place a provider's name appears in code.
- **Streamed.** For at least one long document, the service consumes a streamed response and can report partial progress before generation completes.
- **Self-correcting.** A validation failure triggers a repair retry using the validator's own error message, capped at a small retry count, before falling back to review — not an unbounded loop and not a silent pass-through of bad data.
- **Measured.** The eval harness runs against the gold set and produces all four metrics plus a weakest-field call-out, on demand and in CI.
- **Gated.** A deliberately-introduced regression (a broken prompt edit, a stripped field description) is caught by the CI check; a genuinely neutral change (a comment, a refactor with no behavior change) is not.
- **Watched.** A full corpus run produces a monitoring rollup with all four production signals, in a form you could compare week over week.

## What good looks like

A submission where every acceptance criterion is checked, where the eval report's numbers came from an actual run against the actual corpus rather than a filled-in placeholder, and where the write-up reads like an honest status report: here's the valid-rate, here's field accuracy per field, here's the weakest field and why, here's what's still not good enough. The strongest submissions treat the "deliberately introduce a regression" step as a real test — a genuinely plausible mistake, not an obvious one — and can show the CI gate actually catching it, with the gate's reasoning (which threshold, which run count) stated in the write-up rather than left as an unexplained pass/fail.

## Extensions

- Add a third provider adapter using a grammar-constrained OSS engine, and compare its valid-rate against the two hosted APIs on the same gold set — a real test of whether owning the constraint actually buys the reliability the cross-provider landscape claims it does.
- Extend the monitoring rollup into a real dashboard, plotting field-value distribution over multiple corpus runs rather than a single snapshot.
- Feed a field flagged as weakest by the harness through the full fix loop: read the actual failing records, distinguish a description fix from a schema-coverage gap, apply it, and report the before/after delta on the same gold set.
- Add a second schema version with an intentionally breaking change (a renamed field), and extend the CI gate to detect when a schema change invalidates part of the existing gold set rather than silently comparing incomparable numbers.

**Related:** [Writing Portable Schema Code](/learn/structured-outputs/writing-portable-schema-code), [Building an Eval Harness](/learn/structured-outputs/building-an-extraction-eval-harness), [Regression-Testing Structured Output in CI](/learn/structured-outputs/regression-testing-schemas-and-prompts), [Monitoring in Production](/learn/structured-outputs/monitoring-structured-output-in-production), [Validation and Auto-Repair](/learn/structured-outputs/validation-and-auto-repair), [The Cross-Provider Landscape](/learn/structured-outputs/cross-provider-landscape)
