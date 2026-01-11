# Configuration (Spock)

Spock is the centralized, instance-scoped configuration system for rag2f.

It supports:
- **JSON config files** for structured settings
- **Environment variables** for secrets and overrides
- **Priority**: env overrides JSON
- **Namespaced config** for plugins and core settings

> "The needs of the many outweigh the needs of the few."
> - Spock, Star Trek II: The Wrath of Khan

```
   /\
  /__\   Spock
  |..|   logic
  |__|
```

## Config file

A typical config looks like:

```json
{
  "rag2f": {
    "embedder_default": "test_embedder"
  },
  "plugins": {
    "azure_openai_embedder": {
      "azure_endpoint": "https://your-resource.openai.azure.com",
      "api_key": "your-api-key",
      "api_version": "2024-02-15-preview",
      "deployment": "text-embedding-ada-002"
    }
  }
}
```

## Loading config

You can load config via:

- `config_path="config.json"` (Spock reads the file)
- `config={...}` (pass a dict directly)

rag2f loads configuration **before** discovering plugins:

```python
rag2f = await RAG2F.create(config_path="config.json")
```

## Environment variables

Environment variables override JSON values.

Spock attempts to infer types from env strings:
- `true/false` → bool
- numbers → int/float
- JSON strings (objects/arrays) → parsed JSON
- otherwise → string

## Namespacing rules

Use separate namespaces to avoid collisions:

- core: `rag2f.*`
- plugins: `plugins.<plugin_id>.*`

Example:

```json
{
  "rag2f": {
    "embedder_default": "azure_openai"
  },
  "plugins": {
    "azure_openai_embedder": {
      "deployment": "text-embedding-3-large"
    }
  }
}
```

## Environment override patterns

You can keep secrets in env and map them inside your plugin logic:

```python
api_key = rag2f.spock.get("plugins.azure_openai_embedder.api_key")
if not api_key:
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
```

This keeps config files safe for commits while still enabling per-environment overrides.

## Accessing config

From the core:

```python
default_embedder = rag2f.spock.get("rag2f.embedder_default")
```

From plugins, you typically scope into your plugin id:

```python
api_key = rag2f.spock.get("plugins.azure_openai_embedder.api_key")
```

## Recommended patterns

- Put **non-secrets** in `config.json`
- Put **secrets** in env (e.g. `AZURE_OPENAI_API_KEY`) and map them in your plugin logic
- Keep plugin config nested under `plugins.<plugin_id>`
 - Fail fast on missing required config in your plugin activation code
