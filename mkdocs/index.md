---
template: home.html
hero:
  eyebrow: RAG2F Docs
  title: Hello, dear
  subtitle: The plugin-first kernel for composing RAG systems, with a clean contract for repositories and embedders.
  cta_primary:
    label: Quickstart
    link: rag2f/quickstart/
  cta_secondary:
    label: Configure rag2f
    link: rag2f/configuration/
cards:
  - icon: material/rocket-launch
    title: Quickstart
    description: Run a minimal hello world and load your first plugin.
    link: rag2f/quickstart/
  - icon: material/shape-plus
    title: Plugins
    description: Build, register, and ship plugin hooks the right way.
    link: rag2f/plugins/
  - icon: material/database-search
    title: Repositories
    description: Implement the XFiles protocols and unlock vector search.
    link: rag2f/repositories/
  - icon: material/cube-outline
    title: Architecture
    description: Understand the core runtime and its boundaries.
    link: rag2f/architecture/
features:
  - Plugin-first core with a strict contract between orchestrators and tools.
  - Extensible repository layer with optional vector search capabilities.
  - Explicit configuration with environment overrides and clean defaults.
  - Designed for teams who want to move fast without losing clarity.
---

## RAG2F Documentation Hub

This repository hosts docs for the **rag2f** ecosystem.

## Projects

- **rag2f**: the plugin-first kernel for composing RAG systems  
  → see the [rag2f docs](rag2f/index.md)

- **Deep Thought**: design notes and experiments (placeholder section in this docs repo)

## Contributing

Docs are written in Markdown under `mkdocs/` and published with **MkDocs Material**.

- Edit or add pages under `mkdocs/`
- Update `mkdocs.yml` navigation if you add new pages
