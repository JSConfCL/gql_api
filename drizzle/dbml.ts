import * as schema from "../src/datasources/db/schema";
import { resolve } from "node:path";
import { pgGenerate } from "drizzle-dbml-generator";

const out = resolve(__dirname, "./schema.dbml");
const relational = true;

pgGenerate({ schema, out, relational });
