"""Student-owned MLP exercise. Implement every TODO; do not change public tests."""
import math

def relu(x):
    # TODO: return max(0.0, x)
    raise NotImplementedError

def linear(features, weights, bias):
    # TODO: matrix multiply rows of features by weights, then add bias.
    raise NotImplementedError

def softmax(logits):
    # TODO: numerically stable row-wise softmax.
    raise NotImplementedError

def cross_entropy(probabilities, targets):
    # TODO: mean negative log probability of each integer target.
    raise NotImplementedError

def run(fixture):
    logits = linear(fixture["features"], fixture["weights"], fixture["bias"])
    probabilities = softmax([[relu(v) for v in row] for row in logits])
    return {"probabilities": probabilities, "loss": cross_entropy(probabilities, fixture["targets"])}
