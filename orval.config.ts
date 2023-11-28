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
      mock: true,
      override: {
        mutator: {
          path: "./src/api/custom-instance.ts",
          name: "customInstance",
        },
        operationName: (operation, _, verb) =>
          `${operation.operationId}${verb === "get" ? "Query" : "Mutation"}`,
        mock: {
          baseUrl: "http://localhost:8080",
          useExamples: true,
          delay: 0,
        },
        useNamedParameters: true,
      },
    },
  },
});
