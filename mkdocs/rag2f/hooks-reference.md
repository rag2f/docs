# Hooks reference

This page collects the practical details of how hooks behave.

## Signatures

Hooks are plain Python callables decorated with `@hook`.

Pipeable hook:

```python
@hook("preprocess", priority=5)
def preprocess(phone, *, rag2f):
    phone["text"] = phone["text"].strip()
    return phone
```

Side-effect hook:

```python
@hook("startup", priority=1)
def startup(*, rag2f):
    rag2f.logger.info("Ready")
```

## Piping behavior

- If the hook takes at least one positional argument, the first is treated as `phone`.
- The return value becomes the input for the next hook.
- If a hook returns `None`, the pipeline stops with `None` unless you handle it explicitly.

## Ordering

Hooks with higher priority run earlier. If priorities are equal, ordering is deterministic but unspecified.
Use priorities to guarantee ordering across plugins.

## Testing hooks

Because hooks are plain functions, you can unit test them directly:

```python
def test_preprocess():
    phone = {"text": "  hi  "}
    assert preprocess(phone, rag2f=FakeRag2f())["text"] == "hi"
```

Keep hook logic small and push side-effectful work into helpers so tests remain fast.
