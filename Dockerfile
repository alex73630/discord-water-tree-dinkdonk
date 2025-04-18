FROM node:22-alpine AS base

FROM base AS deps

ENV CI=true
WORKDIR /app
COPY package*.json ./
RUN npm ci --ommit=dev --ignore-scripts


FROM deps AS builder

WORKDIR /app
COPY . .
RUN npm ci
RUN npx prisma generate
RUN npm run build

FROM base AS runner

WORKDIR /app
RUN chown -R node:node /app && \
	chmod -R 770 /app
ENV NODE_ENV=production
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/prisma/client ./prisma/client
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/package.json ./
USER node
CMD ["node", "dist/main"]