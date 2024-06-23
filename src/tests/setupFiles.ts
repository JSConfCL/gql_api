/* eslint-disable no-console */
// Allowing console.log in this file as its a test setup file
import * as uuid from "uuid";
import { afterEach, beforeEach } from "vitest";

import { closeConnection, getTestDB } from "./fixtures/databaseHelper";

const MY_NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";

/**
// beforeAll is called once for each test file.
//
// TODO: Consider a recursive traversal of t.tasks (and
// t.tasks[].tasks[].tasks[]... etc) To find all the tests that will be run,
// and create all databases as a single step before all tests run.
//
// This not only allows us to parallelize the databases creation, but also can
// ensure we don't have multiple tests with the same name (which would mean
// they are using the same database...which is a nono).

beforeAll((t) => {});
*/

beforeEach(async ({ expect }) => {
  const { currentTestName } = expect.getState();
  let databaseName: string | undefined;
  if (currentTestName) {
    databaseName = `test_${uuid.v5(currentTestName, MY_NAMESPACE)}`;
  }
  await getTestDB(databaseName);
  console.log("DB for test: ", currentTestName, " ->", databaseName);
});

afterEach(async () => {
  await closeConnection();
});
