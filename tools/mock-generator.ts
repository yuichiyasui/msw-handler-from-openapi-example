import fs from "node:fs";
import path from "node:path";

import jsYaml from "js-yaml";
import type { OpenAPIV3 } from "openapi-types";
import prettier from "prettier";

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
      } = ${JSON.stringify(example.value)};\n\n`;
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
        } = ${JSON.stringify(example)};\n\n`;
      }

      return acc;
    },
    { mockText: "", importTypes: new Set<string>() },
  );
};

const getMockText = (paths: OpenAPIV3.PathsObject) => {
  const { importTypeList, mockText } = Object.entries(paths)
    .filter((kv): kv is [string, NonNullable<(typeof kv)[1]>] => {
      const [, pathObj] = kv;
      return typeof pathObj !== "undefined";
    })
    .reduce(
      (acc, [, pathObj]) => {
        const methods = Object.keys(pathObj);
        methods.forEach((method) => {
          const operation = pathObj?.[method];
          const operationId = operation.operationId;
          const { importTypes, mockText } = getExampleData(
            operation.responses,
            operationId,
          );
          acc.mockText += mockText;
          importTypes.forEach((importType) =>
            acc.importTypeList.add(importType),
          );
        });

        return acc;
      },
      { mockText: "", importTypeList: new Set<string>() },
    );

  const importStatement = `import { ${Array.from(importTypeList).join(
    ", ",
  )} } from "../__generated__";`;

  return `${importStatement}\n\n${mockText}`;
};

const generateMockData = async () => {
  const doc = loadYaml("openapi/petstore.yaml");
  const mockText = getMockText(doc.paths);
  const formatted = await prettier.format(mockText, {
    parser: "typescript",
  });
  const targetPath = "src/api/__mocks__/mock-data.ts";
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, formatted, { encoding: "utf8", flag: "" });
};

generateMockData();
