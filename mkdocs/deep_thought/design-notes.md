# Design notes

This page captures the reasoning behind rag2f design choices.

## Kernel boundaries

The core stays deliberately small. When something is volatile or vendor-specific, it belongs in a plugin.
This protects the kernel from rapid infrastructure churn.

## Contracts over inheritance

Protocols and capability checks favor structural typing over deep class hierarchies.
This keeps integrations lightweight and reduces the cost of supporting new backends.

## Pipelines live outside core

rag2f avoids baking in a single "retrieve → rerank → generate" flow.
Instead, hooks and registries enable multiple pipeline shapes without a monolithic orchestrator.

## Why registry names are narrative

The named components (Spock, Morpheus, OptimusPrime, XFiles, Johnny5) emphasize:

- small surface area
- clear responsibilities
- minimal coupling

The intent is to prevent a "god object" core and to keep extension points explicit.

## Open questions

Topics still being explored:

- How to express multi-tenant configuration without leaking tenant state into the kernel.
- Where to draw the line between hooks and higher-level workflow engines.
- Best practices for plugin dependency isolation at scale.
