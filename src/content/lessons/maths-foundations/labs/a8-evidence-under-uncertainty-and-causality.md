---
title: "A8 · Evidence under uncertainty and causality"
track: "maths-foundations"
status: live
summary: "This lab turns a small A/B result into an evidence statement rather."
duration: "17 min read"
---

## The short answer

This lab turns a small A/B result into an evidence statement rather than a
binary “winner.” You will calculate effect size, bootstrap uncertainty, a
permutation p-value, an approximate power limit, and a peeking false-positive
pitfall. You will then use a synthetic confounding fixture to show why an
observed treatment difference is not automatically a causal effect. Every result
has a fixed seed, a deterministic check, and a reset path.

## Why this matters

A model comparison or product experiment can produce a precise-looking number
from a small, selected, or repeatedly inspected sample. The number may be useful
descriptive evidence while still being weak evidence for a decision. Bootstrap
resampling asks how the estimate varies under the observed sample; permutation
testing asks how unusual it is under a stated null; power asks whether the design
could detect an effect of a specified size; causal analysis asks what assignment
process and assumptions justify an intervention claim.

The lab's fixtures are intentionally synthetic and small enough to audit by hand.
They are not product data and do not support a claim about any real user,
model, or treatment.

## Lab contract

Submit one reproducible Python script or notebook containing:

1. the frozen A/B and paired model-comparison fixtures below;
2. hand calculations for two effect sizes and at least one uncertainty quantity;
3. a bootstrap interval and standard error for the A/B risk difference;
4. a randomisation/permutation p-value with the null and alternative stated;
5. a paired bootstrap and paired permutation analysis for the model losses;
6. a deterministic power-limit simulation and a sequential-peeking simulation;
7. the confounding fixture, naive estimate, stratum estimates, and adjustment;
8. the deliberate failure, acceptance-test output, and clean reset evidence; and
9. a 150–300 word evidence memo with the decision, assumptions, and limitations.

Use Python 3.11+ and NumPy. Record `np.__version__`. Use `SEED = 20260830`,
`R = 20_000`, and do not replace the fixed fixtures with a more convenient
random dataset. Libraries may verify arithmetic, but the artifact must show the
quantity, resampling unit, null, uncertainty method, and decision.

## How it works

The lab follows one evidence pipeline: freeze the rows, declare the estimand,
measure the effect, choose a resampling/null procedure, inspect uncertainty and
design limits, then state only the decision the design identifies.

### Questions, estimands, and notation

For the independent A/B fixture, let `p_A` and `p_B` be the conversion rates.
The primary estimand is the risk difference

```text
Δ = p_B − p_A.
```

Also report relative lift `(p_B−p_A)/p_A`, risk ratio `p_B/p_A`, and Cohen's
arcsine effect size `h = 2 asin(√p_B) − 2 asin(√p_A)`. These are different
summaries of the same observed contrast; choose one primary quantity before
looking at uncertainty.

For the paired model fixture, lower loss is better. Define per-example
improvement of model B over model A as `d_i = loss_A,i − loss_B,i`, so a positive
mean `d` favours B. Resample the pair `(loss_A,i, loss_B,i)` together, or
equivalently resample the vector of paired differences. Resampling the two model
columns independently destroys the pairing.

For a two-sided test, use `H₀: Δ=0` versus `H₁: Δ≠0`. A p-value is the tail
frequency under the specified null; it is not the probability that the null is
true and not the probability that the observed effect will replicate.

## Deterministic fixtures

Copy these values exactly before editing any code:

```python
import numpy as np

SEED = 20260830
R = 20_000

# Independent A/B conversion outcomes: 0 = no conversion, 1 = conversion.
A = np.array([1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0], dtype=np.int64)
B = np.array([1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1], dtype=np.int64)

# Paired losses on the same eight evaluation examples; lower is better.
loss_A = np.array([0.4, 0.6, 0.2, 0.8, 0.5, 0.7, 0.3, 0.4], dtype=np.float64)
loss_B = np.array([0.3, 0.7, 0.1, 0.6, 0.6, 0.5, 0.4, 0.2], dtype=np.float64)

# Observational fixture. High intent raises outcome, but treatment has no
# effect in this synthetic data-generating process.
high_intent = np.array([1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0], dtype=np.int64)
treatment = np.array([1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0], dtype=np.int64)
outcome = 0.2 + 0.5 * high_intent
```

