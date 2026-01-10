# Architecture

rag2f is a kernel: it gives you the smallest stable set of components needed to compose RAG systems.

Everything volatile lives outside the core — in plugins or your application.

## High-level diagram

```text
               +-----------------------+
               |   Your Application    |
               +-----------+-----------+
                           |
                        RAG2F
                           |
        +------------------+------------------+
        |                  |                  |
      Spock             Morpheus          Johnny5
 (config manager)   (plugins & hooks)  (input manager)
        |                  |
        |            +-----+--------------------------+
        |            |                                |
   OptimusPrime    entry points                  filesystem
 (embedder registry) (rag2f.plugins)             ./plugins
        |
      XFiles
 (repository registry)
```

## What lives in core vs plugins

### Core (stable)
- configuration loader & merger (Spock)
- plugin discovery and hook orchestration (Morpheus)
- registries (OptimusPrime, XFiles)
- protocols/contracts and validation

### Plugins (volatile)
- embedders (Azure OpenAI, OpenAI, local models, etc.)
- repositories (Postgres, SQLite, Qdrant, Pinecone, Neo4j, etc.)
- orchestration patterns (pipelines, workers, DAGs)
- application-specific behavior via hooks

## Naming is intentional

The narrative names are constraints on design:

- registries/managers should stay small and predictable
- executors/orchestrators should live outside the kernel

This helps prevent a “god object” core.

## Pipeline philosophy

rag2f does not impose a single “retrieve → rerank → generate” pipeline.
Instead, you build pipelines by composing:
- hooks
- registries (get the embedder/repository you need)
- your own application code
