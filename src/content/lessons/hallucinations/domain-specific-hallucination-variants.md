---
title: "Variants: Hallucination Signatures in Medicine, Law, and Finance"
track: "hallucinations"
status: live
summary: "The same underlying failure wears a different costume and carries a different cost in medicine, law, finance, and ordinary low-stakes chat."
duration: "7 min read"
---

The mechanism behind a hallucination doesn't change when the topic gets more serious. What changes is the signature it leaves and what it costs when nobody catches it — which is why the same detection budget that's fine for a general chatbot is nowhere near enough for a clinical, legal, or financial one.

## Medicine: invented drug interactions and dosages

**How it shows up:** a model asked about a drug interaction or a dosage adjustment will produce a specific-sounding number or interaction claim with the same fluency it uses for anything else — a "reduce dose by 25% in renal impairment" that wasn't in any label, or an interaction warning between two drugs that don't actually interact, built from a real but irrelevant shared metabolic pathway.

**Where exposure is highest:** rare drug combinations, pediatric or renal/hepatic dosing adjustments, and anything phrased as a specific number rather than a qualitative caution — numbers invite false precision in a way "consult a specialist" doesn't.

**Failure mode:** direct patient harm from an incorrect dose or a missed real interaction masked by a fabricated but plausible-sounding one.

**Cost when it lands:** the highest in this comparison — physical harm is not reversible the way a bad citation or a wrong invoice figure is.

**Ground truth to check against:** the actual drug label (FDA-approved prescribing information or equivalent), a maintained formulary, or a dedicated interaction-checking database — never the model's own recall of "what interactions are typically flagged."

## Law: fabricated case law and statutes

**How it shows up:** invented case citations with realistic reporter formatting (covered in depth in [the citation deep-dive](/learn/hallucinations/fabricated-citations-deep-dive)), and its statutory cousin — a cited section number or a quoted "the statute provides that..." clause that isn't the actual text of the law, or is the actual text of a different, similarly-numbered section.

**Where exposure is highest:** jurisdiction-specific or recently-amended law, where the model's training data is thinner or the model conflates an older version of a statute with the current one.

**Failure mode:** a filed brief or a client-facing opinion relying on authority that doesn't exist or doesn't say what it's cited for — professional sanction, a weakened or lost case, or advice given on a legal basis that isn't real.

**Cost when it lands:** high and often public — courts and bar associations treat fabricated authority as a professional-conduct matter, not merely an error.

**Ground truth to check against:** a real case-law database or the jurisdiction's official statute text — resolution, not inspection, exactly as in [citation hallucination](/learn/hallucinations/citation-hallucination): a fabricated case cannot be told apart from a real one by reading it.

## Finance: made-up figures and filing references

**How it shows up:** a specific revenue, margin, or growth figure attributed to a company's actual filing that isn't in that filing — often a plausible-sounding number in the right range, or a real figure from the wrong fiscal period presented as current.

**Where exposure is highest:** recent quarters not yet well-represented in training data, and comparisons across periods, where the model has to hold two numbers in mind and can quietly substitute a training-time prior for one of them.

**Failure mode:** an investment decision, a compliance report, or client-facing material built on a number that doesn't trace back to any actual filing — financial loss, and in regulated contexts, a compliance or disclosure problem on top of it.

**Ground truth to check against:** the company's actual filed disclosures (the primary source document itself, not a model's summary of it) — this is a faithfulness check as much as a factual one, per [the master-axis lesson](/learn/hallucinations/factual-vs-faithfulness-distinction): the filing is the source of record, and any figure not traceable to a specific line in it is suspect regardless of how reasonable it sounds.

## General-purpose assistants: the baseline this is measured against

**How it shows up:** the same underlying mechanisms — invented specifics, false premises accepted, stale facts stated as current — but about topics with lower individual stakes: a wrong movie release date, a mischaracterized plot summary, a made-up statistic in casual conversation.

**Where exposure is highest:** anywhere a user asks something obscure enough that the model's training coverage thins out, same as the other three — the mechanism doesn't discriminate by domain, only the consequences do.

**Failure mode:** the user is misinformed about something low-consequence, and — because there's no professional or regulatory backstop — often self-corrects by checking elsewhere or simply not noticing, which is a mitigating factor these other three domains don't get.

**Cost when it lands:** meaningfully lower on average, which is exactly why routing and guardrail budget should scale up sharply the moment a query crosses into one of the three domains above — the same hallucination rate is a very different problem depending on which of these four buckets it lands in.

**Ground truth to check against:** general web grounding is usually sufficient; there's no single specialized index the way there is for drug labels, case law, or filings.

## Decision table

| Domain | Signature | Ground-truth source | Relative cost when wrong |
|---|---|---|---|
| Medicine | Specific dosage/interaction claim, no hedge | Drug label, formulary, interaction database | Highest — physical harm |
| Law | Real-looking citation or statute quote that doesn't resolve | Case law database, official statute text | High — professional/legal consequence |
| Finance | Specific figure attributed to a filing that doesn't contain it | The actual primary filing | High — financial/compliance consequence |
| General-purpose | Same mechanisms, lower-stakes topic | General web grounding | Lower — often self-correcting |

## How to choose

Route by domain, not by confidence score: classify the query first, and if it lands in medicine, law, or finance, force retrieval against that domain's specific ground-truth source and add a mandatory verification step before the answer ships — a general web search is not an adequate substitute for a drug label or a primary filing, even when it turns up something that sounds right. For general-purpose queries, the baseline hygiene covered throughout this module (grounding when a source is available, abstention when it isn't) is usually proportionate. The heavier machinery in [guardrails for high-stakes output](/learn/hallucinations/guardrails-for-high-stakes-output) and [the high-stakes case study](/learn/hallucinations/high-stakes-case-study) is built for exactly the first three rows of that table — apply it there deliberately, not everywhere by default, or you'll pay production-guardrail costs on traffic that never needed them.

**Related:** [Deep Dive: Why Fabricated Citations Look So Real](/learn/hallucinations/fabricated-citations-deep-dive), [Guardrails for High-Stakes Output](/learn/hallucinations/guardrails-for-high-stakes-output), [High-Stakes Case Study](/learn/hallucinations/high-stakes-case-study), [Fact-Checking Pipelines](/learn/hallucinations/fact-checking-pipelines), [The Master Axis: Factual vs. Faithfulness Hallucination](/learn/hallucinations/factual-vs-faithfulness-distinction)