The A group has `4/12=0.3333` conversions and B has `9/12=0.75`, so the
observed risk difference is `Δ̂=5/12≈0.4167`. The paired improvement vector is
`d=[0.1,-0.1,0.1,0.2,-0.1,0.2,-0.1,0.2]`, with mean `0.0625`.

## Worked examples and variations

### Case A: independent A/B risk difference

**Input:** the conversion arrays `A` and `B`. **Mechanism:** calculate the two
sample proportions and subtract before choosing a test. **Output:**
`p_A=0.3333`, `p_B=0.75`, `Δ̂=0.4167`, relative lift `125%`, risk ratio `2.25`,
and `h≈0.8634`. **Inspect:** the absolute effect is measured in probability
points; the relative lift uses A as a denominator. **Decision:** treat the size
as potentially important but wait for uncertainty and assignment checks before
calling B a reliable improvement.

### Case B: bootstrap uncertainty for the A/B effect

**Input:** resample 12 A outcomes and 12 B outcomes with replacement, preserving
the group labels, and compute `mean(B*)−mean(A*)` for `R` replicates.
**Mechanism:** the empirical distribution approximates repeated samples from the
observed groups. **Output:** with the fixed seed and the function below's A-then-B
draw order, the percentile interval is approximately `[0.0833, 0.75]` and the
bootstrap standard error is `0.1852`.
**Inspect:** the interval is wide relative to the point estimate and is based
on only 12 observations per arm. **Decision:** report the interval and sample
size; do not turn a positive point estimate into certainty.

### Case C: randomisation/permutation test

**Input:** pool the 24 outcomes, randomly reassign 12 to A and 12 to B, and
recompute the risk difference. **Mechanism:** this represents the null that the
group labels are exchangeable under the experiment's assignment design.
**Output:** `p≈0.09745` with the fixed Monte Carlo seed and plus-one correction
`(extreme+1)/(R+1)`. **Inspect:** the p-value is above `0.05` despite a large
sample difference because the fixture is small. **Decision:** say “the result
is not decisive at this threshold under this test,” not “there is no effect.”

### Case D: paired model comparison

**Input:** the eight paired loss rows. **Mechanism:** compute `d=loss_A-loss_B`
before resampling. A positive value means B has lower loss on that row.
**Output:** mean improvement `0.0625`; the paired bootstrap percentile interval
is approximately `[-0.025, 0.15]`, with standard error `0.0465`. A sign-flip
permutation test gives `p≈0.2811`. **Inspect:** the interval includes zero and
the paired observations are few. **Decision:** do not promote model B on this
fixture alone; inspect slices and collect more paired evaluation cases.

### Boundary case: discrete intervals and zero variance

**Input:** a binary arm with all zeros, or a model-difference vector containing
only zeros. **Mechanism:** bootstrap resamples repeat the same value, so the
bootstrap distribution can have a point mass and standard error zero.
**Output:** a degenerate interval is possible; it is not automatically a coding
failure. **Inspect:** verify that the outcome has no observed variation and that
the estimand is still meaningful. **Decision:** report the boundary explicitly;
do not add random jitter merely to make a plot look continuous.

### Counterexample: breaking paired resampling

**Input:** `loss_A` and `loss_B` resampled independently instead of resampling
`d` or the row pairs. **Mechanism:** the correspondence between model errors on
the same example disappears. **Output:** with the fixed seed, the incorrect
independent bootstrap has interval approximately `[-0.125,0.25]` and standard
error `0.0975`, much wider than the paired interval. **Inspect:** the resampling
unit no longer matches the experimental unit. **Decision:** restore paired
resampling before making a comparison.

## Bootstrap and permutation implementation

Start with these small functions and keep the resampling unit visible:

```python
def risk_difference(a, b):
    return float(np.mean(b) - np.mean(a))


def bootstrap_independent_difference(a, b, R=R, seed=SEED):
    rng = np.random.default_rng(seed)
    a_star = rng.choice(a, size=(R, a.size), replace=True).mean(axis=1)
    b_star = rng.choice(b, size=(R, b.size), replace=True).mean(axis=1)
    return b_star - a_star


def permutation_independent_difference(a, b, R=R, seed=SEED):
    rng = np.random.default_rng(seed)
    pooled = np.concatenate([a, b])
    null = np.empty(R, dtype=np.float64)
    n_a = a.size
    for i in range(R):
        shuffled = rng.permutation(pooled)
        null[i] = shuffled[n_a:].mean() - shuffled[:n_a].mean()
    return null


def bootstrap_paired_difference(a, b, R=R, seed=SEED):
    rng = np.random.default_rng(seed)
    d = np.asarray(a) - np.asarray(b)
    return rng.choice(d, size=(R, d.size), replace=True).mean(axis=1)


def permutation_paired_difference(a, b, R=R, seed=SEED):
    rng = np.random.default_rng(seed)
    d = np.asarray(a) - np.asarray(b)
    signs = rng.choice(np.array([-1.0, 1.0]), size=(R, d.size))
    return (signs * d).mean(axis=1)


def percentile_interval(samples):
    return np.quantile(samples, [0.025, 0.975])


def two_sided_p(null, observed):
    extreme = np.count_nonzero(np.abs(null) >= abs(observed))
    return (extreme + 1.0) / (null.size + 1.0)
```

