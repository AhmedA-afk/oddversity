# MovieLens — student-owned starter

Build an offline recommendation baseline with explicit train/test separation. The source is the GroupLens MovieLens dataset collection: <https://grouplens.org/datasets/movielens/>. Use the dataset page to select a permitted version and retain the GroupLens acknowledgement in your report.

## Data acquisition

Download a chosen MovieLens archive into git-ignored `data/raw/`, preserve the supplied split or create and justify a temporal split, and document filtering (minimum ratings, cold-start policy, and rating scale). Treat ratings as personal data signals: do not attempt re-identification or combine them with external identities.

The committed fixture is synthetic and only supports network-free tests. Complete the TODOs in `starter.py`, then run `python test_public.py`.

