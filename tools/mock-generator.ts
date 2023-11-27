import jsYaml from "js-yaml";
import fs from "node:fs";

const doc = jsYaml.load(fs.readFileSync("openapi/petstore.yaml", "utf8"));
const jsonDoc = JSON.parse(JSON.stringify(doc));

const paths = Object.keys(jsonDoc.paths);

let mockData = "";

paths.forEach((path) => {
  const methods = Object.keys(jsonDoc.paths[path]);
  methods.forEach((method) => {
    const operation = jsonDoc.paths[path][method];
    const operationId = operation.operationId;
    const responses = Object.keys(operation.responses);
    responses.forEach((response) => {
      const responseObj = operation.responses[response];
      const exampleData = responseObj.content?.["application/json"]?.example;
      if (!exampleData) return;
      mockData += `/** "${path}" ${method.toUpperCase()} ${response} */\nconst ${operationId}${response}ResponseMock = ${JSON.stringify(
        exampleData,
      )};`;
    });
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateObjectType = (schema: any) => {
  const properties = schema.properties ?? {};
  const required = schema.required ?? [];
  const optional = Object.keys(properties).filter(
    (key) => !required.includes(key),
  );
  const requiredString = required.map(
    (key) => `${key}: ${convertType(properties[key].type)}`,
  );
  const optionalString = optional.map(
    (key) => `${key}?: ${convertType(properties[key].type)}`,
  );
  return `{ ${[...requiredString, ...optionalString].join(";")} }`;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateArrayType = (schema: any) => {
  const items = schema.items;
  if (!items) return "[]";

  const typeName = items["$ref"].split("/").pop();

  return `${typeName}[]`;
};

const convertType = (type: string) => {
  switch (type) {
    case "integer":
      return "number";
    case "array":
      return "[]";
    default:
      return type;
  }
};

const generateTypes = () => {
  const typeNames = Object.keys(jsonDoc.components.schemas);
  return typeNames.reduce<string>((typesText, typeName) => {
    const type = jsonDoc.components.schemas[typeName];
    const schemaType = type.type;
    if (schemaType === "object") {
      return typesText + `interface ${typeName} ${generateObjectType(type)};`;
    }
    if (schemaType === "array") {
      return typesText + `type ${typeName} = ${generateArrayType(type)};`;
    }

    return typesText;
  }, "");
};

console.log(generateTypes());

fs.writeFileSync("tools/__generated__/mock-data.ts", mockData);
