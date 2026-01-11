# Embedders (OptimusPrime)

OptimusPrime is the embedder registry.

Embedders are contributed by plugins and must satisfy the `Embedder` protocol (structural typing / duck typing).

> "Freedom is the right of all sentient beings."
> - Optimus Prime, Transformers

## The `Embedder` protocol

An embedder must expose:

- `size` (property): embedding vector length
- `getEmbedding(text: str, normalize: bool = False) -> list[float]`

Minimal example:

```python
class MyEmbedder:
    size = 3

    def getEmbedding(self, text: str, normalize: bool = False) -> list[float]:
        vec = [0.1, 0.2, 0.3]
        if normalize:
            scale = sum(v * v for v in vec) ** 0.5
            vec = [v / scale for v in vec]
        return vec
```

## Registering embedders

Plugins typically register an embedder instance with a name/id:

```python
# inside your plugin activation or hook
rag2f.optimus_prime.register("my_embedder", MyEmbedder(...))
```

OptimusPrime enforces protocol compliance and prevents accidental overrides.

## Batching and performance

If your backend supports batch embedding, consider exposing a second helper method in your plugin module (not the protocol) and wrap it with a hook.
This keeps the core contract simple while letting you optimize for throughput.

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
