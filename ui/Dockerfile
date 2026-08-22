FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .

RUN npm run build

# Endgueltiges Image auf Basis von Apache
FROM httpd:2.4-alpine

COPY --from=build /app/dist/ /usr/local/apache2/htdocs/
