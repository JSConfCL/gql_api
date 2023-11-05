export type SanityAsset = {
  id: string;
  assetId: string;
  path: string;
  url: string;
  originalFilename: string;
  size: number;
  metadata: {
    dimensions: {
      aspectRatio: number;
      height: number;
      width: number;
    };
    location: {
      lat: number;
      lon: number;
      alt: number;
    };
  };
};
