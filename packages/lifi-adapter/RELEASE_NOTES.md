# Release notes — v0.0.2

Date: 2025-10-27

Summary
- Small patch release containing documentation and developer tooling improvements plus minor fixes to HTTP utilities and tests.

Changes
- Added `tsx` to `devDependencies` and switched `demo:live` script to use the local `tsx` binary (convenience for local dev).
- Clarified and consolidated demo documentation in `DEMO.md`.
- Migrated important adapter documentation into the repository root README (removed package-local README to avoid duplication).
- Small fixes to `HttpUtils` retry/timeout behavior and deterministic test harness; updated tests — all tests passing locally.



