import { it, describe, assert, afterAll } from "vitest";
import {
  executeGraphqlOperation,
  executeGraphqlOperation,
  insertTag,
} from "~/tests/__fixtures";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import {
  GetTags,
  GetTagsQuery,
  GetTagsQueryVariables,
} from "./getTags.generated";

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
    const response = await executeGraphqlOperation<GetTagsQuery>({
      document: GetTags,
    });
    console.log(response.data);
    console.log(response.errors);

    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.tags.length, 3);
    assert.equal((response as any).data.tags[0].id, tag1.id);
    assert.equal((response as any).data.tags[1].id, tag2.id);
    assert.equal((response as any).data.tags[2].id, tag3.id);
  });

  it("Should filter by ID", async () => {
    const response = await executeGraphqlOperation<
      GetTagsQuery,
      GetTagsQueryVariables
    >({
      document: GetTags,
      variables: {
        tagDescription: null,
        tagName: null,
        tagId: tag2.id,
      },
    });
    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.tags.length, 1);
    assert.equal((response as any).data.tags[0].id, tag2.id);
  });
  it("Should filter by name", async () => {
    const response = await executeGraphqlOperation<
      GetTagsQuery,
      GetTagsQueryVariables
    >({
      document: GetTags,
      variables: {
        tagDescription: null,
        tagId: null,
        tagName: tag2.name,
      },
    });
    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.tags.length, 1);
    assert.equal((response as any).data.tags[0].id, tag2.id);
  });
  it("Should filter by description", async () => {
    const response = await executeGraphqlOperation<
      GetTagsQuery,
      GetTagsQueryVariables
    >({
      document: GetTags,
      variables: {
        tagName: null,
        tagId: null,
        tagDescription: "tag2",
      },
    });
    assert.equal((response as any).errors, undefined);
    assert.equal((response as any).data.tags.length, 1);
    assert.equal((response as any).data.tags[0].id, tag2.id);
  });
});
