import { RedisMemoryServer } from "redis-memory-server";

async function startRedis() {
  const server = new RedisMemoryServer({
    instance: {
      port: 6379,
    },
  });

  const host = await server.getHost();
  const port = await server.getPort();
  console.log(`Redis memory server running at redis://${host}:${port}`);

  process.on("SIGINT", async () => {
    await server.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.stop();
    process.exit(0);
  });
}

startRedis();
