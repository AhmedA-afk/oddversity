---
title: "Permission-aware retrieval: filter before you rank"
phase: ai
module: retrieval-with-permissions
kind: lesson
summary: "The naive way to add permissions to RAG is to rank first and filter afterward. That order leaks information even when the filter itself is correct. Filter to what the user is allowed to see, then rank within that set."
duration: 12 min
updated: "2026-09-02"
outcomes:
  - Explain why filtering after ranking can leak information even when no restricted document is ever shown in full.
  - Design a retrieval query that applies permission filters before similarity ranking, not after.
  - Name at least two ways permission data itself goes stale, and what that does to a system that trusted it once.
artifact: A retrieval function that filters a document index by a caller's permissions before ranking, with a test proving a restricted document never surfaces even indirectly, for a caller who lacks access.
---

A hospital chain builds a RAG assistant over its clinical and administrative documents. A nurse asks a question that, for a doctor, would retrieve a chunk from a restricted clinical-override policy. If the system ranks across the whole index first and checks permissions only when it is about to display a result, something worse than "wrong answer" can happen: the system's response can be shaped by a document the nurse was never meant to see, even if that exact chunk is filtered out of the final display. The fix is not filtering better. It is filtering earlier.

## Why filter-after-rank leaks even when it "works"

Consider a retriever that finds the top ten chunks by relevance across the entire index, then drops any the caller is not permitted to see, and answers from what remains. On the surface this looks correct: the restricted chunk never appears in the response. But two problems remain.

First, if six of the top ten most relevant chunks are restricted and get dropped, the system falls back to chunks four through ten in relevance order — weaker matches — and the resulting answer is visibly worse for that user than for a permitted one, on the same question, in a way that itself signals something exists that they cannot see. A sharp user can infer the presence and rough shape of a restricted document from the degraded quality of answers around it, which is an information leak even though no restricted text was ever displayed.

Second, and more directly dangerous: in an agentic system where a tool call passes retrieved context onward — into a summarisation step, into a second model call, into a log line — filtering only at the final display step means every intermediate step already touched restricted content. A bug in any one of those intermediate steps, and there are usually several, becomes a permissions bug, not a display bug.

## Filter first, then rank within what remains

The correct order applies the permission filter as a condition on the index query itself, before similarity ranking runs, so restricted content is never retrieved, never scored, and never present in anything downstream of that call.

```python
def permission_aware_search(query: str, user: User, top_k: int = 10) -> list[Chunk]:
    allowed_doc_ids = get_permitted_document_ids(user)  # from the source system's ACLs
    candidates = hybrid_search(
        query,
        filter={"doc_id": {"$in": allowed_doc_ids}},
        top_k=top_k,
    )
    return candidates
```

This requires the vector and keyword indexes to support metadata filtering as a pre-condition on the search itself, not as a post-processing step you apply to results after they come back — most production vector databases support exactly this, and it is worth confirming during the tooling decision for a build, not discovering afterward that your chosen index only supports post-filtering.

The `get_permitted_document_ids` function is doing the real work, and it should mirror the customer's actual access-control system, not reimplement a simplified version of it. Building this correctly is the same problem the data phase of this path covers under role-based access and row-level security — retrieval permissions are a specific application of that general discipline, not a separate one, and it is worth reading `/roles/forward-deployed-engineer/data/rbac-row-level-security-and-who-sees-what` alongside this lesson if you have not already.

## Where permission data goes stale

The filter above is only as correct as `allowed_doc_ids`, and that list is a live fact about the customer's organisation, not a static one. Two ways it goes stale, both worth designing against explicitly:

**Role changes lag the index.** An employee moves teams, loses access to a document set, and the retrieval system's cached view of their permissions has not caught up. Cache permission lookups for performance, but with a short enough time-to-live, or an explicit invalidation hook on the customer's identity system, that a revoked employee is not still retrieving restricted content hours later.

**Document classification changes after ingestion.** A document gets reclassified as restricted after it was already indexed as general-access — a common pattern after an incident or an audit finding. If your index does not re-check classification on a schedule, or does not receive an event when classification changes, it will keep serving the document under its old, wider permission set indefinitely.

## The multi-tenant case

The federated version of this problem — competitors, or otherwise mutually distrusting parties, sharing one platform — appears in real deployments: an aviation data platform connecting a manufacturer, competing airlines, and suppliers, where each party needs aggregate insight without seeing another party's raw data; a national health platform connecting many hospital trusts under one ontology, where the filter is not just "is this user allowed to see this document" but "is this user's organisation allowed to see this document at all, regardless of their individual role". The same filter-before-rank principle applies, with an added dimension: the permission check has to run at the tenant boundary before it runs at the individual-user boundary, and getting that ordering backward is the more consequential version of the same mistake.

## The FDE angle

A security reviewer will ask exactly one question about this system before anything else: "show me the query that proves a restricted document cannot be retrieved by an unauthorised user, not just that it is not displayed." Filter-before-rank is the design that lets you answer with a query and a passing test, not a promise about the display layer. This is also, in practice, one of the fastest ways to lose a customer's trust permanently if it is done wrong once and discovered — a permissions leak in a RAG demo is not a bug you apologise for and fix, it is the reason procurement stops the engagement.

## What you should be able to do now

Given a retrieval design, you should be able to point at exactly where the permission filter runs relative to the ranking step, explain what leaks if that order were reversed, and name the staleness risk in how the permission data itself is sourced.

Build the artifact now: a retrieval function that filters by a caller's permitted document set before ranking, and a test that constructs a restricted document highly relevant to a query, confirms it is never retrieved for an unauthorised caller, and confirms it is retrieved for an authorised one — proving the filter, not just observing the absence of a bug.
