---
title: "Lab: permissioned search over a policy corpus"
phase: ai
module: retrieval-with-permissions
kind: lab
summary: "Build a hybrid, permission-aware retriever over a small synthetic HR-policy corpus with documents visible to different roles, and prove with tests that a restricted document never surfaces for a caller who should not see it."
duration: 3 h
updated: "2026-09-02"
outcomes:
  - Build a structure-aware chunker and a hybrid retriever over a real (synthetic) document set.
  - Apply a permission filter before ranking, and prove it holds under an adversarial test, not just a happy-path one.
  - Produce a small labelled eval set for retrieval quality, separate from the permission tests.
artifact: A working retrieval service (chunker, hybrid index, permission filter, a handful of eval queries) with a passing test suite, in your repository, plus a short write-up of one failure you found and fixed.
---

You are building search over a fictional co-operative bank's internal HR policy corpus: leave policy, expense policy, disciplinary procedure, a confidential executive-compensation policy, and a whistleblower-protection policy visible only to HR and legal. Three roles will query it: a general employee, a line manager, and an HR business partner, each with different visibility. This lab builds the retriever from the previous three lessons end to end, and the definition of done is a permission proof, not just a working demo.

## What you are given

Construct a small synthetic corpus yourself — six to ten short policy documents, a few hundred words each, covering the areas above, with at least one table (a leave-accrual schedule by tenure) and at least one document with nested numbered clauses where a later clause modifies an earlier one. Assign each document a visibility level: `all_employees`, `managers`, or `hr_legal`. This mirrors the real shape of the problem without requiring any actual customer data — the corpus is fictional and the bank is fictional; do not model this on a real institution's actual policies.

## Steps

1. **Chunk the corpus.** Apply structure-aware chunking from the earlier lesson: split on section and clause boundaries, and for the table document, repeat the header row in every chunk derived from it. Tag every chunk with its source document ID and that document's visibility level.

2. **Build the hybrid index.** Stand up a keyword index (BM25 or equivalent) and a vector index over the chunks. Confirm both work independently first — a keyword search for an exact phrase from one document, and a vector search for a paraphrase of a different document's content — before combining them.

3. **Combine with reciprocal rank fusion.** Implement or use a hybrid search function that merges the two ranked lists. Construct one test query that only the keyword retriever would find (an exact clause number) and one that only the vector retriever would find (a paraphrase with no shared exact terms), and confirm hybrid search catches both.

4. **Add the permission filter, before ranking.** Write `get_permitted_document_ids(role)` for the three roles above, and wire it into the search call as a pre-ranking filter, exactly as in the permission-aware-retrieval lesson. Do not filter results after they come back — the index query itself should only ever consider permitted documents.

5. **Write the adversarial test.** Construct a query where the most relevant document is the confidential executive-compensation policy, run it as a general employee, and assert that document never appears in the result set — not filtered from a longer list, absent from the query's candidate set entirely. Then run the identical query as an HR business partner and assert it does appear. This pair of tests, not the happy path, is what proves the filter works.

6. **Add reranking.** Take the top candidates from hybrid search for a handful of test queries and add a reranking pass. Compare the ranked order before and after reranking on at least one query where you can tell, by reading the chunks, that reranking improved the order.

7. **Build a small retrieval eval set.** Separately from the permission tests, write eight to ten real questions an employee might actually ask (using the corpus's actual policy content), label the correct source document and, ideally, the correct chunk for each by hand, and score your retriever's top-3 hit rate against those labels. This is a retrieval-quality eval, distinct from the permission tests — a system can pass every permission test and still retrieve the wrong, permitted document.

8. **Break something on purpose, then fix it.** Pick one deliberate failure to induce and observe: feed the retriever a fixed-size chunker instead of the structure-aware one and see which of your eval queries regress, or swap the filter to run after ranking instead of before and confirm your adversarial test in step 5 now fails. Fix it back, and write down what broke and why in one paragraph — this is the write-up you hand in with the lab.

## Definition of done

- A hybrid retriever that demonstrably uses both keyword and vector signals, with a test proving each is necessary (removing either regresses at least one test query).
- A permission filter applied before ranking, proven by the adversarial test in step 5, not asserted by inspection.
- A retrieval eval set of at least eight labelled queries with a measured hit rate, separate from the permission tests.
- A one-paragraph write-up of the deliberate failure from step 8: what broke, how you noticed, and what the fix was.
- All of the above runnable from a single command, so a reviewer — or you, six months from now — can reproduce the result without reading your notes first.

## How this could go wrong

**The permission filter is correct in code but the test only checks the happy path.** A test that only confirms an HR user can see the confidential document proves nothing about the leak this lab exists to catch. The adversarial direction — proving a restricted document is absent for an unauthorised caller, on a query specifically designed to make that document the most relevant candidate — is the test that matters, and it is the one people skip because it is more work to construct.

**The corpus is too clean.** If every document is topically distinct with no overlapping vocabulary, hybrid search and reranking will not visibly improve anything, and you will not learn what they are for. Make at least two documents share enough vocabulary (leave policy and expense policy both mention "manager approval", for instance) that ranking quality is genuinely being tested.

**Chunking is done once and never revisited.** If your eval hit rate is poor, the instinct is to tune the ranker. Check the chunks themselves first — a poor hit rate is very often a chunking problem wearing a retrieval costume, exactly as the RAG-failure-modes lesson describes.

**Reranking is added before hybrid search is confirmed working.** Reranking can only reorder what made it into the shortlist. If hybrid search is missing the right chunk entirely, no amount of reranking recovers it — confirm step 3 works before spending time on step 6.
