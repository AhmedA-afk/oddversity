import math
def stable_softmax(values):
    top=max(values); e=[math.exp(v-top) for v in values]; total=sum(e); return [x/total for x in e]
def attention(query,keys,values,mask):
    d=math.sqrt(len(query)); raw=[sum(q*k for q,k in zip(query,key))/d if keep else -1e30 for key,keep in zip(keys,mask)]
    weights=stable_softmax(raw)
    output=[sum(weights[i]*values[i][j] for i in range(len(values))) for j in range(len(values[0]))]
    return {"weights":weights,"output":output}
def run(fixture): return attention(fixture["query"],fixture["keys"],fixture["values"],fixture["mask"])
