# Reconstructed from propuskator/mqtt-proxy:release (node 12.5 / alpine 3.9)
FROM node:12.5-alpine

WORKDIR /app
RUN apk add --no-cache python3 make g++ bash netcat-openbsd

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV MODE=application
CMD ["/bin/sh","-c","./bin/wait.sh && npm start"]
