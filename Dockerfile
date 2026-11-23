# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
RUN npm install -g pnpm@11.28.10
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN pnpm install --frozen-lockfile
COPY api api
COPY web web
RUN pnpm -r build
RUN pnpm --filter @pulse/api deploy --prod /out

FROM node:22-alpine
ARG APP_COMMIT=dev
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data APP_COMMIT=${APP_COMMIT} WEB_DIR=/app/web
WORKDIR /app
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/package.json ./package.json
COPY --from=build /app/api/dist ./dist
COPY --from=build /app/web/dist ./web
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "dist/server.js"]
