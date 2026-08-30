import importlib,json,os
m=importlib.import_module(os.environ.get("STUDENT_MODULE","starter"))
with open("fixture.json") as f: out=m.run(json.load(f))
assert len(out["probabilities"])==2 and all(abs(sum(r)-1)<1e-9 for r in out["probabilities"])
assert abs(out["loss"]-1.930031)<1e-5
print("PASS: MLP probabilities and loss meet the fixture contract.")
