# Bank Marketing — student-owned starter

Predict whether a client subscribes to a term deposit. The source is the UCI Bank Marketing dataset: <https://archive.ics.uci.edu/dataset/222/bank+marketing>. Preserve its citation and data description in your project report.

## Data acquisition

Download the UCI CSV archive into git-ignored `data/raw/`, record its checksum and extraction steps, and document which columns are available at the decision time. In particular, decide whether call duration is valid for your proposed use case: it is known only after the call and can be leakage for pre-call targeting.

The committed fixture is synthetic and offline-only. Complete the TODO stages in `starter.py`, then run `python test_public.py`.

