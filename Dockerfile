FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock* ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile
RUN bunx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN bun run build

FROM oven/bun:1 AS run
WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock* ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile --production
RUN bunx prisma generate

COPY --from=build /app/dist ./dist
CMD ["bun", "dist/server.js"]