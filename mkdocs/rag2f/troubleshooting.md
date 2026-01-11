# Troubleshooting

Common issues and how to resolve them.

## Plugin not discovered

- Verify the folder is under `plugins/` or you passed `plugins_folder` to `RAG2F.create(...)`.
- Ensure `plugin.json` exists and points to a valid module file.
- If using entry points, confirm the entry point returns the plugin folder, not `site-packages`.

## “No default embedder”

- Register at least one embedder via a plugin.
- Set `rag2f.embedder_default` in config.
- Avoid registering embedders with the same name.

## Capability mismatch errors

- Ensure your repository advertises only the capabilities it implements.
- Implement the required methods before declaring a capability.

## Config values not found

- Check that `config_path` points to the correct file.
- Validate `plugins.<plugin_id>` matches the `id` in `plugin.json`.
- Confirm environment variable overrides are set in the runtime environment.

## Plugin override confusion

Entry point plugins take precedence over local plugins with the same id.
If you are iterating locally, uninstall the packaged plugin or change the plugin id.
