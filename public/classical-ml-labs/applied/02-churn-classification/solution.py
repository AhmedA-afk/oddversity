from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from _shared import cli

if __name__ == "__main__":
    cli("02-churn-classification", solution=True)