Run the analyses:

```python
observed_ab = risk_difference(A, B)
boot_ab = bootstrap_independent_difference(A, B)
null_ab = permutation_independent_difference(A, B)

observed_model = float(np.mean(loss_A - loss_B))
boot_model = bootstrap_paired_difference(loss_A, loss_B)
null_model = permutation_paired_difference(loss_A, loss_B)

print("A/B", observed_ab, percentile_interval(boot_ab), boot_ab.std(ddof=1),
      two_sided_p(null_ab, observed_ab))
print("model", observed_model, percentile_interval(boot_model),
      boot_model.std(ddof=1), two_sided_p(null_model, observed_model))
```

The A/B permutation null is appropriate only if the assignment mechanism makes
the labels exchangeable. The paired sign-flip null additionally assumes that,
under no model difference, the paired differences are exchangeable around zero.
State these assumptions in the memo; a function name is not an assumption.

## Power limits and effect-size planning

Power is the probability that a predeclared test rejects the null under a chosen
alternative, sample size, variance model, and threshold. It is not a property of
the observed p-value. Use this deliberately approximate planning simulation for
two independent Bernoulli arms:

```python
def approximate_power(p_a, p_b, n, trials=10_000, alpha=0.05, seed=SEED):
    rng = np.random.default_rng(seed)
    a_hat = rng.binomial(1, p_a, size=(trials, n)).mean(axis=1)
    b_hat = rng.binomial(1, p_b, size=(trials, n)).mean(axis=1)
    p_null = (p_a + p_b) / 2.0
    se_null = np.sqrt(p_null * (1.0 - p_null) * (2.0 / n))
    z = (b_hat - a_hat) / se_null
    return float(np.mean(np.abs(z) >= 1.959964))


power_small = approximate_power(0.40, 0.50, n=12)
power_large = approximate_power(0.40, 0.50, n=500)
print("power", power_small, power_large)
```

For this fixed simulation, power is about `0.095` at `n=12` per arm and about
`0.891` at `n=500` per arm. The numbers are planning illustrations, not a
replacement for a domain-specific sample-size calculation. The decision is the
important output: a 10-percentage-point effect can be easy to miss in a tiny
sample, while a larger sample changes the detectable-effect regime. Do not
retrofit the effect size or stopping rule after seeing the result.

## Stopping rules and the peeking pitfall

A fixed-horizon test chooses its sample size and analysis before looking at the
outcome. Repeatedly checking a conventional `0.05` threshold and stopping at the
first favorable look changes the false-positive rate. This simulation uses equal
true conversion rates, five unadjusted looks, and a normal-approximation z rule:

```python
def peeking_simulation(trials=10_000, max_n=120, step=20, seed=SEED):
    rng = np.random.default_rng(seed)
    control = rng.binomial(1, 0.50, size=(trials, max_n))
    treatment = rng.binomial(1, 0.50, size=(trials, max_n))
    cumulative_control = np.cumsum(control, axis=1)
    cumulative_treatment = np.cumsum(treatment, axis=1)
    looks = np.arange(step, max_n + 1, step)
    rejected = []
    for n in looks:
        diff = cumulative_treatment[:, n - 1] / n
        diff -= cumulative_control[:, n - 1] / n
        se_null = np.sqrt(0.25 * (2.0 / n))
        rejected.append(np.abs(diff / se_null) >= 1.959964)
    rejected = np.asarray(rejected)
    return looks, rejected.mean(axis=1), rejected.any(axis=0).mean()


looks, fixed_look_rates, peeked_rate = peeking_simulation()
print(looks, fixed_look_rates, peeked_rate)
```

