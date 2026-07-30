# Reconstructed from propuskator/backend:release (node 14.16.1 / alpine 3.11)
FROM node:14.16.1-alpine

WORKDIR /app

# build deps for any native modules + tools used by bin scripts
RUN apk add --no-cache python3 make g++ bash netcat-openbsd tzdata

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV MODE=application
CMD ["/bin/sh","-c","./bin/wait.sh && npm run migration:dev && npm start"]
