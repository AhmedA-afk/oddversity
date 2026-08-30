---
title: "Security and privacy threat modeling for ML"
track: "machine-learning"
order: 614
status: live
summary: "Model threats across data, training, artifacts, APIs, and people so safeguards match realistic attackers and harms."
duration: "23 min read"
updated: "2026-08-30"
---

## The short answer

Threat-model an ML system end to end: identify assets, actors, trust boundaries, attack paths, impact, and mitigations. Include conventional software threats plus data poisoning, training-data extraction, membership inference, model theft, adversarial inputs, and unauthorized use of predictions.

## Why this matters

ML widens the attack surface. An attacker may manipulate labels upstream, query an API to reconstruct sensitive membership, steal a valuable model, or exploit a model’s confidence to evade detection. Privacy failures can happen even when raw records are never returned.

## How it works

Inventory data sensitivity and retention; map collection, labeling, training, registry, deployment, logging, and user interfaces. For each boundary, ask who can read, write, trigger, or infer. Prioritize threats by likelihood and harm. Apply least privilege, encryption, key management, provenance, validation, rate limits, query monitoring, output minimization, robust training where appropriate, red-team tests, and incident response.

## Worked examples and variations

1. A public prediction API returns fine-grained confidence scores; repeated queries enable model extraction. Rate-limit, authenticate, and reduce unnecessary output precision.
2. A poisoned labeling queue marks fraud as legitimate. Use provenance, reviewer sampling, anomaly checks, and segregated approval authority.
3. A membership-inference attacker uses confidence differences to infer whether a patient was in training. Consider data minimization, regularization, privacy evaluation, and access restrictions.
4. A malicious artifact in a shared registry exploits an unsafe deserializer. Require signatures, allowlisted formats, sandboxed inspection, and promotion controls.
5. Boundary case: differential privacy can reduce membership risk but does not make it lawful to collect an unnecessary sensitive attribute or eliminate downstream re-identification risk.

## Two ways to see it

Security is protection of confidentiality, integrity, and availability. Privacy is control of information about people, including inferences and uses that can harm them even when security controls function perfectly.

## Hands-on

Draw a threat model for a lending classifier: assets, trust boundaries, attacker goals, and one mitigation with residual risk for each threat. Deliberate failure: focus only on adversarial images or inputs and ignore dataset access and prediction logs. Reset by reviewing every data flow, service account, artifact registry, and model-output consumer.

## Checkpoint

What could an unauthorized party infer from scores, explanations, logs, or timing? Who can modify labels, features, and the promoted artifact?

## What this does not solve

Threat modeling does not prove security or replace legal, privacy, and domain-expert review. Defenses have costs, blind spots, and must be exercised continuously.

## Continue, go deeper, apply it

Add privacy impact assessments, red-team exercises, secure model registries, retention controls, and access reviews to the release process.
