# Repositories (XFiles)

XFiles is rag2f’s registry for heterogeneous repositories: SQL, vector databases, document stores, graphs, or hybrids.

rag2f intentionally does **not** flatten every backend into a lowest-common-denominator API.
Instead, it defines **minimal contracts** and lets repositories opt into richer protocols.

> "The truth is out there."
> - The X-Files

```
  \  |  /
   .-*-.
  /  |  \   XFiles
```

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

Example capability declaration (conceptual):

```python
capabilities = {
    "queryable": True,
    "vector_search": False,
    "graph_traversal": False,
}
```

## QuerySpec

Queryable repositories accept a `QuerySpec` structure to express filters, pagination and projection.
The exact shape lives in `rag2f.core.xfiles.types`, but conceptually:

```python
from rag2f.core.xfiles import QuerySpec, eq, and_

query = QuerySpec(
    select=["id", "email"],
    where=and_(eq("status", "active"), eq("tier", "pro")),
    order_by=["-created_at"],
    limit=10,
)
rows = repo.find(query)
```

## Minimal repository shape

At minimum, a repository should provide:

- `insert(data)` to add items
- `get(id)` to retrieve by identifier
- `update(id, data)` to modify
- `delete(id)` to remove
- `capabilities()` or `capabilities` metadata

If you implement richer protocols, document the expected payloads in your plugin README.

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
