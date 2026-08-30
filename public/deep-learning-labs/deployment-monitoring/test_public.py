import importlib,json,os
m=importlib.import_module(os.environ.get("STUDENT_MODULE","starter"))
with open("fixture.json") as f: out=m.run(json.load(f))
assert out["decisions"]==[1,1,0,0]
assert abs(out["brier"]-0.2125)<1e-9
assert abs(out["psi"]-0.549774)<1e-5
print("PASS: deployment decisions and monitoring metrics match.")
