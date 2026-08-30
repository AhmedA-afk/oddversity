"""Student-owned deployment and monitoring exercise."""
import math
def threshold_decisions(predictions, threshold):
    # TODO: return integer decisions using >= threshold.
    raise NotImplementedError
def brier_score(predictions, labels):
    # TODO: mean squared probability error.
    raise NotImplementedError
def population_stability_index(baseline, current):
    # TODO: sum((c-b)*log(c/b)); clip each probability to avoid log(0).
    raise NotImplementedError
def run(fixture):
    return {"decisions":threshold_decisions(fixture["predictions"],0.5),
            "brier":brier_score(fixture["predictions"],fixture["labels"]),
            "psi":population_stability_index(fixture["baseline"],fixture["current"])}
