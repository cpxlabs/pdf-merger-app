# PDF Merger App

A lightweight desktop app for merging PDF files with a React UI and native desktop dialogs.

## Features

- Browse and select PDF files
- Load a full folder of PDFs
- Reorder files before merging
- Choose output folder and file name
- Merge locally on your machine
- Basic tests with Vitest

## Tech Stack

- React
- Vite
- Electron
- pdf-lib
- Vitest
- Testing Library

## Requirements

- Node.js 24+
- pnpm 10+

## Install

```bash
pnpm install
```

## Run in development

```bash
pnpm dev
```

## Run tests

```bash
pnpm test
```

## Build

```bash
pnpm build
```

## Project structure

- [src](src) — React UI
- [electron](electron) — Electron main and preload processes
- [src/App.test.jsx](src/App.test.jsx) — basic UI tests

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Notes

The project already includes [pnpm-workspace.yaml](pnpm-workspace.yaml) to allow the required dependency build scripts for Electron and esbuild.
