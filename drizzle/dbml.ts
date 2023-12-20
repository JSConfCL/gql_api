import * as schema from "../src/datasources/db/schema";
import { resolve } from "node:path";
import { sqliteGenerate } from "drizzle-dbml-generator"; // using sqlite generator

const out = resolve(__dirname, "./schema.dbml");
const relational = true;

sqliteGenerate({ schema, out, relational });
