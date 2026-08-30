import numpy as np
from core import *

x = np.array([[0.], [1.], [2.], [3.]])
y = np.array([1., 3., 5., 7.])
closed = least_squares(x, y)
gradient = linear_gradient_descent(x, y)
assert np.allclose(closed, [1., 2.], atol=1e-7)
assert np.allclose(gradient, closed, atol=1e-3)

beta = logistic_gradient_descent(np.array([[-2.], [-1.], [1.], [2.]]), np.array([0., 0., 1., 1.]))
assert sigmoid(add_intercept(np.array([[2.]])) @ beta)[0] > .9
assert knn_predict(x, y, np.array([1.1]), k=2) == 4.0
threshold, sse = best_squared_error_split(x[:, 0], y)
assert threshold in {0., 1., 2.} and sse >= 0

points = np.array([[0., 0.], [0., 1.], [8., 8.], [8., 9.]])
centres, labels = kmeans(points, seed=2)
assert len(np.unique(labels)) == 2 and centres.shape == (2, 2)
projected, directions, values = pca(points, 1)
assert projected.shape == (4, 1) and values[0] >= values[1]
weights, means, variances = gmm_1d(np.array([-2., -1.8, -2.1, 2., 2.2, 1.9]))
assert np.isclose(weights.sum(), 1) and np.all(variances > 0)
assert brier_score(np.array([0., 1.]), np.array([0., 1.])) == 0
assert expected_calibration_error(np.array([.1, .9]), np.array([0, 1])) >= 0
print("All core labs passed.")
