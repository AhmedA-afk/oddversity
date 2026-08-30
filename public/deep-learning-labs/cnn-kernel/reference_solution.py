def valid_convolution(image,kernel):
    h,w=len(kernel),len(kernel[0])
    return [[sum(image[i+a][j+b]*kernel[a][b] for a in range(h) for b in range(w)) for j in range(len(image[0])-w+1)] for i in range(len(image)-h+1)]
def max_pool_2x2(feature_map):
    return [[max(feature_map[i+a][j+b] for a in range(2) for b in range(2)) for j in range(0,len(feature_map[0])-1,2)] for i in range(0,len(feature_map)-1,2)]
def run(fixture):
    fmap=valid_convolution(fixture["image"],fixture["kernel"])
    return {"feature_map":fmap,"pooled":max_pool_2x2(fmap)}
