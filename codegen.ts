import type { CodegenConfig } from "@graphql-codegen/cli";

const preventLinting = [
  "/* eslint-disable */",
  "/* @ts-nocheck */",
  "/* prettier-ignore */",
  "/* This file is automatically generated using `npm run graphql:types` */",
  `import type { JsonObject } from "type-fest";`,
  ``,
];
const codeInjection = {
  add: {
    content: [...preventLinting],
  },
};

const config: CodegenConfig = {
  ignoreNoDocuments: true,
  schema: "http://127.0.0.1:8787/graphql",
  documents: ["./src/**/*.gql"],
  generates: {
    "src/generated/types.ts": { plugins: ["typescript"] },
    "src/generated/": {
      preset: "near-operation-file",
      plugins: [
        // "typescript",
        "typescript-operations",
        "typescript-document-nodes",
        codeInjection,
      ],
      presetConfig: {
        baseTypesPath: "types.ts",
        // importTypesNamespace: "SchemaTypes",
        extension: ".generated.ts",
      },
      config: {
        avoidOptionals: true,
        enumsAsTypes: false,
        useTypeImports: true,
        strictScalars: true,
        defaultScalarType: "unknown",
        preResolveTypes: true,
      },
    },
  },
};

export default config;