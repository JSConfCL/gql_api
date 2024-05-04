const baseURL =
  typeof _APP_ENV !== "undefined" && _APP_ENV == "production"
    ? "https://assets.communityos.io"
    : "";

export const assetURL = (url: string) => {
  if (!url) {
    throw new Error("URL is required");
  }
  if (!url.startsWith("/static")) {
    throw new Error("URL must start with /static");
  }
  return `${baseURL}${url}`;
};
