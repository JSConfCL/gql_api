export type GoogleMediaItemType = {
  id: string;
  baseUrl: string;
  mimeType: string;
  filename: string;
  mediaMetadata: {
    creationTime: string;
    width: string;
    height: string;
    photo: {
      cameraMake: string;
      cameraModel: string;
      focalLength: number;
      apertureFNumber: number;
      isoEquivalent: number;
    };
  };
};

export const getAlbumImages = async (
  albumId: string,
  token: string,
  pageToken?: string,
) => {
  const rawresponse = await fetch(
    "https://photoslibrary.googleapis.com/v1/mediaItems:search",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        albumId: albumId,
        pageSize: 100, // This specifies the number of items to return per page, maximum is 100
        ...(pageToken ? { pageToken } : {}), // This specifies the page token of the next page to return
      }),
    },
  );
  const response = await rawresponse.json();
  return response as {
    mediaItems: Array<GoogleMediaItemType>;
    nextPageToken: string | undefined;
  };
};
