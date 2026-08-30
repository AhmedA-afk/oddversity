# Adult Income — student-owned starter

Predict whether a person earns more than $50K/year. The production dataset is the UCI Adult / Census Income dataset: <https://archive.ics.uci.edu/dataset/2/adult>. Review its metadata, attribution, and terms before downloading or redistributing data.

## Data acquisition

1. Download `adult.data` and `adult.test` from the UCI page into a local, git-ignored `data/raw/` directory.
2. Record download date, source URL, checksum, split rule, and any dropped rows in your model card.
3. Never use `income` (or an equivalent post-outcome field) as a feature. Audit race and sex slices, and describe limitations before deployment.

`data/fixture.csv` is a tiny committed, synthetic, deterministic fixture. It exists only to let the starter and public tests run offline; it is not a substitute for the UCI dataset.

## Your task

Complete the TODO stages in `starter.py`: validate schema, create a transparent baseline, improve it without leakage, and write predictions plus a metrics report. The public test checks the baseline acceptance conditions. Your own work should also add slice metrics and a documented threshold decision.

Run: `python test_public.py`

