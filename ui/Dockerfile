FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .

RUN npm run build

# nginx statt Apache: das Apache-Standardimage liefert weder Kompression noch
# Cache-Header, und nginx laeuft in diesem Stack sowieso schon.
FROM nginx:1.30-alpine

COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY ui-nginx.conf /etc/nginx/conf.d/default.conf
