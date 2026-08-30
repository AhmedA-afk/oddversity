"""Student-owned generative-model arithmetic exercise."""
import math
def reparameterize(mu, logvar, epsilon):
    # TODO: z = mu + exp(0.5*logvar)*epsilon
    raise NotImplementedError
def discriminator_loss(real, fake):
    # TODO: mean[-log(real)-log(1-fake)] with safe clipping.
    raise NotImplementedError
def run(fixture):
    return {"z":reparameterize(fixture["mu"],fixture["logvar"],fixture["epsilon"]),
            "d_loss":discriminator_loss(fixture["real"],fixture["fake"])}
