import { afterEach, beforeEach } from "vitest";
import * as uuid from "uuid";
import { clearDatabase, getTestDB } from "./__fixtures/databaseHelper";

const MY_NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";

beforeEach(async ({ expect }) => {
  const { currentTestName } = expect.getState();
  let databaseName: string | undefined;
  if (currentTestName) {
    databaseName = `test_${uuid.v5(currentTestName, MY_NAMESPACE)}`;
  }
  await getTestDB(databaseName);
  console.log("DB for test: ", currentTestName, " ->", databaseName);
});

afterEach(() => {
  clearDatabase();
});
