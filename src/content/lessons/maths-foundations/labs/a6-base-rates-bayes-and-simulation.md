---
title: "A6 · Base rates, Bayes, and simulation"
track: "maths-foundations"
status: live
summary: "This lab makes one diagnostic-test decision twice: first by expanding a frequency."
duration: "11 min read"
---

## The short answer

This lab makes one diagnostic-test decision twice: first by expanding a frequency
table, then by simulating individual cases with a fixed NumPy seed. With a 1%
base rate, 90% sensitivity, and 5% false-positive rate, a positive flag means
only about 15.4% posterior probability of the condition—not 90%. You will vary
the false-positive rate, expose the base-rate fallacy on a balanced fixture, and
write a decision memo that separates evidence from policy.

## Why this matters

A test’s sensitivity answers a forward question—how often the test flags a true
condition. The routing decision asks the reverse question—how often a flagged
case truly has the condition. Those probabilities use different denominators,
and a rare condition lets false positives from the much larger negative group
dominate the alert queue. A table and a simulation make that denominator visible
before a threshold or workflow policy is applied.

## Lab contract

Submit one notebook or script plus a 150–300 word decision memo for A6 in the
practice ladder. The artifact
must contain:

1. the A6 problem statement in your own words;
2. event notation and assumptions from conditional probability,
   total probability, and Bayes’ rule;
3. the exact frequency-table solution;
4. a seeded individual-case simulation and a comparison with the table;
5. a base-rate-fallacy fixture using a balanced evaluation sample;
6. a false-positive-rate sensitivity table or plot;
7. a deliberately failing test, its diagnosis, and a clean reset; and
8. the acceptance tests and rubric evidence below.

Use Python 3, NumPy, `np.float64` for calculations, and a fixed random seed.
Record `np.__version__`. The numbers describe a toy screening system; they are
not medical guidance and do not justify a real-world diagnosis or intervention.

## How it works

### The decision setup

Let:

```text
D       = the case truly has the condition
T+      = the test raises a positive flag
P(D)    = 0.01             base rate / prevalence
P(T+|D) = 0.90             sensitivity / true-positive rate
P(T+|¬D)= 0.05             false-positive rate
N       = 20,000           illustrative population size
```

For this lab only, the routing policy is:

```text
if P(D|T+) ≥ 0.50: accept the toy flag as sufficiently reliable
else:             send the case to confirmatory review
```

The `0.50` threshold is a visible exercise policy, not a universal operating
threshold. A real decision would also include costs, harms, prevalence drift,
confirmatory-test performance, access, and a qualified domain review.

## Worked examples and variations

### Part I · Solve it with a frequency table

### Step 1: expand the population

At `N=20,000`, the base rate gives 200 true-condition cases and 19,800 cases
without the condition. Apply the conditional rates inside each true-label group:

|                 | `D` true | `¬D` true | total |
|---|---:|---:|---:|
| `T+` flag       | 180 (TP) | 990 (FP) | 1,170 |
| `T−` no flag    | 20 (FN)  | 18,810 (TN) | 18,830 |
| **total**       | **200**  | **19,800** | **20,000** |

The table is a concrete version of the law of total probability. Every cell has
an input group, a conditional rate, and an output count. Check that rows and
columns add to the same grand total before calculating a posterior.

### Step 2: calculate the quantities that answer different questions

```text
sensitivity        = TP/(TP+FN) = 180/200       = 0.90
false-positive rate= FP/(FP+TN) = 990/19,800    = 0.05
positive predictive value
                    = P(D|T+) = TP/(TP+FP)      = 180/1,170 ≈ 0.153846
negative posterior = P(D|T−) = FN/(FN+TN)      = 20/18,830 ≈ 0.001062
```

Bayes gives the same positive posterior directly:

```text
P(D|T+) = P(T+|D)P(D)
          ------------------------------
          P(T+|D)P(D) + P(T+|¬D)P(¬D)

        = (0.90×0.01)/(0.90×0.01 + 0.05×0.99)
        = 0.009/0.0585
        ≈ 0.153846.
```

### Step 3: make the toy routing decision

The positive flag’s posterior is approximately 0.154, below the lab threshold
of 0.50. The defensible toy decision is therefore **confirmatory review**, not
automatic acceptance of the condition. A negative flag has a much lower posterior
of about 0.00106, but that is still a conditional probability, not proof that a
case is clear.

### The base-rate fallacy fixture

**Input:** a balanced evaluation fixture with 100 true-condition cases and 100
non-condition cases, while keeping sensitivity at 90% and the false-positive
rate at 5%. **Mechanism:** the fixture has a 50% condition rate, not the 1%
deployment rate. It contains 90 TP and 5 FP. **Output:** its positive predictive
value is `90/(90+5)=0.9474`. **Inspect:** this is not the deployment posterior
`0.1538`; the denominator’s population mix changed. **Decision:** never transport
precision from a balanced benchmark to deployment without recalculating under the
deployment base rate.

The fallacy is the tempting substitution
`P(T+|D)=0.90 ⇒ P(D|T+)=0.90`. The two condition on opposite events. The frequency
table makes the 990 false positives from the large negative group visible.

