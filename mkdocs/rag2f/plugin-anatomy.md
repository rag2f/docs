# Plugin anatomy

This page describes the recommended structure and metadata for rag2f plugins.

## Local plugin structure

```
plugins/
  my_plugin/
    plugin.json
    my_plugin.py
    README.md
```

`plugin.json` is the primary metadata source.

### Extended layout (recommended)

```
plugins/
  my_plugin/
    plugin.json
    my_plugin.py
    requirements.txt
    README.md
    tests/
      test_plugin.py
```

Keep optional dependencies in `requirements.txt` so the core stays lean.

## `plugin.json` fields

Minimal fields:

- `id`: unique plugin id (used for config namespacing)
- `name`: human-friendly name
- `version`: plugin version
- `module`: entry module path (relative to plugin folder)

Example:

```json
{
  "id": "my_plugin",
  "name": "My Plugin",
  "version": "0.1.0",
  "module": "my_plugin.py"
}
```

### Common optional fields

- `description`, `keywords`
- `author_name`, `author_email`
- `license`
- `urls` (project/home/docs)
- `min_rag2f_version`, `max_rag2f_version`

Use `min_rag2f_version` to declare compatibility windows.

## Packaged plugins and entry points

If you publish a plugin as a Python package, expose an entry point in the group:

```
rag2f.plugins
```

Entry points must be **callable** and must return the **absolute path** to the plugin folder.

Conceptual `pyproject.toml` snippet:

```toml
[project.entry-points."rag2f.plugins"]
my-plugin = "my_plugin_pkg:get_plugin_path"
```

### Example `get_plugin_path()`

```python
from importlib import resources

def get_plugin_path() -> str:
    return str(resources.files("my_plugin_pkg"))
```

## Plugin activation checklist

In your plugin module:

1. Validate required config (fail fast).
2. Register embedders or repositories with their registries.
3. Register hooks for pipeline stages you want to contribute to.

Keep heavy imports inside functions when possible so optional dependencies do not slow startup.

## Example: embedder plugin skeleton

```python
from rag2f.core.morpheus.decorators.plugin import plugin

@plugin
def activate(rag2f):
    cfg = rag2f.spock.get_plugin_config("my_embedder") or {}
    api_key = cfg.get("api_key")
    if not api_key:
        raise ValueError("Missing my_embedder.api_key")
    rag2f.optimus_prime.register("my_embedder", MyEmbedder(api_key=api_key))
```

## Example: repository plugin skeleton

```python
from rag2f.core.morpheus.decorators.plugin import plugin

@plugin
def activate(rag2f):
    repo = MyRepo(...)
    result = rag2f.xfiles.execute_register(
        "primary",
        repo,
        meta={"type": "vector", "domain": "docs"},
    )
    if result.is_error():
        raise ValueError(result.detail.message)
```

## Hook design tips

- Keep hooks pure and deterministic where possible.
- Document expected `phone` keys in the plugin README.
- Use priorities to control ordering across plugins.

## Testing suggestions

- Unit test hooks directly (they are plain functions).
- Validate registry entries and capability declarations.
- Run a smoke test that loads the plugin and calls a hook.
