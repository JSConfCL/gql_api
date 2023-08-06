export const sanitizeForLikeSearch = (str: string) => {
  const sanitizedString = str.replace(/[%_]/g, "\\$&");
  return `%${sanitizedString}%`;
};