## Two ways to see it

### Frequency-table view

The table is a population accounting view: begin with the base-rate split, apply
the test rates inside each group, and divide the true-positive cell by all
positive flags. It shows exactly which cases occupy the decision denominator.

### Simulation view

The seeded simulation is an individual-case view: draw a truth label, draw a test
outcome conditional on that truth, and recompute the same four cells. It should
agree with the table within sampling error while making reproducibility and
random variation testable.

## Part II · Solve it with deterministic simulation

The simulation samples one truth label and one test outcome per case. A fixed
seed makes the run reproducible; it does not make the sampled counts equal to the
frequency-table counts. With one million cases, sampling noise should be small
relative to the 15.4% table result.

```python
import numpy as np

SEED = 20260830
N_SIM = 1_000_000
PREVALENCE = 0.01
SENSITIVITY = 0.90
FALSE_POSITIVE_RATE = 0.05

def frequency_counts(n, prevalence, sensitivity, false_positive_rate):
    n_positive = int(round(n * prevalence))
    n_negative = n - n_positive
    tp = int(round(n_positive * sensitivity))
    fp = int(round(n_negative * false_positive_rate))
    return {
        "tp": tp,
        "fp": fp,
        "fn": n_positive - tp,
        "tn": n_negative - fp,
    }

def ppv(counts):
    alerts = counts["tp"] + counts["fp"]
    if alerts == 0:
        raise ValueError("positive predictive value is undefined with no alerts")
    return counts["tp"] / alerts

def simulate(n, prevalence, sensitivity, false_positive_rate, seed):
    rng = np.random.default_rng(seed)
    truth = rng.random(n) < prevalence
    probability_of_flag = np.where(
        truth, sensitivity, false_positive_rate
    )
    flag = rng.random(n) < probability_of_flag
    counts = {
        "tp": int(np.sum(truth & flag)),
        "fp": int(np.sum(~truth & flag)),
        "fn": int(np.sum(truth & ~flag)),
        "tn": int(np.sum(~truth & ~flag)),
    }
    return counts

table = frequency_counts(20_000, PREVALENCE, SENSITIVITY,
                          FALSE_POSITIVE_RATE)
assert table == {"tp": 180, "fp": 990, "fn": 20, "tn": 18_810}
assert np.isclose(ppv(table), 180 / 1170)
assert not np.isclose(ppv(table), SENSITIVITY)  # base-rate-fallacy guard

sim_a = simulate(N_SIM, PREVALENCE, SENSITIVITY,
                 FALSE_POSITIVE_RATE, SEED)
sim_b = simulate(N_SIM, PREVALENCE, SENSITIVITY,
                 FALSE_POSITIVE_RATE, SEED)
assert sim_a == sim_b  # deterministic replay check
assert sum(sim_a.values()) == N_SIM
assert abs(ppv(sim_a) - ppv(table)) < 0.01

print("NumPy version:", np.__version__)
print("table:", table, "table_ppv:", ppv(table))
print("simulation:", sim_a, "simulation_ppv:", ppv(sim_a))
```

On the verification environment (`NumPy 2.4.4`), the seeded simulation produces
`TP=9,070`, `FP=49,925`, `FN=983`, `TN=940,022`, and
`PPV≈0.153742`. A different NumPy version may produce different sampled counts;
the reproducibility check and the tolerance comparison are the durable tests.

## False-positive-rate sensitivity

Hold prevalence and sensitivity fixed, then vary only the false-positive rate.
The posterior formula is:

```text
PPV(f) = (0.90×0.01)/(0.90×0.01 + f×0.99).
```

For the same 20,000-case population:

| False-positive rate | False positives | Positive posterior | Toy route |
|---:|---:|---:|---|
| 5.0% | 990 | 0.1538 | confirmatory review |
| 2.0% | 396 | 0.3125 | confirmatory review |
| 1.0% | 198 | 0.4762 | confirmatory review |
| 0.5% | 99  | 0.6452 | passes the toy 0.50 threshold |

**Inspect:** sensitivity stays at 90% in every row, but PPV changes sharply
because false positives are drawn from the much larger negative population.
**Decision:** measure false-positive behaviour in the target population and
revisit the route when the base rate or test operating point changes. A five-fold
false-positive reduction from 5% to 1% raises PPV from 15.4% to 47.6%, but it
still does not cross the toy 50% threshold.

Add this deterministic check to the artifact:

```python
rates = np.array([0.05, 0.02, 0.01, 0.005], dtype=np.float64)
ppvs = np.array([
    ppv(frequency_counts(20_000, PREVALENCE, SENSITIVITY, rate))
    for rate in rates
])
assert np.all(np.diff(ppvs) > 0)  # lower FPR must raise PPV here
assert np.isclose(ppvs[0], 0.15384615384615385)
assert np.isclose(ppvs[-1], 0.6451612903225806)
```

## Failure fixture and reset

### Deliberate failure: swap sensitivity for posterior

Implement this wrong claim in a separate test, not in the repaired function:

