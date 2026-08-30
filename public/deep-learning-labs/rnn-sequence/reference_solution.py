import math
def tanh(x): return math.tanh(x)
def step(token,state,wx,wh,bias): return tanh(wx*token+wh*state+bias)
def run(fixture):
    state=fixture["initial_state"]; states=[]
    for token in fixture["tokens"]:
        state=step(token,state,fixture["wx"],fixture["wh"],fixture["bias"]); states.append(state)
    return {"states":states,"final_state":state}
