# Contributing

This page focuses on contributing to the rag2f codebase (core + plugins) in the `rag2f-main` repo. Docs live in this repo under `mkdocs/`.

## Repo layout at a glance

- `src/`: src-layout package (importable code lives here)
- `tests/`: pytest suite
- `scripts/`: release helper scripts
- `pyproject.toml`: build, Ruff, and pytest config

## Local development workflow

Minimal setup (venv or Dev Container):

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
```

Run tests:

```bash
pytest
```

Enable pre-commit hooks (optional, but recommended):

```bash
pre-commit install
pre-commit run --all-files
```

## Techy: Python rules (Ruff)

rag2f uses Ruff for linting, import sorting, and formatting. Key settings in `rag2f-main/pyproject.toml`:

- Target version: `py312`
- Line length: `99`
- Lint rules: `E`, `F`, `I`, `UP`, `B`, `SIM`, `S`
- `E501` (line length) is ignored; formatter handles wrapping

Local commands:

```bash
ruff check src tests
ruff check --fix src tests
ruff format src tests
ruff format --check src tests
```

## Packaging guardrails

The repo enforces a src-layout build and versioning via `setuptools-scm`. Expect checks for:

- `dynamic = ["version"]` in `pyproject.toml`
- `setuptools-scm` in `build-system.requires`
- `local_scheme = "no-local-version"`
- `src/rag2f/_version.py` generation
- `__init__.py` in all Python package directories

These are validated in CI and by local scripts.

## CI/CD overview (from the current workflows)

The rag2f repo uses GitHub Actions workflows stored in `.github/workflows/`:

### `ruff.yml`

- Trigger: pushes to `main`, pull requests
- Jobs: lint + format check (`ruff check`, `ruff format --check`)

### `ci-dev-testpypi.yml`

- Trigger: pushes and PRs to `main`
- Jobs:
  - Ruff lint/format
  - `pip-audit` for dependency vulnerabilities
  - pytest (full test run)
  - repo validation (src layout, `__init__.py`, `pyproject.toml` checks)
  - build and publish to **TestPyPI** on `main` pushes
  - smoke test that installs the TestPyPI artifact and verifies `__version__`

Build versioning uses `NEXT_VERSION` + `SETUPTOOLS_SCM_PRETEND_VERSION_FOR_RAG2F`.

### `release-tags.yml`

- Trigger: tags matching `v*`
- Checks tag commit is on `main`
- Builds wheel + sdist, creates checksums
- Publishes to **PyPI**
- Creates a GitHub Release and runs a PyPI install smoke test

## Local release helpers

The `scripts/` folder mirrors parts of CI for local checks:

- `scripts/test_release_setup.sh`: quick validation of versioning + build artifacts
- `scripts/build-local.sh`: full local build and install test

These are useful before pushing or tagging a release.
