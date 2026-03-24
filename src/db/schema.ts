import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const scrutin = sqliteTable("scrutin", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["loi", "referendum", "election"] }).notNull(),
  status: text("status", { enum: ["draft", "open", "closed", "tallied"] }).notNull().default("draft"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  sourceUrl: text("source_url"),
  sourceRef: text("source_ref"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const option = sqliteTable("option", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  scrutinId: text("scrutin_id").notNull().references(() => scrutin.id),
  label: text("label").notNull(),
  position: integer("position").notNull(),
});

export const voteRecord = sqliteTable("vote_record", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  scrutinId: text("scrutin_id").notNull().references(() => scrutin.id),
  voterHash: text("voter_hash").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
