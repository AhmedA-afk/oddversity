"""Student-owned CNN primitive exercise."""
def valid_convolution(image, kernel):
    # TODO: return valid 2-D cross-correlation (no padding, no kernel flip).
    raise NotImplementedError
def max_pool_2x2(feature_map):
    # TODO: return non-overlapping 2x2 maximum pooling.
    raise NotImplementedError
def run(fixture):
    fmap=valid_convolution(fixture["image"], fixture["kernel"])
    return {"feature_map": fmap, "pooled": max_pool_2x2(fmap)}
