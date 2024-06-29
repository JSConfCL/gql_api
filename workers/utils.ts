export const ensureKeys = <T extends Record<string, any>>(
  env: T,
  keys: (keyof T)[],
): T => {
  for (const key of keys) {
    if (!env[key]) {
      throw new Error(`${key as string} environment variable is not defined`);
    }
  }

  return env;
};
