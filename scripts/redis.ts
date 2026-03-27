import "dotenv-flow/config";
import { env } from "../env";
import { RedisMemoryServer } from "redis-memory-server";

const port = Number(new URL(env.REDIS_URL).port) || 6379;

async function main() {
	const redis = new RedisMemoryServer({
		instance: { port },
	});

	await redis.start();

	const host = await redis.getHost();
	const actualPort = await redis.getPort();

	console.log("");
	console.log("■ Redis (in-memory)");
	console.log(`  - Port: ${actualPort}`);
	console.log(`  - URL:  redis://${host}:${actualPort}`);
	console.log("");
	console.log("✓ Ready");
	console.log("");

	process.on("SIGINT", async () => {
		await redis.stop();
		process.exit(0);
	});
}

main().catch((err) => {
	console.error("✗ Failed to start Redis:", err.message || err);
	process.exit(1);
});
