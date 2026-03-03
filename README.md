# Atio ThingWorx Agent — Desktop MVP Skeleton

This repository provides:
1. A complete architecture document at `docs/architecture.md`.
2. A working Electron desktop skeleton with secure storage, WorkOS SSO hooks, workspace/RAG foundations, model routing, metering ledger, telemetry buffering, and updater stubs.

## Repository structure

- `apps/desktop` — Electron desktop app and local services
- `docs/architecture.md` — implementation-grade architecture document
- `.github/workflows/ci.yml` — baseline CI

## Prerequisites

- Node.js 20+
- npm 10+
- OS keyring dependencies for `keytar`:
  - macOS: Xcode CLT + Keychain available
  - Windows: Credential Manager / DPAPI available
  - Linux: libsecret + gnome-keyring (or equivalent)

## Setup

```bash
cp .env.example .env
npm install
```

## Run (dev)

```bash
npm run dev
```

## Build check

```bash
npm run build
```

> The MVP uses a build validation script; production packaging and signing pipeline is documented in `docs/architecture.md`.

## Test

```bash
npm run test
```

## Lint

```bash
npm run lint
```

## Platform notes

### Windows
- `npm install` builds native modules for the current ABI.
- Run in PowerShell or CMD.

### macOS
- Ensure Keychain access is available to app process.

### Linux
- Ensure `libsecret` development packages are installed for `keytar` build/runtime.

## Security defaults

- Secrets stored via OS key vault (`keytar`) and never in plaintext files.
- Telemetry is opt-in by default and prompt/response payloads are scrubbed.
- Local vector index artifacts are encrypted at rest.
- Metering ledger uses hash chain and HMAC signature for tamper detection.

