---
title: "Capstone 01: the permissioned research assistant (after Morgan Stanley)"
phase: practice
module: capstones
kind: capstone
summary: "Rebuild the shape of the Morgan Stanley research deployment: retrieval over a document corpus where every user sees a different subset, an eval labelled by domain experts before you build, and an adoption plan that assumes trust takes longer than the build. Deployed to a VPC, not your laptop."
duration: 3 weeks
updated: "2026-09-02"
outcomes:
  - Build a retrieval system where entitlements are enforced in the query, not in the prompt, and prove it with a negative-permission eval.
  - Label 60 questions with two independent labellers, record the disagreements, and score citation-grounded accuracy against a keyword baseline.
  - Deploy the service into a VPC with a private database and rehearse a one-minute rollback.
artifact: A repository containing the labelled eval set, the scorer, the entitlement module, the deployed service, a first-person write-up with your measured numbers, a recorded walkthrough, and a generalise-vs-one-off memo.
sources:
  - "https://www.zenml.io/llmops-database/forward-deployed-engineering-for-enterprise-llm-deployments"
  - "https://www.zenml.io/llmops-database/forward-deployed-engineering-bringing-enterprise-llm-applications-to-production"
---

## The public case, and what is actually known about it

In 2023 Morgan Stanley deployed a GPT-4-based system that gave wealth advisors retrieval access to the firm's internal research corpus. It is usually described as the first large enterprise GPT-4 deployment.

What is reasonably solid: the shape. Retrieval over a controlled document corpus, an eval regime built for a regulated context where a wrong citation is a compliance event, and a long adoption phase after the engineering was finished.

What is company-reported and should be labelled that way every time you repeat it: 98% advisor adoption and a threefold increase in research-report usage. Both figures come from Colin Jarvis, OpenAI's head of Forward Deployed Engineering, in a talk transcribed in the ZenML LLMOps database. They are his stated figures for his own team's engagement. There is no independent audit of them in the public record, and OpenAI's own case page was not reachable when this path's research was compiled, so even the primary marketing version is second-hand here. The same applies to the timeline he gives: six to eight weeks for the technical pipeline, then roughly four more months of trust-building and eval rigour before regulated use.

Use the timeline. It is the most useful thing in the case, because it tells you the build is the short part. Do not use the adoption number as if it were yours.

## The customer stand-in

**Kestrel Wealth Partners.** A fictional independent advisory firm, about 400 advisors across the US Midwest, with a nine-person research desk in Pune that publishes internal notes overnight. Three document classes:

- **Public filings.** Everyone can read them.
- **Internal research notes.** Visible to advisors whose licence covers the asset class, and to nobody else.
- **Restricted notes.** Anything touching a company where the firm has a banking relationship. Visible only to a named list, and the fact that a restricted note exists must not leak through the answer.

Two stakeholders you will hear from in your own head all the way through. **Priya Raghunathan**, head of the research desk, wants advisors to stop emailing her the same four questions and cares that the answer cites the right note. **Dale Ferraro**, compliance, does not want the system at all, and his only question is what happens when an advisor asks about a company on the restricted list. Dale is right to ask. Build for Dale.

## The data pack

Two halves, both legitimately obtainable.

**Public half.** SEC EDGAR. Company filings are freely downloadable over HTTP with a declared user-agent, and 10-K and 10-Q documents give you long, ugly, real text with tables, footnotes, and the kind of formatting that breaks naive chunking. Pull twenty filings across six companies.

**Private half.** Synthetic internal notes, generated so that entitlements have something to bite on. Generate them, do not write them by hand, so you can regenerate when your schema changes.

```python
import json, random, uuid

random.seed(7)

SECTORS = ["semis", "banks", "energy", "pharma", "logistics", "retail"]
CLASSES = ["public", "internal", "restricted"]
TICKERS = ["KSTR", "ORVEX", "PLUMA", "BHARATCO", "NORDEL", "SANTIQ"]

def note(i: int) -> dict:
    cls = random.choices(CLASSES, weights=[2, 6, 2])[0]
    sector = random.choice(SECTORS)
    ticker = random.choice(TICKERS)
    return {
        "doc_id": str(uuid.uuid4()),
        "title": f"{ticker} {sector} update {i:03d}",
        "ticker": ticker,
        "sector": sector,
        "classification": cls,
        "allowed_sectors": [sector],
        "allowed_users": (["u_042", "u_117"] if cls == "restricted" else []),
        "published": f"2026-0{random.randint(1,8)}-{random.randint(10,28)}",
        "body": (
            f"Desk view on {ticker}. We move our estimate for FY27 revenue to "
            f"{random.randint(90, 140)} and hold the rating. Key risk is "
            f"{random.choice(['input costs', 'tariff exposure', 'refinancing', 'channel inventory'])}."
        ),
    }

with open("notes.jsonl", "w") as f:
    for i in range(300):
        f.write(json.dumps(note(i)) + "\n")
```

