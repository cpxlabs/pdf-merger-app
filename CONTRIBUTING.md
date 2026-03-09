# Contributing

Thanks for contributing to PDF Merger App.

## Local setup

1. Clone the repository.
2. Install dependencies:

```bash
pnpm install
```

3. Start the app:

```bash
pnpm dev
```

## Before opening a pull request

Run the basic checks:

```bash
pnpm test
pnpm build
```

## Development guidelines

- Keep changes small and focused.
- Prefer simple UI behavior and clear error states.
- Add or update tests when UI behavior changes.
- Do not commit generated folders like `node_modules` or `dist`.

## Suggested workflow

1. Create a branch from `main`.
2. Implement the change.
3. Run tests and build.
4. Open a pull request with a clear summary.

## Areas to improve

Good first contributions:

- better error handling
- drag-and-drop ordering
- split or extract PDF pages
- packaging and release automation
