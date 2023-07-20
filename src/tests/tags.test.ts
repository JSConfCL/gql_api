import { it, describe, assert, afterEach, afterAll } from "vitest";
import { executeGraphqlOperation, insertTag } from "~/tests/fixtures";
import gql from "graphql-tag";
import { clearDatabase } from "~/tests/fixtures/databaseHelper";

const getTags = gql/* GraphQL */ `
  query ASD($tagDescription: String, $tagId: String, $tagName: String) {
    tags(input: { description: $tagDescription, id: $tagId, name: $tagName }) {
      description
      id
      name
      slug
    }
  }
`;

afterAll(() => {
  clearDatabase();
});

describe("Tags", async () => {
  const tag1 = await insertTag({
    description: "description tag1 with some text",
  });
  const tag2 = await insertTag({
    description: "description tag2 with some text",
  });
  const tag3 = await insertTag({
    description: "description tag3 with some text",
  });
  it("Should return an unfiltered list", async () => {
    const response = await executeGraphqlOperation({
      document: getTags,
    });
    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.tags.length, 3);
    assert.equal((response as any).data.tags[0].id, tag1.id);
    assert.equal((response as any).data.tags[1].id, tag2.id);
    assert.equal((response as any).data.tags[2].id, tag3.id);
  });

  it("Should filter by ID", async () => {
    const response = await executeGraphqlOperation({
      document: getTags,
      variables: {
        tagId: tag2.id,
      },
    });
    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.tags.length, 1);
    assert.equal((response as any).data.tags[0].id, tag2.id);
  });
  it("Should filter by name", async () => {
    const response = await executeGraphqlOperation({
      document: getTags,
      variables: {
        tagName: tag2.name,
      },
    });
    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.tags.length, 1);
    assert.equal((response as any).data.tags[0].id, tag2.id);
  });
  it("Should filter by description", async () => {
    const response = await executeGraphqlOperation({
      document: getTags,
      variables: {
        tagDescription: "tag2",
      },
    });
    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.tags.length, 1);
    assert.equal((response as any).data.tags[0].id, tag2.id);
  });
});
