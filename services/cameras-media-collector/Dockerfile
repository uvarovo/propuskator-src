# Reconstructed from propuskator/cameras-media-collector:release (node 14.17.3 / alpine 3.11)
FROM node:14.17.3-alpine

WORKDIR /app
RUN apk add --no-cache ffmpeg bash python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

CMD ["./start.sh"]
