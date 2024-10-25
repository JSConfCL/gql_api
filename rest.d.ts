import "@total-typescript/ts-reset";

declare global {
  type NonNullableFields<T> = {
    [K in keyof T]: NonNullable<T[K]>;
  };
}
