import "dotenv-flow/config";
import { env } from "../env";
import EmbeddedPostgres from "embedded-postgres";
import postgres from "postgres";
import { existsSync } from "fs";
import { execSync } from "child_process";

const url = new URL(env.DATABASE_URL);
const port = Number(url.port) || 5432;
const user = url.username || "postgres";
const password = url.password || "postgres";
const dbName = url.pathname.slice(1) || "vote";

async function main() {
	const dataDir = "./tmp/pg-data";
	const alreadyInitialised = existsSync(dataDir);

	const pg = new EmbeddedPostgres({
		databaseDir: dataDir,
		user,
		password,
		port,
		persistent: true,
	});

	if (!alreadyInitialised) {
		await pg.initialise();
	}

	await pg.start();

	const sql = postgres(`postgresql://${user}:${password}@localhost:${port}/postgres`);
	const result = await sql`SELECT 1 FROM pg_database WHERE datname = ${dbName}`;
	if (result.length === 0) {
		await pg.createDatabase(dbName);
	}
	await sql.end();

	// Push schema + seed
	console.log("◇ Pushing schema...");
	execSync("pnpm db:push", { stdio: "ignore" });
	console.log("◇ Seeding...");
	execSync("pnpm seed", { stdio: "ignore" });

	console.log("");
	console.log(`■ PostgreSQL ${alreadyInitialised ? "(restored)" : "(initialized)"}`);
	console.log(`  - Port:     ${port}`);
	console.log(`  - Database: ${dbName}`);
	console.log(`  - URL:      ${env.DATABASE_URL}`);
	console.log("");
	console.log("✓ Ready");
	console.log("");

	process.on("SIGINT", async () => {
		await pg.stop();
		process.exit(0);
	});
}

main().catch((err) => {
	console.error("✗ Failed to start Postgres:", err.message || err);
	process.exit(1);
});
