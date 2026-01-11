# rag2f overview

**rag2f** is a *plugin-first, entry-point–driven kernel* for composing Retrieval-Augmented Generation (RAG) systems **without forcing a single pipeline shape**.

It gives you a small, stable core (the “kernel”) and pushes volatile integrations (vector DBs, embedders, stores, orchestration) into plugins so you can swap infrastructure without rewriting your whole app.

> rag2f is **not** a turnkey RAG pipeline.  
> Pipelines live in plugins or in *your* application.

## Why rag2f

RAG stacks depend on fast-moving infrastructure (vector DBs, LLM SDKs, hosted services). That creates two recurring problems:

- **Supply-chain risk**: dependency churn breaks builds, increases attack surface, and forces migrations.
- **Architecture rigidity**: “one pipeline to rule them all” hides backend-specific power and makes swaps painful.

rag2f addresses both by:
- keeping the **base install lean**,
- discovering integrations via **plugins**,
- using **explicit contracts** (protocols) and **capability declarations**.

## What you get in core

A `RAG2F` instance wires together a few intentionally-named components:

- **Spock**: configuration manager (JSON + env; env overrides JSON)
- **Morpheus**: plugin & hook manager (entry points + filesystem)
- **OptimusPrime**: embedder registry (embedders contributed by plugins)
- **XFiles**: repository registry (SQL/vector/graph/document repositories)
- **Johnny5**: input manager (small deterministic pre-processing)

## The typical lifecycle

1. **Load configuration** (Spock) and validate basics.
2. **Discover plugins** (Morpheus) from entry points and local folders.
3. **Register capabilities** (embedders, repositories, hooks).
4. **Compose a pipeline** in your app or via plugin hooks.
5. **Execute** RAG workflows using the registries and hooks.

This keeps the kernel stable while allowing your stack to evolve.

## Quick links

- [Quickstart](quickstart.md)
- [Installation](installation.md)
- [Configuration (Spock)](configuration.md)
- [Plugins & hooks (Morpheus)](plugins.md)
- [Hooks reference](hooks-reference.md)
- [Embedders (OptimusPrime)](embedders.md)
- [Repositories (XFiles)](repositories.md)
- [Architecture](architecture.md)
- [Troubleshooting](troubleshooting.md)

## License

rag2f is distributed under **GPL-3.0** (see the repository’s `LICENSE`).

## Get in touch

If you’re working on rag2f plugins or want to align on architecture, open a GitHub issue/discussion in the rag2f repo.
