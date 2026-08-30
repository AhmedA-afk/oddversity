import importlib,json,os
m=importlib.import_module(os.environ.get("STUDENT_MODULE","starter"))
with open("fixture.json") as f: out=m.run(json.load(f))
assert len(out["states"])==3
assert abs(out["final_state"]+0.186827)<1e-5
assert out["states"][0] > 0 and out["states"][2] < 0
print("PASS: recurrent state updates match fixture.")
