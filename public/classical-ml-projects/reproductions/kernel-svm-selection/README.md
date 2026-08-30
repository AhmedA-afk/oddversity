# Kernel SVM model selection

Implement a small binary kernel SVM and select between linear and RBF kernels on a
deterministic XOR-like fixture. The point is not library use; it is respecting a
train/validation protocol while implementing the dual optimisation yourself.

## Deliverables

- Implement linear/RBF kernels, a deterministic training routine, prediction, and
  validation-based kernel selection.
- Save `artifacts/kernel_selection.json`.
- Pass `python test_public.py`.

The reference solution uses a compact SMO-style coordinate loop. You may use another
correct, deterministic dual optimiser; do not call a library SVM.
