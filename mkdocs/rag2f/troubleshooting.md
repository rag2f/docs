# Troubleshooting

Common issues and how to resolve them.

## Plugin not discovered

- Verify the folder is under `plugins/` or you passed `plugins_folder` to `RAG2F.create(...)`.
- Ensure `plugin.json` exists and points to a valid module file.
- If using entry points, confirm the entry point returns the plugin folder, not `site-packages`.

## Hooks not running

- Confirm the hook name matches exactly (case-sensitive).
- Ensure the hook function is decorated with `@hook`.
- Verify the plugin was activated (check logs at startup).

## “No default embedder”

- Register at least one embedder via a plugin.
- Set `rag2f.embedder_default` in config.
- Avoid registering embedders with the same name.

## “Multiple embedders but no default configured”

- Set `rag2f.embedder_default` to one of the registered keys.
- If only one embedder should exist, remove the extra plugin.

## Capability mismatch errors

- Ensure your repository advertises only the capabilities it implements.
- Implement the required methods before declaring a capability.

## Config values not found

- Check that `config_path` points to the correct file.
- Validate `plugins.<plugin_id>` matches the `id` in `plugin.json`.
- Confirm environment variable overrides are set in the runtime environment.

## Environment overrides not applying

- Check prefix and section: `RAG2F__RAG2F__...` or `RAG2F__PLUGINS__...`
- Ensure values parse correctly (JSON vs string).
- Remember env overrides config file values.

## Plugin override confusion

Entry point plugins take precedence over local plugins with the same id.
If you are iterating locally, uninstall the packaged plugin or change the plugin id.

## Duplicate hooks running twice

- Confirm you do not have both an entry-point and filesystem plugin with the same id.
- Ensure your plugin module is not imported twice in different paths.

## Registry lookup failures

- Check the registry key casing; keys are treated as strings.
- Call `list_keys()` on OptimusPrime/XFiles to verify registration.

## Runtime errors inside hooks

- Reduce hook scope and move heavy logic into helpers.
- Add logging inside hooks for payload inspection.
- Use try/except with meaningful error messages for easier debugging.
