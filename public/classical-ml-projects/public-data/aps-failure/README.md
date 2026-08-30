# APS Failure — student-owned starter

Triage potential failure in Scania truck air-pressure-system data. The source is the UCI APS Failure at Scania Trucks dataset: <https://archive.ics.uci.edu/dataset/421/aps+failure+at+scania+trucks>. This is an imbalanced, cost-sensitive classification task; preserve the original attribution and study its data description before use.

## Data acquisition

Download the original archive into git-ignored `data/raw/`, record its checksum, and document missing-value handling. Design the workflow around error cost: a false negative can be much more expensive than an inspection. Do not infer a maintenance decision from a score without a human review process and operational validation.

The tracked fixture is synthetic, tiny, and network-free. Complete the TODO stages in `starter.py`, then run `python test_public.py`.