With `SEED=20260830`, the final-look false-positive rate is approximately
`0.0469`, while the “reject at any look” rate is approximately `0.1542`.
**Inspect:** the data-generating process has no treatment effect, yet peeking
creates many more apparent wins. **Decision:** predeclare the horizon, use a
sequential-testing design, or adjust the boundary; do not report the unadjusted
first favorable look as if it were fixed-horizon evidence.

## Causal limitation and confounding fixture

The observational fixture has a confounder, `high_intent`, that raises the
outcome from `0.2` to `0.7`. Treatment is more common among high-intent rows, but
the outcome equation contains no treatment term. This is a deliberately
transparent data-generating process:

```text
outcome = 0.2 + 0.5·high_intent
```

The naive treated mean is `0.6167`; the naive control mean is `0.2833`; their
observed difference is `0.3333`. Within the high-intent stratum, both arms have
mean `0.7`; within the low-intent stratum, both arms have mean `0.2`. A
population-standardised adjustment therefore gives

```text
0.5·(0.7−0.7) + 0.5·(0.2−0.2) = 0.
```

Run the check:

```python
def mean_where(values, mask):
    selected = np.asarray(values)[mask]
    if selected.size == 0:
        raise ValueError("empty stratum")
    return float(selected.mean())


naive = mean_where(outcome, treatment == 1) - mean_where(outcome, treatment == 0)
stratum_effects = {}
for level in (0, 1):
    in_stratum = high_intent == level
    stratum_effects[level] = (
        mean_where(outcome, in_stratum & (treatment == 1))
        - mean_where(outcome, in_stratum & (treatment == 0))
    )
adjusted = 0.5 * stratum_effects[0] + 0.5 * stratum_effects[1]

assert np.isclose(naive, 1.0 / 3.0)
assert np.isclose(stratum_effects[0], 0.0)
assert np.isclose(stratum_effects[1], 0.0)
assert np.isclose(adjusted, 0.0)
```

**Interpretation:** in this fixture, the naive difference is entirely explained
by the measured confounder and the known outcome rule. In real data, adjustment
only supports a causal claim under stronger assumptions: the confounder must be
measured well, relevant strata must overlap, treatment assignment must be
appropriately modelled, and important unmeasured confounding must be absent or
addressed. A/B randomisation can identify an average treatment effect under its
own implementation assumptions; observational adjustment is not a universal
substitute.

## Two ways to see it

### Builder view

This lab is a reproducible analysis pipeline: frozen rows → declared estimand →
effect size → uncertainty method → null or assignment assumption → test →
decision memo. Each resampling function names its unit, and each assertion checks
one claim against a known fixture.

### Decision-maker and causal view

The same point estimate can support different decisions depending on uncertainty,
power, stopping, assignment, cost, and harm. A large naive observational gap can
be descriptive evidence of different populations rather than evidence that
treatment caused the outcome. The right question is “what claim does this design
identify?”

## Hands-on

Run the clean analysis first, preserve its outputs, then activate each broken
state below one at a time. The artifact is complete only when the failure is
observable, the test names the violated contract, and the reset reproduces the
clean result.

### Failure fixture, deterministic tests, and reset

Run the broken states before repairing them:

1. Replace `bootstrap_paired_difference` with independent resampling of
   `loss_A` and `loss_B`; the interval and standard error should differ because
   row pairing was destroyed.
2. Treat `peeked_rate` as a fixed-horizon p-value; the null simulation should
   expose inflated false positives.
3. Report `naive` as the causal effect while skipping `high_intent`; the
   stratum assertions should contradict that interpretation.
4. Mutate one frozen outcome or treatment label; the fixture-integrity check
   below must fail before analysis.

Use these deterministic checks:

```python
def require(condition, message):
    if not condition:
        raise AssertionError(message)


def assert_fixture_integrity():
    require(np.array_equal(A, [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0]), "A fixture changed")
    require(np.array_equal(B, [1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1]), "B fixture changed")
    require(np.array_equal(treatment, [1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0]), "treatment fixture changed")


def assert_deterministic_outputs():
    assert_fixture_integrity()
    boot_1 = bootstrap_independent_difference(A, B, seed=SEED)
    boot_2 = bootstrap_independent_difference(A, B, seed=SEED)
    require(np.array_equal(boot_1, boot_2), "same seed changed bootstrap output")
    require(np.isclose(risk_difference(A, B), 5.0 / 12.0), "wrong A/B effect")
    require(np.allclose(percentile_interval(boot_1), [1.0 / 12.0, 0.75]), "unexpected bootstrap interval")
    require(np.isclose(boot_1.std(ddof=1), 0.1852433622, atol=1e-9), "unexpected bootstrap SE")
    null_1 = permutation_independent_difference(A, B, seed=SEED)
    p_1 = two_sided_p(null_1, risk_difference(A, B))
    require(np.isclose(p_1, 0.0974451277, atol=1e-9), "unexpected permutation p-value")
    require(np.isclose(np.mean(loss_A - loss_B), 0.0625), "wrong paired effect")
    require(np.isclose(naive, 1.0 / 3.0), "wrong naive confounded estimate")
    require(np.isclose(adjusted, 0.0), "confounding adjustment failed")


assert_deterministic_outputs()
print("A8 acceptance: PASS")
```

