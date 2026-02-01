from __future__ import annotations

import shutil
from pathlib import Path


def on_post_build(config, **kwargs):
    """Copy llm/*.txt files into the built site root.

    This makes files like /llms.txt available both in `mkdocs build`
    and during `mkdocs serve`, without having to keep duplicates under docs_dir.
    """

    config_file_path = Path(config["config_file_path"]).resolve()
    project_root = config_file_path.parent

    src_dir = project_root / "llm"
    if not src_dir.exists():
        return

    site_dir = Path(config["site_dir"]).resolve()
    site_dir.mkdir(parents=True, exist_ok=True)

    for txt_file in src_dir.glob("*.txt"):
        shutil.copy2(txt_file, site_dir / txt_file.name)
