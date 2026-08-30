---
title: "Latent variables and evidence lower-bound intuition"
track: "maths-foundations"
status: live
summary: "A latent variable is an unobserved quantity introduced to explain structure in observed data."
duration: "4 min read"
---

## The short answer

A latent variable is an unobserved quantity introduced to explain structure in observed data. The marginal likelihood sums or integrates the joint model over that hidden variable, which is often hard to compute. The evidence lower bound (ELBO) replaces exact inference with a tractable approximation: `log p(x) = ELBO + KL(q(z|x)||p(z|x))`, so ELBO is a lower bound that tightens when q matches the true posterior.

## Why this matters

Mixture models, hidden-state models, and variational autoencoders all ask the system to reason about variables it cannot observe directly. ELBO language makes the trade-off between reconstruction/data fit and approximate posterior complexity visible.

**Small incident (illustrative):** a latent clustering model produced attractive groups, but the approximate posterior was too simple and merged distinct modes. The objective improved while the representation remained inadequate for the intended decision.

## How it works

For observed x and latent z, `p(x)=sum_z p(x,z)` for discrete z or an integral for continuous z. Introduce any distribution q(z|x):

`ELBO = E_q[log p(x,z) − log q(z|x)]`.

Using `p(x,z)=p(z|x)p(x)`, the difference between log evidence and ELBO is `KL(q(z|x)||p(z|x))`, which is nonnegative. Thus maximising ELBO improves a lower bound on evidence, but the result also depends on the family q and optimisation.

### Assumptions and derivation

The decomposition assumes q has support wherever the true posterior has support, otherwise KL can be infinite. In practice, one chooses a tractable q, estimates expectations by samples or analytic forms, and optimises model and inference parameters together. A higher ELBO is not automatically a better representation for every downstream task.

## AI use

Use latent-variable thinking for clustering, topic models, missing-data models, embeddings, VAEs, and hidden-state inference. Ask what z means, what is observed, what prior is used, how q is parameterised, and whether the latent structure is identifiable or merely one useful explanation.

## Worked examples and variations

### Example A — smallest happy path

**Input:** a coin is chosen from fair coin C₁ or biased coin C₂, but the chosen coin is hidden; observe one head. **Mechanism:** marginalise the hidden coin: p(head)=p(C₁)p(head|C₁)+p(C₂)p(head|C₂). **Output:** a mixture probability. **Inspect:** the posterior over coin identity changes after the observation. **Next decision:** keep uncertainty over z rather than hard-assigning too early.

### Example B — meaningful variation

**Input:** a mixture model with two Gaussian components. **Mechanism:** each point has a soft responsibility for each hidden component; the complete-data likelihood uses those latent assignments. **Output:** clusters plus assignment uncertainty. **Inspect:** overlapping components and initialisation. **Next decision:** report soft responsibilities or validate the downstream use of hard labels.

### Example C — boundary case

**Input:** choose q(z|x)=p(z|x), the exact posterior. **Mechanism:** KL term is zero. **Output:** ELBO equals log evidence. **Inspect:** this is the ideal limit, often unavailable computationally. **Next decision:** use the gap as an inference-quality concept, not a directly observed certificate.

### Example D — tempting counterexample

**Input:** q is too narrow to represent a multimodal posterior. **Mechanism:** optimisation finds one mode while ignoring another. **Output:** a good-looking but loose ELBO and biased uncertainty. **Inspect:** vary q family, initialisation, and posterior predictive checks. **Next decision:** increase inference flexibility or state the approximation limit.

## Computation and interpretation

```python
import numpy as np

# Discrete toy model: z in {0, 1}, x is observed.
p_z = np.array([.5, .5])
p_x_given_z = np.array([.2, .8])
p_x = np.sum(p_z * p_x_given_z)
posterior = p_z * p_x_given_z / p_x
print(p_x, posterior)
```

This exact marginalisation is the small case ELBO approximations are trying to scale beyond. Inspect both evidence and posterior responsibilities; neither scalar alone explains whether the latent variable is useful.

## Two ways to see it

### Builder view

Latent modelling adds a hidden state and an inference procedure to the ordinary likelihood. Draw the joint graph, then identify which sum or integral is expensive.

### Systems view

Latents are explanations chosen by a model, not automatically human-meaningful facts. A neat latent plot can be unstable, non-identifiable, or encode the training distribution rather than a causal factor.

## Hands-on

Implement exact marginalisation and posterior responsibilities for the hidden-coin fixture. **Failure fixture:** replace the marginal sum with only the most likely hidden coin before computing p(x). **Test:** the exact evidence must equal the weighted sum and the posterior probabilities must sum to one; the hard-assignment shortcut should be reported as an approximation. **Reset:** restore both hidden states and recompute the exact posterior.

## Checkpoint

- [ ] Explain why latent variables require marginalisation.
- [ ] Derive the ELBO plus KL decomposition in words.
- [ ] State when ELBO equals log evidence.
- [ ] Give one way an approximate posterior can be too simple.

## What this does not solve

ELBO optimisation does not guarantee identifiable or human-meaningful latents, exact posterior uncertainty, or superior downstream performance. A higher bound can reflect an objective/model choice that does not match the product task.

## Continue, go deeper, apply it

- Continue: Exponential families, sufficient statistics, and GLM intuition
- Go deeper: MAP and regularisation
- Apply it: Neural networks and representations
