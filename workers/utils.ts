export const ensureKeys = <T extends Record<string, any>>(env: T): T => {
  const keys = [
    "DATABASE_URL",
    "DATABASE_TOKEN",
    "MP_ACCESS_TOKEN",
    "MP_PUBLIC_KEY",
    "RV_KEY",
    "ST_KEY",
  ] as const;
  for (const key of keys) {
    if (!env[key]) {
      throw new Error(`${key} is not defined`);
    }
  }
  return env;
};
