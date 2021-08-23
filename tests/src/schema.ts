import flagpole from "../../dist/index";
import { HttpResponseOptions } from "../../dist/interfaces";

flagpole("Test Assertion Schema", async (suite) => {
  const jtdSchema: any = {
    properties: {
      foo: { type: "string" },
    },
  };
  const jsonSchema: any = {
    type: "object",
    properties: {
      foo: { type: "string" },
    },
    required: ["foo"],
  };

  const validResponse: HttpResponseOptions = {
    status: [200, "OK"],
    body: {
      foo: "bar",
    },
  };

  const invalidResponse: HttpResponseOptions = {
    status: [200, "OK"],
    body: {
      foo: 123,
    },
  };

  suite
    .scenario("Matching Schema - File JsonSchema", "json")
    .mock(validResponse)
    .next((context) => {
      context.assert(context.response.jsonBody).schema("@foobar");
    });

  suite
    .scenario("Matching Schema - File JTD", "json")
    .mock(validResponse)
    .next((context) => {
      context.assert(context.response.jsonBody).schema("@foobar.jtd", "JTD");
    });

  suite
    .scenario("Matching Schema - Manual Schema JsonSchema", "json")
    .mock(validResponse)
    .next((context) => {
      context
        .assert(context.response.jsonBody)
        .schema(jsonSchema, "JsonSchema");
    });

  suite
    .scenario("Not matching schema, JsonSchema", "json")
    .mock(invalidResponse)
    .next((context) => {
      context.assert(context.response.jsonBody).schema("@foobar", "JsonSchema");
    });

  suite
    .scenario("Matching Schema - Manual Schema JTD", "json")
    .mock(validResponse)
    .next((context) => {
      context.assert(context.response.jsonBody).schema(jtdSchema, "JTD");
    });

  suite
    .scenario("Not matching schema, JTD", "json")
    .mock(invalidResponse)
    .next((context) => {
      context.assert(context.response.jsonBody).schema(jtdSchema, "JTD");
    });
});
