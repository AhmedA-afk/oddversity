# Expected artifacts

Running a passing implementation creates:

- `artifacts/model.json` with numeric `intercept` and `coefficients`.
- `artifacts/predictions.csv` with `x,prediction` rows for the fixture.

The public harness checks these artifacts as well as the implementation. Do not
hard-code fixture answers: hidden data should still work.
