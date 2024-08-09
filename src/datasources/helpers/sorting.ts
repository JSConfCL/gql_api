type DirectionalType = "asc" | "desc";

export type SortableSchemaFields<T> = [[T, DirectionalType]] | undefined | null;
