import { it, describe, assert } from "vitest";

import { executeGraphqlOperation, insertTag } from "~/tests/fixtures";

import { Tags, TagsQuery, TagsQueryVariables } from "./getTags.generated";

const createTags = async () => {
  const tag1 = await insertTag({
    description: "description tag1 with some text",
  });
  const tag2 = await insertTag({
    description: "description tag2 with some text",
  });
  const tag3 = await insertTag({
    description: "description tag3 with some text",
  });

  return {
    tag1,
    tag2,
    tag3,
  };
};

describe("Tags", () => {
  it("Should return an unfiltered list", async () => {
    const { tag1, tag2, tag3 } = await createTags();
    const response = await executeGraphqlOperation<
      TagsQuery,
      TagsQueryVariables
    >({
      document: Tags,
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.tags.length, 3);

    assert.equal(response.data?.tags[0].id, tag1.id);

    assert.equal(response.data?.tags[1].id, tag2.id);

    assert.equal(response.data?.tags[2].id, tag3.id);
  });

  it("Should filter by ID", async () => {
    const { tag2 } = await createTags();
    const response = await executeGraphqlOperation<
      TagsQuery,
      TagsQueryVariables
    >({
      document: Tags,
      variables: {
        input: {
          id: tag2.id,
        },
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.tags.length, 1);

    assert.equal(response.data?.tags[0].id, tag2.id);
  });

  it("Should filter by name", async () => {
    const { tag2 } = await createTags();
    const response = await executeGraphqlOperation<
      TagsQuery,
      TagsQueryVariables
    >({
      document: Tags,
      variables: {
        input: {
          name: tag2.name,
        },
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.tags.length, 1);

    assert.equal(response.data?.tags[0].id, tag2.id);
  });

  it("Should filter by description", async () => {
    const { tag2 } = await createTags();
    const response = await executeGraphqlOperation<
      TagsQuery,
      TagsQueryVariables
    >({
      document: Tags,
      variables: {
        input: {
          description: "tag2",
        },
      },
    });

    assert.equal(response.errors, undefined);

    assert.equal(response.data?.tags.length, 1);

    assert.equal(response.data?.tags[0].id, tag2.id);
  });
});