Three hundred notes is enough. The interesting property is not volume, it is that some notes are restricted and some questions have their only good answer inside a restricted note.

## The eval, before anything else

You will write the eval set, the scorer, and the baseline, and commit them, before you write the retrieval system. This is a hard gate on the rubric.

**The question set.** Sixty questions, drawn from three advisor personas: the generalist who asks broad sector questions, the specialist who asks about one ticker in depth, and the new joiner who asks questions that are slightly wrong. Fifteen of the sixty must be entitlement traps: questions whose best answer sits in a document the asking user cannot see.

**The labelling protocol.** Write it down before labelling, in the repository, and follow it.

1. Two labellers work independently. If you cannot find a second person, label the set twice a week apart, without looking at your first pass, and treat the two passes as two labellers. Say in the write-up that you did this. It is weaker and honesty about it costs you nothing.
2. Each question gets: the gold answer in one or two sentences, the set of `doc_id` values that support it, and a label from `answerable` / `answerable_only_from_restricted` / `not_in_corpus`.
3. Disagreements are not averaged. They are listed in `eval/disagreements.md` with both readings and the adjudication. Enterprise domain experts disagree about their own domain constantly, and the disagreements are where you learn what the customer actually means.
4. Freeze the set. Any later change gets a new file and a note about why.

**The scorer.** Four numbers, all computed by your code:

- **Citation-grounded accuracy.** Does the answer cite at least one gold document, and does every factual claim map to a retrieved chunk.
- **Leak rate.** How often a restricted document's content, title, or existence appears in an answer for a user without rights. This one must be zero, and it is scored as a gate inside the capstone, not as a percentage.
- **Correct refusal rate.** On the `not_in_corpus` and out-of-entitlement questions, does it say it cannot answer rather than improvising.
- **Unsupported-claim rate.** Sentences with a number or a name in them that no retrieved chunk contains.

**The baseline.** BM25 or plain `LIKE` keyword search over the notes, returning the top three documents with no model at all. Run the scorer against it. Write the number down. If your finished system does not beat that number by a margin you can defend, the honest write-up says so.

## The build, in stages

**Stage 1: ingestion and identity.** Load EDGAR filings and the synthetic notes into one store. Chunk with the structure, not by character count: filings have headings, use them. Every chunk inherits `doc_id`, `classification`, `allowed_sectors`, `allowed_users`. Build a users table with sector licences.

**Stage 2: retrieval with the filter in the query.** This is the whole capstone in one design decision. The entitlement predicate goes into the retrieval query, so that a document the user cannot see is never a candidate. It does not go into a re-ranking step and it certainly does not go into the prompt.

```python
def visible_predicate(user):
    return (
        "(classification = 'public' "
        " OR (classification = 'internal' AND sector = ANY(%(sectors)s)) "
        " OR (classification = 'restricted' AND %(uid)s = ANY(allowed_users)))"
    ), {"sectors": user.licensed_sectors, "uid": user.id}

def search(conn, user, query_vec, k=8):
    pred, params = visible_predicate(user)
    params.update({"q": query_vec, "k": k})
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT doc_id, chunk_id, body FROM chunks "
            f"WHERE {pred} ORDER BY embedding <=> %(q)s LIMIT %(k)s",
            params,
        )
        return cur.fetchall()
```

Write the test that proves it now: for every restricted document, assert that a user not on its list gets zero rows for a query built from that document's own text.

**Stage 3: answering with enforced citations.** Ask for an answer with inline chunk references. Then run a validator that rejects any answer where a sentence containing a number or a proper noun has no supporting chunk, and re-asks once with the offending sentence quoted back. If it fails twice, return the retrieved passages and say the system could not answer confidently. Advisors prefer that to a confident wrong number, and Dale requires it.

**Stage 4: the "there is something you cannot see" problem.** When the best-scoring documents were filtered out, you have a choice, and it is a customer decision, not a technical one. Telling the user "there is research you are not entitled to" leaks the existence of a banking relationship. Saying nothing means an advisor confidently tells a client the firm has no view. Kestrel's answer, and yours: route it. The system returns a neutral "no accessible research covers this" and files a request to the research desk. Write down that you asked, and what the answer was, because that conversation is the job.

