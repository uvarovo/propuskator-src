# Reconstructed from propuskator/cameras-media-collector:release (node 14.17.3).
# Upstream deps lived on WebbyLab's now-defunct private GitLab, so node_modules
# is vendored from the mirrored release image rather than resolved via npm.
FROM uvarovo/propuskator-cameras-media-collector:release AS vendor

FROM node:14.17.3-alpine
WORKDIR /app
RUN apk add --no-cache ffmpeg bash
COPY --from=vendor /app/node_modules ./node_modules
COPY . .

CMD ["/bin/sh","-c","./start.sh"]
