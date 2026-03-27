import "dotenv-flow/config";
import { env } from "../env";
import postgres from "postgres";

const sql = postgres(env.DATABASE_URL);

async function seed() {
  // Skip seed if polls already exist
  const existing = await sql`SELECT COUNT(*) as count FROM poll`;
  if (Number(existing[0].count) > 0) {
    console.log("Seed skipped: polls already exist");
    await sql.end();
    process.exit(0);
  }

  const now = new Date().toISOString();

  const endDate7 = new Date();
  endDate7.setDate(endDate7.getDate() + 7);
  endDate7.setHours(20, 0, 0, 0);
  const in7days = endDate7.toISOString();

  const endDate30 = new Date();
  endDate30.setDate(endDate30.getDate() + 30);
  endDate30.setHours(20, 0, 0, 0);
  const in30days = endDate30.toISOString();

  await sql`INSERT INTO poll (id, title, description, type, status, start_date, end_date, created_at) VALUES
    ('poll-1', 'Faut-il rendre le vote en ligne obligatoire ?', 'Ce référendum citoyen vise à déterminer si le vote en ligne devrait devenir un droit fondamental pour tous les citoyens français, en complément du vote physique en bureau de vote.', 'referendum', 'open', ${now}, ${in7days}, ${now}),
    ('poll-2', 'Projet de loi sur la transparence des algorithmes', 'Ce projet de loi propose d''obliger les administrations publiques à publier le code source des algorithmes utilisés pour les décisions administratives affectant les citoyens.', 'law', 'open', ${now}, ${in30days}, ${now}),
    ('poll-3', 'Élection du représentant citoyen numérique', 'Élisez le représentant qui portera la voix des citoyens sur les questions de numérique et de démocratie en ligne auprès des institutions.', 'election', 'closed', '2026-01-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`;

  await sql`INSERT INTO option (id, poll_id, label, position) VALUES
    ('poll-1-opt-1', 'poll-1', 'Pour', 1),
    ('poll-1-opt-2', 'poll-1', 'Contre', 2),
    ('poll-1-opt-3', 'poll-1', 'Abstention', 3),
    ('poll-2-opt-1', 'poll-2', 'Pour', 1),
    ('poll-2-opt-2', 'poll-2', 'Contre', 2),
    ('poll-2-opt-3', 'poll-2', 'Abstention', 3),
    ('poll-3-opt-1', 'poll-3', 'Marie Dupont', 1),
    ('poll-3-opt-2', 'poll-3', 'Jean Martin', 2),
    ('poll-3-opt-3', 'poll-3', 'Alice Bernard', 3)`;

  console.log("Seed complete: 3 polls created");
  await sql.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
