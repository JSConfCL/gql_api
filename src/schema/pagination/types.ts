import {
  ImplementableObjectRef,
  InputFieldRef,
  InputObjectRef,
  ObjectRef,
  QueryFieldBuilder,
} from "@pothos/core";

import { builder } from "~/builder";

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const PaginationSearchInputParams = builder.inputType(
  "PaginationSearchInputParams",
  {
    fields: (t) => ({
      page: t.int({
        required: true,
        description: "Page number, starts at 0",
      }),
      pageSize: t.int({
        required: true,
      }),
    }),
  },
);

const createPaginationInputArg = <T extends InputObjectRef<any>>(search: T) => {
  const capitalizedName = capitalizeFirstLetter(search.name);

  return builder.inputType(`PaginatedInput${capitalizedName}`, {
    fields: (t) => ({
      search: t.field({
        type: search,
        required: false,
      }),
      pagination: t.field({
        type: PaginationSearchInputParams,
        required: true,
        defaultValue: {
          page: 0,
          pageSize: 20,
        },
      }),
    }),
  });
};

type PaginationResponseType = {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
};

const PaginationRef = builder.objectRef<PaginationResponseType>("Pagination");

builder.objectType(PaginationRef, {
  description: "Pagination meta data",
  fields: (t) => ({
    currentPage: t.field({
      type: "Int",
      nullable: false,
      resolve: (root) => root.currentPage,
    }),
    pageSize: t.field({
      type: "Int",
      nullable: false,
      resolve: (root) => root.pageSize,
    }),
    totalRecords: t.field({
      type: "Int",
      nullable: false,
      resolve: (root) => root.totalRecords,
    }),
    totalPages: t.field({
      type: "Int",
      nullable: false,
      resolve: (root) => root.totalPages,
    }),
  }),
});

const CreatePaginationRef = <TShape>(name: string) => {
  const capitalizedName = capitalizeFirstLetter(name);

  return builder.objectRef<{
    pagination: PaginationResponseType;
    data: TShape[];
  }>(`Paginated${capitalizedName}`);
};

// TODO: Considerar hacer myinputField opcional
export const createPaginationInputType = <
  U extends QueryFieldBuilder<any, any>,
  T extends InputObjectRef<any>,
>(
  t: U,
  myInputField: T,
) => {
  const newInput = createPaginationInputArg(myInputField);

  return {
    input: t.arg({
      type: newInput,
      required: true,
    }),
  };
};

export const createPaginationObjectType = <
  T extends ImplementableObjectRef<any, TShape>,
  TShape
>(
  objectReference: T,
) => {
  const ref = CreatePaginationRef<TShape>(objectReference["name"]);

  builder.objectType(ref, {
    description:
      "Type used for querying the paginated leaves and it's paginated meta data",
    fields: (t) => ({
      pagination: t.field({
        type: PaginationRef,
        nullable: false,
        resolve: (root) => {
          return root.pagination;
        },
      }),
      data: t.field({
        type: [objectReference],
        nullable: false,
        // @ts-expect-error generics for pothos are hard to type
        resolve: (root) => root.data ?? [],
      }),
    }),
  });

  return ref;
};
