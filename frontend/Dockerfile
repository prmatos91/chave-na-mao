# Etapa 1: build da aplicacao Angular
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# Etapa 2: servir os arquivos estaticos com Nginx
FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/docker-entrypoint.sh /docker-entrypoint.d/30-inject-env.sh
RUN chmod +x /docker-entrypoint.d/30-inject-env.sh

COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=6 \
  CMD wget -qO- http://127.0.0.1:80/ >/dev/null 2>&1 || exit 1
