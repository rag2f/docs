# Installation

## Requirements

- Python **3.12+** (rag2f declares `requires-python = ">=3.12"`)
- A Dev Container (recommended for consistent toolchains)

## Install from source (dev)

```bash
git clone <your-rag2f-repo>
cd rag2f
# Recommended: Dev Container (VS Code / devcontainers CLI)
# - Open the repo in the dev container and wait for the container to build
pip install -e ".[dev]"
```

(If you prefer a local venv instead of a dev container: `python -m venv .venv && source .venv/bin/activate`.)

### Dev Container notes

- The container runs the same bootstrap script as local setup.
- You still get a `.venv` inside the workspace for consistent tooling.
- Use it for deterministic Python versions and tooling across the team.

Alternatively, the repo ships a bootstrap script:

```bash
bash scripts/bootstrap-venv.sh
source .venv/bin/activate
```

## Install as a dependency

If you publish rag2f to an index, install it like any other Python package:

```bash
pip install rag2f
```

### Optional extras

rag2f keeps the core small, so most heavy dependencies live in plugins.
Install plugin packages separately, or include them in your own app.

## Pinning and upgrades

Because rag2f is designed to keep integrations in plugins, the core can remain small and stable.
Still, for production systems:

- Pin rag2f and plugin versions together.
- Upgrade in a staging environment where you can validate the plugin contracts.
- Keep plugin dependencies isolated to avoid cross-plugin conflicts.

### Recommended versioning practice

- Pin `rag2f` and plugin packages in the same requirements lock.
- Record the `rag2f` version that each plugin was last tested with.
- Use CI to run plugin contract tests against new core versions.

## Project layout expectations

rag2f assumes a “project root” (current working directory) and uses it to locate a default plugin folder:

- default plugins folder: `./plugins` (relative to `os.getcwd()`)

You can override this by passing `plugins_folder=...` when creating the `RAG2F` instance.

## CLI / scripts

If your app has a CLI entry point, make sure it sets the working directory to the project root or passes an explicit `plugins_folder` so local plugins are consistently resolved.

## Local plugins folder

For local development, create:

```
your_app/
  config.json
  plugins/
    my_plugin/
      plugin.json
      my_plugin.py
```

Then:

```python
rag2f = await RAG2F.create(plugins_folder="plugins", config_path="config.json")
```

## Environment variables

Spock reads env vars with the `RAG2F__` prefix:

```
RAG2F__RAG2F__EMBEDDER_DEFAULT=my_embedder
RAG2F__PLUGINS__MY_PLUGIN__API_KEY=sk-...
```

Env overrides config files, so it is the best place for secrets.

## Troubleshooting

### “No plugins loaded”
- Ensure your `plugins_folder` exists (or that you installed plugins via pip with entry points).
- Check that each plugin has metadata (`plugin.json` and/or `pyproject.toml`) and Python files that define hooks/tools.

### “Entry point plugin path returned site-packages”
Some plugins may accidentally return the `site-packages` directory instead of their own plugin directory.
rag2f tries to detect and recover from this, but the plugin should fix its `get_plugin_path()` factory.

### “Multiple embedders registered but no default configured”
- Set `rag2f.embedder_default` in config or env.
- If only one embedder is expected, ensure only that plugin is installed.
