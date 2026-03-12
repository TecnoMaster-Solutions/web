# syntax=docker/dockerfile:1.7

FROM node:22.22.1-alpine3.23 AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk upgrade --no-cache && apk add --no-cache gcompat
RUN npm install -g npm@11.7.0
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22.22.1-alpine3.23 AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG CI=true
ENV CI=$CI
RUN apk upgrade --no-cache && apk add --no-cache gcompat
RUN npm install -g npm@11.7.0
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22.22.1-alpine3.23 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
RUN apk upgrade --no-cache && apk add --no-cache gcompat
RUN npm install -g npm@11.7.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev && npm cache clean --force
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000"]
