# Reconstructed from propuskator/updater:release (node 12.5 / debian 9)
FROM node:12.5

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

CMD ["npm","start"]
