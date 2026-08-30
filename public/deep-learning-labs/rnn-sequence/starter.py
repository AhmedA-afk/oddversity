"""Student-owned recurrent-state exercise."""
import math
def tanh(x):
    # TODO: implement tanh using math.tanh.
    raise NotImplementedError
def step(token, state, wx, wh, bias):
    # TODO: h_t=tanh(wx*x_t + wh*h_(t-1) + bias)
    raise NotImplementedError
def run(fixture):
    state=fixture["initial_state"]; states=[]
    for token in fixture["tokens"]:
        state=step(token,state,fixture["wx"],fixture["wh"],fixture["bias"]); states.append(state)
    return {"states":states,"final_state":state}
