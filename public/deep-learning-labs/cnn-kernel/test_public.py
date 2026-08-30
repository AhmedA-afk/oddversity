import importlib,json,os
m=importlib.import_module(os.environ.get("STUDENT_MODULE","starter"))
with open("fixture.json") as f: out=m.run(json.load(f))
assert out["feature_map"]==[[-4,-4],[-4,-4]]
assert out["pooled"]==[[-4]]
print("PASS: convolution and pooling outputs match.")
