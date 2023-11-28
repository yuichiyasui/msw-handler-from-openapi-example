import jsYaml from "js-yaml";
import fs from "node:fs";
import type { OpenAPIV3 } from "openapi-types";
import prettier from "prettier";
import path from "node:path";

const loadYaml = (path: string) =>
  jsYaml.load(fs.readFileSync(path, "utf8")) as OpenAPIV3.Document;

const isReferenceObject = (
  obj:
    | OpenAPIV3.ReferenceObject
    | OpenAPIV3.ResponseObject
    | OpenAPIV3.SchemaObject
    | undefined,
): obj is OpenAPIV3.ReferenceObject =>
  typeof obj !== "undefined" && "$ref" in obj;

const capitalizeFirstLetter = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

type Examples = {
  [media: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.ExampleObject;
};

const getExampleDataFromExamples = (
  examples: Examples,
  type: string | undefined,
  prefix: string,
) => {
  return Object.entries(examples)
    .filter((kv): kv is [string, OpenAPIV3.ExampleObject] => {
      const [, example] = kv;
      return !isReferenceObject(example);
    })
    .map(([key, example]) => {
      return `export const ${prefix}${capitalizeFirstLetter(key)}ResponseMock ${
        type ? `:${type}` : ""
      } = ${JSON.stringify(example.value)};\n`;
    })
    .join("");
};

const getExampleData = (
  responses: OpenAPIV3.ResponsesObject,
  operationId: string,
) => {
  return Object.entries(responses).reduce(
    (acc, [responseKey, response]) => {
      if (isReferenceObject(response)) return acc;

      const mediaTypeObj = response.content?.["application/json"];
      if (!mediaTypeObj) return acc;

      const schema = mediaTypeObj.schema;
      const type = isReferenceObject(schema)
        ? schema.$ref.split("/").pop()
        : "";

      const examples = mediaTypeObj.examples;
      const example = mediaTypeObj.example;
      if (examples) {
        type && acc.importTypes.add(type);
        acc.mockText += getExampleDataFromExamples(
          examples,
          type,
          `${operationId}${responseKey}`,
        );
      } else if (example) {
        type && acc.importTypes.add(type);
        acc.mockText += `export const ${operationId}${responseKey}ResponseMock${
          type === "" ? "" : `: ${type}`
        } = ${JSON.stringify(example)};\n`;
      }

      return acc;
    },
    { mockText: "", importTypes: new Set<string>() },
  );
};

const generateMockData = async () => {
  const doc = loadYaml("openapi/petstore.yaml");
  const paths = Object.keys(doc.paths);

  const { mockText, importTypeList } = paths.reduce(
    (acc, path) => {
      const pathObj = doc.paths?.[path];
      if (typeof pathObj === "undefined") return acc;

      const methods = Object.keys(pathObj);
      methods.forEach((method) => {
        const operation = pathObj?.[method];
        const operationId = operation.operationId;
        const { importTypes, mockText } = getExampleData(
          operation.responses,
          operationId,
        );
        acc.mockText += mockText;
        importTypes.forEach((importType) => acc.importTypeList.add(importType));
      });

      return acc;
    },
    { mockText: "", importTypeList: new Set<string>() },
  );

  const importStatement = `import { ${Array.from(importTypeList).join(
    ", ",
  )} } from "../__generated__";\n\n`;
  const formatted = await prettier.format(importStatement + mockText, {
    parser: "typescript",
  });
  const targetPath = "src/api/__mocks__/mock-data.ts";
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, formatted, { encoding: "utf8", flag: "" });
};

generateMockData();
