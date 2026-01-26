# Result Pattern

RAG2F uses a typed Result pattern for common, expected outcomes. Instead of
raising exceptions for cases like empty input or missing repositories, methods
return a structured Result object with status and details. Exceptions are
reserved for system errors (backend crashes, timeouts, invariant violations).

## Core types

- `BaseResult`: shared fields (`status`, `detail`) and helpers (`is_ok()`, `is_error()`).
- `StatusDetail`: structured status info (`code`, `message`, `context`).
- `StatusCode`: centralized status code constants.

## Module-specific results

### Johnny5 (input)

- `execute_handle_text_foreground(text) -> InsertResult`
- Expected states return `InsertResult` with `status="error"` and `detail`:
  - `StatusCode.EMPTY`: empty input
  - `StatusCode.DUPLICATE`: duplicate input
  - `StatusCode.NOT_HANDLED`: no hook handled the input

```python
result = rag2f.johnny5.execute_handle_text_foreground(text)
if result.is_ok():
    use_track_id(result.track_id)
else:
    logger.info("Input rejected: %s", result.detail.code)
```

### IndianaJones (retrieve/search)

- `execute_retrieve(query, k=10) -> RetrieveResult`
- `execute_search(query, k=10, return_mode=...) -> SearchResult`
- Expected states return `status="error"` with `detail`:
  - `StatusCode.EMPTY`: empty query

```python
result = rag2f.indiana_jones.execute_search("docs", k=5)
if result.is_ok():
    print(result.response)
else:
    handle_empty_query()
```

### XFiles (repositories)

- `execute_register(id, repo, meta=None) -> RegisterResult`
- `execute_get(id) -> GetResult`
- `execute_search(...) -> SearchRepoResult`
- `CacheResult` is used for explicit cache lookups.

```python
reg = rag2f.xfiles.execute_register("primary", repo, meta={"type": "vector"})
if reg.is_ok() and reg.created:
    logger.info("Repository registered: %s", reg.id)
elif reg.is_error():
    raise ValueError(reg.detail.message)

get_result = rag2f.xfiles.execute_get("primary")
if get_result.is_ok() and get_result.repository:
    repo = get_result.repository
else:
    handle_missing_repo(get_result.detail)
```

## Status codes (high-level)

- Common: `EMPTY`, `INVALID`, `NOT_FOUND`, `PARTIAL`
- Johnny5: `DUPLICATE`, `DUPLICATE_MERGED`, `NOT_HANDLED`
- IndianaJones: `NO_RESULTS`, `DEGRADED`
- XFiles: `CACHE_MISS`, `ALREADY_EXISTS`, `INVALID_SPEC`, `PARTIAL_RESULTS`

Use `StatusCode` constants instead of string literals to keep checks consistent.
