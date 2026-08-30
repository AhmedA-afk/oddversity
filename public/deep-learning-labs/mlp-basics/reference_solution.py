import math

def relu(x): return max(0.0, x)
def linear(features, weights, bias):
    return [[sum(x * weights[k][j] for k, x in enumerate(row)) + bias[j] for j in range(len(bias))] for row in features]
def softmax(logits):
    answer=[]
    for row in logits:
        top=max(row); exps=[math.exp(v-top) for v in row]; total=sum(exps)
        answer.append([v/total for v in exps])
    return answer
def cross_entropy(probabilities, targets):
    return -sum(math.log(max(probabilities[i][target], 1e-12)) for i,target in enumerate(targets))/len(targets)
def run(fixture):
    logits=linear(fixture["features"],fixture["weights"],fixture["bias"])
    probabilities=softmax([[relu(v) for v in row] for row in logits])
    return {"probabilities":probabilities,"loss":cross_entropy(probabilities,fixture["targets"])}
