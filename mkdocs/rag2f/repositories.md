# Repositories (XFiles)

XFiles is rag2f’s registry for heterogeneous repositories: SQL, vector databases, document stores, graphs, or hybrids.

rag2f intentionally does **not** flatten every backend into a lowest-common-denominator API.
Instead, it defines **minimal contracts** and lets repositories opt into richer protocols.

## Repository protocols

A repository plugin implements one or more of these contracts:

- **BaseRepository**: minimal CRUD + capabilities + native escape hatch
- **QueryableRepository**: `find()` with `QuerySpec`
- **VectorSearchRepository**: `vector_search()` for embedding retrieval
- **GraphTraversalRepository**: `traverse()` for graph queries

Use **capabilities** to determine what you can safely call.

## Capabilities

Repositories declare capabilities (e.g. supports vector search, supports graph traversal).
XFiles validates that the repository methods match the declared capabilities.

This makes it harder to:
- accidentally call vector search on a SQL-only repo,
- ship a plugin that claims features it doesn’t implement.

## QuerySpec

Queryable repositories accept a `QuerySpec` structure to express filters, pagination and projection.
The exact shape lives in `rag2f.core.xfiles.types`, but conceptually:

```python
query = {
  "where": {"field": "title", "op": "contains", "value": "rag"},
  "limit": 10
}
rows = await repo.find(query)
```

## Native access

For advanced use, repositories can expose native handles:

```python
client = repo.native("primary")
# now you're in backend-specific territory
```

This “escape hatch” is deliberate:
- rag2f keeps contracts minimal,
- you can still use vendor-specific power when you want it.

## Registering repositories

Repository registration is typically performed by plugins via XFiles hooks or explicit registration calls (depending on your plugin design).

See [Architecture](architecture.md) for how XFiles sits in the overall system.
