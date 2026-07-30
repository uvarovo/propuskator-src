# Reconstructed from propuskator/updater:release (node 12.5 / debian 9).
# node_modules vendored from the mirrored release image (dead upstream deps).
FROM uvarovo/propuskator-updater:release AS vendor

FROM node:12.5
WORKDIR /app
COPY --from=vendor /app/node_modules ./node_modules
COPY . .
CMD ["/bin/sh","-c","npm start"]
