import { resolve } from "node:path";

import { sqliteGenerate } from "drizzle-dbml-generator";

import * as schema from "~/datasources/db/schema";

const out = resolve(__dirname, "./schema.dbml");
const relational = true;

sqliteGenerate({ schema, out, relational });
