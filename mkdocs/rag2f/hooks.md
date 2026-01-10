# Hooks

Hooks are rag2f’s main extension point. They are “adaptation points” that let plugins modify behavior without changing the core.

## The `phone` pattern (pipeable value)

For hook pipelines that accept arguments, Morpheus treats the first positional argument as a pipeable payload called **phone**:

- hook 1 receives `phone`, returns a (possibly modified) `phone`
- hook 2 receives the returned `phone`, and so on

This lets you:
- add capabilities
- override defaults
- enrich results

## Defining a hook

```python
from rag2f.core.morpheus.decorators.hook import hook

@hook("preprocess", priority=5)
def preprocess(phone, *, rag2f):
    phone["text"] = phone["text"].strip()
    return phone
```

### Priorities

- Default priority is `1`
- Higher priority runs earlier

If multiple plugins define the same hook, the ordering is deterministic by priority.

## Executing a hook

From the core / your application:

```python
phone = {"text": "  hello  "}
phone = rag2f.morpheus.execute_hook("preprocess", phone, rag2f=rag2f)
```

If no plugin implements the hook:
- if a phone argument was provided, Morpheus returns it unchanged
- otherwise it returns `None`

## When to use hooks vs plugins

- Use **hooks** when you want to compose behaviors (pipelines).
- Use **plugin overrides** (`@plugin`) when you want to override plugin-specific behavior (non-piped, per-plugin).
