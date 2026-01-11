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

## Plugin activation checklist

In your plugin module:

1. Validate required config (fail fast).
2. Register embedders or repositories with their registries.
3. Register hooks for pipeline stages you want to contribute to.

Keep heavy imports inside functions when possible so optional dependencies do not slow startup.
