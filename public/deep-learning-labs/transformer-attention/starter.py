"""Student-owned attention exercise."""
import math
def stable_softmax(values):
    # TODO: return a numerically stable probability vector.
    raise NotImplementedError
def attention(query, keys, values, mask):
    # TODO: use dot(q,k)/sqrt(d); excluded positions receive zero probability.
    raise NotImplementedError
def run(fixture):
    return attention(fixture["query"],fixture["keys"],fixture["values"],fixture["mask"])
