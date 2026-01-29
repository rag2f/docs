# Installation

## Requirements

- Python **3.12+**

## Install

=== "From Source (dev)"
    ```bash
    git clone <your-rag2f-repo>
    cd rag2f
    pip install -e ".[dev]"
    ```

=== "As Dependency"
    ```bash
    pip install rag2f
    ```

=== "With Bootstrap"
    ```bash
    bash scripts/bootstrap-venv.sh
    source .venv/bin/activate
    ```

## Project Layout

```
your_app/
├── config.json          # Spock config
├── plugins/             # Local plugins folder
│   └── my_plugin/
│       ├── plugin.json  # Plugin metadata
│       └── my_plugin.py # Hooks/tools
└── main.py
```

## Quick Verify

```python
from rag2f import RAG2F

async def main():
    rag2f = await RAG2F.create(
        plugins_folder="plugins",
        config_path="config.json"
    )
    print(f"Loaded: {len(rag2f.morpheus.plugins)} plugins")
```

## Troubleshooting

| Problem | Check |
|---------|-------|
| No plugins loaded | `plugins_folder` exists, has `plugin.json` |
| Multiple embedders | Set `rag2f.embedder_default` in config |
| Wrong plugin path | Plugin's `get_plugin_path()` returns its own dir |

See [Configuration](configuration.md) for env vars and [Plugins](plugins.md) for plugin setup.
