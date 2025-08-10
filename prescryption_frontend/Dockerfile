# --- stage de build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --no-audit --no-fund
COPY . .
# Si usás Vite:
# RUN npm run build
# Si usás CRA:
RUN npm run build

# --- stage de run ---
FROM nginx:1.27-alpine
# React Router fallback:
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/build /usr/share/nginx/html
# Opcional: nginx.conf con fallback a /index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
