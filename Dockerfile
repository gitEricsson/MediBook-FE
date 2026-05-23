# ─── Build Stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

ARG VITE_API_URL
ARG VITE_ENV=production
ARG VITE_APP_NAME=MediBook
ARG BUILD_VERSION=dev
ARG BUILD_SHA=unknown

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

# lightningcss (used by Vite v8 / rolldown for CSS minification) ships native
# binaries per-platform as optional deps. When the lockfile is generated on
# Windows/macOS, npm filters out the Alpine (musl) binary as non-matching, so
# `npm ci` on this Alpine builder leaves it missing. Install it explicitly so
# the build doesn't blow up with "Cannot find module ../lightningcss.linux-x64-musl.node".
RUN LIGHTNINGCSS_VERSION=$(node -p "require('./node_modules/lightningcss/package.json').version") && \
    npm install --no-save --ignore-scripts "lightningcss-linux-x64-musl@${LIGHTNINGCSS_VERSION}"

COPY . .

ENV VITE_API_URL=${VITE_API_URL} \
    VITE_ENV=${VITE_ENV} \
    VITE_APP_NAME=${VITE_APP_NAME}

RUN npm run build

# ─── Runtime Stage ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

ARG BUILD_VERSION=dev
ARG BUILD_SHA=unknown
ARG BUILD_DATE

LABEL org.opencontainers.image.title="MediBook Frontend" \
      org.opencontainers.image.description="Healthcare Appointment and Consultation Platform — React SPA" \
      org.opencontainers.image.version="${BUILD_VERSION}" \
      org.opencontainers.image.revision="${BUILD_SHA}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.source="https://github.com/gitEricsson/MediBook-FE"

# Run nginx as non-root
RUN sed -i 's|listen       80;|listen       8080;|g' /etc/nginx/conf.d/default.conf 2>/dev/null || true && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid

COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx --from=builder /app/dist /usr/share/nginx/html

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1