## The deployment target

A container behind a private subnet in a VPC. Concretely: one small VM or a single-container service, a managed Postgres with `pgvector` that has no public address, a security group that only permits the app to reach the database, secrets from the environment or a secrets manager, and an OIDC login so that the identity in the entitlement filter is a real authenticated identity and not a query parameter.

Requirements that will bite you and are supposed to: outbound egress to the model provider has to be allowed explicitly, the database migration has to run from somewhere inside the network, and the container that worked locally will fail on boot at least once because of a missing environment variable. Fix it in the deployment, not by adding a default.

**Rollback.** `ASSISTANT_ENABLED=false` served from environment configuration, checked at request entry, returning the plain search UI instead. Redeploy the previous pinned image tag. Rehearse both, on video, in under a minute.

**Air-gap variant (stretch).** Swap the hosted model for a small local one, vendor every Python dependency into a local wheelhouse, bake the model weights into the image, and prove the whole thing starts with networking disabled. The eval numbers will drop. Report both columns. Being able to say "here is what accuracy costs when the customer will not let traffic leave the building" is a genuinely rare thing to be able to say.

## Guardrails, and where they live

One module, `entitlements.py`, containing the visibility predicate and nothing else. One module, `validation.py`, containing the citation validator. Two test files that try to defeat both by input: prompt injection inside a filing footnote telling the assistant to ignore its instructions, a question that quotes a restricted title verbatim, a user ID passed as a string that is meant to break the parameter binding.

Nothing about entitlements is in a prompt. If a reviewer greps your prompts and finds the word "restricted", you have built a preference, not a control.

## The adoption plan

Kestrel's plan, which is yours to write out properly:

- **Weeks 1 to 2, shadow.** Five advisors, chosen for being sceptical rather than enthusiastic, plus Priya. They ask their real questions, and rate the answer against what they would have done. Nothing is relied on.
- **Weeks 3 to 6, assisted.** The assistant is allowed to answer, every answer carries its citations, and there is a one-click "this was wrong" that writes the question into a review queue. Priya reviews the queue weekly and those cases go into the eval set.
- **Week 7, the compliance review.** Dale gets the leak test suite, the audit log of who asked what and which documents were visible to them, and the rollback demo. Not a slide deck.
- **The metric.** Not usage. Time from question to a citable answer, self-reported by the five advisors, against their own baseline from week one.
- **The kill date.** End of week 8. If the median time has not moved and the review queue is not shrinking, it goes off and you write down why.

## The memo

One page, three columns.

**Specific to Kestrel:** the three-class document taxonomy, the sector-licence model, the routing behaviour when a restricted document is filtered out, the EDGAR ingestion quirks.

**Any three customers would need:** the filter-in-the-query pattern, the citation validator, the negative-permission eval harness, the audit log schema, the shadow-then-assisted adoption arc.

**Should be configuration, not code:** the classification taxonomy itself, the refusal message, the number of chunks retrieved, whether existence of inaccessible documents is disclosed.

Then the recommendation, with a cost. Jarvis's stated target is roughly 20% reusable components out of a first engagement, rising to about half by the third. On this one, the honest answer is usually that the eval harness and the entitlement predicate generalise and almost nothing else does, and that trying to build a general entitlement engine on the strength of one customer is the "generalising too early" error he names as his biggest.

## Grading applied

| Line | Weight | What the grader opens |
|---|---|---|
| Eval before build | 20 | `eval/questions.jsonl`, `eval/protocol.md`, `eval/disagreements.md`, and the git log showing all three predate `app/` |
| Deployed off your laptop | 20 | Terraform or a deploy script, a private-subnet database, an OIDC login, a health endpoint |
| Measured result | 15 | Baseline vs v1 vs final on all four scorer numbers, plus cost and latency per question |
| Guardrails and rollback | 15 | `entitlements.py`, the leak test suite at zero, the rollback recording |
| Adoption plan | 10 | The eight-week plan with named roles, metric, and kill date |
| Write-up | 10 | First person, your numbers, the regression you hit, Morgan Stanley figures labelled as OpenAI-reported |
| Walkthrough | 5 | Six minutes: the leak test failing on an early version, then passing |
| Memo | 5 | Three columns and a costed recommendation |

Start the eval today and the build next week. If that ordering feels wrong, that is the habit this capstone exists to break.
