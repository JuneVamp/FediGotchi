// import { betterAuth } from "better-auth";
// import type { BetterAuthOptions } from "better-auth";
// import Database from "better-sqlite3";

// const authOptions = {
//     database: new Database("./sqlite.db"),
//     emailAndPassword: {
//         enabled : true,
//     }
// } satisfies BetterAuthOptions;

// export const auth = betterAuth(authOptions) as ReturnType<typeof betterAuth>;

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "./db.js";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
    }),

    emailAndPassword: {
        enabled: true,
    },
});