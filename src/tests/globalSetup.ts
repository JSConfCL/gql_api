import { existsSync, mkdirSync, unlinkSync, readdirSync } from "node:fs";

import { testDatabasesFolder } from "./fixtures/databaseHelper";

export default () => {
  if (!existsSync(`./${testDatabasesFolder}`)) {
    mkdirSync(`./${testDatabasesFolder}`);
  }

  const files = readdirSync(`./${testDatabasesFolder}`);
  for (const file of files) {
    unlinkSync(`./${testDatabasesFolder}/${file}`);
  }
};
