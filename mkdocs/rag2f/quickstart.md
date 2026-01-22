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

## 5) Compose a minimal pipeline

rag2f does not impose a pipeline; you compose one with hooks and registries:

```python
phone = {"text": "hello rag2f"}
phone = rag2f.morpheus.execute_hook("preprocess", phone, rag2f=rag2f)
phone = rag2f.morpheus.execute_hook("retrieve", phone, rag2f=rag2f)
phone = rag2f.morpheus.execute_hook("rerank", phone, rag2f=rag2f)
phone = rag2f.morpheus.execute_hook("generate", phone, rag2f=rag2f)
```

Hooks are optional. If no plugin implements a hook, the phone passes through unchanged.

## 6) Use repositories (XFiles)

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

## 7) Add a simple repository plugin (sketch)

Repository plugins register themselves in activation or via hooks:

```python
from rag2f.core.xfiles import BaseRepository

class MemoryRepo(BaseRepository):
    capabilities = {"queryable": False, "vector_search": False, "graph_traversal": False}
    def __init__(self):
        self._rows = {}
    def insert(self, data):
        self._rows[data["id"]] = data
    def get(self, id):
        return self._rows.get(id)
    def update(self, id, data):
        self._rows[id] = {**self._rows.get(id, {}), **data}
    def delete(self, id):
        self._rows.pop(id, None)

def activate(rag2f):
    rag2f.xfiles.register("memory", MemoryRepo(), meta={"type": "memory", "domain": "demo"})
```

## 8) Add a track ID for idempotency

If your input pipeline needs idempotency or tracing, include a track ID in your phone payload
and let downstream hooks keep it attached to results:

```python
import uuid
phone = {"id": uuid.uuid4().hex, "text": "hello rag2f"}
```

## Next steps

- Configure rag2f with [Spock](configuration.md)
- Build a plugin and register it via [entry points](plugins.md)
- Implement a repository plugin using [XFiles protocols](repositories.md)
