# Зеркало Пропускатора в Gitea (drop.uvarovo.net)

Git (SSH :32103, HTTPS/веб :32102):
- ssh://git@drop.uvarovo.net:32103/uvarovo/propuskator.git
- ssh://git@drop.uvarovo.net:32103/uvarovo/propuskator-src.git      — сервер (backend/ui/compose)
- ssh://git@drop.uvarovo.net:32103/uvarovo/propuskator-firmware.git — прошивки читалок (+ `release/` с образами)

GitHub (github.com/uvarovo/*) — основной, Gitea — зеркало; пушить в оба.

Docker-образы прода (снимок 2026-09-04), реестр drop.uvarovo.net:32102/uvarovo/, теги `release` и `prod-2026-09-04`:
propuskator-backend, propuskator-ui, propuskator-nginx-service, propuskator-mqtt-proxy,
propuskator-percona-service, propuskator-heartbeat, propuskator-updater, propuskator-updater-manager,
propuskator-backups, propuskator-minio-service, propuskator-minio-client-service,
propuskator-streamming-service, propuskator-ssl-certs-service, propuskator-cameras-media-collector,
propuskator-telegram-bot-integration, propuskator-google-home-integration,
propuskator-phone-trigger-handler-integration, propuskator-modbus-bridge,
propuskator-2smart-standalone-emqx-service.

Пример: `docker pull drop.uvarovo.net:32102/uvarovo/propuskator-backend:prod-2026-09-04`
