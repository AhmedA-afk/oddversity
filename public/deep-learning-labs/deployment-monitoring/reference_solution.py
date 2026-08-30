import math
def threshold_decisions(predictions,threshold): return [int(x>=threshold) for x in predictions]
def brier_score(predictions,labels): return sum((p-y)**2 for p,y in zip(predictions,labels))/len(labels)
def population_stability_index(baseline,current):
    return sum((max(c,1e-12)-max(b,1e-12))*math.log(max(c,1e-12)/max(b,1e-12)) for b,c in zip(baseline,current))
def run(fixture): return {"decisions":threshold_decisions(fixture["predictions"],.5),"brier":brier_score(fixture["predictions"],fixture["labels"]),"psi":population_stability_index(fixture["baseline"],fixture["current"])}
