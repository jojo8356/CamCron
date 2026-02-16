FROM node:20-alpine AS builder

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma/ ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

COPY src/ ./src/

RUN pnpm run build

FROM node:20-alpine

RUN apk add --no-cache ffmpeg
RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

RUN mkdir -p /data/camcron

EXPOSE 3000

CMD ["node", "dist/main.js"]
