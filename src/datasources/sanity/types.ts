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

export type SanityEvent = {
  id: string;
  project: string;
  mergedTitle: boolean;
  title: string;
  startDate: string;
  endDate: string;
  bgColor: string;
  galleryEnabled: boolean;
  image: SanityAsset;
};
