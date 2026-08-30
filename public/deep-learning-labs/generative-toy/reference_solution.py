import math
def reparameterize(mu,logvar,epsilon): return [m+math.exp(.5*v)*e for m,v,e in zip(mu,logvar,epsilon)]
def discriminator_loss(real,fake):
    terms=[-math.log(max(r,1e-12))-math.log(max(1-f,1e-12)) for r,f in zip(real,fake)]
    return sum(terms)/len(terms)
def run(fixture): return {"z":reparameterize(fixture["mu"],fixture["logvar"],fixture["epsilon"]),"d_loss":discriminator_loss(fixture["real"],fixture["fake"])}
