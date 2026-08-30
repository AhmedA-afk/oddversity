import importlib,json,os
m=importlib.import_module(os.environ.get("STUDENT_MODULE","starter"))
with open("fixture.json") as f: out=m.run(json.load(f))
assert abs(sum(out["weights"])-1)<1e-9 and out["weights"][2]<1e-10
assert abs(out["output"][0]-1.339523)<1e-5 and abs(out["output"][1]-0.660477)<1e-5
print("PASS: masked scaled attention is correct.")
