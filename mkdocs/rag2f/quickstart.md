# Quickstart

This page shows the smallest “hello world” you can run with rag2f.

## 1) Install

```bash
# Recommended: Dev Container (VS Code / devcontainers CLI)
# - Open the repo in the dev container and wait for the container to build
pip install -e .
```

(If you prefer a local venv instead of a dev container: `python -m venv .venv && source .venv/bin/activate`.)

## 2) Create a config (optional)

rag2f can run with an empty config, but most real usage needs at least an embedder and one repository.

Create `config.json`:

```json
{
  "rag2f": {
    "embedder_default": "my_embedder"
  },
  "plugins": {
    "my_embedder_plugin": {
      "api_key": "..."
    }
  }
}
```

## 3) Add a tiny local plugin (optional)

Local plugins are the fastest way to test hooks and registries.

Create a plugin folder:

```
plugins/
  hello_plugin/
    plugin.json
    hello_plugin.py
```

Example `plugin.json`:

```json
{
  "id": "hello_plugin",
  "name": "Hello Plugin",
  "version": "0.1.0",
  "module": "hello_plugin.py"
}
```

Example `hello_plugin.py`:

```python
from rag2f.core.morpheus.decorators.hook import hook

@hook("preprocess", priority=5)
def add_tag(phone, *, rag2f):
    phone["tags"] = phone.get("tags", []) + ["hello"]
    return phone
```

## 4) Start an instance and discover plugins

```python
import asyncio
from rag2f.core.rag2f import RAG2F

async def main():
    rag2f = await RAG2F.create(
        plugins_folder="plugins",     # optional; defaults to ./plugins
        config_path="config.json",    # optional
    )

    # Embedder
    embedder = rag2f.optimus_prime.get_default()
    v = embedder.getEmbedding("hello rag2f")

    print(len(v), v[:5])

asyncio.run(main())
```

## 5) Use repositories (XFiles)

Once a repository plugin is registered, you can fetch it by name/id and call protocol methods based on capabilities.

Conceptually:

```python
repo = rag2f.xfiles.get("primary")

# Minimal CRUD
await repo.insert({"id": "1", "text": "hello"})

# Optional query / vector search if supported by the repository
rows = await repo.find({"where": {"field": "text", "op": "contains", "value": "hello"}})
```

See [Repositories (XFiles)](repositories.md) for the real contracts and `QuerySpec` shapes.

## Next steps

- Configure rag2f with [Spock](configuration.md)
- Build a plugin and register it via [entry points](plugins.md)
- Implement a repository plugin using [XFiles protocols](repositories.md)
