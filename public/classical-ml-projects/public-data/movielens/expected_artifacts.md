# Expected artifacts

- `recommendations.csv` with user, movie, and rank columns; training-seen movies must be excluded.
- `metrics.json` containing `users_with_holdout` and `hit_rate_at_2`; the fixture has three held-out users and requires hit rate 1.0.
- For real data: temporal or supplied split evidence, ranking metrics, cold-start policy, and privacy limitations.
