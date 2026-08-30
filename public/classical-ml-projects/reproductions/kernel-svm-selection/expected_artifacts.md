# Expected artifacts

`artifacts/kernel_selection.json` records validation accuracy for `linear` and
`rbf`, the selected kernel, and its hyperparameters. The fixture has an XOR
boundary, so a valid RBF model should win without using validation labels as training
data.
