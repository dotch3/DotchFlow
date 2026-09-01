# DotchFlow frontend — React/Vite SPA, built and served via Nginx
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Baked in at build time - Vite replaces import.meta.env.VITE_API_URL with
# this literal value in the compiled bundle. Must be the backend's URL as
# reachable from the BROWSER (not the Docker network), e.g.
# http://localhost:3001/api when running via docker-compose locally.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
