# propuskator-src

Reconstructed source monorepo for the **Propuskator** access-control system.

> **Why this repo exists.** Upstream Propuskator has been unmaintained since
> late 2023 and no public source repositories remain. Only runtime Docker
> images survive (mirrored under `uvarovo/propuskator-*`). This repo recovers
> the **actual application source** out of those images so the project can be
> maintained and extended again.
>
> The companion repo [`uvarovo/propuskator`](https://github.com/uvarovo/propuskator)
> is the *deployment kit* (docker-compose + image mirrors). This repo is the
> *development kit* (buildable source).

## What is recovered

All Node.js services ship as plain, un-minified source in their images, so they
are recovered faithfully (source + `package.json` + `babel.config.js` +
migrations/seeds):

| Service | Node | Base | Path |
|---|---|---|---|
| backend | 14.16.1 | alpine 3.11 | `services/backend` |
| mqtt-proxy | 12.5.0 | alpine 3.9 | `services/mqtt-proxy` |
| heartbeat | 14.17.5 | alpine 3.11 | `services/heartbeat` |
| updater | 12.5.0 | debian 9 | `services/updater` |
| streamming-service | 12.5.0 | alpine 3.9 + ffmpeg | `services/streamming-service` |
| cameras-media-collector | 14.17.3 | alpine 3.11 + ffmpeg | `services/cameras-media-collector` |

`Dockerfile`s are **reconstructed** from the image metadata (base image, node
version, entrypoint/cmd, extra apt/apk packages). They are not the original
vendor Dockerfiles (those were not shipped in the images), but reproduce a
functionally equivalent build.

### Not source-recoverable

- **ui** — shipped as a minified/bundled React SPA (no source maps). Only the
  built assets exist. Planned to be **rewritten from scratch** (React + Node
  BFF) against the recovered backend API rather than un-minified.
- Infrastructure images (`nginx`, `percona`/`mysql`, `minio`, `ssl-certs`,
  `updater-manager`, `backups`) are stock/config images and live in the
  deployment kit.

## Security note

Production TLS private keys and certificates were found mounted into the
backend image under `etc/ssl/` (a runtime volume, not source). They are
**excluded** from this repo (see `.gitignore`) and must never be committed.

## Building

```bash
docker compose -f docker-compose.build.yml build
```

Each service can also be built individually:

```bash
docker build -t ghcr.io/uvarovo/propuskator-backend:dev services/backend
```