**Test:** the clean fixture must end with `A8 acceptance: PASS`; the paired
failure must produce a materially different uncertainty report; the peeking
check must show `peeked_rate > fixed_look_rates[-1] + 0.05`; and the causal
check must retain both the naive and adjusted estimates. **Reset:** restore
`A`, `B`, `loss_A`, `loss_B`, `high_intent`, `treatment`, and `outcome` from the
starter block, restart the process, rerun `assert_deterministic_outputs()`, and
confirm the same interval, p-value, and confounding result. Do not reset by
overwriting the expected values with whatever the broken run produced.

## Required decision memo

Write 150–300 words answering:

- What is the primary estimand and observed effect?
- What do the bootstrap interval and permutation test add, and what do they not
  establish?
- Is the small fixture powered for a 10-percentage-point effect?
- What would a predeclared stopping rule change?
- Why is the naive observational difference not a causal effect in the
  confounding fixture?
- What additional data, randomisation, or sensitivity analysis would change your
  decision?

Use “illustrative synthetic fixture” in the memo. Do not present its numbers as
production performance or as evidence about a real population.

## Acceptance tests

- [ ] The exact fixtures, NumPy version, `SEED`, and `R` are recorded.
- [ ] A/B risk difference, relative lift, risk ratio, and one standardised effect size are shown.
- [ ] Independent-group bootstrap uses within-arm resampling and reports interval plus standard error.
- [ ] Independent-group permutation states exchangeability, null, alternative, and plus-one correction.
- [ ] Paired model comparison resamples paired differences and reports interval, standard error, and p-value.
- [ ] The independent-bootstrap mutant is caught as a broken resampling unit.
- [ ] Power is reported as a design simulation, not inferred from the observed p-value.
- [ ] The peeking simulation contrasts a fixed final look with any-look rejection under a true null.
- [ ] The confounding fixture preserves naive, stratum, and adjusted estimates.
- [ ] Fixture-integrity, reproducibility, expected-value, and reset checks pass.
- [ ] The evidence memo states one decision and at least two limitations.

## Rubric

| Criterion | Weight | Full-credit evidence |
|---|---:|---|
| Estimands and mathematics | 20% | correct risk difference, paired improvement, effect sizes, and resampling definitions |
| Bootstrap and permutation | 25% | valid independent and paired implementations, nulls, intervals, p-values, and assumptions |
| Power and stopping | 15% | deterministic power-limit interpretation and clear peeking false-positive diagnosis |
| Causal reasoning | 20% | naive/stratified/adjusted confounding analysis with an honest identification limit |
| Diagnostics and reset | 10% | fixture mutation, broken resampling, reproducibility assertions, and clean reset evidence |
| Communication | 10% | labelled outputs and a 150–300 word decision memo that does not overclaim |

## Checkpoint

- [ ] Calculate `Δ̂`, relative lift, risk ratio, and the paired model improvement by hand.
- [ ] Explain why a bootstrap interval and a permutation p-value answer different questions.
- [ ] State the exchangeability or pairing assumption for each permutation method.
- [ ] Explain why a small p-value would not repair peeking or confounding.
- [ ] Explain the naive versus adjusted estimate in the synthetic causal fixture.
- [ ] Attach the passing output and the decision memo.

## What this does not solve

This lab does not create randomisation where none existed, guarantee adequate
power, correct arbitrary stopping, or prove that an effect will replicate. A
bootstrap inherits the observed sample's biases and dependence structure; a
permutation test inherits its exchangeability or pairing assumption; a causal
adjustment inherits its measured-confounder and overlap assumptions. Passing the
deterministic checks proves only that this analysis matches this frozen fixture.

## Continue, go deeper, apply it

- Continue: Self-information and coding intuition
- Go deeper: A/B experiments, sequential testing, and multiple comparisons
- Apply it: Causal inference foundations
