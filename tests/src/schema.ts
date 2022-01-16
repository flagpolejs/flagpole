import flagpole, { JsonScenario } from "../../dist/index";
import { HttpResponseOptions } from "../../dist/interfaces/http";

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
    jsonBody: {
      foo: "bar",
    },
  };

  const invalidResponse: HttpResponseOptions = {
    status: [200, "OK"],
    jsonBody: {
      foo: 123,
    },
  };

  suite
    .scenario("Matching Schema - File JsonSchema", "json")
    .mock(validResponse)
    .next((context) => {
      context.assert(context.response.jsonBody).schema("@foobar");
    });

  // borked
  // suite
  //   .scenario("Matching Schema - File JTD", "json")
  //   .mock(validResponse)
  //   .next((context) => {
  //     context.assert(context.response.jsonBody).schema("@foobar.jtd", "JTD");
  //   });

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
      context
        .assert(context.response.jsonBody)
        .optional.schema("@foobar", "JsonSchema");
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
      context
        .assert(context.response.jsonBody)
        .optional.schema(jtdSchema, "JTD");
    });

  suite
    .scenario("Homepage Loads", JsonScenario)
    .open("https://pokeapi.co/api/v2/pokemon/ditto")
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(200);
      const json = context.response.jsonBody;
      context.comment(json);
      await context.assert(json).schema("@ditto");
    });
});
