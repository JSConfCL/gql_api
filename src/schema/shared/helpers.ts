export const sanitizeForLikeSearch = (str: string) => {
  const sanitizedString = str.replace(/[%_]/g, "\\$&");
  return `%${sanitizedString}%`;
};

export const addToObjectIfPropertyExists = (
  object: any,
  key: string,
  value: number | string | boolean | Date | undefined | null,
) => {
  if (value) {
    object[key] = value;
  }
};
