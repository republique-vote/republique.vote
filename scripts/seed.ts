import Database from "better-sqlite3";

const db = new Database("app.db");

db.exec(`DELETE FROM vote_record`);
db.exec(`DELETE FROM blind_signature_request`);
db.exec(`DELETE FROM poll_key_pair`);
db.exec(`DELETE FROM option`);
db.exec(`DELETE FROM poll`);

const insertPoll = db.prepare(
  `INSERT INTO poll (id, title, description, type, status, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);

const insertOption = db.prepare(
  `INSERT INTO option (id, poll_id, label, position) VALUES (?, ?, ?, ?)`,
);

const now = new Date().toISOString();

const endDate7 = new Date();
endDate7.setDate(endDate7.getDate() + 7);
endDate7.setHours(20, 0, 0, 0);
const in7days = endDate7.toISOString();

const endDate30 = new Date();
endDate30.setDate(endDate30.getDate() + 30);
endDate30.setHours(20, 0, 0, 0);
const in30days = endDate30.toISOString();

insertPoll.run(
  "poll-1",
  "Faut-il rendre le vote en ligne obligatoire ?",
  "Ce référendum citoyen vise à déterminer si le vote en ligne devrait devenir un droit fondamental pour tous les citoyens français, en complément du vote physique en bureau de vote.",
  "referendum",
  "open",
  now,
  in7days,
  now,
);
insertOption.run("poll-1-opt-1", "poll-1", "Pour", 1);
insertOption.run("poll-1-opt-2", "poll-1", "Contre", 2);
insertOption.run("poll-1-opt-3", "poll-1", "Abstention", 3);

insertPoll.run(
  "poll-2",
  "Projet de loi sur la transparence des algorithmes",
  "Ce projet de loi propose d'obliger les administrations publiques à publier le code source des algorithmes utilisés pour les décisions administratives affectant les citoyens.",
  "law",
  "open",
  now,
  in30days,
  now,
);
insertOption.run("poll-2-opt-1", "poll-2", "Pour", 1);
insertOption.run("poll-2-opt-2", "poll-2", "Contre", 2);
insertOption.run("poll-2-opt-3", "poll-2", "Abstention", 3);

insertPoll.run(
  "poll-3",
  "Élection du représentant citoyen numérique",
  "Élisez le représentant qui portera la voix des citoyens sur les questions de numérique et de démocratie en ligne auprès des institutions.",
  "election",
  "closed",
  "2026-01-01T00:00:00.000Z",
  "2026-03-01T00:00:00.000Z",
  "2026-01-01T00:00:00.000Z",
);
insertOption.run("poll-3-opt-1", "poll-3", "Marie Dupont", 1);
insertOption.run("poll-3-opt-2", "poll-3", "Jean Martin", 2);
insertOption.run("poll-3-opt-3", "poll-3", "Alice Bernard", 3);

console.log("Seed complete: 3 polls created");

db.close();
