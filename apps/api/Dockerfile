FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
FROM base AS build
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY tests/package.json tests/package.json
COPY apps/api/prisma apps/api/prisma
RUN npm ci --workspace apps/api --include-workspace-root
COPY apps/api apps/api
RUN npm run build -w apps/api && npm prune --omit=dev --workspace apps/api --include-workspace-root
FROM base AS runner
ENV NODE_ENV=production PORT=3001
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --chown=node:node apps/api/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
USER node
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s CMD node -e "fetch('http://127.0.0.1:3001/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "apps/api/dist/main.js"]
