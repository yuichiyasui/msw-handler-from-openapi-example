import { defineConfig } from "orval";
export default defineConfig({
  petstore: {
    input: "./openapi/petstore.yaml",
    output: {
      mode: "tags-split",
      target: "src/api/__generated__/petstore.ts",
      schemas: "./src/api/__generated__",
      prettier: true,
      clean: true,
      client: "react-query",
      override: {
        mutator: {
          path: "./src/api/custom-instance.ts",
          name: "customInstance",
        },
      },
    },
  },
});
