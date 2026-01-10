# Hello, dear 👋

**rag2f** is a *plugin-first, entry-point–driven kernel* for composing Retrieval-Augmented Generation (RAG) systems **without forcing a single pipeline shape**.

It gives you a small, stable core (the “kernel”) and pushes volatile integrations (vector DBs, embedders, stores, orchestration) into plugins — so you can swap infrastructure without rewriting your whole app.

> rag2f is **not** a turnkey RAG pipeline.  
> Pipelines live in plugins or in *your* application.

## Quick links

- [Quickstart](quickstart.md)
- [Installation](installation.md)
- [Configuration (Spock)](configuration.md)
- [Plugins & hooks (Morpheus)](plugins.md)
- [Repositories (XFiles)](repositories.md)
- [Embedders (OptimusPrime)](embedders.md)
- [Architecture](architecture.md)

## Why rag2f

### Dependency volatility is real
RAG stacks depend on fast-moving infrastructure (vector DBs, LLM SDKs, hosted services). That creates two recurring problems:

- **Supply-chain risk**: dependency churn breaks builds, increases attack surface, and forces migrations.
- **Architecture rigidity**: “one pipeline to rule them all” hides backend-specific power and makes swaps painful.

rag2f addresses both by:
- keeping the **base install lean**,
- discovering integrations via **plugins**,
- using **explicit contracts** (protocols) and **capability declarations**.

## The core at a glance

A `RAG2F` instance wires together a few intentionally-named components:

- **Spock**: configuration manager (JSON + env; env overrides JSON)
- **Morpheus**: plugin & hook manager (entry points + filesystem)
- **OptimusPrime**: embedder registry (embedders contributed by plugins)
- **XFiles**: repository registry (SQL/vector/graph/document repositories)
- **Johnny5**: input manager (small deterministic pre-processing)

## License

rag2f is distributed under **GPL-3.0** (see the repository’s `LICENSE`).

## Get in touch

If you’re working on rag2f plugins or want to align on architecture, open a GitHub issue/discussion in the rag2f repo.
