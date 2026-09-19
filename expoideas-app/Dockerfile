# syntax=docker/dockerfile:1
# App de Expoideas: se compila con Node y se sirve con Nginx sin privilegios.
# Nginx también reenvía /expoideas/api/ a la API, así que la app y la API
# comparten origen y no hace falta CORS.

FROM node:24-slim AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# La ruta base está fija en nginx.conf; la API se llama por la misma ruta.
ENV VITE_BASE_PATH=/expoideas/ \
    VITE_API_URL=/expoideas/api/v1
RUN npm run build


FROM nginxinc/nginx-unprivileged:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html/expoideas

EXPOSE 8080
