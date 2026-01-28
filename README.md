# RAG2F docs

Documentation for the rag2f ecosystem, built with MkDocs Material.

## Structure

- `mkdocs/` contains all Markdown content
- `mkdocs.yml` defines the navigation
- `mkdocs/overrides/` holds theme overrides (home cards, custom HTML)

## Local preview

This repository contains the **RAG2F** documentation site (MkDocs Material).

### Option A: VS Code Tasks (recommended)

The repo includes ready-to-run tasks in [.vscode/tasks.json](.vscode/tasks.json).

1. Run `Terminal → Run Task… → Docs: Setup venv (.venv)`
2. Run `Terminal → Run Task… → MkDocs: Serve (RAG2F)`
3. Open `http://127.0.0.1:8000/`

To build the static site output:

- Run `Terminal → Run Task… → MkDocs: Build (RAG2F)`

### Option B: CLI (manual)

Create and populate a virtual environment:

```bash
python3 -m venv .venv
./.venv/bin/python -m pip install -r requirements-docs.txt
```

Run a local dev server:

```bash
./.venv/bin/python -m mkdocs serve -f mkdocs.yml -a 127.0.0.1:8000
```

Build the static site:

```bash
./.venv/bin/python -m mkdocs build -f mkdocs.yml
```

Static output is generated into `site/`.

## TODO: Documentation Improvements

- [ ] **End-to-End Tutorial**: Add `tutorial.md` with complete example "install → configure → create plugin → test"
- [ ] **Auto-Generated API Reference**: Integrate `mkdocstrings` to auto-generate API reference from docstrings
- [ ] **Debug Examples**: Add practical examples with logging and breakpoints in `troubleshooting.md`
- [ ] **Changelog/Versioning**: Create `changelog.md` and document plugin ↔ rag2f version compatibility
