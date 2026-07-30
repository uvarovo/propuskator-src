# Reconstructed from propuskator/backend:release (node 14.16.1).
# Upstream deps lived on WebbyLab's now-defunct private GitLab, so node_modules
# is vendored from the mirrored release image rather than resolved via npm.
FROM uvarovo/propuskator-backend:release AS vendor

FROM node:14.16.1-alpine
WORKDIR /app
RUN apk add --no-cache bash netcat-openbsd tzdata
COPY --from=vendor /app/node_modules ./node_modules
COPY . .
ENV MODE=application
CMD ["/bin/sh","-c","./bin/wait.sh && npm run migration:dev && npm start"]
