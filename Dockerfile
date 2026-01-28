FROM node:24-alpine AS base
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

FROM base AS deps

ENV CI=true
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN node -e "let pkg=require('./package.json'); delete pkg.scripts.postinstall; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2))"
RUN YARN_ENABLE_SCRIPTS=0 yarn workspaces focus --production


FROM deps AS builder

WORKDIR /app
COPY . .
RUN yarn install --immutable
RUN yarn prisma generate
RUN yarn run build

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