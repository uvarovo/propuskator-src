# Reconstructed from propuskator/streamming-service:release (node 12.5 / alpine 3.9)
FROM node:12.5-alpine

WORKDIR /app
RUN apk add --no-cache ffmpeg bash python3 make g++ netcat-openbsd

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV MODE=application
CMD ["/bin/sh","-c","./bin/wait.sh && npm start"]
