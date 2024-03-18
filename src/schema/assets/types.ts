import { builder } from "~/builder";
import { SanityAssetRef } from "~/schema/shared/refs";

builder.objectType(SanityAssetRef, {
  description: "Representation of a Sanity Asset",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    assetId: t.exposeString("assetId", { nullable: false }),
    path: t.exposeString("path", { nullable: false }),
    url: t.exposeString("url", { nullable: false }),
    originalFilename: t.exposeString("originalFilename", { nullable: false }),
    size: t.exposeInt("size", { nullable: false }),
  }),
});
