# Embedders (OptimusPrime)

OptimusPrime is the embedder registry.

Embedders are contributed by plugins and must satisfy the `Embedder` protocol (structural typing / duck typing).

## The `Embedder` protocol

An embedder must expose:

- `size` (property): embedding vector length
- `getEmbedding(text: str, normalize: bool = False) -> list[float]`

## Registering embedders

Plugins typically register an embedder instance with a name/id:

```python
# inside your plugin activation or hook
rag2f.optimus_prime.register("my_embedder", MyEmbedder(...))
```

OptimusPrime enforces protocol compliance and prevents accidental overrides.

## Selecting the default embedder

Default embedder selection uses Spock config:

- `rag2f.embedder_default = "<name>"`

If exactly one embedder is registered, rag2f may treat it as default automatically.

Usage:

```python
embedder = rag2f.optimus_prime.get_default()
vec = embedder.getEmbedding("hello")
```

## Normalization

If you implement `normalize=True`, document whether you:
- L2-normalize vectors,
- or apply another scaling/standardization.

Downstream vector search engines often expect normalized embeddings for cosine similarity.
