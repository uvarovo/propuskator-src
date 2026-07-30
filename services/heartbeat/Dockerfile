# Reconstructed from propuskator/heartbeat:release (node 14.17.5).
# Upstream deps lived on WebbyLab's now-defunct private GitLab, so node_modules
# is vendored from the mirrored release image rather than resolved via npm.
FROM uvarovo/propuskator-heartbeat:release AS vendor

FROM node:14.17.5-alpine
WORKDIR /app

COPY --from=vendor /app/node_modules ./node_modules
COPY . .

CMD ["/bin/sh","-c","npm start"]
