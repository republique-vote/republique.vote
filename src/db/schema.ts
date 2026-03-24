import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";

export const poll = sqliteTable("poll", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["law", "referendum", "election"] }).notNull(),
  status: text("status", { enum: ["draft", "open", "closed", "tallied"] }).notNull().default("draft"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  sourceUrl: text("source_url"),
  sourceRef: text("source_ref"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const option = sqliteTable("option", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pollId: text("poll_id").notNull().references(() => poll.id),
  label: text("label").notNull(),
  position: integer("position").notNull(),
});

export const pollKeyPair = sqliteTable("poll_key_pair", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pollId: text("poll_id").notNull().references(() => poll.id).unique(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const blindSignatureRequest = sqliteTable("blind_signature_request", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pollId: text("poll_id").notNull().references(() => poll.id),
  userId: text("user_id").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  unique().on(table.pollId, table.userId),
]);

export const voteRecord = sqliteTable("vote_record", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pollId: text("poll_id").notNull().references(() => poll.id),
  optionId: text("option_id").notNull().references(() => option.id),
  blindToken: text("blind_token").notNull(),
  blindSignature: text("blind_signature").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  unique().on(table.pollId, table.blindToken),
]);
