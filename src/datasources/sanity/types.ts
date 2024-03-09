import { SanityAssetZodSchema, SanityEventZodSchema } from "./zod";

export type SanityAsset = typeof SanityAssetZodSchema._type;
export type SanityEvent = typeof SanityEventZodSchema._type;
