# ---------------------------------------------------------------- build
FROM node:20-alpine AS build
WORKDIR /build

COPY package*.json ./
# npm ci y no npm install: instala exactamente lo del lock, asi la imagen es
# reproducible y no incorpora versiones nuevas en silencio.
RUN npm ci

COPY . .
RUN npm run build

# ------------------------------------------------------------- runtime
FROM nginx:1.27-alpine

# Angular 17+ emite a dist/<proyecto>/browser
COPY --from=build /build/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80