#!/usr/bin/env python3
"""Compatibility wrapper — use scripts/sync-all.py instead."""

from __future__ import annotations

import runpy
import sys
from pathlib import Path

if __name__ == "__main__":
    sys.argv = [str(Path(__file__).with_name("sync-all.py")), *sys.argv[1:]]
    runpy.run_path(str(Path(__file__).with_name("sync-all.py")), run_name="__main__")
