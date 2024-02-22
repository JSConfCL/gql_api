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
  _id: string;
  title: string;
  url: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  project?: {
    _type: "project";
    _ref: string;
    _id: string;
    title: string;
    imageUrl?: string;
  };
};
