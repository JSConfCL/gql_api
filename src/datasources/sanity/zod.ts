import { z } from "zod";

export const SanityAssetZodSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  path: z.string(),
  url: z.string(),
  originalFilename: z.string(),
  size: z.number(),
  metadata: z
    .object({
      dimensions: z.object({
        aspectRatio: z.number(),
        height: z.number(),
        width: z.number(),
      }),
      location: z.object({
        lat: z.number(),
        lon: z.number(),
        alt: z.number(),
      }),
    })
    .optional(),
});

export const SanityEventZodSchema = z.object({
  _id: z.string(),
  title: z.string(),
  url: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  imageUrl: z.string().optional(),
  project: z
    .object({
      _type: z.literal("project"),
      _ref: z.string(),
      _id: z.string(),
      title: z.string(),
      imageUrl: z.string().optional(),
    })
    .optional(),
});
