---
title: "Lab: content ranking with feedback"
track: "machine-learning"
order: 707
status: live
summary: "Build an offline ranking prototype while recognizing exposure bias and feedback loops."
duration: "90 min lab"
updated: "2026-08-30"
---

## The short answer

Start with a transparent candidate-generation and ranking baseline, evaluate ranking metrics on logged impressions, and document why offline clicks cannot by themselves prove a new ranking will improve users’ experience.

## Why this matters

Ranking models shape what users get a chance to see. Logged clicks reflect prior ranking and position, creating feedback loops that can amplify popularity and hide good but underexposed content.

## How it works

Define the query or user context, candidate set, relevance signal, and time cutoff. Build a chronological evaluation set from impressions, not just clicks. Compare recency, popularity, and a simple supervised ranker using NDCG, MRR, coverage, and diversity at k. Include position as an analysis variable, not a causal feature to be copied blindly. Reserve online experiments for claims about user outcomes.

## Worked examples and variations (4 examples incl. boundary/counterexample)

1. A news feed can rank by predicted long click or satisfaction proxy at top 10.
2. A cold-start item needs metadata or exploration because it has no click history.
3. A diversity constraint can avoid showing ten near-duplicate items.
4. Counterexample: training only on clicked items treats unseen items as irrelevant even though users were never exposed to them.

## Two ways to see it

For a product team, ranking is allocation of attention. For an ML practitioner, it is learning from selectively observed relevance labels.

## Hands-on

Deliver an impression-level schema, chronological split, three baselines, metric dashboard for NDCG@10 and coverage, and a manual audit of 20 result lists. Intentionally fail by evaluating on clicks alone or randomly splitting impressions; document the issue, then reset to impression logs with an out-of-time slice. Propose one low-risk exploration bucket and a guardrail metric before any live test.

## Checkpoint

You can state what each logged non-click means—and does not mean—and why rank metrics need diversity and exposure context.

## What this does not solve

Offline ranking evaluation does not establish causal lift, user satisfaction, safety, or editorial quality.

## Continue, go deeper, apply it

Learn counterfactual evaluation, contextual bandits, consent-aware personalization, and online experimentation with explicit guardrails.
