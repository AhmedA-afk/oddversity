# Least-squares reproduction

Implement ordinary least squares from the normal equations, then create a small
reproducible model artifact. The fixture has one feature and an intercept; do not
use scikit-learn or `numpy.linalg.lstsq`.

## Deliverables

- Complete the three TODO functions in `starter.py`.
- Run `python test_public.py`; all checks must pass.
- Inspect the generated `artifacts/model.json` and `artifacts/predictions.csv`.

## Acceptance

The solution must recover the fixture's known linear relationship, generalise to
held-out points, and write deterministic artifacts. A reference implementation is
available only to validate the harness:

```bash
STUDENT_MODULE=reference_solution python test_public.py
```

Use `python test_public.py` to test your own `starter.py`.
