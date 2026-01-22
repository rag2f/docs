# Concepts

This page defines the core terms used throughout the rag2f docs.

## Kernel

The **kernel** is the small, stable core of rag2f. It only contains:

- configuration and plugin discovery
- registries and contracts
- hook orchestration

Everything else should live in plugins or your application.

## Instance

An **instance** is a single `RAG2F` object with its own configuration, registries, and plugin state.
Instances are intentionally isolated so tests, tenants, or apps can run side by side without cross-talk.

## Plugin

A **plugin** is a self-contained integration that contributes hooks, embedders, repositories, or helpers.
Plugins are discovered via Python entry points or a local `plugins/` folder.

## Plugin ID

A **plugin ID** is the stable identifier used for namespacing config and avoiding collisions.
It also becomes the namespace used in logs and hook registrations.

## Hook

A **hook** is a named pipeline stage. Multiple hooks can register for the same stage and are executed in priority order.
Hooks optionally receive a pipeable payload called `phone` that flows through the pipeline.

## Phone

**Phone** is the pipeable payload that moves through a hook pipeline.
It is typically a small dict or dataclass that each hook can enrich.

## Registry

Registries are named stores owned by the kernel:

- **OptimusPrime** stores embedders.
- **XFiles** stores repositories.

Registries enforce basic contracts and protect against accidental overrides.

## Protocol

A **protocol** is a minimal interface a plugin component must satisfy.
rag2f uses protocols to validate embedders and repositories without prescribing full implementations.

## Capability

A **capability** is a feature flag declared by a repository to signal which operations it supports.
This protects callers from invoking methods the backend does not implement.

## Entry point

An **entry point** is a packaging-time registration that lets Morpheus discover a plugin from installed packages.
Entry points are resolved before filesystem plugins to keep discovery deterministic.

## Native escape hatch

The **native escape hatch** is a repository feature that exposes a backend-specific handle
so you can access vendor-specific power without distorting the core contracts.

## Pipeline

A **pipeline** is the ordered composition of hooks and application logic that turns a user input into a response.
rag2f does not define a default pipeline; you assemble one explicitly.
