---
title: "Quiz: Data Cleaning & Validation"
track: "python-data-apis"
status: live
summary: "A 6-question self-check on choosing fillna vs dropna, what errors='coerce' actually does to bad values, where schema checks belong in a pipeline, and a worked scenario on unvalidat"
duration: "12 min read"
---

You've seen `fillna`, `dropna`, `errors='coerce'`, and schema checks separately — this quiz checks whether you can pick the right tool under pressure, not just recite what each one does.

## 1. A column, a decision

You're cleaning a 50,000-row customer table before joining it to an orders table on `customer_id`. The `signup_source` column (values like `"organic"`, `"referral"`, `"paid_ad"`) is missing for 3% of rows, scattered with no obvious pattern. Row count has to stay intact for the join to line up correctly downstream.

- **A.** `df.dropna(subset=['signup_source'])`
- **B.** `df['signup_source'] = df['signup_source'].fillna('unknown')`
- **C.** `df['signup_source'] = df['signup_source'].fillna(df['signup_source'].mean())`
- **D.** Drop the whole `signup_source` column since it has gaps

<details><summary>Answer</summary>

**Correct: B.** `fillna('unknown')` keeps every row (the join downstream needs them all) and turns "missing" into an honest, queryable category instead of erasing the fact that you don't know the source. 3% of rows carrying an explicit "unknown" label costs you almost nothing and loses no information you didn't already lack.

**A** — `dropna` would silently remove ~1,500 rows right before a join that depends on row alignment. You'd be trading a labeling problem for a data-loss problem, and a worse one.

**C** — `.mean()` is undefined on a string column and will raise a `TypeError` before it even gets to `fillna`. Even if you're picturing a coded/categorical version of this, "average" isn't a meaningful fill for a category.

**D** — you'd be throwing away signal from the 97% of rows that *do* have a value, to avoid labeling the 3% that don't. That's a much bigger loss than the problem you're solving.

</details>

## 2. What `errors='coerce'` actually does

```python
import pandas as pd

prices = pd.Series(["19.99", "N/A", "$5", ""])
result = pd.to_numeric(prices, errors='coerce')
```

What does `result` look like for the `"N/A"` and `"$5"` entries?

- **A.** It raises a `ValueError` and stops execution before `result` is assigned
- **B.** Both become `NaN` — neither string parses as a plain number
- **C.** `"N/A"` becomes `NaN`, but `"$5"` becomes `5.0` because pandas strips the currency symbol
- **D.** Both are left as their original strings, unchanged, inside `result`

<details><summary>Answer</summary>

**Correct: B.** `errors='coerce'` means "if a value can't be converted, replace it with `NaN` instead of failing." `"N/A"` isn't a number, full stop. `"$5"` isn't a number *either* — `to_numeric` doesn't know currency symbols and won't strip them for you. Both fail to parse, so both become `NaN`. This is exactly why type coercion is only step one; you need a follow-up plan for what those `NaN`s mean, which is why coercion and [handling missing values](/learn/python-data-apis/handling-missing-values) are really one workflow, not two.

**A** — that's `errors='raise'` (also pandas' default when you don't pass `errors` at all). `coerce` exists specifically so one bad value doesn't blow up the whole column.

**C** — this is the tempting one, because it's what you'd *want* for a messy price column. But `to_numeric` does no symbol-stripping or cleanup — you'd need `.str.replace('$', '')` (or similar) before coercing. Assuming coerce is smart about formats is a fast way to ship silently wrong numbers.

**D** — that's closer to the old `errors='ignore'` behavior (now deprecated), which leaves the *entire* input untouched if conversion fails anywhere. `coerce` acts per-value, not all-or-nothing.

</details>

## 3. Where does the schema check go?

Your pipeline looks like this:

```python
df = load_raw("orders.csv")
df = clean(df)        # dropna, coerce dtypes, dedupe
df = engineer_features(df)
predictions = model.predict(df)
```

You want to add a schema check — required columns present, dtypes correct, values in expected ranges. Where does it belong?

- **A.** Inside `load_raw`, right after reading the CSV — check the raw data's shape before anything else touches it
- **B.** Right after `clean(df)` returns, before it's handed to `engineer_features` — validate what your cleaning step actually promised to produce
- **C.** As the first line inside `model.predict`, so the model itself guards its input
- **D.** Nowhere in the code — schema problems show up as bad predictions, so catch them by monitoring output quality in production

