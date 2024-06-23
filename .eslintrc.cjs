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
        // imports
        "plugin:import/recommended",
        "plugin:import/typescript",
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
        "no-console": "error", // We capture console.log on our logger system, so we allow it
        curly: ["error", "all"],

        // turn on errors for missing imports
        "import/no-unresolved": "error",
        // 'import/no-named-as-default-member': 'off',
        "import/order": [
          "error",
          {
            groups: [
              "builtin", // Built-in imports (come from NodeJS native) go first
              "external", // <- External imports
              "internal", // <- Absolute imports
              ["sibling", "parent"], // <- Relative imports, the sibling and parent types they can be mingled together
              "index", // <- index imports
              "unknown", // <- unknown
            ],
            "newlines-between": "always",
            alphabetize: {
              /* sort in ascending order. Options: ["ignore", "asc", "desc"] */
              order: "asc",
              /* ignore case. Options: [true, false] */
              caseInsensitive: true,
            },
          },
        ],
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
        project: __dirname,
      },
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        moduleDirectory: ["node_modules", "src/", "workers/"],
        paths: ["./src", "./workers"],
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
