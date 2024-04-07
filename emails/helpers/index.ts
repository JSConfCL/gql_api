const baseURL = process.env.NODE_ENV === "production" ? "https://cdn.com" : "";

export const assetURL = (url: string) => {
  if (!url) {
    throw new Error("URL is required");
  }
  if (!url.startsWith("/static")) {
    throw new Error("URL must start with /static");
  }
  return `${baseURL}${url}`;
};
