import { bigint, integer, pgTable, text, unique } from "drizzle-orm/pg-core";

export const poll = pgTable("poll", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["law", "referendum", "election"] }).notNull(),
  status: text("status", { enum: ["draft", "open", "closed", "tallied"] })
    .notNull()
    .default("draft"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  sourceUrl: text("source_url"),
  sourceRef: text("source_ref"),
  merkleRoot: text("merkle_root"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const option = pgTable("option", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pollId: text("poll_id")
    .notNull()
    .references(() => poll.id),
  label: text("label").notNull(),
  position: integer("position").notNull(),
});

export const pollKeyPair = pgTable("poll_key_pair", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pollId: text("poll_id")
    .notNull()
    .references(() => poll.id)
    .unique(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const blindSignatureRequest = pgTable(
  "blind_signature_request",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pollId: text("poll_id")
      .notNull()
      .references(() => poll.id),
    userId: text("user_id").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [unique().on(table.pollId, table.userId)]
);

export const voteRecord = pgTable(
  "vote_record",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    pollId: text("poll_id")
      .notNull()
      .references(() => poll.id),
    optionId: text("option_id")
      .notNull()
      .references(() => option.id),
    blindToken: text("blind_token").notNull(),
    blindSignature: text("blind_signature").notNull(),
    sequence: integer("sequence").notNull(),
    hash: text("hash").notNull(),
    previousHash: text("previous_hash"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [unique().on(table.pollId, table.blindToken)]
);

export const rekorEntry = pgTable("rekor_entry", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pollId: text("poll_id")
    .notNull()
    .references(() => poll.id),
  sequence: integer("sequence").notNull(),
  merkleRoot: text("merkle_root").notNull(),
  logIndex: bigint("log_index", { mode: "number" }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