```python
def wrong_probability_positive_given_flag(sensitivity):
    return sensitivity

assert np.isclose(
    wrong_probability_positive_given_flag(SENSITIVITY),
    ppv(table),
), "expected failure: sensitivity is not PPV"
```

**Observed failure:** the assertion fails because `0.90 != 0.153846`. **Cause:**
the code returned `P(T+|D)` while the decision needs `P(D|T+)`. **Diagnostic:**
print the event after the probability bar and identify its denominator; then
rebuild the table from the 1% deployment mix.

### Deliberate failure: use a balanced sample as deployment evidence

Use the 100/100 balanced fixture and report `0.9474` as if it were production
PPV. **Test:** assert the deployment posterior is within `1e-12` of `180/1170`
and assert it is not within `0.01` of the balanced-fixture PPV. The test should
name the changed base rate as the reason, not call the model “inconsistent.”

### Reset path

**Reset:** follow the sequence below from the saved-good fixture; do not reuse
mutated arrays or a changed seed from a failure run.

1. Save the passing table, seed, rates, and expected posterior.
2. Run each failure fixture in isolation so its failure cannot corrupt the good
   result.
3. Restore `PREVALENCE=0.01`, `SENSITIVITY=0.90`, `FALSE_POSITIVE_RATE=0.05`,
   `N=20_000`, and `SEED=20260830`.
4. Recompute the table, rerun the simulation twice, and verify the replay,
   total-count, posterior-tolerance, and false-positive sensitivity assertions.
5. Record the failed claim and its repair in the decision memo.

## Hands-on

Produce `a6-base-rates-report.ipynb` or an equivalent script plus a short report
with these sections:

| Artifact section | Evidence to include |
|---|---|
| Assumptions | `D`, `T+`, prevalence, sensitivity, false-positive rate, `N`, seed |
| Frequency table | four cells, row/column totals, sensitivity, FPR, PPV, negative posterior |
| Simulation | code, NumPy version, seeded counts, PPV, difference from table |
| Base-rate fixture | balanced-sample PPV beside deployment PPV and explanation |
| Sensitivity analysis | at least four FPR values, table or labelled plot, route changes |
| Failure/reset | failing assertion, diagnosis, repaired output, replay evidence |
| Decision memo | 150–300 words on the route, assumptions, and limitations |

For a visual view, draw the two-stage tree: first `D`/`¬D` with widths 1%/99%,
then `T+`/`T−` branches. Shade the TP and FP terminal branches in different
colours. The positive posterior is the shaded TP width divided by all positive
terminal width—not the width of the positive branch before the test.

## Acceptance tests

- [ ] The frequency table totals 20,000 and its four cells are
  `TP=180`, `FP=990`, `FN=20`, `TN=18,810`.
- [ ] Sensitivity is 0.90, false-positive rate is 0.05, and deployment PPV is
  `180/1,170≈0.153846`.
- [ ] The base-rate-fallacy fixture shows why 0.90 is not the positive posterior.
- [ ] The seeded simulation runs twice with identical counts and keeps the PPV
  within 0.01 of the table result.
- [ ] The four-rate sensitivity analysis shows PPV increasing as false-positive
  rate decreases and crosses the toy threshold at 0.5%.
- [ ] A deliberately wrong denominator or balanced-sample transport fails a
  named test rather than merely producing a warning.
- [ ] The reset reproduces the saved-good table, simulation, and assertions.
- [ ] The memo distinguishes probability estimates, policy threshold, and
  real-world cost or harm.

## Rubric

| Criterion | Weight | Full-credit evidence |
|---|---:|---|
| Mathematical model | 25% | Events, conditionals, denominator, Bayes derivation, and correct table |
| Computation | 20% | NumPy simulation with fixed seed, version, reproducible checks, and tolerance |
| Interpretation | 20% | Base-rate fallacy explained and posterior connected to the stated route |
| Diagnostics | 20% | False-positive sensitivity, failing fixture, named cause, and reset evidence |
| Communication | 15% | Labelled table/plot, readable artifact, 150–300 word decision memo, limitations |

## Checkpoint

- [ ] From the table, calculate `P(T+|D)`, `P(T+|¬D)`, and `P(D|T+)` without
  swapping the conditioning event.
- [ ] Explain why a balanced test set can show PPV 0.9474 while deployment PPV
  is 0.1538 under the same sensitivity and false-positive rate.
- [ ] Predict the direction of PPV when the false-positive rate falls and show
  the calculation for 1%.
- [ ] Explain why the seeded simulation is reproducible but does not reproduce
  the exact deterministic table counts.
- [ ] State what the toy 0.50 threshold decides and which real-world inputs it
  leaves out.

## What this does not solve

Bayes’ rule only updates the assumptions supplied to it. This lab does not prove
that prevalence is measured correctly, that labels are accurate, that sensitivity
or false-positive rate is stable across subgroups and time, or that the test is
causal. A seeded simulation demonstrates sampling behaviour, not external
validity. A threshold also hides a cost model unless its harms, review capacity,
and escalation path are specified.

## Continue, go deeper, apply it

- Continue: Random variables and support
- Go deeper: Monte Carlo estimation and standard errors
- Apply it: Classifiers, thresholds, and calibration
