import importlib,json,os
m=importlib.import_module(os.environ.get("STUDENT_MODULE","starter"))
with open("fixture.json") as f: out=m.run(json.load(f))
assert all(abs(actual-expected)<1e-9 for actual,expected in zip(out["z"],[1.2,-2.1]))
assert abs(out["d_loss"]-0.454161)<1e-5
print("PASS: VAE reparameterization and GAN loss match.")
