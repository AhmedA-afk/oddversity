# AdaBoost noise-sensitivity reproduction

Build AdaBoost with one-dimensional decision stumps and reproduce the central
observation: label noise can make successive boosting rounds chase difficult points.
The included fixture is deterministic and deliberately small enough to inspect.

## Deliverables

- Implement stump search, boosting, prediction, and the two-noise-rate experiment.
- Report clean and noisy accuracy plus the final weighted error.
- Save `artifacts/noise_sensitivity.json`.

Run your work with `python test_public.py`; validate the harness with
`STUDENT_MODULE=reference_solution python test_public.py`.
