import jsYaml from "js-yaml";
import fs from "node:fs";
import type { OpenAPIV3 } from "openapi-types";
import prettier from "prettier";
import path from "node:path";

const loadYaml = (path: string) => {
  return jsYaml.load(fs.readFileSync(path, "utf8")) as OpenAPIV3.Document;
};

const isReferenceObject = (
  obj:
    | OpenAPIV3.ReferenceObject
    | OpenAPIV3.ResponseObject
    | OpenAPIV3.SchemaObject
    | undefined,
): obj is OpenAPIV3.ReferenceObject => {
  return typeof obj !== "undefined" && "$ref" in obj;
};

const getExampleData = (
  responses: OpenAPIV3.ResponsesObject,
  operationId: string,
) => {
  const importTypeList = new Set<string>();
  const responseKeys = Object.keys(responses);
  const mockText = responseKeys.reduce((exampleData, responseKey) => {
    const response = responses[responseKey];
    if (isReferenceObject(response)) {
      return exampleData;
    }

    const mediaTypeObj = response.content?.["application/json"];
    if (!mediaTypeObj) {
      return exampleData;
    }

    const example = mediaTypeObj.example;
    if (!example) {
      return exampleData;
    }

    const schema = mediaTypeObj.schema;

    const type = isReferenceObject(schema) ? schema.$ref.split("/").pop() : "";
    if (type) {
      importTypeList.add(type);
    }

    return (
      exampleData +
      `export const ${operationId}${responseKey}ResponseMock${
        type === "" ? "" : `: ${type}`
      } = ${JSON.stringify(example)};\n`
    );
  }, "");

  return {
    mockText,
    importTypes: Array.from(importTypeList),
  };
};

const generateMockData = async () => {
  const doc = loadYaml("openapi/petstore.yaml");
  const paths = Object.keys(doc.paths);
  const importTypeList = new Set<string>();

  const data = paths.reduce((mockData, path) => {
    let mock = "";
    const pathObj = doc.paths?.[path];
    if (typeof pathObj === "undefined") {
      return mockData;
    }

    const methods = Object.keys(pathObj);
    methods.forEach((method) => {
      const operation = pathObj?.[method];
      const operationId = operation.operationId;
      const { importTypes, mockText } = getExampleData(
        operation.responses,
        operationId,
      );
      mock += mockText;
      importTypes.forEach((importType) => {
        importTypeList.add(importType);
      });
    });

    return mockData + mock;
  }, "");

  const importStatement = `import { ${Array.from(importTypeList).join(
    ", ",
  )} } from "../__generated__";\n\n`;
  const mockData = importStatement + data;

  const formatted = await prettier.format(mockData, { parser: "typescript" });
  const targetPath = "src/api/__mocks__/mock-data.ts";
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, formatted, { encoding: "utf8", flag: "" });
};

generateMockData();
