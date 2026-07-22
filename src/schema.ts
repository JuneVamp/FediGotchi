import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    id: text("id").primaryKey(),

    username: text("username").notNull().unique(),

    passwordHash: text("password_hash").notNull(),

    createdAt: integer("created_at", {
        mode: "timestamp"
    }).notNull(),
});