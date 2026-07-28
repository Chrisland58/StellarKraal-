/**
 * OpenAPI spec validation tests
 * Ensures openapi.json meets documentation standards:
 *  - Every endpoint has a non-empty summary and description
 *  - All request/response schemas have description fields
 *  - All schema properties have description fields
 *  - Component responses include example payloads
 *  - The spec parses as valid JSON and has the correct OpenAPI version
 */
import * as fs from "fs";
import * as path from "path";

const SPEC_PATH = path.resolve(__dirname, "../openapi.json");

function loadSpec(): any {
  const raw = fs.readFileSync(SPEC_PATH, "utf-8");
  return JSON.parse(raw);
}

describe("openapi.json", () => {
  let spec: any;

  beforeAll(() => {
    spec = loadSpec();
  });

  describe("spec structure", () => {
    it("is valid JSON and has openapi version 3.0.x", () => {
      expect(spec.openapi).toMatch(/^3\.0\.\d+$/);
    });

    it("has required top-level fields", () => {
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBeTruthy();
      expect(spec.info.version).toBeTruthy();
      expect(spec.paths).toBeDefined();
      expect(spec.components).toBeDefined();
      expect(spec.tags).toBeDefined();
    });

    it("has at least one server defined", () => {
      expect(Array.isArray(spec.servers)).toBe(true);
      expect(spec.servers.length).toBeGreaterThanOrEqual(1);
    });

    it("has security schemes defined", () => {
      expect(spec.components.securitySchemes).toBeDefined();
      expect(spec.components.securitySchemes.bearerAuth).toBeDefined();
    });
  });

  describe("every endpoint has summary and description", () => {
    const missingSummary: string[] = [];
    const missingDescription: string[] = [];

    beforeAll(() => {
      for (const [pathKey, pathItem] of Object.entries<any>(spec.paths)) {
        for (const method of ["get", "post", "put", "patch", "delete"]) {
          const operation = (pathItem as any)[method];
          if (!operation) continue;
          const label = `${method.toUpperCase()} ${pathKey}`;
          if (!operation.summary || operation.summary.trim() === "") {
            missingSummary.push(label);
          }
          if (!operation.description || operation.description.trim() === "") {
            missingDescription.push(label);
          }
        }
      }
    });

    it("every operation has a non-empty summary", () => {
      expect(missingSummary).toEqual([]);
    });

    it("every operation has a non-empty description", () => {
      expect(missingDescription).toEqual([]);
    });
  });

  describe("every schema has a top-level description", () => {
    const schemasWithoutDescription: string[] = [];

    beforeAll(() => {
      const schemas = spec.components.schemas;
      for (const [name, schema] of Object.entries<any>(schemas)) {
        if (!schema.description || schema.description.trim() === "") {
          schemasWithoutDescription.push(name);
        }
      }
    });

    it("all schemas have description fields", () => {
      expect(schemasWithoutDescription).toEqual([]);
    });
  });

  describe("schema properties have descriptions", () => {
    const propsMissingDescription: string[] = [];

    beforeAll(() => {
      const schemas = spec.components.schemas;
      for (const [schemaName, schema] of Object.entries<any>(schemas)) {
        if (!schema.properties) continue;
        for (const [propName, prop] of Object.entries<any>(schema.properties)) {
          if (!prop.description || prop.description.trim() === "") {
            propsMissingDescription.push(`${schemaName}.${propName}`);
          }
          // Also check nested objects (one level deep)
          if (prop.type === "object" && prop.properties) {
            for (const [nestedName, nested] of Object.entries<any>(prop.properties)) {
              if (!nested.description || nested.description.trim() === "") {
                propsMissingDescription.push(`${schemaName}.${propName}.${nestedName}`);
              }
            }
          }
        }
      }
    });

    it("all schema properties have description fields", () => {
      expect(propsMissingDescription).toEqual([]);
    });
  });

  describe("component responses have examples", () => {
    const responsesWithoutExample: string[] = [];

    beforeAll(() => {
      const responses = spec.components.responses;
      for (const [name, response] of Object.entries<any>(responses)) {
        const content = response.content?.["application/json"];
        if (!content) {
          responsesWithoutExample.push(name);
          continue;
        }
        if (!content.example && !content.examples) {
          responsesWithoutExample.push(name);
        }
      }
    });

    it("all component responses include example payloads", () => {
      expect(responsesWithoutExample).toEqual([]);
    });
  });

  describe("requestBody objects have descriptions", () => {
    const requestBodiesWithoutDescription: string[] = [];

    beforeAll(() => {
      for (const [pathKey, pathItem] of Object.entries<any>(spec.paths)) {
        for (const method of ["get", "post", "put", "patch", "delete"]) {
          const operation = (pathItem as any)[method];
          if (!operation?.requestBody) continue;
          const label = `${method.toUpperCase()} ${pathKey}`;
          if (!operation.requestBody.description || operation.requestBody.description.trim() === "") {
            requestBodiesWithoutDescription.push(label);
          }
        }
      }
    });

    it("all requestBody objects have description fields", () => {
      expect(requestBodiesWithoutDescription).toEqual([]);
    });
  });

  describe("paths with parameters have descriptions", () => {
    const paramsWithoutDescription: string[] = [];

    beforeAll(() => {
      for (const [pathKey, pathItem] of Object.entries<any>(spec.paths)) {
        for (const method of ["get", "post", "put", "patch", "delete"]) {
          const operation = (pathItem as any)[method];
          if (!operation?.parameters) continue;
          for (const param of operation.parameters) {
            if (!param.description || param.description.trim() === "") {
              paramsWithoutDescription.push(
                `${method.toUpperCase()} ${pathKey} → ${param.name} (${param.in})`
              );
            }
          }
        }
      }
    });

    it("all operation parameters have description fields", () => {
      expect(paramsWithoutDescription).toEqual([]);
    });
  });

  describe("inline request body schemas have descriptions", () => {
    const inlineBodiesWithoutDescription: string[] = [];

    beforeAll(() => {
      for (const [pathKey, pathItem] of Object.entries<any>(spec.paths)) {
        for (const method of ["get", "post", "put", "patch", "delete"]) {
          const operation = (pathItem as any)[method];
          if (!operation?.requestBody?.content) continue;
          for (const [mediaType, mediaObj] of Object.entries<any>(operation.requestBody.content)) {
            const schema = mediaObj.schema;
            // Only check inline schemas (not $ref)
            if (schema?.$ref) continue;
            if (!schema?.description || schema.description.trim() === "") {
              inlineBodiesWithoutDescription.push(
                `${method.toUpperCase()} ${pathKey} (${mediaType})`
              );
            }
          }
        }
      }
    });

    it("all inline request body schemas have descriptions", () => {
      expect(inlineBodiesWithoutDescription).toEqual([]);
    });
  });

  describe("no operation is missing an operationId", () => {
    const opsWithoutId: string[] = [];

    beforeAll(() => {
      for (const [pathKey, pathItem] of Object.entries<any>(spec.paths)) {
        for (const method of ["get", "post", "put", "patch", "delete"]) {
          const operation = (pathItem as any)[method];
          if (!operation) continue;
          if (!operation.operationId) {
            opsWithoutId.push(`${method.toUpperCase()} ${pathKey}`);
          }
        }
      }
    });

    it("every operation has an operationId", () => {
      expect(opsWithoutId).toEqual([]);
    });
  });

  describe("error responses use $ref to component responses", () => {
    it("uses $ref for standard error responses", () => {
      const specStr = JSON.stringify(spec);
      // Verify that error responses reference component responses
      expect(specStr).toContain('"$ref": "#/components/responses/ValidationError"');
      expect(specStr).toContain('"$ref": "#/components/responses/Unauthorized"');
      expect(specStr).toContain('"$ref": "#/components/responses/NotFound"');
      expect(specStr).toContain('"$ref": "#/components/responses/RateLimited"');
      expect(specStr).toContain('"$ref": "#/components/responses/InternalError"');
    });
  });
});
