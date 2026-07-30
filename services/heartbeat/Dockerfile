# Reconstructed from propuskator/heartbeat:release (node 14.17.5 / alpine 3.11)
FROM node:14.17.5-alpine

WORKDIR /app
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

CMD ["npm","start"]
