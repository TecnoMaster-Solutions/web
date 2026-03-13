FROM node:22-alpine AS builder
WORKDIR /app

RUN apk upgrade --no-cache && apk add --no-cache gcompat

ENV NEXT_TELEMETRY_DISABLED=1
ARG CI=true
ENV CI=$CI

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

RUN apk upgrade --no-cache && apk add --no-cache gcompat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000"]
