import { resolve } from "node:path";

import { pgGenerate } from "drizzle-dbml-generator";

import * as schema from "~workers/db_service/db/schema";

const out = resolve(__dirname, "./schema.dbml");
const relational = true;

pgGenerate({ schema, out, relational });
