module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  overrides: [
    // PARA TODO EL PROJECTO
    {
      extends: [
        "eslint:recommended",
        "prettier",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        warnOnUnsupportedTypeScriptVersion: true,
        project: ["tsconfig.json"],
      },
      plugins: ["@typescript-eslint"],
      files: ["*.ts", "*.tsx"],
      rules: {
        // Es re-funcional nuestra API, no nos sirve esta regla realmente y causa
        // varios falsos positivos
        // https://typescript-eslint.io/rules/unbound-method/
        "@typescript-eslint/unbound-method": "off",
        // No nos sirve esta regla realmente y causa varios falsos positivos
        // https://typescript-eslint.io/rules/no-non-null-assertion/
        "@typescript-eslint/no-unsafe-member-access": "off",
        // No nos sirve esta regla realmente y causa varios falsos positivos
        // https://typescript-eslint.io/rules/no-non-null-assertion/
        "@typescript-eslint/no-unsafe-arguments": "off",
        "no-console": "error",
      },
    },
    // PARA LOS TESTS
    {
      files: ["*.test.ts", ""],
      rules: {},
    },
    // Para graphql
    {
      files: ["*.graphql", "*.gql"],
      parser: "@graphql-eslint/eslint-plugin",
      plugins: ["@graphql-eslint"],
      extends: [
        "plugin:@graphql-eslint/schema-recommended",
        "plugin:@graphql-eslint/operations-recommended",
      ],
      parserOptions: {
        schema: "./src/generated/schema.graphql",
        operations: ["./src/tests/**/*.gql", "./src/tests/**/*.graphql"],
      },
      rules: {
        // Incredible Plugin.
        // Rules URL: https://the-guild.dev/graphql/eslint/rules
        "@graphql-eslint/unique-fragment-name": "error",
        "@graphql-eslint/selection-set-depth": [
          "error",
          {
            maxDepth: 10,
          },
        ],
      },
    },
  ],
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        moduleDirectory: ["node_modules", "src/"],
        paths: ["./src"],
      },
    },
  },
  ignorePatterns: [
    "/.cache",
    "/.git",
    "/.husky",
    "/.yarn",
    "/*/dist",
    "./src/generated",
    "src/@types/schema.generated.ts",
  ],
};
