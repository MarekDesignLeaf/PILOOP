import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const toys = sqliteTable('piloop_toys', {
 id: text('id').primaryKey(), name: text('name').notNull().default(''),
 awakenedAt: text('awakened_at'), genesisId: text('genesis_id'),
});
export const memories = sqliteTable('piloop_memories', {
 id: text('id').primaryKey(), toyId: text('toy_id').notNull().references(() => toys.id),
 text: text('text').notNull(), createdAt: text('created_at').notNull(),
});
