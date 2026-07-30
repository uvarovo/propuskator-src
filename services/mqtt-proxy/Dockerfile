# Reconstructed from propuskator/mqtt-proxy:release (node 12.5).
# Upstream deps lived on WebbyLab's now-defunct private GitLab, so node_modules
# is vendored from the mirrored release image rather than resolved via npm.
FROM uvarovo/propuskator-mqtt-proxy:release AS vendor

FROM node:12.5-alpine
WORKDIR /app
RUN apk add --no-cache bash netcat-openbsd
COPY --from=vendor /app/node_modules ./node_modules
COPY . .
ENV MODE=application
CMD ["/bin/sh","-c","./bin/wait.sh && npm start"]
