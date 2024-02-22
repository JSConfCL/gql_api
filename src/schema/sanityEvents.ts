import { builder } from "~/builder";
import { SanityEventRef } from "~/schema/shared/refs";
import {
  GoogleMediaItemType,
  getAlbumImages,
} from "../datasources/google/photos";
import {
  GoogleImportQueueElement,
  enqueueGooglePhotoImageBatch,
} from "../datasources/queues/google_import";

builder.objectType(SanityEventRef, {
  description: "Representation of a Sanity Asset",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
  }),
});

builder.queryFields((t) => ({
  salaries: t.field({
    description: "Get a list of events from Sanity",
    type: [SanityEventRef],
    resolve: async (root, _, { DB, USER }) => {
      if (!USER) {
        throw new Error("No user present");
      }
      const salaries = await DB.query.salariesSchema.findMany({
        where: (salary, { eq }) => eq(salary.userId, USER.id),
      });
      return salaries.map((salary) => selectSalariesSchema.parse(salary));
    },
  }),
}));
