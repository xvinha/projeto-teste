FROM oven/bun:1

WORKDIR /app

COPY back-end/package.json back-end/bun.lock ./
RUN bun install --frozen-lockfile

COPY back-end/ ./

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "start"]
