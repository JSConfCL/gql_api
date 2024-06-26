export const sanitizeForLikeSearch = (str: string) => {
  const sanitizedString = str.replace(/[%_]/g, "\\$&");

  return `%${sanitizedString}%`;
};

export const addToObjectIfPropertyExists = (
  object: Record<string, number | string | boolean | Date | undefined | null>,
  key: string,
  value: number | string | boolean | Date | undefined | null,
) => {
  if (value) {
    object[key] = value;
  }
};

export const isValidUUID = (uuid: string) => {
  return (
    uuid
      .trim()
      .match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ) !== null
  );
};
