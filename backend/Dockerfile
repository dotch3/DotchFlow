# DotchFlow backend — Node/Express API
FROM node:20-alpine

WORKDIR /app

# Install deps first (better layer caching on rebuilds)
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production

# Actual listening port is controlled by the PORT env var at runtime
# (see docker-compose.yml / .env) - this is just documentation for
# tools that read EXPOSE.
EXPOSE 3001

CMD ["npm", "start"]