<details><summary>Answer</summary>

**Correct: B.** The check that matters most is the one on `clean(df)`'s *output* — that's the contract the rest of your pipeline is trusting. If `clean` has a bug (a `coerce` that quietly produces way more `NaN`s than expected, a `dropna()` that eats more rows than intended, a dtype that didn't convert), you want to know the instant `clean` returns, not three stages later when a model is already scoring on it. This is the core idea behind [validating dataframes with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) — you're not just checking the world, you're checking your own code.

**A** — checking the raw input has real value (see [data contracts and validation](/learn/python-data-apis/data-contracts-and-validation)), but it only tells you the input was reasonable. It can't catch a bug *inside* `clean` — a broken join, a bad coercion, an over-aggressive `dropna` — because none of that has happened yet at this point in the pipeline.

**C** — by the time `model.predict` runs, feature engineering has already transformed the bad data into something that looks like a normal (wrong) feature vector, often with no obvious error to catch. It also couples data-quality logic to the model class, and if `predict` is called per-row or in a loop, you'd be re-validating the same schema over and over for no benefit.

**D** — this makes validation purely reactive. You'd be finding out about the problem from a stakeholder asking why forecasts look off, days or weeks after the bad data entered the pipeline, instead of failing loudly the same run it happened.

</details>

## 4. Coerce, then what?

```python
df['age'] = pd.to_numeric(df['age'], errors='coerce')
```

Before coercion, `age` held things like `34`, `"unknown"`, and `"twenty-five"`. After coercion, about 1% of rows are `NaN`. This column will go into a model as a numeric feature. What's the right next move?

- **A.** Leave the `NaN`s as-is — most models handle missing numeric values natively
- **B.** `df.dropna(subset=['age'])` — a 1% loss is cheap, and there's no trustworthy way to guess an exact age from nothing
- **C.** `df['age'] = df['age'].fillna(0)` — 0 is a safe, neutral placeholder for a numeric column
- **D.** `df['age'] = df['age'].fillna(df['age'].mode()[0])` — treat age like a category and fill with the most common value

<details><summary>Answer</summary>

**Correct: B.** With only 1% of rows affected, dropping them costs you almost nothing, and age is exactly the kind of continuous field where a wrong guess (via mean, mode, or a placeholder) actively misleads the model rather than just being neutral. This is the same trade-off as question 1, flipped: small missing rate + no reliable imputation target usually means `dropna` beats `fillna`, whereas question 1's small-but-categorical case went the other way. The decision depends on *what* the column is, not just *how much* is missing — see [the data cleaning workflow](/learn/python-data-apis/data-cleaning-workflow) for the fuller decision process.

**A** — plain scikit-learn estimators (linear/logistic regression, a default `RandomForestClassifier`, etc.) will raise a `ValueError` the moment they see a `NaN`. A few gradient-boosting implementations handle missing values internally, but that's a specific model choice you'd make deliberately — not something to assume by doing nothing.

**C** — 0 is a plausible-looking age. Filling with 0 doesn't flag anything as missing; it inserts a fake newborn into your data, dragging down the mean and potentially distorting anything downstream that treats age as a real value (age-based segments, ratios, model splits).

**D** — mode imputation is a categorical-data technique. Applying it to a continuous variable collapses a chunk of rows onto one exact value, distorting the distribution's spread — and age's mode is just as arbitrary a guess as 0 or the mean.

</details>

## 5. The scenario: bad data got to the model

A nightly pipeline for a demand-forecasting model runs this every night:

```python
df['discount_pct'] = pd.to_numeric(df['discount_pct'], errors='coerce')
df['discount_pct'] = df['discount_pct'].fillna(0)
predictions = model.predict(df)
```

One week, an upstream system quietly starts sending discounts as strings like `"10%"` instead of decimals like `0.10`. Nothing crashes — `"10%"` fails to coerce, becomes `NaN`, and `fillna(0)` turns it into "no discount." A month later, someone notices the model is under-forecasting demand for discounted items. What should have caught this *before* it reached the model?

- **A.** Using `errors='raise'` instead of `errors='coerce'`, so the pipeline halts on the first unparseable value
- **B.** A schema check right after the coerce/fillna step that flags when the null rate (or the fraction being filled) in `discount_pct` jumps above its normal baseline, and fails the run instead of proceeding
- **C.** Retraining the model more often so it adapts to the new upstream format
- **D.** Increasing the decimal precision used in `fillna(0)` so small discounts aren't rounded away

<details><summary>Answer</summary>

**Correct: B.** The actual failure here isn't one bad value — it's that the *shape* of the column changed (a null/fill rate that used to be near-zero suddenly spiked) and nothing was watching for that. A schema check that asserts "the fraction of `discount_pct` values I had to fill should stay under some threshold, e.g. 2%" would have failed the run the very first night the format changed, instead of letting weeks of silently-wrong feature values reach the model. This is the gap between coercion (handles one bad value) and [validation](/learn/python-data-apis/data-contracts-and-validation) (catches when the aggregate pattern of a column stops matching what you expect).

**A** — `errors='raise'` is defensible as a stricter default, but it's blunt: it crashes the whole pipeline on the *first* unparseable value with no distinction between "one stray typo" (fine to coerce and move on) and "an entire column's format silently changed" (needs a loud, specific alert). You'd either be fielding constant false-alarm crashes or turning `raise` off the first time it's annoying — neither gets you the targeted signal a null-rate check gives you.

**C** — retraining doesn't fix the input. The model would just keep learning from a `discount_pct` column that says "0" for items that are actually discounted — you'd be reinforcing the wrong signal, not correcting it.

**D** — rounding precision has nothing to do with this bug. The problem isn't that `0` is imprecise; it's that `0` is *the wrong value entirely* for rows where a real discount existed but got coerced away. Fixing precision treats a symptom that was never the actual issue.

</details>

## 6. The dropna surprise

You run this on a 20-column dataframe, expecting to clean up the `notes` column, which is about 40% missing:

```python
df_clean = df.dropna()
```

You expected to lose roughly 40% of rows. Instead you lose 95% of them. What almost certainly happened?

- **A.** `dropna()` with no arguments drops any row that has a missing value in *any* column — some other column is missing far more often than `notes`, and it's driving the loss
- **B.** `dropna()` defaults to dropping columns rather than rows, and most of your 20 columns happened to be related to `notes`
- **C.** pandas detected a mixed-dtype column somewhere and silently coerced the entire dataframe to `NaN` before dropping
- **D.** `notes` actually contains empty strings (`""`), not real missing values, and `dropna()` also strips out every row with an empty string anywhere else in the frame

<details><summary>Answer</summary>

**Correct: A.** `dropna()` with no arguments drops a row if *any* column in that row is `NaN` — it's `how='any'` across all columns by default. If you only meant to target `notes`, you needed `df.dropna(subset=['notes'])`. The 95% loss is the fingerprint of some other column (maybe one you weren't even thinking about) having a much higher missing rate, and `dropna()` quietly including it in the check. Always ask "which column(s)" before calling `dropna()` bare — see [the data cleaning workflow](/learn/python-data-apis/data-cleaning-workflow) and [common data-cleaning mistakes](/learn/python-data-apis/data-cleaning-common-mistakes) for this exact trap.

**B** — `dropna()`'s default `axis` is `0` (rows), not columns. Column-dropping requires `axis=1` explicitly; it's never the silent default.

**C** — there's no such mechanism in pandas. A mixed-dtype column doesn't cause the rest of the dataframe to be coerced to `NaN`; this option describes a failure mode that doesn't exist, which is worth noticing when you're debugging for real — don't invent mechanisms pandas doesn't have.

**D** — this describes a real and separate gotcha (pandas does *not* treat `""` as missing by default, so a column full of empty strings can slip past `dropna()`/`isna()` entirely), but it's the opposite direction of what's described here, and it wouldn't explain rows being dropped *because* of empty strings — `dropna()` ignores empty strings, it doesn't act on them.

</details>

**Related:** [Handling missing values](/learn/python-data-apis/handling-missing-values) · [Type coercion and parsing dates](/learn/python-data-apis/type-coercion-and-parsing-dates) · [Validating dataframes with schemas](/learn/python-data-apis/validating-dataframes-with-schemas) · [Data contracts and validation](/learn/python-data-apis/data-contracts-and-validation) · [The data cleaning workflow](/learn/python-data-apis/data-cleaning-workflow) · [Data cleaning common mistakes](/learn/python-data-apis/data-cleaning-common-mistakes)
